/**
 * LifeOS Neo-Brutalist Design Tokens
 * Strict adherence to the LifeOS Specification:
 * - Canvas #F7F5F0, text/borders black, 2px borders, 4px 4px 0 #000 hard shadow.
 * - Strict Color Roles:
 *     Yellow = Primary action & active state ONLY
 *     Mint   = Habits
 *     Pink   = Streaks & alerts
 *     Purple = AI
 *     Blue   = Finance
 * - Type scale: 28, 20, 16, 14, 12 (strictly nothing below 12px).
 * - 8px spacing grid, min 44px touch targets.
 */

export const Colors = {
  // Canvas & Base
  background: '#F7F5F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EDE8',
  text: '#000000',
  textMuted: '#555555',
  border: '#000000',
  borderWidth: 2,

  // Semantic Color Roles
  yellow: '#FFE500',   // Primary actions & active nav state ONLY
  mint: '#70E4BA',     // Habits & healthy status
  pink: '#FF6584',     // Streaks, alerts, urgent items
  purple: '#D8B4FE',   // AI assistant & insights
  blue: '#4DC9FF',     // Finance & transactions

  // Dark Mode Counterparts (High contrast, WCAG AA compliant)
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceAlt: '#282828',
    text: '#FFFFFF',
    textMuted: '#A0A0A0',
    border: '#FFFFFF',
    borderWidth: 2,

    yellow: '#FFE500',
    mint: '#70E4BA',
    pink: '#FF6584',
    purple: '#D8B4FE',
    blue: '#4DC9FF',
  },
};

export const Typography = {
  // Type scale strictly enforced: 28, 20, 16, 14, 12 (nothing < 12px)
  sizes: {
    xs: 12,    // captions, badges, tags (strictly min 12px)
    sm: 14,    // secondary body, form labels
    base: 16,  // body copy, list item titles
    lg: 20,    // section titles, card headers
    xl: 28,    // screen titles, hero metrics
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  // Fonts: One heading, one body, SpaceMono exclusively for large numbers & badges
  fonts: {
    heading: 'System',
    body: 'System',
    numeric: 'SpaceMono',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.6,
  },
};

export const Spacing = {
  // Strict 8px grid
  grid1: 8,
  grid2: 16,
  grid3: 24,
  grid4: 32,
  grid5: 40,
  grid6: 48,
  minTouchTarget: 44,

  // Compatibility aliases
  xs: 8,
  sm: 8,
  md: 16,
  base: 16,
  lg: 24,
  xl: 32,
};

export const Radii = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

/**
 * Single Unified Neo-Brutalist Hard Shadow (4px 4px 0 #000, zero blur)
 */
export const HardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
};

export const HardShadowSmall = {
  shadowColor: '#000000',
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 2,
};
