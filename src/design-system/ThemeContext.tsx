import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { LightColors, DarkColors, AppColorScheme, Spacing, Radii, Typography, HardShadows } from './tokens';

type ThemeMode = 'system' | 'light' | 'dark';

export type ThemeColors = AppColorScheme;

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppColorScheme;
  spacing: typeof Spacing;
  radii: typeof Radii;
  typography: typeof Typography;
  hardShadows: typeof HardShadows;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark = useMemo(() => {
    if (mode === 'light') return false;
    if (mode === 'dark') return true;
    return systemScheme === 'dark';
  }, [mode, systemScheme]);

  const colors = useMemo(() => (isDark ? DarkColors : LightColors), [isDark]);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors,
      spacing: Spacing,
      radii: Radii,
      typography: Typography,
      hardShadows: HardShadows,
      setThemeMode: setMode,
    }),
    [mode, isDark, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}
