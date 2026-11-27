import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputInstance } from 'react-native';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { AUTH_MESSAGES } from '@/features/auth/viewmodel/auth.messages';
import { validateUsername } from '@/features/auth/viewmodel/auth.logic';
import { validarPassword } from '@/features/auth/viewmodel/password.logic';
import { PasswordRequirements } from '@/features/auth/view/PasswordRequirements';
import { AppText } from '@/shared/components/AppText';
import { Icon } from '@/shared/components/Icon';
import { PrimaryButton } from '@/shared/components/Buttons';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { useTheme } from '@/shared/theme/ThemeProvider';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const firstNameRef = useRef<TextInputInstance>(null);
  const lastNameRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const usernameRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => () => {
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
    }
  }, []);

  const passwordValidation = validarPassword(password);
  const usernameValidation = username.length > 0 ? validateUsername(username) : null;
  const firstNameError =
    errorKey === 'first_name_empty' ? AUTH_MESSAGES.first_name_empty : null;
  const lastNameError =
    errorKey === 'last_name_empty' ? AUTH_MESSAGES.last_name_empty : null;
  const emailError =
    errorKey === 'email_empty' || errorKey === 'email_invalid' || errorKey === 'email_taken'
      ? AUTH_MESSAGES[errorKey]
      : null;
  const usernameError =
    errorKey === 'username_taken' || errorKey === 'username_empty' || errorKey === 'username_short' || errorKey === 'username_invalid'
      ? AUTH_MESSAGES[errorKey]
      : usernameValidation
        ? AUTH_MESSAGES[usernameValidation]
        : null;
  const passwordError =
    errorKey === 'password_short' || errorKey === 'password_weak'
      ? AUTH_MESSAGES[errorKey]
      : null;
  const confirmError =
    confirm.length > 0 && password !== confirm
      ? AUTH_MESSAGES.password_mismatch
      : errorKey === 'password_mismatch'
        ? AUTH_MESSAGES.password_mismatch
        : null;
  const fieldErrors = [
    'first_name_empty',
    'last_name_empty',
    'email_empty',
    'email_invalid',
    'email_taken',
    'username_empty',
    'username_short',
    'username_invalid',
    'username_taken',
    'password_short',
    'password_weak',
    'password_mismatch',
  ];
  const formError =
    errorKey && !fieldErrors.includes(errorKey)
      ? (AUTH_MESSAGES[errorKey] ?? null)
      : null;

  const submit = async () => {
    if (submitting || !passwordValidation.valida) {
      return;
    }
    setErrorKey(null);
    setSubmitting(true);
    try {
      const result = await register({
        firstName,
        lastName,
        email,
        username,
        password,
        confirm,
      });
      if (result.ok) {
        setSuccessMessage('Cuenta creada. Entrando a tu ruta de aprendizaje...');
        redirectTimer.current = setTimeout(() => router.replace('/'), 900);
        return;
      }
      setErrorKey(result.error);
    } catch {
      setErrorKey('storage_error');
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = () => {
    setErrorKey(null);
    setSuccessMessage(null);
  };

  return (
    <Screen keyboardAvoiding contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <AppText variant="eyebrow">Primer acceso</AppText>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Volver a iniciar sesión"
            disabled={submitting}
            onPress={() => router.back()}
            style={styles.loginLink}>
            <AppText variant="small" color={colors.primary} weight="700">
              Iniciar sesión
            </AppText>
          </Pressable>
        </View>
        <AppText variant="title">Crea tu cuenta</AppText>
        <AppText variant="small">
          Tu cuenta se guarda en la nube y podrás entrar desde otro equipo.
        </AppText>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
        ]}>
        <TextField
          ref={firstNameRef}
          label="Nombre"
          value={firstName}
          error={firstNameError ?? undefined}
          onChangeText={value => {
            setFirstName(value);
            clearError();
          }}
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
          onSubmitEditing={() => lastNameRef.current?.focus()}
          placeholder="Valentina"
        />
        <TextField
          ref={lastNameRef}
          label="Apellidos"
          value={lastName}
          error={lastNameError ?? undefined}
          onChangeText={value => {
            setLastName(value);
            clearError();
          }}
          autoComplete="family-name"
          textContentType="familyName"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          placeholder="Ríos"
        />
        <TextField
          ref={emailRef}
          label="Correo"
          value={email}
          error={emailError ?? undefined}
          onChangeText={value => {
            setEmail(value);
            clearError();
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => usernameRef.current?.focus()}
          placeholder="tu@correo.com"
        />
        <TextField
          ref={usernameRef}
          label="Usuario"
          value={username}
          error={usernameError ?? undefined}
          onChangeText={value => {
            setUsername(value);
            clearError();
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="valentina"
        />
        <TextField
          ref={passwordRef}
          label="Contraseña"
          value={password}
          error={passwordError ?? undefined}
          onChangeText={value => {
            setPassword(value);
            clearError();
          }}
          secureTextEntry={!showPassword}
          maxLength={128}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          placeholder="••••••••••••"
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
          ref={confirmRef}
          label="Confirmar contraseña"
          value={confirm}
          error={confirmError ?? undefined}
          onChangeText={value => {
            setConfirm(value);
            clearError();
          }}
          secureTextEntry={!showConfirm}
          maxLength={128}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          placeholder="••••••••••••"
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showConfirm ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
              accessibilityState={{ selected: showConfirm }}
              onPress={() => setShowConfirm(value => !value)}
              style={styles.passwordToggle}>
              <Icon name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
            </Pressable>
          }
        />
        {formError ? (
          <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {formError}
          </AppText>
        ) : null}
        {successMessage ? (
          <AppText variant="small" color={colors.success} accessibilityLiveRegion="polite">
            {successMessage}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Crear cuenta"
          onPress={submit}
          disabled={submitting || !passwordValidation.valida}
          loading={submitting}
        />
      </View>
      <View style={[styles.notice, { marginTop: spacing.lg }]}>
        <Icon name="info" size={18} color={colors.muted} />
        <AppText variant="small" style={styles.flex}>
          Usaremos tu correo para recuperar la contraseña si algún día la olvidas.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: 32 },
  hero: { gap: 4, marginBottom: 20 },
  heroTop: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loginLink: { minHeight: 44, justifyContent: 'center' },
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
