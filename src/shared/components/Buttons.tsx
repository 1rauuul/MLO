import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

import { AppText } from '@/shared/components/AppText';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  labelColor?: string;
  loading?: boolean;
}

function pressStyle(pressed: boolean, reduced: boolean): StyleProp<ViewStyle> {
  return pressed && !reduced ? { transform: [{ scale: 0.98 }] } : null;
}

function compactStyle(compact?: boolean): StyleProp<ViewStyle> {
  return compact ? { alignSelf: 'flex-end' } : null;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  compact,
  icon,
  style,
  accessibilityLabel,
  loading,
}: ButtonProps) {
  const { colors, radius, scale } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.primary,
          borderRadius: radius.control,
          opacity: disabled || loading ? 0.5 : 1,
        },
        compactStyle(compact),
        pressStyle(pressed, reduced),
        style,
      ]}>
      <View style={styles.content}>
        {icon}
        {loading ? <ActivityIndicator size="small" color={colors.onPrimary} /> : null}
        <AppText weight="600" color={colors.onPrimary} style={{ fontSize: 15 * scale }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  compact,
  icon,
  style,
  accessibilityLabel,
  labelColor,
  loading,
}: ButtonProps) {
  const { colors, radius, scale } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.soft,
          borderRadius: radius.control,
          opacity: disabled || loading ? 0.5 : 1,
        },
        compactStyle(compact),
        pressStyle(pressed, reduced),
        style,
      ]}>
      <View style={styles.content}>
        {icon}
        {loading ? <ActivityIndicator size="small" color={colors.text} /> : null}
        <AppText weight="600" color={labelColor} style={{ fontSize: 15 * scale }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

export function IconButton({
  glyph,
  onPress,
  disabled,
  accessibilityLabel,
  style,
  children,
}: {
  glyph?: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const { colors, radius, scale } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: colors.card,
          borderColor: colors.line,
          borderRadius: radius.control,
          opacity: disabled ? 0.5 : 1,
        },
        pressStyle(pressed, reduced),
        style,
      ]}>
      {children ?? <AppText style={{ fontSize: 18 * scale, lineHeight: 20 * scale }}>{glyph}</AppText>}
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
