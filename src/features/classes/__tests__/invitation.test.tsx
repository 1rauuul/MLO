import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import JoinClassScreen from '@/features/classes/view/JoinClassScreen';
import {
  extractInvitationToken,
  parseInvitationClaim,
  type InvitationClaim,
} from '@/shared/services/content/invitations';
import { HttpError, NetworkError } from '@/shared/services/http/client';

// Flujo de invitación con esperas encadenadas; 5 s es muy justo con la suite en paralelo.
jest.setTimeout(15000);

const FIXTURES = join(__dirname, '..', '__fixtures__', 'x07');
const TOKEN = 'A'.repeat(43);
const STUDENT_KEY = '11111111-1111-4111-8111-111111111111';

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf8')) as unknown;
}

function claimSuccess(): InvitationClaim {
  return parseInvitationClaim(fixture('success.json'));
}

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockFetchClassPreview = jest.fn();
const mockJoinClass = jest.fn();
const mockClaimInvitation = jest.fn();
const mockRefreshClass = jest.fn(async () => false);
const mockSaveAccountClass = jest.fn(async () => {});
const mockRefreshClasses = jest.fn(async () => {});
let mockParams: Record<string, string | string[]> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    push: jest.fn(),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: jest.fn(),
}));
jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({
    account: {
      id: 1,
      externalKey: '11111111-1111-4111-8111-111111111111',
      displayName: 'Ana Alumna',
    },
  }),
}));
jest.mock('@/features/classes/viewmodel/useClasses', () => ({
  useClasses: () => ({ refresh: mockRefreshClasses }),
}));
jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => ({
    content: {
      fetchClassPreview: mockFetchClassPreview,
      joinClass: mockJoinClass,
      claimInvitation: mockClaimInvitation,
      refreshClass: mockRefreshClass,
    },
    classes: { saveAccountClass: mockSaveAccountClass },
  }),
}));
jest.mock('@/shared/services/data/dataMode', () => ({
  isHybrid: () => true,
}));
jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#fff',
      card: '#fff',
      line: '#ddd',
      warning: '#f90',
      success: '#0a0',
      danger: '#f00',
      muted: '#777',
      text: '#111',
      primary: '#00f',
      soft: '#eee',
      onPrimary: '#fff',
    },
    scale: 1,
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    radius: { card: 12, control: 8, tile: 20, pill: 99 },
    fonts: { mono: 'monospace', sans: 'System' },
  }),
}));

const preview = {
  schemaVersion: 2 as const,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profesora Ríos' },
  published: null,
};

function submit(value: string) {
  const view = render(<JoinClassScreen />);
  fireEvent.changeText(
    view.getByLabelText('Enlace de invitación o código de la clase'),
    value,
  );
  fireEvent.press(view.getByLabelText('Continuar'));
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockFetchClassPreview.mockResolvedValue(preview);
  mockJoinClass.mockResolvedValue(preview);
  mockClaimInvitation.mockResolvedValue(claimSuccess());
});

