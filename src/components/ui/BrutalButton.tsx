/* eslint-disable react-hooks/immutability */
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'destructive' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface BrutalButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  pill?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BrutalButton({
  title,
  onPress,
  variant = 'filled',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  pill = false,
}: BrutalButtonProps) {
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
    if (!disabled && !loading) {
      pressedX.value = withTiming(2, { duration: 60 });
      pressedY.value = withTiming(2, { duration: 60 });
      haptic.medium();
    }
  };

  const handlePressOut = () => {
    pressedX.value = withSpring(0, { damping: 15, stiffness: 350 });
    pressedY.value = withSpring(0, { damping: 15, stiffness: 350 });
  };

  // Neo-Brutalist Colors
  let backgroundColor: string = colors.accentYellow;
  let textColor: string = '#000000';
  let borderWidth: number = 2.5;
  let borderColor: string = colors.border;
  let shadowWidth = 3;
  let shadowHeight = 3;

  if (variant === 'filled') {
    backgroundColor = disabled ? colors.surfaceVariant : colors.accentYellow;
    textColor = '#000000';
  } else if (variant === 'tonal') {
    backgroundColor = disabled ? colors.surfaceVariant : colors.surface;
    textColor = colors.onSurface;
  } else if (variant === 'outlined') {
    backgroundColor = 'transparent';
    textColor = colors.onBackground;
  } else if (variant === 'destructive') {
    backgroundColor = colors.accentRed;
    textColor = '#FFFFFF';
  } else if (variant === 'text') {
    backgroundColor = 'transparent';
    textColor = colors.onBackground;
    borderWidth = 0;
    shadowWidth = 0;
    shadowHeight = 0;
  }

  // Size styling
  let height = 46;
  let paddingHorizontal = spacing.lg;
  let fontSize = 13;

  if (size === 'small') {
    height = 36;
    paddingHorizontal = spacing.md;
    fontSize = 11;
    shadowWidth = 2;
    shadowHeight = 2;
  } else if (size === 'large') {
    height = 54;
    paddingHorizontal = spacing.xxl;
    fontSize = 15;
    shadowWidth = 4;
    shadowHeight = 4;
  }

  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          height,
          paddingHorizontal,
          backgroundColor,
          borderRadius: pill ? radii.full : radii.md,
          borderWidth,
          borderColor,
          shadowColor,
          shadowOffset: { width: shadowWidth, height: shadowHeight },
          shadowOpacity: borderWidth > 0 ? 1 : 0,
          shadowRadius: 0,
          elevation: borderWidth > 0 ? 3 : 0,
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
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize,
                fontFamily: 'SpaceMono',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
