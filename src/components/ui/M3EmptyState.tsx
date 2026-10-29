import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Button } from './M3Button';

interface M3EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function M3EmptyState({
  icon = 'inbox',
  title,
  description,
  actionTitle,
  onAction,
}: M3EmptyStateProps) {
  const { colors, spacing, typography, radii, shadow } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: colors.borderWidth,
          borderRadius: radii.md,
          shadowColor: shadow.shadowColor,
          shadowOffset: shadow.shadowOffset,
          shadowOpacity: shadow.shadowOpacity,
          shadowRadius: shadow.shadowRadius,
          elevation: shadow.elevation,
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: colors.yellow,
            borderColor: colors.border,
            borderWidth: colors.borderWidth,
            borderRadius: radii.sm,
          },
        ]}
      >
        <Feather name={icon as any} size={28} color="#000000" />
      </View>
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontSize: typography.sizes.base,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: colors.textMuted,
            fontSize: typography.sizes.xs,
            marginBottom: actionTitle ? spacing.grid2 : 0,
          },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onAction && (
        <M3Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="sm"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginVertical: 16,
    marginHorizontal: 4,
  },
  iconBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  description: {
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
