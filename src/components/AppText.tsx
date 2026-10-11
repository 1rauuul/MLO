import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

type Variant = 'eyebrow' | 'title' | 'heading' | 'body' | 'small' | 'code';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  center?: boolean;
}

export function AppText({
  variant = 'body',
  color,
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  const { colors, fonts, scale } = useTheme();

  const variantStyle: TextStyle = (() => {
    switch (variant) {
      case 'eyebrow':
        return {
          fontFamily: fonts.mono,
          fontSize: 10 * scale,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: colors.muted,
        };
      case 'title':
        return { fontSize: 30 * scale, lineHeight: 33 * scale, letterSpacing: -1, fontWeight: '700' };
      case 'heading':
        return { fontSize: 20 * scale, lineHeight: 25 * scale, letterSpacing: -0.4, fontWeight: '700' };
      case 'small':
        return { fontSize: 12 * scale, lineHeight: 16 * scale, color: colors.muted };
      case 'code':
        return { fontFamily: fonts.mono, fontSize: 13 * scale, lineHeight: 19 * scale };
      case 'body':
      default:
        return { fontSize: 15 * scale, lineHeight: 22 * scale };
    }
  })();

  return (
    <Text
      allowFontScaling={false}
      {...rest}
      style={[
        { color: color ?? colors.text },
        variantStyle,
        weight ? { fontWeight: weight } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}
