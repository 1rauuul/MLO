import { Modal, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { useTheme } from '@/shared/theme/ThemeProvider';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** `null` oculta el botón de cancelar (diálogo informativo). */
  cancelLabel?: string | null;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Salir',
  cancelLabel = 'Cancelar',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel ?? onConfirm}>
      <View
        style={styles.overlay}
        accessibilityViewIsModal
        accessibilityRole="alert">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
          <AppText variant="heading">{title}</AppText>
          <AppText variant="small" style={{ marginTop: spacing.xs }}>
            {message}
          </AppText>
          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <PrimaryButton
              label={confirmLabel}
              onPress={onConfirm}
              style={destructive ? { backgroundColor: colors.danger } : undefined}
            />
            {cancelLabel !== null ? (
              <SecondaryButton label={cancelLabel} onPress={onCancel ?? onConfirm} />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', borderWidth: 1, padding: 20 },
});
