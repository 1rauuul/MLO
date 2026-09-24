import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/theme-provider';
import { useAuth } from '@/viewmodels/useAuth';

const MESSAGES: Record<string, string> = {
  missing: 'Completa usuario y contraseña.',
  invalid_credentials: 'Usuario o contraseña incorrectos.',
};

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const result = await login(username, password);
    if (result.ok) {
      router.replace('/');
    } else {
      setError(MESSAGES[result.error] ?? 'No se pudo iniciar sesión.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <AppText variant="eyebrow">Objeto de aprendizaje</AppText>
        <AppText variant="title">Ingeniería de Software</AppText>
        <AppText variant="small">Continúa tu ruta de aprendizaje.</AppText>
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
        <AppText variant="heading">Iniciar sesión</AppText>
        <TextField
          label="Usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="tu.usuario"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••"
        />
        {error ? (
          <AppText variant="small" color={colors.danger}>
            {error}
          </AppText>
        ) : null}
        <PrimaryButton label="Entrar" onPress={submit} />
        <SecondaryButton label="Crear cuenta" onPress={() => router.push('/register')} />
      </View>
      <AppText variant="small" style={{ marginTop: spacing.lg }}>
        Tus datos se guardan solo en este dispositivo.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingBottom: 32 },
  hero: { gap: 4, marginBottom: 20 },
  card: { borderWidth: 1, padding: 20, gap: 14 },
});
