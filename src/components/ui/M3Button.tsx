import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
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

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large' | 'sm' | 'md' | 'lg';

interface M3ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant | 'filled' | 'tonal' | 'outlined'; // backwards compatibility
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  pill?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function M3Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  pill = false,
  testID,
}: M3ButtonProps) {
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
    if (!disabled && !loading) {
      pressedX.value = withTiming(2, { duration: 50 });
      pressedY.value = withTiming(2, { duration: 50 });
      haptic.medium();
    }
  };

  const handlePressOut = () => {
    pressedX.value = withSpring(0, { damping: 15, stiffness: 350 });
    pressedY.value = withSpring(0, { damping: 15, stiffness: 350 });
  };

  // Resolve variants (supporting legacy aliases 'filled', 'tonal', 'outlined')
  let resolvedVariant = variant;
  if (variant === 'filled') resolvedVariant = 'primary';
  if (variant === 'tonal' || variant === 'outlined') resolvedVariant = 'secondary';

  let backgroundColor = colors.yellow;
  let textColor = '#000000';
  let borderWidth = colors.borderWidth;
  let hasShadow = true;

  if (resolvedVariant === 'primary') {
    backgroundColor = disabled ? colors.surfaceAlt : colors.yellow;
    textColor = '#000000';
  } else if (resolvedVariant === 'secondary') {
    backgroundColor = disabled ? colors.surfaceAlt : colors.surface;
    textColor = colors.text;
  } else if (resolvedVariant === 'destructive') {
    backgroundColor = disabled ? colors.surfaceAlt : colors.pink;
    textColor = '#000000';
  } else if (resolvedVariant === 'ghost') {
    backgroundColor = 'transparent';
    textColor = colors.text;
    borderWidth = 0;
    hasShadow = false;
  }

  // Size styling ensuring minimum 44px touch targets
  let minHeight = spacing.minTouchTarget; // 44px minimum touch target!
  let paddingHorizontal = spacing.grid2; // 16px
  let fontSize = typography.sizes.sm; // 14px

  if (size === 'small' || size === 'sm') {
    minHeight = spacing.minTouchTarget;
    paddingHorizontal = spacing.grid2;
    fontSize = typography.sizes.xs; // 12px
  } else if (size === 'large' || size === 'lg') {
    minHeight = 52;
    paddingHorizontal = spacing.grid3;
    fontSize = typography.sizes.base; // 16px
  }

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          minHeight,
          paddingHorizontal,
          backgroundColor,
          borderRadius: pill ? radii.full : radii.md,
          borderWidth,
          borderColor: colors.border,
          shadowColor: shadowSmall.shadowColor,
          shadowOffset: hasShadow ? shadowSmall.shadowOffset : { width: 0, height: 0 },
          shadowOpacity: hasShadow ? shadowSmall.shadowOpacity : 0,
          shadowRadius: shadowSmall.shadowRadius,
          elevation: hasShadow ? shadowSmall.elevation : 0,
          opacity: disabled ? 0.6 : 1,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize,
                fontWeight: typography.weights.bold,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
