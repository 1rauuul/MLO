import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AUTH_MESSAGES } from '@/features/auth/viewmodel/auth.messages';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { Icon } from '@/shared/components/Icon';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { useTheme } from '@/shared/theme/ThemeProvider';

const EMAIL_ERRORS = ['email_empty', 'email_invalid', 'email_taken'];

export default function RecoveryEmailScreen() {
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const { account, needsRemoteLink, updateRecoveryEmail } = useAuth();
  const [email, setEmail] = useState(account?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const emailError = error && EMAIL_ERRORS.includes(error) ? AUTH_MESSAGES[error] : undefined;
  const passwordError =
    error === 'invalid_credentials' ? AUTH_MESSAGES.invalid_credentials : undefined;
  const formError =
    error && !EMAIL_ERRORS.includes(error) && error !== 'invalid_credentials'
      ? (AUTH_MESSAGES[error] ?? null)
      : null;

  const submit = async () => {
    if (submitting) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const outcome = await updateRecoveryEmail(email, password);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setPassword('');
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (needsRemoteLink) {
    return (
      <Screen keyboardAvoiding contentStyle={styles.content}>
        <View style={styles.hero}>
          <AppText variant="eyebrow">Cuenta</AppText>
          <AppText variant="title">Correo de recuperación</AppText>
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
          ]}>
          <AppText variant="small" color={colors.warning}>
            Primero vincula tu cuenta a la nube. Sin eso no podemos guardar un correo de
            recuperación.
          </AppText>
          <SecondaryButton
            label="Vincular cuenta"
            onPress={() => router.push('/vincular-cuenta' as never)}
          />
          <SecondaryButton label="Volver" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (success) {
    return (
      <Screen keyboardAvoiding contentStyle={styles.content}>
        <View style={styles.hero}>
          <AppText variant="eyebrow">Cuenta</AppText>
          <AppText variant="title">Correo guardado</AppText>
          <AppText variant="small">
            {email.trim().length > 0
              ? `Si olvidas tu contraseña, enviaremos el código a ${email.trim()}.`
              : 'Tu correo de recuperación quedó guardado.'}
          </AppText>
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
          ]}>
          <PrimaryButton label="Volver al perfil" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen keyboardAvoiding contentStyle={styles.content}>
      <View style={styles.hero}>
        <AppText variant="eyebrow">Cuenta</AppText>
        <AppText variant="title">
          {account?.email ? 'Cambia tu correo' : 'Agrega un correo'}
        </AppText>
        <AppText variant="small">
          Lo usaremos solo para enviarte un código si olvidas tu contraseña.
        </AppText>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
        ]}>
        <TextField
          label="Correo"
          value={email}
          error={emailError}
          onChangeText={value => {
            setEmail(value);
            setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          placeholder="tu@correo.com"
        />
        <TextField
          label="Contraseña actual"
          value={password}
          error={passwordError}
          onChangeText={value => {
            setPassword(value);
            setError(null);
          }}
          secureTextEntry
          maxLength={128}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
          placeholder="••••••••"
        />
        {formError ? (
          <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {formError}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Guardar correo"
          onPress={() => void submit()}
          disabled={submitting}
          loading={submitting}
        />
      </View>
      <View style={[styles.notice, { marginTop: spacing.lg }]}>
        <Icon name="info" size={18} color={colors.muted} />
        <AppText variant="small" style={styles.flex}>
          Pedimos tu contraseña actual para que nadie pueda desviar la recuperación desde
          una sesión abierta.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: 32 },
  hero: { gap: 4, marginBottom: 20 },
  card: { borderWidth: 1, padding: 20, gap: 14 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
