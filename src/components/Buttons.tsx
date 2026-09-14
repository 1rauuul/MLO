import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { useReducedMotion } from '@/hooks/useReducedMotion';

import { AppText } from './AppText';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

function pressStyle(pressed: boolean, reduced: boolean): StyleProp<ViewStyle> {
  return pressed && !reduced ? { transform: [{ scale: 0.98 }] } : null;
}

export function PrimaryButton({ label, onPress, disabled, style, accessibilityLabel }: ButtonProps) {
  const { colors, radius, scale } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.primary,
          borderRadius: radius.control,
          opacity: disabled ? 0.5 : 1,
        },
        pressStyle(pressed, reduced),
        style,
      ]}>
      <AppText weight="600" color={colors.onPrimary} style={{ fontSize: 15 * scale }}>
        {label}  →
      </AppText>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, style, accessibilityLabel }: ButtonProps) {
  const { colors, radius, scale } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.soft,
          borderRadius: radius.control,
          opacity: disabled ? 0.5 : 1,
        },
        pressStyle(pressed, reduced),
        style,
      ]}>
      <AppText weight="600" style={{ fontSize: 15 * scale }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function IconButton({
  glyph,
  onPress,
  accessibilityLabel,
  style,
}: {
  glyph: string;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, scale } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.soft, borderRadius: radius.control },
        pressStyle(pressed, reduced),
        style,
      ]}>
      <AppText style={{ fontSize: 18 * scale, lineHeight: 20 * scale }}>{glyph}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
