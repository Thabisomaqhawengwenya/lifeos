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
  const { colors, spacing, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.md) + spacing.xs,
          paddingHorizontal: spacing.base,
          paddingBottom: spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: 2.5,
          borderBottomColor: colors.border,
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
                  backgroundColor: colors.accentYellow,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.headingRow}>
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
                    shadowColor: isDark ? '#FFFFFF' : '#000000',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color={colors.onBackground} />
              </Pressable>
            )}
            <Text
              style={[
                styles.title,
                {
                  color: colors.onBackground,
                  fontFamily: 'SpaceMono',
                },
              ]}
            >
              {title}
            </Text>
          </View>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: isDark ? '#A0A0A0' : '#444444' },
              ]}
            >
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
    marginTop: 2,
  },
  backButton: {
    marginRight: 10,
    padding: 6,
    borderWidth: 2,
    borderRadius: 6,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  badgeText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
