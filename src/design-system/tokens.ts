export const LightColors = {
  primary: '#0F4C3A', // Deep Forest Emerald
  onPrimary: '#FFFFFF',
  primaryContainer: '#D0E8DC',
  onPrimaryContainer: '#052017',

  secondary: '#335345',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#D6E6DC',
  onSecondaryContainer: '#0F2018',

  tertiary: '#21566B', // Deep Slate Indigo
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#CBE6F5',
  onTertiaryContainer: '#041E28',

  background: '#F6F9F7',
  onBackground: '#171D1A',

  surface: '#FFFFFF',
  onSurface: '#171D1A',
  surfaceVariant: '#E9EFEA',
  onSurfaceVariant: '#404944',
  surfaceElevated: '#FFFFFF',

  outline: '#707974',
  outlineVariant: '#C0C9C3',

  success: '#147D4C',
  successContainer: '#D0F4DF',
  onSuccessContainer: '#002110',

  warning: '#BA7500',
  warningContainer: '#FFE0A8',
  onWarningContainer: '#281700',

  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  accentGold: '#C58B12',
  accentGoldContainer: '#FCEAC2',

  divider: 'rgba(0, 0, 0, 0.08)',
  shadow: '#000000',
};

export const DarkColors = {
  primary: '#80D7B4', // Luminous Mint Pine
  onPrimary: '#003828',
  primaryContainer: '#0E4E3B',
  onPrimaryContainer: '#9DF4CE',

  secondary: '#B4CCBF',
  onSecondary: '#1F3529',
  secondaryContainer: '#354B3F',
  onSecondaryContainer: '#D0E8DB',

  tertiary: '#94CEE7',
  onTertiary: '#003444',
  tertiaryContainer: '#134B5E',
  onTertiaryContainer: '#BDE8FD',

  background: '#0D1210',
  onBackground: '#DFE4DF',

  surface: '#131A16',
  onSurface: '#DFE4DF',
  surfaceVariant: '#1E2622',
  onSurfaceVariant: '#C0C9C3',
  surfaceElevated: '#212B26',

  outline: '#8A938E',
  outlineVariant: '#3F4944',

  success: '#46DB8B',
  successContainer: '#00522B',
  onSuccessContainer: '#68FFAC',

  warning: '#FFBA4C',
  warningContainer: '#593900',
  onWarningContainer: '#FFDDB1',

  error: '#FFB4AB',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  accentGold: '#F0C265',
  accentGoldContainer: '#523A00',

  divider: 'rgba(255, 255, 255, 0.08)',
  shadow: '#000000',
};

export type ThemeColors = typeof LightColors;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Radii = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const Typography = {
  displayLarge: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.5 },
  displayMedium: { fontSize: 26, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.3 },
  headlineLarge: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  headlineMedium: { fontSize: 19, lineHeight: 26, fontWeight: '600' as const },
  titleLarge: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  titleMedium: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  labelSmall: { fontSize: 11, lineHeight: 14, fontWeight: '500' as const },
};
