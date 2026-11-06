import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { SecondaryButton } from '@/shared/components/Buttons';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { useContentSync } from '@/shared/services/content/ContentSyncProvider';
import { useTheme } from '@/shared/theme/ThemeProvider';

/** Modal de confirmación y aviso breve de actualización. */
export function ContentUpdateNotice() {
  const { updateAvailable, applying, updated, blocked, applyUpdate, dismissUpdate } =
    useContentSync();
  const { colors, radius, spacing } = useTheme();

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
        <View pointerEvents="none" style={styles.toastAnchor}>
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                backgroundColor: colors.card,
                borderColor: colors.success,
                borderRadius: radius.control,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              },
            ]}>
            <AppText weight="700" color={colors.success}>
              Contenido actualizado
            </AppText>
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
    left: 24,
    right: 24,
    bottom: 24,
    alignItems: 'center',
  },
  toast: { borderWidth: 1 },
});
