import { Platform } from 'react-native';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  text: string;
  muted: string;
  line: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  soft: string;
  code: string;
  onPrimary: string;
}

export const palette: Record<ThemeMode, ThemeColors> = {
  dark: {
    bg: '#10151D',
    surface: '#19212C',
    card: '#1E2835',
    text: '#F4F7FB',
    muted: '#9CABBC',
    line: '#324050',
    primary: '#4D7CFE',
    success: '#45D39A',
    warning: '#F3BC61',
    danger: '#EE6F7D',
    soft: '#263447',
    code: '#121923',
    onPrimary: '#FFFFFF',
  },
  light: {
    bg: '#F5F7FB',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#172033',
    muted: '#617086',
    line: '#DCE3ED',
    primary: '#315FEC',
    success: '#138A63',
    warning: '#B98225',
    danger: '#C43D4B',
    soft: '#E9EFF9',
    code: '#142033',
    onPrimary: '#FFFFFF',
  },
};

export const radius = {
  card: 16,
  control: 14,
  tile: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fonts = {
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const typography = {
  eyebrow: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' as const },
  title: { fontSize: 30, lineHeight: 32, letterSpacing: -1 },
  heading: { fontSize: 20, letterSpacing: -0.4 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 12, lineHeight: 16 },
} as const;
