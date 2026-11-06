import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AppState, Pressable, Text } from 'react-native';

import {
  ContentSyncProvider,
  useContentSync,
} from '@/shared/services/content/ContentSyncProvider';
import { stageClassContent } from '@/shared/services/content/classSync';
import { refreshCourseList } from '@/shared/services/content/coursesV3';
import {
  applyPendingContent,
  hasPendingContent,
} from '@/shared/services/content/remote/applyStagedContent';
import { refreshCatalogs } from '@/shared/services/content/remoteContent';

let mockAppStateHandler: ((state: string) => void) | null = null;
let mockHybrid = true;
const mockDb = {};

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('@/shared/services/data/dataMode', () => ({ isHybrid: () => mockHybrid }));
jest.mock('@/shared/services/http/client', () => ({
  apiBaseUrl: () => 'https://api.test',
  http: {},
  httpV3: {},
}));
jest.mock('@/shared/services/content/remoteContent', () => ({
  refreshCatalogs: jest.fn(),
}));
jest.mock('@/shared/services/content/coursesV3', () => ({
  refreshCourseList: jest.fn(),
}));
jest.mock('@/shared/services/content/classSync', () => ({
  stageClassContent: jest.fn(),
}));
jest.mock('@/shared/services/content/remote/applyStagedContent', () => ({
  hasPendingContent: jest.fn(),
  applyPendingContent: jest.fn(),
}));

const mockRefreshCatalogs = jest.mocked(refreshCatalogs);
const mockRefreshCourseList = jest.mocked(refreshCourseList);
const mockStageClassContent = jest.mocked(stageClassContent);
const mockHasPendingContent = jest.mocked(hasPendingContent);
const mockApplyPendingContent = jest.mocked(applyPendingContent);

function Probe() {
  const sync = useContentSync();
  return (
    <>
      <Text>{`checking:${sync.checking}`}</Text>
      <Text>{`update:${sync.updateAvailable}`}</Text>
      <Pressable accessibilityLabel="manual" onPress={() => void sync.checkNow()}>
        <Text>manual</Text>
      </Pressable>
      <Pressable accessibilityLabel="later" onPress={sync.dismissUpdate}>
        <Text>later</Text>
      </Pressable>
    </>
  );
}

function renderProvider() {
  return render(
    <ContentSyncProvider>
      <Probe />
    </ContentSyncProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockAppStateHandler = null;
  mockHybrid = true;
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    value: 'active',
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    mockAppStateHandler = handler as unknown as (state: string) => void;
    return { remove: jest.fn() } as never;
  });
  mockRefreshCatalogs.mockResolvedValue(false);
  mockRefreshCourseList.mockResolvedValue(false);
  mockStageClassContent.mockResolvedValue({ changed: false, failed: [] });
  mockHasPendingContent.mockResolvedValue(false);
  mockApplyPendingContent.mockResolvedValue({ failed: [] });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('ContentSyncProvider', () => {
  it('en modo local no dispara ninguna descarga', async () => {
    mockHybrid = false;
    renderProvider();
    await act(async () => {});

    expect(mockRefreshCatalogs).not.toHaveBeenCalled();
  });

  it('comprueba al abrir y cada hora en primer plano', async () => {
    renderProvider();

    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(1));

    await act(async () => {
      jest.advanceTimersByTime(60 * 60 * 1000);
    });

    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(2));
  });

  it('el botón manual fuerza una comprobación', async () => {
    const { getByLabelText } = renderProvider();
    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(1));

    fireEvent.press(getByLabelText('manual'));

    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(2));
  });

  it('pausa el temporizador en background y comprueba al volver', async () => {
    renderProvider();
    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(1));

    act(() => mockAppStateHandler?.('background'));
    await act(async () => {
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);
    });
    expect(mockRefreshCatalogs).toHaveBeenCalledTimes(1);

    act(() => mockAppStateHandler?.('active'));
    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(2));
  });

  it('no solapa comprobaciones: la manual espera a la que está en curso', async () => {
    let release!: (value: boolean) => void;
    mockRefreshCatalogs.mockImplementationOnce(
      () =>
        new Promise<boolean>(resolve => {
          release = resolve;
        }),
    );
    const { getByLabelText } = renderProvider();
    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(1));

    fireEvent.press(getByLabelText('manual'));
    await act(async () => {
      jest.advanceTimersByTime(60 * 60 * 1000);
    });
    expect(mockRefreshCatalogs).toHaveBeenCalledTimes(1);

    await act(async () => {
      release(false);
    });
    fireEvent.press(getByLabelText('manual'));
    await waitFor(() => expect(mockRefreshCatalogs).toHaveBeenCalledTimes(2));
  });

  it('detecta cambios por version/hash y ofrece la actualización', async () => {
    mockRefreshCourseList.mockResolvedValue(true);
    const { getByText } = renderProvider();

    await waitFor(() => expect(getByText('update:true')).toBeTruthy());
  });

  it('«Más tarde» descarta el aviso y la siguiente comprobación lo vuelve a detectar', async () => {
    mockHasPendingContent.mockResolvedValue(true);
    const { getByLabelText, getByText } = renderProvider();

    await waitFor(() => expect(getByText('update:true')).toBeTruthy());
    fireEvent.press(getByLabelText('later'));
    expect(getByText('update:false')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(60 * 60 * 1000);
    });

    await waitFor(() => expect(getByText('update:true')).toBeTruthy());
  });
});
