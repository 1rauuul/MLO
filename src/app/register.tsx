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
  name_empty: 'Escribe tu nombre.',
  username_empty: 'Elige un usuario.',
  username_short: 'El usuario debe tener al menos 3 caracteres.',
  username_invalid: 'Usa solo letras, números, punto, guion o guion bajo.',
  password_short: 'La contraseña debe tener al menos 6 caracteres.',
  password_mismatch: 'Las contraseñas no coinciden.',
  username_taken: 'Ese usuario ya existe en este dispositivo.',
};

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const result = await register({ displayName, username, password, confirm });
    if (result.ok) {
      router.replace('/');
    } else {
      setError(MESSAGES[result.error] ?? 'No se pudo crear la cuenta.');
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
          onChangeText={setDisplayName}
          placeholder="Valentina Ríos"
        />
        <TextField
          label="Usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="valentina"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••"
        />
        <TextField
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••"
        />
        {error ? (
          <AppText variant="small" color={colors.danger}>
            {error}
          </AppText>
        ) : null}
        <PrimaryButton label="Crear cuenta" onPress={submit} />
        <SecondaryButton label="Ya tengo cuenta" onPress={() => router.back()} />
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
