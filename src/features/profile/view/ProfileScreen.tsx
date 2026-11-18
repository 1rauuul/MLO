import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Screen } from '@/shared/components/Screen';
import { SectionHeading } from '@/shared/components/SectionHeading';
import { Toggle } from '@/features/profile/view/Toggle';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { initials } from '@/features/auth/viewmodel/auth.logic';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useCatalog } from '@/features/modules/viewmodel/useCatalog';
import { useLearnerProfile } from '@/features/profile/viewmodel/useLearnerProfile';
import { useProgressSync } from '@/features/profile/viewmodel/useProgressSync';
import { useRecentResults } from '@/features/profile/viewmodel/useRecentResults';
import { useSession } from '@/features/auth/viewmodel/useSession';
import { isHybrid } from '@/shared/services/data/dataMode';

interface DialogState {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  cancelLabel?: string | null;
  onConfirm: () => void;
}

export default function ProfileScreen() {
  const { colors, radius, spacing } = useTheme();
  const { account, logout, resetProgress } = useAuth();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const { darkMode, setDarkMode, showBaseCourse, setShowBaseCourse } = useLearnerProfile();
  const { clear: clearLocation } = useSession();
  const { lessonsByUnit, completionMap, refresh } = useCatalog();
  const { averageScore, refresh: refreshResults } = useRecentResults();
  const {
    saveProgress,
    syncProgress,
    busyAction,
    isBusy,
    error: syncError,
    message: syncMessage,
  } = useProgressSync();

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshResults();
    }, [refresh, refreshResults]),
  );

  const learnerName = account?.displayName ?? 'Estudiante';
  const accountUsername = account?.username ?? '';
  const completedLessons = Object.values(completionMap).filter(Boolean).length;
  const totalLessons = Object.values(lessonsByUnit).reduce((total, lessons) => total + lessons.length, 0);

  const onResetProgress = () =>
    setDialog({
      title: 'Reiniciar progreso',
      message: 'Se borrarán tus lecciones completadas y resultados. Esta acción no se puede deshacer.',
      confirmLabel: 'Reiniciar',
      destructive: true,
      onConfirm: () => {
        void resetProgress().then(() => {
          clearLocation();
          return Promise.all([refresh(), refreshResults()]);
        });
      },
    });

  const onSyncProgress = () =>
    setDialog({
      title: 'Sincronizar progreso',
      message:
        'Se reemplazará tu progreso local por el guardado en la nube. Esta acción no se puede deshacer.',
      confirmLabel: 'Sincronizar',
      destructive: true,
      onConfirm: () => {
        void syncProgress();
      },
    });

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.profileHero}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.soft }]}>
          <AppText variant="code" color={colors.primary} weight="700">
            {initials(learnerName)}
          </AppText>
        </View>
        <View>
          <AppText variant="eyebrow">Estudiante</AppText>
          <AppText variant="title">{learnerName}</AppText>
          <AppText variant="small">{`@${accountUsername}`}</AppText>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[
          { value: `${completedLessons}/${totalLessons}`, label: 'subtemas completados' },
          { value: `${averageScore}%`, label: 'promedio evaluación' },
        ].map(stat => (
          <View
            key={stat.label}
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
            ]}>
            <AppText variant="heading">{stat.value}</AppText>
            <AppText variant="small">{stat.label}</AppText>
          </View>
        ))}
      </View>

      <SectionHeading eyebrow="Cursos" title="Curso base" />
      <View style={styles.list}>
        <SettingRow
          title="Mostrar curso base"
          subtitle="Ingeniería de software"
          control={
            <Toggle
              on={showBaseCourse}
              onToggle={() => setShowBaseCourse(!showBaseCourse)}
              label="Mostrar curso base"
            />
          }
        />
      </View>

      <SectionHeading eyebrow="Accesibilidad" title="Ajustes de lectura" />
      <View style={styles.list}>
        <SettingRow
          title="Apariencia oscura"
          subtitle="Reduce el brillo para estudiar"
          control={<Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} label="Apariencia oscura" />}
        />
      </View>

      <SectionHeading eyebrow="Cuenta" title="Sesión" />
      <View style={styles.list}>
        <SettingRow title={learnerName} subtitle={`@${accountUsername}`} control={null} />
      </View>

      <SectionHeading eyebrow="Sincronización" title="Tu progreso" />
      <AppText variant="small">
        Guarda tu avance en la nube y recupéralo en este dispositivo cuando lo necesites.
      </AppText>
      {!isHybrid() ? (
        <AppText variant="small" style={{ marginTop: spacing.sm }}>
          Necesitas conexión y el modo híbrido para guardar o sincronizar.
        </AppText>
      ) : null}
      <View style={[styles.backupActions, { marginTop: spacing.md }]}>
        <SecondaryButton
          label="Guardar progreso"
          onPress={() => void saveProgress()}
          loading={busyAction === 'save'}
          disabled={!isHybrid() || isBusy}
        />
        <SecondaryButton
          label="Sincronizar"
          onPress={onSyncProgress}
          loading={busyAction === 'sync'}
          disabled={!isHybrid() || isBusy}
        />
      </View>
      {syncError ? (
        <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {syncError}
        </AppText>
      ) : syncMessage ? (
        <AppText variant="small" color={colors.success} accessibilityLiveRegion="polite">
          {syncMessage}
        </AppText>
      ) : null}

      <View style={[styles.sessionActions, { marginTop: spacing.md }]}>
        <PrimaryButton label="Cerrar sesión" onPress={() => void logout()} />
        <SecondaryButton label="Reiniciar mi progreso" onPress={onResetProgress} />
      </View>

      <ConfirmModal
        visible={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel={dialog?.cancelLabel}
        destructive={dialog?.destructive}
        onConfirm={() => {
          const action = dialog?.onConfirm;
          setDialog(null);
          action?.();
        }}
        onCancel={() => setDialog(null)}
      />
    </Screen>
  );
}

function SettingRow({
  title,
  subtitle,
  control,
}: {
  title: string;
  subtitle: string;
  control: React.ReactNode;
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.settingRow,
        { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
      ]}>
      <View style={styles.flex}>
        <AppText weight="600">{title}</AppText>
        <AppText variant="small">{subtitle}</AppText>
      </View>
      {control}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  flex: { flex: 1 },
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  list: { gap: 12 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
  },
  sessionActions: { gap: 8 },
  backupActions: { gap: 8 },
});
