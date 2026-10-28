/* eslint-disable react-hooks/immutability */
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';
import React from 'react';
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

type CardVariant = 'elevated' | 'filled' | 'outlined' | 'yellow' | 'coral' | 'mint' | 'lilac';

interface BrutalCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BrutalCard({
  children,
  onPress,
  variant = 'elevated',
  style,
  padding,
}: BrutalCardProps) {
  const { colors, radii, spacing, isDark } = useAppTheme();
  const pressedX = useSharedValue(0);
  const pressedY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressedX.value },
      { translateY: pressedY.value },
    ],
  }));

  const handlePressIn = () => {
    if (onPress) {
      pressedX.value = withTiming(2, { duration: 60 });
      pressedY.value = withTiming(2, { duration: 60 });
      haptic.light();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      pressedX.value = withSpring(0, { damping: 15, stiffness: 350 });
      pressedY.value = withSpring(0, { damping: 15, stiffness: 350 });
    }
  };

  let backgroundColor = colors.surface;
  let borderColor = colors.border;
  let shadowColor = isDark ? '#FFFFFF' : '#000000';

  if (variant === 'filled') {
    backgroundColor = colors.surfaceVariant;
  } else if (variant === 'yellow') {
    backgroundColor = colors.accentYellow;
  } else if (variant === 'coral') {
    backgroundColor = colors.accentCoral;
  } else if (variant === 'mint') {
    backgroundColor = colors.accentJade;
  } else if (variant === 'lilac') {
    backgroundColor = colors.accentLilac;
  } else if (variant === 'outlined') {
    backgroundColor = 'transparent';
  }

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderRadius: radii.lg,
    padding: padding ?? spacing.base,
    borderWidth: 2.5,
    borderColor,
    shadowColor,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
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
