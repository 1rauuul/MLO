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

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({ displayName, username, password, confirm });
      if (result.ok) {
        router.replace('/');
        return;
      }
      setError(AUTH_MESSAGES[result.error] ?? 'No se pudo crear la cuenta.');
    } catch {
      setError(AUTH_MESSAGES.storage_error ?? 'No se pudo crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <AppText variant="eyebrow">Primer acceso</AppText>
        <AppText variant="title">Crea tu cuenta</AppText>
        <AppText variant="small">Todo se guarda de forma local y sin conexión.</AppText>
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
        <TextField
          label="Nombre"
          value={displayName}
          onChangeText={value => {
            setDisplayName(value);
            setError(null);
          }}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          placeholder="Valentina Ríos"
        />
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
          placeholder="valentina"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={value => {
            setPassword(value);
            setError(null);
          }}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          placeholder="••••••"
        />
        <TextField
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={value => {
            setConfirm(value);
            setError(null);
          }}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
          placeholder="••••••"
        />
        {error ? (
          <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}
        <PrimaryButton label="Crear cuenta" onPress={submit} disabled={submitting} />
        <SecondaryButton
          label="Ya tengo cuenta"
          onPress={() => router.back()}
          disabled={submitting}
        />
      </View>
      <AppText variant="small" style={{ marginTop: spacing.lg }}>
        El progreso empieza en cero.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingBottom: 32 },
  hero: { gap: 4, marginBottom: 20 },
  card: { borderWidth: 1, padding: 20, gap: 14 },
});
