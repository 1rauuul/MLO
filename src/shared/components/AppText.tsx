import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';
import { typography } from '@/shared/theme/tokens';

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
  const token = typography[variant];
  const variantStyle: TextStyle = {
    ...token,
    fontSize: token.fontSize * scale,
    lineHeight: token.lineHeight * scale,
  };

  return (
    <Text
      allowFontScaling={false}
      {...rest}
      style={[
        { fontFamily: fonts.sans },
        variantStyle,
        { color: color ?? (variant === 'small' || variant === 'eyebrow' ? colors.muted : colors.text) },
        weight ? { fontWeight: weight } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}
