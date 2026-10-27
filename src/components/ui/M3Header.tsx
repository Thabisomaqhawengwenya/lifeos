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
  const { colors, spacing, typography, radii } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.md) + spacing.xs,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          {badge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.primaryContainer,
                  borderRadius: radii.full,
                  paddingHorizontal: spacing.sm + 2,
                  paddingVertical: spacing.xxs,
                },
              ]}
            >
              <Text
                style={[
                  typography.labelSmall,
                  { color: colors.onPrimaryContainer, fontWeight: '700' },
                ]}
              >
                {badge.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.headingRow}>
            {showBack && (
              <Pressable
                onPress={() => {
                  haptic.light();
                  onBack?.();
                }}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={24} color={colors.onBackground} />
              </Pressable>
            )}
            <Text style={[typography.headlineLarge, { color: colors.onBackground }]}>
              {title}
            </Text>
          </View>
          {subtitle && (
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightAction && <View style={styles.rightActionContainer}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
    paddingRight: 12,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
