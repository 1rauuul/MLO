import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { isHybrid } from '@/shared/services/data/dataMode';
import { useTheme } from '@/shared/theme/ThemeProvider';
import {
  normalizeClassCode,
  useJoinClass,
  type JoinClassError,
} from '@/features/classes/viewmodel/useJoinClass';

const ERROR_MESSAGES: Record<Exclude<JoinClassError, null>, string> = {
  code: 'El código debe tener 6 caracteres.',
  link: 'Pega el enlace de invitación completo o un código de 6 caracteres.',
  not_found: 'No encontramos una clase con ese código.',
  rate_limited: 'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
  config: 'La app no tiene configurado el servicio de contenido.',
  network: 'No hay conexión. Inténtalo de nuevo.',
  invalid: 'El contenido de la clase no es válido.',
  invitation_invalid: 'La invitación no es válida.',
  expired: 'La invitación expiró. Pide una nueva a tu docente.',
  used: 'Esta invitación ya se usó. Pide una nueva a tu docente.',
  revoked: 'El docente revocó esta invitación.',
  full: 'El grupo ya está lleno.',
  already_member: 'Ya perteneces a un grupo de este curso.',
  no_account: 'Inicia sesión para unirte a una clase.',
};

export default function JoinClassScreen() {
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string | string[] }>();
  const { colors, radius, spacing } = useTheme();
  const {
    preview,
    invitation,
    phase,
    error,
    canRetry,
    lookup,
    join,
    claim,
    retry,
    reset,
  } = useJoinClass();
  const [input, setInput] = useState('');
  const deepLinkToken = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const claimedDeepLink = useRef<string | null>(null);

  useEffect(() => {
    if (!deepLinkToken || claimedDeepLink.current === deepLinkToken) {
      return;
    }
    claimedDeepLink.current = deepLinkToken;
    void claim(deepLinkToken);
  }, [claim, deepLinkToken]);

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

  const busy = phase === 'looking' || phase === 'joining' || phase === 'claiming';

  const submit = () => {
    const value = input.trim();
    const code = normalizeClassCode(value);
    if (!value.includes('token=') && code.length === 6) {
      void lookup(value);
      return;
    }
    void claim(value);
  };

  return (
    <Screen>
      <ScreenHeader onBack={() => router.back()} eyebrow="Clase" title="Unirme a una clase" />

      {invitation ? (
        <View style={{ gap: spacing.md }}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
            ]}>
            <AppText variant="eyebrow">Invitación aceptada</AppText>
            <AppText weight="600">{invitation.membership.className}</AppText>
            <AppText variant="small">{`Maestro: ${invitation.membership.teacherName}`}</AppText>
            <AppText variant="small">
              {invitation.published
                ? `Contenido publicado: versión ${invitation.published.version}`
                : 'Este grupo todavía no tiene contenido extra publicado.'}
            </AppText>
          </View>
          <PrimaryButton label="Ir a módulos" onPress={() => router.replace('/')} />
        </View>
      ) : !preview ? (
        <View style={{ gap: spacing.md }}>
          <AppText variant="small">
            Pega el enlace de invitación o escribe el código de 6 caracteres de la clase.
          </AppText>
          <TextInput
            value={input}
            onChangeText={value => setInput(value)}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={200}
            placeholder="Enlace de invitación o ABC123"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Enlace de invitación o código de la clase"
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
            label={phase === 'claiming' ? 'Reclamando…' : phase === 'looking' ? 'Buscando…' : 'Continuar'}
            disabled={busy}
            onPress={submit}
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

      {error && !invitation ? (
        <AppText
          variant="small"
          color={colors.danger}
          accessibilityLiveRegion="polite"
          style={{ marginTop: spacing.md }}>
          {ERROR_MESSAGES[error]}
        </AppText>
      ) : null}

      {error && canRetry && !invitation ? (
        <SecondaryButton label="Reintentar" onPress={() => void retry()} disabled={busy} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, paddingHorizontal: 14, minHeight: 48, fontSize: 16 },
  card: { borderWidth: 1, padding: 16, gap: 6 },
});
