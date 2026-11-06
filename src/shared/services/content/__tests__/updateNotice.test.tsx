import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ContentUpdateNotice } from '@/shared/components/ContentUpdateNotice';
import { ContentSyncProvider } from '@/shared/services/content/ContentSyncProvider';
import {
  applyPendingContent,
  hasPendingContent,
} from '@/shared/services/content/remote/applyStagedContent';
import { refreshCatalogs } from '@/shared/services/content/remoteContent';
import { useBlockContentUpdates } from '@/shared/hooks/useContentUpdatesGate';

const mockDb = {};

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('@/shared/services/data/dataMode', () => ({ isHybrid: () => true }));
jest.mock('@/shared/services/http/client', () => ({
  apiBaseUrl: () => 'https://api.test',
  http: {},
  httpV3: {},
}));
jest.mock('@/shared/services/content/remoteContent', () => ({
  refreshCatalogs: jest.fn(async () => true),
}));
jest.mock('@/shared/services/content/coursesV3', () => ({
  refreshCourseList: jest.fn(async () => false),
}));
jest.mock('@/shared/services/content/classSync', () => ({
  stageClassContent: jest.fn(async () => ({ changed: false, failed: [] })),
}));
jest.mock('@/shared/services/content/remote/applyStagedContent', () => ({
  hasPendingContent: jest.fn(async () => false),
  applyPendingContent: jest.fn(async () => ({ failed: [] })),
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

const mockRefreshCatalogs = jest.mocked(refreshCatalogs);
const mockHasPendingContent = jest.mocked(hasPendingContent);
const mockApplyPendingContent = jest.mocked(applyPendingContent);

function RunningEvaluation() {
  useBlockContentUpdates(true);
  return null;
}

function renderNotice(extra?: ReactNode) {
  return render(
    <ContentSyncProvider>
      {extra}
      <ContentUpdateNotice />
    </ContentSyncProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRefreshCatalogs.mockResolvedValue(true);
  mockHasPendingContent.mockResolvedValue(false);
  mockApplyPendingContent.mockResolvedValue({ failed: [] });
});

describe('ContentUpdateNotice', () => {
  it('el evento de actualización abre el modal y confirma el aviso', async () => {
    const { getByLabelText, getByText } = renderNotice();

    await waitFor(() => expect(getByText('Contenido nuevo disponible')).toBeTruthy());
    fireEvent.press(getByLabelText('Actualizar ahora'));

    await waitFor(() => expect(mockApplyPendingContent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByText('Contenido actualizado')).toBeTruthy());
  });

  it('«Más tarde» oculta el aviso sin aplicar nada', async () => {
    const { getByLabelText, queryByText } = renderNotice();

    await waitFor(() => expect(queryByText('Contenido nuevo disponible')).toBeTruthy());
    fireEvent.press(getByLabelText('Más tarde'));

    await waitFor(() => expect(queryByText('Contenido nuevo disponible')).toBeNull());
    expect(mockApplyPendingContent).not.toHaveBeenCalled();
  });

  it('si falla la aplicación conserva el contenido anterior y no confirma', async () => {
    mockHasPendingContent.mockResolvedValue(true);
    mockApplyPendingContent.mockResolvedValueOnce({ failed: ['base'] });
    const { getByLabelText, queryByText } = renderNotice();

    await waitFor(() => expect(queryByText('Contenido nuevo disponible')).toBeTruthy());
    fireEvent.press(getByLabelText('Actualizar ahora'));

    await waitFor(() => expect(mockApplyPendingContent).toHaveBeenCalledTimes(1));
    expect(queryByText('Contenido actualizado')).toBeNull();
    await waitFor(() => expect(queryByText('Contenido nuevo disponible')).toBeTruthy());
  });

  it('una desconexión no aplica ni borra la copia local', async () => {
    mockRefreshCatalogs.mockRejectedValueOnce(new Error('sin red'));
    const { queryByText } = renderNotice();

    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(1));
    expect(mockApplyPendingContent).not.toHaveBeenCalled();
    expect(queryByText('Contenido nuevo disponible')).toBeNull();
  });

  it('una evaluación en curso difiere el aviso hasta una transición segura', async () => {
    const { queryByText, rerender } = renderNotice(<RunningEvaluation />);

    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(1));
    expect(queryByText('Contenido nuevo disponible')).toBeNull();
    expect(mockApplyPendingContent).not.toHaveBeenCalled();

    rerender(
      <ContentSyncProvider>
        <ContentUpdateNotice />
      </ContentSyncProvider>,
    );

    await waitFor(() => expect(queryByText('Contenido nuevo disponible')).toBeTruthy());
  });
});
