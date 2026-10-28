/* eslint-disable react-hooks/immutability */
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';
import { Ionicons } from '@expo/vector-icons';
import {
    Pressable,
    StyleProp,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface BrutalFABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BrutalFAB({
  onPress,
  icon = 'add',
  style,
  accessibilityLabel = 'Create new item',
}: BrutalFABProps) {
  const { colors, radii, isDark } = useAppTheme();
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

  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.fab,
        {
          backgroundColor: colors.accentYellow,
          borderColor: colors.border,
          borderRadius: radii.md,
          shadowColor,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={28} color="#000000" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
});
