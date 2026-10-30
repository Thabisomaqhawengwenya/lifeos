import React from 'react';
import { Image, View, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';

export type BrandType = 'ecocash' | 'innbucks' | 'csv' | 'manual' | 'bank';

interface BrandLogoProps {
  brand: BrandType | string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  showBorder?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  size = 28,
  style,
  imageStyle,
  showBorder = true,
}) => {
  const { colors, radii } = useAppTheme();
  const b = (brand || '').toLowerCase();

  let source = null;
  let bg = '#FFFFFF';

  if (b.includes('eco')) {
    source = require('@/assets/images/ecocash-logo.png');
    bg = '#FFFFFF';
  } else if (b.includes('inn')) {
    source = require('@/assets/images/innbucks-logo.png');
    bg = '#081B2B'; // Matching InnBucks dark navy
  } else if (b.includes('csv')) {
    source = require('@/assets/images/csv-logo.png');
    bg = '#FFFFFF';
  }

  if (source) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            backgroundColor: bg,
            borderRadius: radii.sm,
            borderColor: showBorder ? colors.border : 'transparent',
            borderWidth: showBorder ? colors.borderWidth : 0,
          },
          style,
        ]}
      >
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: size - 6,
              height: size - 6,
            },
            imageStyle,
          ]}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Fallback for manual / cash
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: colors.surfaceAlt,
          borderRadius: radii.sm,
          borderColor: showBorder ? colors.border : 'transparent',
          borderWidth: showBorder ? colors.borderWidth : 0,
        },
        style,
      ]}
    >
      <Feather name="credit-card" size={Math.round(size * 0.55)} color={colors.text} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    alignSelf: 'center',
  },
});
