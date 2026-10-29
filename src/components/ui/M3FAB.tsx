import React from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';

interface M3FABProps {
  onPress: () => void;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function M3FAB({
  onPress,
  icon = 'plus',
  style,
  accessibilityLabel = 'Create new item',
}: M3FABProps) {
  const { colors, radii, shadow } = useAppTheme();
  const pressedX = useSharedValue(0);
  const pressedY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressedX.value },
      { translateY: pressedY.value },
    ],
  }));

  const handlePressIn = () => {
    pressedX.value = withTiming(2, { duration: 60 });
    pressedY.value = withTiming(2, { duration: 60 });
    haptic.heavy();
  };

  const handlePressOut = () => {
    pressedX.value = withSpring(0, { damping: 15, stiffness: 350 });
    pressedY.value = withSpring(0, { damping: 15, stiffness: 350 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.fab,
        {
          backgroundColor: colors.yellow,
          borderColor: colors.border,
          borderWidth: colors.borderWidth,
          borderRadius: radii.md,
          shadowColor: shadow.shadowColor,
          shadowOffset: shadow.shadowOffset,
          shadowOpacity: shadow.shadowOpacity,
          shadowRadius: shadow.shadowRadius,
          elevation: shadow.elevation,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Feather name={icon === 'add' ? 'plus' : (icon as any)} size={26} color="#000000" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
});
