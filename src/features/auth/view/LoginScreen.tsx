import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { AUTH_MESSAGES } from '@/features/auth/viewmodel/auth.messages';
import { Icon } from '@/shared/components/Icon';
import { AppText } from '@/shared/components/AppText';
import { PrimaryButton } from '@/shared/components/Buttons';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { useTheme } from '@/shared/theme/ThemeProvider';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    if (submitting) {
      return;
    }
    setErrorKey(null);
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (result.ok) {
        router.replace('/');
        return;
      }
      setErrorKey(result.error);
    } catch {
      setErrorKey('storage_error');
    } finally {
      setSubmitting(false);
    }
  };

  const usernameError = errorKey === 'missing' && username.trim().length === 0
    ? 'Escribe tu usuario.'
    : null;
  const passwordError =
    errorKey === 'missing' && password.length === 0
      ? 'Escribe tu contraseña.'
      : errorKey === 'invalid_credentials'
        ? AUTH_MESSAGES.invalid_credentials
        : null;
  const formError = errorKey === 'storage_error' ? AUTH_MESSAGES.storage_error : null;

  return (
    <Screen keyboardAvoiding contentStyle={styles.content}>
      <View style={styles.hero}>
        <AppText variant="eyebrow">Objeto de aprendizaje</AppText>
        <AppText variant="title">Ingeniería de Software</AppText>
        <AppText variant="small">Continúa tu ruta de aprendizaje.</AppText>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
        ]}>
        <AppText variant="heading">Iniciar sesión</AppText>
        <TextField
          ref={usernameRef}
          label="Usuario"
          value={username}
          error={usernameError ?? undefined}
          onChangeText={value => {
            setUsername(value);
            setErrorKey(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="tu.usuario"
        />
        <TextField
          ref={passwordRef}
          label="Contraseña"
          value={password}
          error={passwordError ?? undefined}
          onChangeText={value => {
            setPassword(value);
            setErrorKey(null);
          }}
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          placeholder="••••••"
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              accessibilityState={{ selected: showPassword }}
              onPress={() => setShowPassword(value => !value)}
              style={styles.passwordToggle}>
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
            </Pressable>
          }
        />
        {formError ? (
          <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {formError}
          </AppText>
        ) : null}
        <PrimaryButton label="Entrar" onPress={submit} disabled={submitting} loading={submitting} />
        <View style={styles.linkRow}>
          <AppText variant="small">¿No tienes cuenta? </AppText>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Crear cuenta"
            disabled={submitting}
            onPress={() => router.push('/register')}
            style={styles.link}>
            <AppText variant="small" color={colors.primary} weight="700">
              Crear cuenta
            </AppText>
          </Pressable>
        </View>
      </View>
      <View style={[styles.notice, { marginTop: spacing.lg }]}>
        <Icon name="info" size={18} color={colors.muted} />
        <AppText variant="small" style={styles.flex}>
          Tus datos se guardan solo en este dispositivo.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: 32 },
  hero: { gap: 4, marginBottom: 20 },
  card: { borderWidth: 1, padding: 20, gap: 14 },
  passwordToggle: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  link: { minHeight: 44, justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
