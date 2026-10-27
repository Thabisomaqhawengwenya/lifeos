import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';

interface M3ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  badge?: number | string;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function M3Chip({
  label,
  selected = false,
  onPress,
  icon,
  badge,
  style,
}: M3ChipProps) {
  const { colors, radii, spacing, typography } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    haptic.selection();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const backgroundColor = selected ? colors.primary : colors.surfaceVariant;
  const textColor = selected ? colors.onPrimary : colors.onSurfaceVariant;
  const borderColor = selected ? colors.primary : colors.outlineVariant;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        {
          backgroundColor,
          borderColor,
          borderRadius: radii.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 2,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[typography.labelMedium, { color: textColor }]}>{label}</Text>
      {badge !== undefined && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: selected ? colors.onPrimary : colors.primary,
              borderRadius: radii.full,
            },
          ]}
        >
          <Text
            style={[
              typography.labelSmall,
              { color: selected ? colors.primary : colors.onPrimary, fontSize: 10 },
            ]}
          >
            {badge}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 34,
  },
  icon: {
    marginRight: 6,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