describe('fixtures x07', () => {
  it('conserva los hashes del productor CMS', () => {
    const hashes: Record<string, string> = {
      'success.json': '51516785b638f210b79800c8b0b2b1a2f8914d7505f9e678b75a12425793f626',
      'expired.json': '94a355cdfb2801b76dcc1485f2ad1c2a0cd121cdf7fe0e2d2611a33ac2c47cb6',
      'used.json': '2008b390be72c69d1462b4263d2b135e4ae051aa64a97ffd6f5b1e1033eb0d81',
      'revoked.json': 'dfe547486f916b34ff6845ec525f01766a9d98928f8e895b90d507edb63eda99',
      'full.json': 'fd179d6e4bb8fb43e3ea89623aed3a40eaebbba70754a5dbc186c8105429b57f',
      'already-member.json': 'bd9897ddf852ef5c7568d3aa6a1a608cb0e43781f4cf80436c7f6b522c5d2f54',
    };
    for (const [name, expected] of Object.entries(hashes)) {
      const text = readFileSync(join(FIXTURES, name))
        .toString('utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\r\n/g, '\n');
      expect(createHash('sha256').update(text, 'utf8').digest('hex')).toBe(expected);
    }
  });
});

describe('token de invitación', () => {
  it('extrae el token del enlace real o del token pegado', () => {
    expect(
      extractInvitationToken(`mloingenieriasoftware://join-class?token=${TOKEN}`),
    ).toBe(TOKEN);
    expect(extractInvitationToken(TOKEN)).toBe(TOKEN);
    expect(extractInvitationToken('ABC123')).toBeNull();
    expect(extractInvitationToken('token incompleto')).toBeNull();
  });

  it('rechaza una respuesta de éxito sin membresía completa', () => {
    const success = fixture('success.json') as {
      membership: Record<string, unknown>;
    };
    expect(() =>
      parseInvitationClaim({
        ok: true,
        membership: { ...success.membership, classId: '' },
        published: null,
      }),
    ).toThrow('Respuesta de invitación inválida');
    expect(() =>
      parseInvitationClaim({
        ok: true,
        membership: { ...success.membership, courseCatalogId: '' },
        published: null,
      }),
    ).toThrow('Respuesta de invitación inválida');
  });
});

describe('reclamo de invitación', () => {
  it('acepta el enlace, guarda la membresía y navega a módulos', async () => {
    const claim = claimSuccess();
    mockClaimInvitation.mockResolvedValue(claim);
    const view = submit(`mloingenieriasoftware://join-class?token=${TOKEN}`);

    await waitFor(() =>
      expect(mockClaimInvitation).toHaveBeenCalledWith(
        TOKEN,
        STUDENT_KEY,
        'Ana Alumna',
      ),
    );
    expect(mockSaveAccountClass).toHaveBeenCalledWith(
      1,
      'A7K2M9',
      {
        schemaVersion: 2,
        class: {
          id: '8b1d4e20-6c3f-4a92-b7d5-0e9f2a6c8b13',
          name: 'Grupo A · 2026',
          teacherName: 'Ana Torres',
        },
        published: claim.published,
      },
      'base',
    );
    await waitFor(() => expect(view.getByText('Invitación aceptada')).toBeTruthy());
    expect(mockRefreshClass).toHaveBeenCalledWith(
      '8b1d4e20-6c3f-4a92-b7d5-0e9f2a6c8b13',
      'A7K2M9',
      STUDENT_KEY,
      'base',
    );

    fireEvent.press(view.getByText('Ir a módulos'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('guarda y refresca el catálogo de un curso adicional distinto de base', async () => {
    const base = claimSuccess();
    const claim: InvitationClaim = {
      ...base,
      membership: { ...base.membership, courseCatalogId: 'demo' },
    };
    mockClaimInvitation.mockResolvedValue(claim);
    const view = submit(TOKEN);

    await waitFor(() =>
      expect(mockSaveAccountClass).toHaveBeenCalledWith(
        1,
        'A7K2M9',
        expect.objectContaining({ schemaVersion: 2 }),
        'demo',
      ),
    );
    await waitFor(() => expect(view.getByText('Invitación aceptada')).toBeTruthy());
    expect(mockRefreshClass).toHaveBeenCalledWith(
      '8b1d4e20-6c3f-4a92-b7d5-0e9f2a6c8b13',
      'A7K2M9',
      STUDENT_KEY,
      'demo',
    );
  });

  it('reclama el token recibido por deep link al abrir la pantalla', async () => {
    mockParams = { token: TOKEN };
    render(<JoinClassScreen />);

    await waitFor(() =>
      expect(mockClaimInvitation).toHaveBeenCalledWith(
        TOKEN,
        STUDENT_KEY,
        'Ana Alumna',
      ),
    );
    await waitFor(() => expect(mockClaimInvitation).toHaveBeenCalledTimes(1));
  });

  it('mantiene el flujo de unión por código de 6 caracteres', async () => {
    const view = submit('abc123');

    await waitFor(() => expect(mockFetchClassPreview).toHaveBeenCalledWith('ABC123'));
    expect(mockClaimInvitation).not.toHaveBeenCalled();
    await waitFor(() => expect(view.getByText('Grupo A')).toBeTruthy());
  });

  it('pide un enlace o código válido sin llamar a la API', async () => {
    const view = submit('esto no es un enlace');

    await waitFor(() =>
      expect(
        view.getByText(
          'Pega el enlace de invitación completo o un código de 6 caracteres.',
        ),
      ).toBeTruthy(),
    );
    expect(mockClaimInvitation).not.toHaveBeenCalled();
  });
});

describe('estados de error de la invitación', () => {
  it.each([
    ['expired.json', 410, 'La invitación expiró. Pide una nueva a tu docente.'],
    ['used.json', 409, 'Esta invitación ya se usó. Pide una nueva a tu docente.'],
    ['revoked.json', 410, 'El docente revocó esta invitación.'],
    ['full.json', 409, 'El grupo ya está lleno.'],
    ['already-member.json', 409, 'Ya perteneces a un grupo de este curso.'],
  ])('muestra el estado de %s', async (file, status, message) => {
    mockClaimInvitation.mockRejectedValue(
      new HttpError(status, JSON.stringify(fixture(file))),
    );
    const view = submit(TOKEN);

    await waitFor(() => expect(view.getByText(message)).toBeTruthy());
    expect(mockSaveAccountClass).not.toHaveBeenCalled();
  });

  it('muestra la invitación inválida', async () => {
    mockClaimInvitation.mockRejectedValue(
      new HttpError(
        400,
        JSON.stringify({ error: 'invalid', message: 'La invitación no es válida.' }),
      ),
    );
    const view = submit(TOKEN);

    await waitFor(() =>
      expect(view.getByText('La invitación no es válida.')).toBeTruthy(),
    );
  });

  it('permite reintentar tras un error de red sin perder el token', async () => {
    mockClaimInvitation
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValueOnce(claimSuccess());
    const view = submit(TOKEN);

    await waitFor(() =>
      expect(view.getByText('No hay conexión. Inténtalo de nuevo.')).toBeTruthy(),
    );
    fireEvent.press(view.getByText('Reintentar'));

    await waitFor(() => expect(view.getByText('Invitación aceptada')).toBeTruthy());
    expect(mockClaimInvitation).toHaveBeenCalledTimes(2);
    expect(mockClaimInvitation).toHaveBeenLastCalledWith(
      TOKEN,
      STUDENT_KEY,
      'Ana Alumna',
    );
  });
});
