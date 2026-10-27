import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
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

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface M3ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function M3Button({
  title,
  onPress,
  variant = 'filled',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}: M3ButtonProps) {
  const { colors, radii, spacing, typography } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withTiming(0.96, { duration: 100 });
      haptic.light();
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  // Variant styling
  let backgroundColor: string = colors.primary;
  let textColor: string = colors.onPrimary;
  let borderWidth: number = 0;
  let borderColor: string = 'transparent';

  if (variant === 'filled') {
    backgroundColor = disabled ? colors.surfaceVariant : colors.primary;
    textColor = disabled ? colors.outline : colors.onPrimary;
  } else if (variant === 'tonal') {
    backgroundColor = disabled ? colors.surfaceVariant : colors.primaryContainer;
    textColor = disabled ? colors.outline : colors.onPrimaryContainer;
  } else if (variant === 'outlined') {
    backgroundColor = 'transparent';
    textColor = disabled ? colors.outline : colors.primary;
    borderWidth = 1;
    borderColor = disabled ? colors.surfaceVariant : colors.outlineVariant;
  } else if (variant === 'text') {
    backgroundColor = 'transparent';
    textColor = disabled ? colors.outline : colors.primary;
  }

  // Size styling
  let height = 44;
  let paddingHorizontal = spacing.lg;
  let fontStyle = typography.labelLarge;

  if (size === 'small') {
    height = 36;
    paddingHorizontal = spacing.md;
    fontStyle = typography.labelMedium;
  } else if (size === 'large') {
    height = 52;
    paddingHorizontal = spacing.xxl;
    fontStyle = typography.titleMedium;
  }

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
          borderRadius: radii.full,
          borderWidth,
          borderColor,
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
          {icon && <Animated.View style={styles.iconContainer}>{icon}</Animated.View>}
          <Text style={[styles.text, fontStyle, { color: textColor }, textStyle]}>{title}</Text>
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
  },
});
