import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputInstance } from 'react-native';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { AUTH_MESSAGES } from '@/features/auth/viewmodel/auth.messages';
import { validarPassword } from '@/features/auth/viewmodel/password.logic';
import { PasswordRequirements } from '@/features/auth/view/PasswordRequirements';
import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { Icon } from '@/shared/components/Icon';
import { useTheme } from '@/shared/theme/ThemeProvider';

const FIELD_ERRORS = [
  'current_password_missing',
  'invalid_credentials',
  'password_weak',
  'invalid_code',
];

export default function LinkAccountScreen() {
  const { account, linkAccount, needsRemoteLink } = useAuth();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const newPasswordRef = useRef<TextInputInstance>(null);
  const codeRef = useRef<TextInputInstance>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const newPasswordValidation = validarPassword(newPassword);

  const submit = async () => {
    if (submitting) {
      return;
    }
    if (currentPassword.length === 0) {
      setErrorKey('current_password_missing');
      return;
    }
    if (!newPasswordValidation.valida) {
      setErrorKey('password_weak');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setErrorKey('invalid_code');
      return;
    }
    setErrorKey(null);
    setSubmitting(true);
    try {
      const result = await linkAccount(currentPassword, newPassword, code);
      if (result.ok) {
        router.back();
        return;
      }
      setErrorKey(result.error);
    } catch {
      setErrorKey('storage_error');
    } finally {
      setSubmitting(false);
    }
  };

  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const formError =
    errorKey && !FIELD_ERRORS.includes(errorKey) && AUTH_MESSAGES[errorKey]
      ? AUTH_MESSAGES[errorKey]
      : null;

  return (
    <Screen keyboardAvoiding contentStyle={styles.content}>
      <View style={styles.hero}>
        <AppText variant="eyebrow">Cuenta en la nube</AppText>
        <AppText variant="title">
          {needsRemoteLink ? 'Vincula tu cuenta' : 'Cuenta vinculada'}
        </AppText>
        <AppText variant="small">
          {needsRemoteLink
            ? `Pide a tu docente un código de vinculación para @${account?.username ?? ''}. Después elige una contraseña nueva.`
            : 'Tu cuenta y tu progreso ya están en la nube.'}
        </AppText>
      </View>

      {needsRemoteLink ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.line,
              borderRadius: radius.card,
            },
          ]}>
          <TextField
            label="Contraseña actual"
            value={currentPassword}
            error={
              errorKey === 'current_password_missing' ||
              errorKey === 'invalid_credentials'
                ? (AUTH_MESSAGES[errorKey] ?? undefined)
                : undefined
            }
            onChangeText={value => {
              setCurrentPassword(value);
              setErrorKey(null);
            }}
            secureTextEntry={!showPassword}
            maxLength={128}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="next"
            onSubmitEditing={() => newPasswordRef.current?.focus()}
            placeholder="••••••••"
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                accessibilityState={{ selected: showPassword }}
                onPress={() => setShowPassword(value => !value)}
                style={styles.passwordToggle}>
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            }
          />
          <TextField
            ref={newPasswordRef}
            label="Nueva contraseña"
            value={newPassword}
            error={errorKey === 'password_weak' ? AUTH_MESSAGES.password_weak : undefined}
            onChangeText={value => {
              setNewPassword(value);
              setErrorKey(null);
            }}
            secureTextEntry
            maxLength={128}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => codeRef.current?.focus()}
            placeholder="••••••••"
          />
          <PasswordRequirements password={newPassword} />
          <TextField
            ref={codeRef}
            label="Código de vinculación"
            value={code}
            error={
              errorKey === 'invalid_code' ? AUTH_MESSAGES.invalid_code : undefined
            }
            onChangeText={value => {
              setCode(value.replace(/\D/g, ''));
              setErrorKey(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="off"
            returnKeyType="go"
            onSubmitEditing={submit}
            placeholder="000000"
          />
          {formError ? (
            <AppText
              variant="small"
              color={colors.danger}
              accessibilityLiveRegion="polite">
              {formError}
            </AppText>
          ) : null}
          <PrimaryButton
            label="Vincular cuenta"
            onPress={submit}
            disabled={submitting || !newPasswordValidation.valida}
            loading={submitting}
          />
          <SecondaryButton
            label="Ahora no"
            onPress={dismiss}
            disabled={submitting}
          />
        </View>
      ) : (
        <SecondaryButton label="Volver" onPress={dismiss} />
      )}

      <View style={[styles.notice, { marginTop: spacing.lg }]}>
        <Icon name="info" size={18} color={colors.muted} />
        <AppText variant="small" style={styles.flex}>
          El código lo emite tu docente o el administrador y es de un solo uso.
          Sin él, nadie puede reclamar tu identidad.
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
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
