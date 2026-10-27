import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Button } from './M3Button';

interface M3EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function M3EmptyState({
  icon = 'leaf-outline',
  title,
  description,
  actionTitle,
  onAction,
}: M3EmptyStateProps) {
  const { colors, spacing, typography, radii } = useAppTheme();

  return (
    <View style={[styles.container, { padding: spacing.xxl }]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: radii.full,
            width: 72,
            height: 72,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={[typography.titleLarge, { color: colors.onSurface, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text
        style={[
          typography.bodyMedium,
          {
            color: colors.onSurfaceVariant,
            textAlign: 'center',
            marginTop: spacing.xs,
            marginBottom: actionTitle ? spacing.lg : 0,
            maxWidth: 280,
          },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onAction && (
        <M3Button
          title={actionTitle}
          onPress={onAction}
          variant="tonal"
          size="small"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
