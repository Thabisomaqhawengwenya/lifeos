/* eslint-disable react-hooks/immutability */
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { haptic } from '@/src/design-system/haptics';
import React from 'react';
import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface BrutalChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  badge?: number | string;
  style?: StyleProp<ViewStyle>;
  colorScheme?: 'yellow' | 'coral' | 'mint' | 'lilac' | 'sky';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BrutalChip({
  label,
  selected = false,
  onPress,
  icon,
  badge,
  style,
  colorScheme = 'yellow',
}: BrutalChipProps) {
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
    pressedX.value = withTiming(1.5, { duration: 50 });
    pressedY.value = withTiming(1.5, { duration: 50 });
    haptic.selection();
  };

  const handlePressOut = () => {
    pressedX.value = withSpring(0, { damping: 15, stiffness: 350 });
    pressedY.value = withSpring(0, { damping: 15, stiffness: 350 });
  };

  let activeBg = colors.accentYellow;
  if (colorScheme === 'mint') activeBg = colors.accentJade;
  else if (colorScheme === 'coral') activeBg = colors.accentCoral;
  else if (colorScheme === 'lilac') activeBg = colors.accentLilac;
  else if (colorScheme === 'sky') activeBg = colors.accentSky;

  const backgroundColor = selected ? activeBg : colors.surface;
  const textColor = '#000000';
  const borderColor = colors.border;
  const shadowColor = isDark ? '#FFFFFF' : '#000000';

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
          borderRadius: radii.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 2,
          shadowColor,
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 2,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {badge !== undefined && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: selected ? '#000000' : colors.accentYellow,
              borderRadius: radii.xs,
              borderColor: '#000000',
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: selected ? '#FFFFFF' : '#000000' },
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
    borderWidth: 2,
    minHeight: 34,
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  icon: {
    marginRight: 6,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
  },
});
