import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { AUTH_MESSAGES } from '@/features/auth/viewmodel/auth.messages';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (result.ok) {
        router.replace('/');
        return;
      }
      setError(AUTH_MESSAGES[result.error] ?? 'No se pudo iniciar sesión.');
    } catch {
      setError(AUTH_MESSAGES.storage_error ?? 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
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
          onChangeText={value => {
            setUsername(value);
            setError(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          placeholder="tu.usuario"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={value => {
            setPassword(value);
            setError(null);
          }}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={submit}
          placeholder="••••••"
        />
        {error ? (
          <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}
        <PrimaryButton label="Entrar" onPress={submit} disabled={submitting} />
        <SecondaryButton
          label="Crear cuenta"
          onPress={() => router.push('/register')}
          disabled={submitting}
        />
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
