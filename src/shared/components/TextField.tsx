import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, style, ...rest }: TextFieldProps) {
  const { colors, radius, scale } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="eyebrow" color={colors.muted}>
        {label}
      </AppText>
      <TextInput
        {...rest}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.line,
            color: colors.text,
            borderRadius: radius.control,
            fontSize: 15 * scale,
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: { borderWidth: 1, paddingHorizontal: 14, minHeight: 48 },
});
