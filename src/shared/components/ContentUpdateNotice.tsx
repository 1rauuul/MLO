import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/AppText';
import { SecondaryButton } from '@/shared/components/Buttons';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Icon } from '@/shared/components/Icon';
import { useContentSync } from '@/shared/services/content/ContentSyncProvider';
import { useTheme } from '@/shared/theme/ThemeProvider';

/** Modal de confirmación y aviso breve de actualización. */
export function ContentUpdateNotice() {
  const { updateAvailable, applying, updated, blocked, applyUpdate, dismissUpdate } =
    useContentSync();
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <ConfirmModal
        visible={updateAvailable && !blocked && !applying}
        title="Contenido nuevo disponible"
        message="Hay una actualización de contenido. Puedes aplicarla ahora o continuar y verla más tarde."
        confirmLabel="Actualizar ahora"
        cancelLabel="Más tarde"
        onConfirm={() => void applyUpdate()}
        onCancel={dismissUpdate}
      />
      {updated ? (
        <View
          pointerEvents="none"
          style={[styles.toastAnchor, { bottom: insets.bottom + 64 }]}>
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                backgroundColor: colors.card,
                borderColor: colors.success,
                borderRadius: radius.card,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              },
            ]}>
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.soft, borderRadius: radius.pill },
              ]}>
              <Icon name="check" size={16} color={colors.success} strokeWidth={2.4} />
            </View>
            <View style={styles.copy}>
              <AppText weight="700">Contenido actualizado</AppText>
              <AppText variant="small" color={colors.muted}>
                Las lecciones y actividades nuevas ya están disponibles.
              </AppText>
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}

/** Botón manual para forzar una comprobación desde la pantalla de módulos. */
export function ContentUpdateButton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { checking, checkNow } = useContentSync();

  return (
    <SecondaryButton
      label={checking ? 'Buscando…' : 'Buscar actualizaciones'}
      onPress={() => void checkNow()}
      disabled={checking}
      accessibilityLabel="Buscar actualizaciones de contenido"
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  toastAnchor: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 520,
  },
  badge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
});
