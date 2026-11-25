import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputInstance } from 'react-native';

import { AUTH_MESSAGES } from '@/features/auth/viewmodel/auth.messages';
import { validarPassword } from '@/features/auth/viewmodel/password.logic';
import { usePasswordRecovery } from '@/features/auth/viewmodel/usePasswordRecovery';
import { PasswordRequirements } from '@/features/auth/view/PasswordRequirements';
import { AppText } from '@/shared/components/AppText';
import { Icon } from '@/shared/components/Icon';
import { PrimaryButton } from '@/shared/components/Buttons';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { useTheme } from '@/shared/theme/ThemeProvider';

const FIELD_ERRORS = ['email_empty', 'email_invalid', 'invalid_code', 'password_weak'];

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const {
    step,
    email,
    error,
    submitting,
    success,
    requestCode,
    confirm,
    backToEmail,
    clearError,
  } = usePasswordRecovery();
  const [inputEmail, setInputEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmationRef = useRef<TextInputInstance>(null);

  const passwordValidation = validarPassword(password);
  const emailError =
    error === 'email_empty' || error === 'email_invalid'
      ? AUTH_MESSAGES[error]
      : undefined;
  const codeError = error === 'invalid_code' ? AUTH_MESSAGES.invalid_code : undefined;
  const passwordError =
    error === 'password_weak' ? AUTH_MESSAGES.password_weak : undefined;
  const confirmationError =
    confirmation.length > 0 && password !== confirmation
      ? AUTH_MESSAGES.password_mismatch
      : undefined;
  const formError =
    error && !FIELD_ERRORS.includes(error) ? (AUTH_MESSAGES[error] ?? null) : null;

  const submitEmail = () => {
    if (!submitting) {
      void requestCode(inputEmail);
    }
  };

  const submitCode = () => {
    if (submitting || !passwordValidation.valida || password !== confirmation) {
      return;
    }
    void confirm(code, password);
  };

  const useAnotherEmail = () => {
    setCode('');
    setPassword('');
    setConfirmation('');
    backToEmail();
  };

  if (success) {
    return (
      <Screen keyboardAvoiding contentStyle={styles.content}>
        <View style={styles.hero}>
          <AppText variant="eyebrow">Recuperación</AppText>
          <AppText variant="title">Contraseña actualizada</AppText>
          <AppText variant="small">
            Inicia sesión con tu nueva contraseña. Tu usuario está en el correo que
            recibiste.
          </AppText>
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
          ]}>
          <PrimaryButton
            label="Iniciar sesión"
            onPress={() => router.replace('/login')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen keyboardAvoiding contentStyle={styles.content}>
      <View style={styles.hero}>
        <AppText variant="eyebrow">Recuperación</AppText>
        <AppText variant="title">Recupera tu contraseña</AppText>
        <AppText variant="small">
          {step === 'email'
            ? 'Te enviaremos un código de 6 dígitos al correo de tu cuenta.'
            : `Enviamos un código a ${email}. Vence en 15 minutos.`}
        </AppText>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
        ]}>
        {step === 'email' ? (
          <>
            <TextField
              label="Correo"
              value={inputEmail}
              error={emailError}
              onChangeText={value => {
                setInputEmail(value);
                clearError();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={submitEmail}
              placeholder="tu@correo.com"
            />
            {formError ? (
              <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
                {formError}
              </AppText>
            ) : null}
            <PrimaryButton
              label="Enviar código"
              onPress={submitEmail}
              disabled={submitting}
              loading={submitting}
            />
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Volver a iniciar sesión"
              disabled={submitting}
              onPress={() => router.back()}
              style={styles.link}>
              <AppText variant="small" color={colors.primary} weight="700">
                Volver a iniciar sesión
              </AppText>
            </Pressable>
          </>
        ) : (
          <>
            <TextField
              label="Código"
              value={code}
              error={codeError}
              onChangeText={value => {
                setCode(value.replace(/\D/g, ''));
                clearError();
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="000000"
            />
            <TextField
              ref={passwordRef}
              label="Nueva contraseña"
              value={password}
              error={passwordError}
              onChangeText={value => {
                setPassword(value);
                clearError();
              }}
              secureTextEntry={!showPassword}
              maxLength={128}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmationRef.current?.focus()}
              placeholder="••••••••"
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
            <PasswordRequirements password={password} />
            <TextField
              ref={confirmationRef}
              label="Confirmar contraseña"
              value={confirmation}
              error={confirmationError}
              onChangeText={value => {
                setConfirmation(value);
                clearError();
              }}
              secureTextEntry={!showConfirmation}
              maxLength={128}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submitCode}
              placeholder="••••••••"
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirmation
                      ? 'Ocultar confirmación de contraseña'
                      : 'Mostrar confirmación de contraseña'
                  }
                  accessibilityState={{ selected: showConfirmation }}
                  onPress={() => setShowConfirmation(value => !value)}
                  style={styles.passwordToggle}>
                  <Icon
                    name={showConfirmation ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              }
            />
            {formError ? (
              <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
                {formError}
              </AppText>
            ) : null}
            <PrimaryButton
              label="Cambiar contraseña"
              onPress={submitCode}
              disabled={submitting || !passwordValidation.valida || password !== confirmation}
              loading={submitting}
            />
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Usar otro correo"
              disabled={submitting}
              onPress={useAnotherEmail}
              style={styles.link}>
              <AppText variant="small" color={colors.primary} weight="700">
                Usar otro correo
              </AppText>
            </Pressable>
          </>
        )}
      </View>
      <View style={[styles.notice, { marginTop: spacing.lg }]}>
        <Icon name="info" size={18} color={colors.muted} />
        <AppText variant="small" style={styles.flex}>
          Si el correo no está registrado, no recibirás ningún código.
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
  link: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
