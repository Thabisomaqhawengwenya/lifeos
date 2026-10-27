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
  const { colors, spacing, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: isDark ? '#FFFFFF' : '#000000',
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: colors.accentYellow,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={30} color="#000000" />
      </View>
      <Text style={[styles.title, { color: colors.onSurface }]}>
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: isDark ? '#B0B0B0' : '#444444',
            marginBottom: actionTitle ? spacing.base : 0,
          },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onAction && (
        <M3Button
          title={actionTitle}
          onPress={onAction}
          variant="filled"
          size="small"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderRadius: 12,
    padding: 24,
    marginVertical: 16,
    marginHorizontal: 4,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  title: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
