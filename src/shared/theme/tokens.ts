export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  text: string;
  muted: string;
  line: string;
  primary: string;
  primaryStrong: string;
  success: string;
  warning: string;
  danger: string;
  dangerStrong: string;
  soft: string;
  code: string;
  onPrimary: string;
}

export const palette: Record<ThemeMode, ThemeColors> = {
  dark: {
    bg: '#10171E',
    surface: '#243444',
    card: '#1B2835',
    text: '#F4F7FB',
    muted: '#9CABBC',
    line: '#304153',
    primary: '#5285FF',
    primaryStrong: '#3563D9',
    success: '#2DD4A0',
    warning: '#FFC266',
    danger: '#FF7373',
    dangerStrong: '#C43D4B',
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
    primaryStrong: '#315FEC',
    success: '#138A63',
    warning: '#B98225',
    danger: '#C43D4B',
    dangerStrong: '#C43D4B',
    soft: '#E9EFF9',
    code: '#142033',
    onPrimary: '#FFFFFF',
  },
};

export const radius = {
  card: 16,
  control: 12,
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
  sans: 'SourceSans3',
  mono: 'FiraCode',
} as const;

/** Dark ink for the fixed unit accent tiles. */
export const accentInk = '#10151D';

const unitAccents: Record<string, string> = {
  blue: '#4D7CFE',
  violet: '#8B7CFE',
  green: '#45D39A',
  amber: '#D99318',
  orange: '#EB6A3D',
  rose: '#E3547D',
  teal: '#18A7A2',
};

export function accentForUnit(color: string): string {
  return unitAccents[color] ?? unitAccents.blue;
}

export const typography = {
  eyebrow: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18 },
  title: { fontSize: 28, lineHeight: 32, letterSpacing: -0.5, fontWeight: '700' as const },
  heading: { fontSize: 20, lineHeight: 26, letterSpacing: -0.4, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 25 },
  small: { fontSize: 14, lineHeight: 20 },
  code: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 20 },
} as const;

export const learningAccents = {
  dark: { lesson: '#5285FF', examples: '#38BFA0', exercises: '#F0B454', evaluation: '#9483FF' },
  light: { lesson: '#315FEC', examples: '#087D65', exercises: '#946013', evaluation: '#6951CC' },
} as const;
