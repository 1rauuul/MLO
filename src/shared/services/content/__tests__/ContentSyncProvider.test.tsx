import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ContentSyncProvider } from '@/shared/services/content/ContentSyncProvider';
import { refreshCatalogs } from '@/shared/services/content/remoteContent';

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => ({}) }));
jest.mock('@/shared/services/content/remoteContent', () => ({
  refreshCatalogs: jest.fn(),
}));

describe('ContentSyncProvider', () => {
  it('en modo local no dispara ninguna descarga', () => {
    render(
      <ContentSyncProvider>
        <Text>contenido</Text>
      </ContentSyncProvider>,
    );

    expect(refreshCatalogs).not.toHaveBeenCalled();
  });
});
