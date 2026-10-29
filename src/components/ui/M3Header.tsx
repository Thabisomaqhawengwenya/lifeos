import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';

interface M3HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  rightAction?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function M3Header({
  title,
  subtitle,
  badge,
  rightAction,
  showBack = false,
  onBack,
}: M3HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, radii, shadowSmall } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.grid2) + spacing.grid1,
          paddingHorizontal: spacing.grid2,
          paddingBottom: spacing.grid2,
          backgroundColor: colors.background,
          borderBottomWidth: colors.borderWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Top Row: Badge or Back button + Right Actions */}
      {(badge || rightAction || showBack) && (
        <View style={styles.utilityRow}>
          <View style={styles.utilityLeft}>
            {showBack && (
              <Pressable
                onPress={() => {
                  haptic.light();
                  onBack?.();
                }}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radii.sm,
                    borderWidth: colors.borderWidth,
                    shadowColor: shadowSmall.shadowColor,
                    shadowOffset: shadowSmall.shadowOffset,
                    shadowOpacity: shadowSmall.shadowOpacity,
                    shadowRadius: shadowSmall.shadowRadius,
                    elevation: shadowSmall.elevation,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </Pressable>
            )}
            {badge && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.yellow,
                    borderColor: colors.border,
                    borderRadius: radii.sm,
                    borderWidth: colors.borderWidth,
                    shadowColor: shadowSmall.shadowColor,
                    shadowOffset: shadowSmall.shadowOffset,
                    shadowOpacity: shadowSmall.shadowOpacity,
                    shadowRadius: shadowSmall.shadowRadius,
                    elevation: shadowSmall.elevation,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: '#000000' }]}>
                  {badge.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {rightAction && <View style={styles.rightActionContainer}>{rightAction}</View>}
        </View>
      )}

      {/* Main Title Row: Full width to prevent orphaning words */}
      <View style={styles.titleContainer}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.sizes.xl, // 28
            },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textMuted,
                fontSize: typography.sizes.xs, // 12px min
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 36,
  },
  utilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleContainer: {
    width: '100%',
    marginTop: 2,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
