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
  colorScheme?: 'yellow' | 'mint' | 'pink' | 'purple' | 'blue' | 'coral' | 'sky' | 'lilac';
  variant?: any;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function M3Chip({
  label,
  selected = false,
  onPress,
  icon,
  badge,
  style,
  colorScheme = 'yellow',
  variant,
  testID,
}: M3ChipProps) {
  const { colors, radii, spacing, typography, shadowSmall } = useAppTheme();
  const pressedX = useSharedValue(0);
  const pressedY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressedX.value },
      { translateY: pressedY.value },
    ],
  }));

  const handlePressIn = () => {
    pressedX.value = withTiming(1.5, { duration: 50 });
    pressedY.value = withTiming(1.5, { duration: 50 });
    haptic.selection();
  };

  const handlePressOut = () => {
    pressedX.value = withSpring(0, { damping: 15, stiffness: 350 });
    pressedY.value = withSpring(0, { damping: 15, stiffness: 350 });
  };

  const effectiveScheme = (variant && typeof variant === 'string' && ['yellow', 'mint', 'pink', 'purple', 'blue', 'coral', 'sky', 'lilac'].includes(variant)) ? variant : colorScheme;

  let activeColor = colors.yellow;
  if (effectiveScheme === 'mint') activeColor = colors.mint;
  else if (effectiveScheme === 'pink' || effectiveScheme === 'coral') activeColor = colors.pink;
  else if (effectiveScheme === 'purple' || effectiveScheme === 'lilac') activeColor = colors.purple;
  else if (effectiveScheme === 'blue' || effectiveScheme === 'sky') activeColor = colors.blue;

  const backgroundColor = selected ? activeColor : colors.surface;
  const textColor = '#000000';

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={[
        styles.chip,
        {
          backgroundColor,
          borderColor: colors.border,
          borderRadius: radii.sm,
          paddingHorizontal: spacing.grid2,
          borderWidth: colors.borderWidth,
          shadowColor: shadowSmall.shadowColor,
          shadowOffset: shadowSmall.shadowOffset,
          shadowOpacity: shadowSmall.shadowOpacity,
          shadowRadius: shadowSmall.shadowRadius,
          elevation: shadowSmall.elevation,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { fontSize: typography.sizes.xs }]}>{label}</Text>
      {badge !== undefined && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: selected ? '#000000' : colors.surfaceAlt,
              borderRadius: radii.xs,
              borderColor: colors.border,
              borderWidth: 1.5,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: selected ? '#FFFFFF' : '#000000',
                fontSize: typography.sizes.xs,
              },
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
    minHeight: 40, // Accessible touch height
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  icon: {
    marginRight: 6,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
});
