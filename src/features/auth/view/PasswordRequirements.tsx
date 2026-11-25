import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Icon } from '@/shared/components/Icon';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { validarPassword } from '@/features/auth/viewmodel/password.logic';

export function PasswordRequirements({ password }: { password: string }) {
  const { colors } = useTheme();
  const { resultados } = validarPassword(password);

  return (
    <View style={styles.requirements} accessibilityRole="list">
      {resultados.map(result => (
        <View
          key={result.id}
          accessible
          accessibilityLabel={`${result.texto}: ${result.cumple ? 'cumplido' : 'pendiente'}`}
          style={styles.requirement}>
          <Icon
            name={result.cumple ? 'check' : 'circle'}
            size={16}
            color={result.cumple ? colors.success : colors.muted}
            strokeWidth={result.cumple ? 2.5 : 1.8}
          />
          <AppText variant="small" color={result.cumple ? colors.success : colors.muted}>
            {result.texto}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  requirements: { gap: 6, marginTop: -4 },
  requirement: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
