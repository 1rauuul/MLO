import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { isHybrid } from '@/shared/services/data/dataMode';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { useJoinClass, type JoinClassError } from '@/features/classes/viewmodel/useJoinClass';

const ERROR_MESSAGES: Record<Exclude<JoinClassError, null>, string> = {
  code: 'El código debe tener 6 caracteres.',
  not_found: 'No encontramos una clase con ese código.',
  rate_limited: 'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
  config: 'La app no tiene configurado el servicio de contenido.',
  network: 'No hay conexión. Inténtalo de nuevo.',
  invalid: 'El contenido de la clase no es válido.',
  no_account: 'Inicia sesión para unirte a una clase.',
};

export default function JoinClassScreen() {
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const { preview, phase, error, lookup, join, reset } = useJoinClass();
  const [code, setCode] = useState('');

  if (!isHybrid()) {
    return (
      <Screen>
        <ScreenHeader onBack={() => router.back()} eyebrow="Clase" title="Unirme a una clase" />
        <EmptyState
          title="No disponible"
          message="Unirse a una clase requiere conexión y el modo híbrido."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader onBack={() => router.back()} eyebrow="Clase" title="Unirme a una clase" />

      {!preview ? (
        <View style={{ gap: spacing.md }}>
          <AppText variant="small">
            Pide a tu maestro el código de 6 caracteres de la clase.
          </AppText>
          <TextInput
            value={code}
            onChangeText={value => setCode(value)}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            placeholder="ABC123"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Código de la clase"
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: colors.line,
                borderRadius: radius.control,
              },
            ]}
          />
          <PrimaryButton
            label={phase === 'looking' ? 'Buscando…' : 'Buscar clase'}
            disabled={phase === 'looking'}
            onPress={() => void lookup(code)}
          />
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
            ]}>
            <AppText variant="eyebrow">{preview.class.name}</AppText>
            <AppText weight="600">{`Maestro: ${preview.class.teacherName}`}</AppText>
            <AppText variant="small">
              {preview.published
                ? `Contenido publicado: versión ${preview.published.version}`
                : 'Esta clase todavía no tiene contenido extra publicado.'}
            </AppText>
          </View>
          <PrimaryButton
            label={phase === 'joining' ? 'Uniéndome…' : 'Unirme a esta clase'}
            disabled={phase === 'joining'}
            onPress={() => {
              void join().then(joined => {
                if (joined) {
                  router.back();
                }
              });
            }}
          />
          <SecondaryButton label="Cambiar código" onPress={reset} disabled={phase === 'joining'} />
        </View>
      )}

      {error ? (
        <AppText
          variant="small"
          color={colors.danger}
          accessibilityLiveRegion="polite"
          style={{ marginTop: spacing.md }}>
          {ERROR_MESSAGES[error]}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, paddingHorizontal: 14, minHeight: 48, fontSize: 16, letterSpacing: 4 },
  card: { borderWidth: 1, padding: 16, gap: 6 },
});
