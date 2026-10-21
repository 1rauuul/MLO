import { Modal, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { useTheme } from '@/shared/theme/ThemeProvider';

interface ConfirmExitModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmExitModal({
  visible,
  title,
  message,
  confirmLabel = 'Salir',
  cancelLabel = 'Continuar',
  onConfirm,
  onCancel,
}: ConfirmExitModalProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
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
            <PrimaryButton label={confirmLabel} onPress={onConfirm} />
            <SecondaryButton label={cancelLabel} onPress={onCancel} />
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
