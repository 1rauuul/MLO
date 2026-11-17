import { fireEvent, render } from '@testing-library/react-native';

import { RichContent } from '@/features/modules/view/RichContent';

jest.mock('react-native-webview', () => {
  const { View } = jest.requireActual('react-native');
  return { WebView: (props: Record<string, unknown>) => <View testID="webview" {...props} /> };
});

jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    constructor(base: { uri: string } | string, name = '') {
      this.uri = typeof base === 'string' ? base : `${base.uri}/${name}`;
    }
  }
  return { Paths: { document: { uri: 'file:///doc' } }, File };
});

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

const image = {
  type: 'image' as const,
  src: 'https://cms.test/api/media/abc?sig=xyz',
  localSrc: 'media/abc.webp',
  mime: 'image/webp' as const,
  width: 1280,
  height: 720,
  alt: 'Diagrama',
  caption: 'Figura 1',
};

const video = {
  type: 'video' as const,
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: 'Clase',
};

describe('RichContent multimedia', () => {
  it('muestra la imagen local con su caption', () => {
    const { getByTestId, getByText } = render(<RichContent blocks={[image]} />);
    expect(getByTestId('lesson-image').props.source).toEqual({ uri: 'file:///doc/media/abc.webp' });
    expect(getByText('Figura 1')).toBeTruthy();
  });

  it('cae al aviso cuando la imagen no está disponible', () => {
    const { getByTestId, getByText } = render(
      <RichContent blocks={[{ ...image, localSrc: undefined, src: 'file:///missing.webp' }]} />,
    );
    fireEvent(getByTestId('lesson-image'), 'error');
    expect(getByText('Imagen no disponible sin conexión.')).toBeTruthy();
  });

  it('abre el video dentro de la app', () => {
    const { getByTestId, getByText } = render(<RichContent blocks={[video]} />);
    fireEvent.press(getByTestId('lesson-video'));
    expect(getByTestId('video-player')).toBeTruthy();
    expect(getByText('Cerrar')).toBeTruthy();
  });

  it('muestra un aviso para un bloque desconocido', () => {
    const { getByText } = render(
      <RichContent blocks={[{ type: 'audio' } as unknown as typeof image]} />,
    );
    expect(getByText('Contenido no disponible.')).toBeTruthy();
  });
});
