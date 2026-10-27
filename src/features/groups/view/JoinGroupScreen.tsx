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
import { useJoinGroup, type JoinError } from '@/features/groups/viewmodel/useJoinGroup';

const ERROR_MESSAGES: Record<Exclude<JoinError, null>, string> = {
  code: 'El código debe tener 6 caracteres.',
  not_found: 'No encontramos un grupo con ese código.',
  closed: 'Este grupo ya no acepta nuevas uniones.',
  rate_limited: 'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
  content_missing: 'El curso de este grupo todavía no está disponible.',
  config: 'La app no tiene configurado el servicio de contenido.',
  network: 'No hay conexión. Inténtalo de nuevo.',
  invalid: 'El contenido del grupo no es válido.',
  incomplete: 'El curso no se pudo aplicar completo. Inténtalo de nuevo.',
  no_account: 'Inicia sesión para unirte a un grupo.',
};

export default function JoinGroupScreen() {
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const { preview, phase, error, lookup, join, reset } = useJoinGroup();
  const [code, setCode] = useState('');

  if (!isHybrid()) {
    return (
      <Screen>
        <ScreenHeader onBack={() => router.back()} eyebrow="Grupo" title="Unirme a un grupo" />
        <EmptyState
          title="No disponible"
          message="Unirse a un grupo requiere conexión y el modo híbrido."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader onBack={() => router.back()} eyebrow="Grupo" title="Unirme a un grupo" />

      {!preview ? (
        <View style={{ gap: spacing.md }}>
          <AppText variant="small">
            Pide a tu maestro el código de 6 caracteres del grupo.
          </AppText>
          <TextInput
            value={code}
            onChangeText={value => setCode(value)}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={8}
            placeholder="ABC123"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Código del grupo"
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
            label={phase === 'looking' ? 'Buscando…' : 'Buscar grupo'}
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
            <AppText variant="eyebrow">{preview.group.name}</AppText>
            <AppText weight="600">{`Maestro: ${preview.group.teacherName}`}</AppText>
            <AppText variant="small">{`Curso: ${preview.catalog.title}`}</AppText>
          </View>
          <PrimaryButton
            label={phase === 'joining' ? 'Descargando el curso…' : 'Unirme a este grupo'}
            disabled={phase === 'joining'}
            onPress={() => {
              void join().then(joined => {
                if (joined) {
                  router.replace('/');
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
