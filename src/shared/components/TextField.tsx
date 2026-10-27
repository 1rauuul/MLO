import { forwardRef, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  trailing?: ReactNode;
}

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, error, trailing, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors, radius, scale } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <AppText
        variant="eyebrow"
        color={colors.muted}
        style={{ fontSize: 12 * scale, lineHeight: 16 * scale }}>
        {label}
      </AppText>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : focused ? colors.primary : colors.line,
            borderRadius: radius.control,
          },
        ]}>
        <TextInput
          {...rest}
          ref={ref}
          accessibilityLabel={`${label}${error ? `, ${error}` : ''}`}
          placeholderTextColor={colors.muted}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: 15 * scale,
            },
            style,
          ]}
        />
        {trailing}
      </View>
      {error ? (
        <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  field: { gap: 6 },
  inputShell: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, minHeight: 46 },
});
