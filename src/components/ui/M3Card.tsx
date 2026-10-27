import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';

type CardVariant = 'elevated' | 'filled' | 'outlined';

interface M3CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function M3Card({
  children,
  onPress,
  variant = 'filled',
  style,
  padding,
}: M3CardProps) {
  const { colors, radii, spacing, isDark } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withTiming(0.98, { duration: 100 });
      haptic.light();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  let backgroundColor = colors.surface;
  let borderWidth = 0;
  let borderColor = 'transparent';
  let elevation = 0;
  let shadowOpacity = 0;

  if (variant === 'filled') {
    backgroundColor = colors.surfaceVariant;
  } else if (variant === 'elevated') {
    backgroundColor = colors.surfaceElevated;
    elevation = 2;
    shadowOpacity = isDark ? 0.3 : 0.08;
  } else if (variant === 'outlined') {
    backgroundColor = colors.surface;
    borderWidth = 1;
    borderColor = colors.outlineVariant;
  }

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderRadius: radii.xl,
    padding: padding ?? spacing.lg,
    borderWidth,
    borderColor,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity,
    shadowRadius: 6,
    elevation,
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.base, cardStyle, animatedStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[styles.base, cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
