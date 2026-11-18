import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useLearnerProfile } from '@/features/profile/viewmodel/useLearnerProfile';

import { palette, radius, spacing, typography, fonts, type ThemeColors, type ThemeMode } from '@/shared/theme/tokens';

export interface ThemeValue {
  mode: ThemeMode;
  colors: ThemeColors;
  largeText: boolean;
  scale: number;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  fonts: typeof fonts;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { darkMode } = useLearnerProfile();

  const value = useMemo<ThemeValue>(() => {
    const mode: ThemeMode = darkMode ? 'dark' : 'light';
    return {
      mode,
      colors: palette[mode],
      largeText: true,
      scale: 1.15,
      spacing,
      radius,
      typography,
      fonts,
    };
  }, [darkMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de AppThemeProvider');
  }
  return context;
}
