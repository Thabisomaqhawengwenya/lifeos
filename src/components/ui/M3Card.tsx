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

export type CardStripeColor =
  | 'yellow'
  | 'mint'
  | 'pink'
  | 'purple'
  | 'blue'
  | 'coral'
  | 'sky'
  | 'lilac';

export interface M3CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  stripe?: CardStripeColor;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  testID?: string;
  variant?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function M3Card({
  children,
  onPress,
  stripe,
  backgroundColor,
  style,
  padding,
  testID,
}: M3CardProps) {
  const { colors, radii, spacing, shadow } = useAppTheme();
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
      pressedX.value = withTiming(2, { duration: 50 });
      pressedY.value = withTiming(2, { duration: 50 });
      haptic.light();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      pressedX.value = withSpring(0, { damping: 15, stiffness: 350 });
      pressedY.value = withSpring(0, { damping: 15, stiffness: 350 });
    }
  };

  const cardBg = backgroundColor || colors.surface;

  let stripeBg: string | undefined;
  if (stripe === 'yellow') stripeBg = colors.yellow;
  else if (stripe === 'mint') stripeBg = colors.mint;
  else if (stripe === 'pink' || stripe === 'coral') stripeBg = colors.pink;
  else if (stripe === 'purple' || stripe === 'lilac') stripeBg = colors.purple;
  else if (stripe === 'blue' || stripe === 'sky') stripeBg = colors.blue;

  const cardStyle: ViewStyle = {
    backgroundColor: cardBg,
    borderRadius: radii.md,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    shadowColor: shadow.shadowColor,
    shadowOffset: shadow.shadowOffset,
    shadowOpacity: shadow.shadowOpacity,
    shadowRadius: shadow.shadowRadius,
    elevation: shadow.elevation,
    position: 'relative',
    overflow: 'hidden',
  };

  const innerStyle: ViewStyle = {
    padding: padding ?? spacing.grid2,
    paddingLeft: stripeBg ? (padding ?? spacing.grid2) + 6 : (padding ?? spacing.grid2),
  };

  const content = (
    <View style={innerStyle}>
      {stripeBg && (
        <View
          style={[
            styles.stripeBar,
            {
              backgroundColor: stripeBg,
              borderRightWidth: colors.borderWidth,
              borderRightColor: colors.border,
            },
          ]}
        />
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyle, animatedStyle, style]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View testID={testID} style={[cardStyle, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  stripeBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 8,
  },
});
