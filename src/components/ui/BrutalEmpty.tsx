import { BrutalButton } from '@/src/components/ui/BrutalButton';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface BrutalEmptyProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function BrutalEmpty({
  icon = 'leaf-outline',
  title,
  description,
  actionTitle,
  onAction,
}: BrutalEmptyProps) {
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
        <BrutalButton
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
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 19,
  },
});
