import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  Radii,
  HardShadow,
  HardShadowSmall,
} from './tokens';

type ThemeMode = 'system' | 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    border: string;
    borderWidth: number;
    yellow: string; // Primary action & active state ONLY
    mint: string;   // Habits
    pink: string;   // Streaks & alerts
    purple: string; // AI
    blue: string;   // Finance

    // Backward-compatibility aliases
    onBackground: string;
    onSurface: string;
    accentYellow: string;
    accentJade: string;
    accentPink: string;
    accentRed: string;
    accentPurple: string;
    accentBlue: string;
    accentCoral: string;
    accentSky: string;
    accentLilac: string;
    accentMint: string;
    primary: string;
    divider: string;
  };
  typography: typeof Typography;
  spacing: typeof Spacing;
  radii: typeof Radii;
  shadow: typeof HardShadow;
  shadowSmall: typeof HardShadowSmall;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<AppTheme | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark = useMemo(() => {
    if (mode === 'light') return false;
    if (mode === 'dark') return true;
    return systemScheme === 'dark';
  }, [mode, systemScheme]);

  const value = useMemo<AppTheme>(() => {
    const activeColors = isDark
      ? {
          background: Colors.dark.background,
          surface: Colors.dark.surface,
          surfaceAlt: Colors.dark.surfaceAlt,
          text: Colors.dark.text,
          textMuted: Colors.dark.textMuted,
          border: Colors.dark.border,
          borderWidth: Colors.dark.borderWidth,
          yellow: Colors.dark.yellow,
          mint: Colors.dark.mint,
          pink: Colors.dark.pink,
          purple: Colors.dark.purple,
          blue: Colors.dark.blue,

          onBackground: Colors.dark.text,
          onSurface: Colors.dark.text,
          accentYellow: Colors.dark.yellow,
          accentJade: Colors.dark.mint,
          accentPink: Colors.dark.pink,
          accentRed: Colors.dark.pink,
          accentPurple: Colors.dark.purple,
          accentBlue: Colors.dark.blue,
          accentCoral: Colors.dark.pink,
          accentSky: Colors.dark.blue,
          accentLilac: Colors.dark.purple,
          accentMint: Colors.dark.mint,
          primary: Colors.dark.yellow,
          divider: Colors.dark.border,
        }
      : {
          background: Colors.background,
          surface: Colors.surface,
          surfaceAlt: Colors.surfaceAlt,
          text: Colors.text,
          textMuted: Colors.textMuted,
          border: Colors.border,
          borderWidth: Colors.borderWidth,
          yellow: Colors.yellow,
          mint: Colors.mint,
          pink: Colors.pink,
          purple: Colors.purple,
          blue: Colors.blue,

          onBackground: Colors.text,
          onSurface: Colors.text,
          accentYellow: Colors.yellow,
          accentJade: Colors.mint,
          accentPink: Colors.pink,
          accentRed: Colors.pink,
          accentPurple: Colors.purple,
          accentBlue: Colors.blue,
          accentCoral: Colors.pink,
          accentSky: Colors.blue,
          accentLilac: Colors.purple,
          accentMint: Colors.mint,
          primary: Colors.yellow,
          divider: Colors.border,
        };

    const shadow = isDark
      ? {
          ...HardShadow,
          shadowColor: '#FFFFFF',
        }
      : HardShadow;

    const shadowSmall = isDark
      ? {
          ...HardShadowSmall,
          shadowColor: '#FFFFFF',
        }
      : HardShadowSmall;

    return {
      mode,
      isDark,
      colors: activeColors,
      typography: Typography,
      spacing: Spacing,
      radii: Radii,
      shadow,
      shadowSmall,
      setThemeMode: setMode,
    };
  }, [mode, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}
