import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';
import { PrimaryButton } from './Buttons';

interface ResultModalProps {
  visible: boolean;
  learnerName: string;
  score: number;
  onClose: () => void;
  onRetry: () => void;
}

export function ResultModal({ visible, learnerName, score, onClose, onRetry }: ResultModalProps) {
  const { colors, radius } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <View
          accessibilityRole="alert"
          accessibilityLabel={`Evaluación completada. Puntuación ${score}%`}
          style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
          <View style={[styles.orb, { backgroundColor: colors.soft }]}>
            <AppText color={colors.primary} style={styles.orbGlyph}>
              ✦
            </AppText>
          </View>
          <AppText variant="eyebrow">Evaluación completada</AppText>
          <AppText variant="heading">Buen trabajo, {learnerName.split(' ')[0]}</AppText>
          <AppText variant="small" center>
            Has consolidado las bases de este tema.
          </AppText>
          <View style={[styles.score, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
            <AppText variant="title" color={colors.primary}>
              {score}%
            </AppText>
            <AppText variant="small">Puntuación final</AppText>
          </View>
          <PrimaryButton label="Volver al tema" onPress={onClose} />
          <Pressable accessibilityRole="button" accessibilityLabel="Reintentar evaluación" onPress={onRetry} style={styles.retry}>
            <AppText color={colors.muted} weight="600">
              Reintentar evaluación
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlyph: {
    fontSize: 24,
  },
  score: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 2,
  },
  retry: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
