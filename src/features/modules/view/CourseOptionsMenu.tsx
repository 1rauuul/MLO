import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Icon, type IconName } from '@/shared/components/Icon';
import { useTheme } from '@/shared/theme/ThemeProvider';

interface CourseOptionsMenuProps {
  visible: boolean;
  checking: boolean;
  canLeave: boolean;
  onClose: () => void;
  onCheckUpdates: () => void;
  onShowInfo: () => void;
  onLeave: () => void;
}

interface MenuRowProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

export function CourseOptionsMenu({
  visible,
  checking,
  canLeave,
  onClose,
  onCheckUpdates,
  onShowInfo,
  onLeave,
}: CourseOptionsMenuProps) {
  const { colors, radius } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar opciones"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
          ]}>
          <AppText variant="heading" style={styles.title}>
            Opciones del curso
          </AppText>
          <MenuRow
            icon="refresh"
            label={checking ? 'Buscando…' : 'Buscar actualizaciones'}
            onPress={onCheckUpdates}
            disabled={checking}
          />
          <MenuRow icon="info" label="Información del curso" onPress={onShowInfo} />
          {canLeave ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.line }]} />
              <MenuRow
                icon="logout"
                label="Salir del curso"
                onPress={onLeave}
                color={colors.danger}
              />
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function MenuRow({ icon, label, onPress, color, disabled }: MenuRowProps) {
  const { colors, radius } = useTheme();
  const tint = color ?? colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderRadius: radius.control, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}>
      <Icon name={icon} size={18} color={tint} />
      <AppText weight="600" color={tint}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderWidth: 1,
    padding: 16,
    gap: 2,
  },
  title: { marginBottom: 8 },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  divider: { height: 1, marginVertical: 6 },
});
