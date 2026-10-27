/**
 * LifeOS Neo-Brutalism Design Tokens
 * Directly inspired by Maqhawe T Ngwenya's portfolio (https://maqhawe.vercel.app)
 * and Pinterest App Board benchmarks (Tuckii Neo-Brutalism & Taxi Rider Brutalism).
 */

export const LightColors = {
  // Primary Portfolio Electric Yellow
  primary: '#FFE500',
  onPrimary: '#000000',
  primaryContainer: '#FFF8B2',
  onPrimaryContainer: '#000000',

  // Secondary Stark Black
  secondary: '#000000',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8E6DF',
  onSecondaryContainer: '#000000',

  // Tertiary Tuckii Lilac
  tertiary: '#D8B4FE',
  onTertiary: '#000000',
  tertiaryContainer: '#F3E8FF',
  onTertiaryContainer: '#000000',

  // Canvas & Surfaces (Portfolio warm cream & pure white)
  background: '#F8F6F2',
  onBackground: '#000000',

  surface: '#FFFFFF',
  onSurface: '#000000',
  surfaceVariant: '#F0EDE8',
  onSurfaceVariant: '#222222',
  surfaceElevated: '#FFFFFF',

  // Hard Brutalist Borders
  border: '#000000',
  borderWidth: 2.5,
  outline: '#000000',
  outlineVariant: '#000000',

  // Accents (Direct from maqhawe.vercel.app adminTheme.ts)
  accentYellow: '#FFE500',
  accentRed: '#FF3C2F',
  accentCoral: '#FF6584',
  accentBlue: '#0047FF',
  accentSky: '#4DC9FF',
  accentMint: '#00C853',
  accentJade: '#70E4BA',
  accentLilac: '#D8B4FE',

  // Status Colors
  success: '#00C853',
  successContainer: '#D1FADF',
  onSuccessContainer: '#000000',

  warning: '#FFE500',
  warningContainer: '#FFF5A0',
  onWarningContainer: '#000000',

  error: '#FF3C2F',
  errorContainer: '#FEE4E2',
  onErrorContainer: '#000000',

  accentGold: '#FFE500',
  accentGoldContainer: '#FFF8B2',

  divider: '#000000',
  shadow: '#000000',
};

export const DarkColors = {
  // Neo-Brutalism Dark Theme (High-contrast pitch obsidian with electric neon borders)
  primary: '#FFE500',
  onPrimary: '#000000',
  primaryContainer: '#403800',
  onPrimaryContainer: '#FFE500',

  secondary: '#FFFFFF',
  onSecondary: '#000000',
  secondaryContainer: '#262626',
  onSecondaryContainer: '#FFFFFF',

  tertiary: '#D8B4FE',
  onTertiary: '#000000',
  tertiaryContainer: '#3B185F',
  onTertiaryContainer: '#F3E8FF',

  background: '#121212',
  onBackground: '#FFFFFF',

  surface: '#1A1A1A',
  onSurface: '#FFFFFF',
  surfaceVariant: '#242424',
  onSurfaceVariant: '#E0E0E0',
  surfaceElevated: '#262626',

  border: '#FFFFFF',
  borderWidth: 2.5,
  outline: '#FFFFFF',
  outlineVariant: '#FFFFFF',

  accentYellow: '#FFE500',
  accentRed: '#FF5449',
  accentCoral: '#FF7F96',
  accentBlue: '#4D82FF',
  accentSky: '#6CD4FF',
  accentMint: '#46DB8B',
  accentJade: '#85EAC2',
  accentLilac: '#E2C7FE',

  success: '#46DB8B',
  successContainer: '#004D20',
  onSuccessContainer: '#FFFFFF',

  warning: '#FFE500',
  warningContainer: '#4A4200',
  onWarningContainer: '#FFFFFF',

  error: '#FF5449',
  errorContainer: '#5C0A0A',
  onErrorContainer: '#FFFFFF',

  accentGold: '#FFE500',
  accentGoldContainer: '#4A4200',

  divider: '#FFFFFF',
  shadow: '#000000',
};

export const Typography = {
  fontFamily: {
    display: 'SpaceMono',
    sans: 'System',
    mono: 'SpaceMono',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.6,
    wider: 1.2,
  },
};

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  gutter: 16,
};

export const Radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

/**
 * Hard Neo-Brutalist Isometric Shadows (No Blur, Strict Offset)
 */
export const HardShadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  yellow: {
    shadowColor: '#FFE500',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  coral: {
    shadowColor: '#FF3C2F',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  mint: {
    shadowColor: '#00C853',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
};

export type AppColorScheme = typeof LightColors;
