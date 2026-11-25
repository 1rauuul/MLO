import { useFocusEffect, useRouter } from 'expo-router';
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
import { useCourses } from '@/features/modules/viewmodel/useCourses';
import { useLearnerProfile } from '@/features/profile/viewmodel/useLearnerProfile';
import {
  useProgressSync,
  type ProgressSyncStatus,
} from '@/features/profile/viewmodel/useProgressSync';
import { useRecentResults } from '@/features/profile/viewmodel/useRecentResults';
import { useSession } from '@/features/auth/viewmodel/useSession';

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
  const router = useRouter();
  const { account, logout, resetProgress, needsRemoteLink } = useAuth();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const { darkMode, setDarkMode } = useLearnerProfile();
  const { clear: clearLocation } = useSession();
  const { activeCatalogId } = useCourses();
  const { lessonsByUnit, completionMap, refresh } = useCatalog(activeCatalogId);
  const { averageScore, refresh: refreshResults } = useRecentResults();
  const {
    status: syncStatus,
    lastSyncedAt,
    error: syncError,
    isSyncing,
    syncNow,
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
        void resetProgress().then(async () => {
          clearLocation();
          await Promise.all([refresh(), refreshResults()]);
          await syncNow();
        });
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
        <SettingRow
          title="Correo de recuperación"
          subtitle={account?.email ?? 'Sin correo'}
          control={null}
        />
      </View>
      {needsRemoteLink ? (
        <AppText variant="small" color={colors.warning} style={{ marginTop: spacing.sm }}>
          Vincula tu cuenta para poder guardar un correo de recuperación.
        </AppText>
      ) : (
        <View style={[styles.backupActions, { marginTop: spacing.md }]}>
          <SecondaryButton
            label={account?.email ? 'Cambiar correo' : 'Agregar correo'}
            onPress={() => router.push('/correo-recuperacion' as never)}
          />
        </View>
      )}

      <SectionHeading eyebrow="Sincronización" title="Tu progreso" />
      <AppText variant="small">
        Tu avance se guarda solo cuando hay conexión y se recupera al iniciar sesión
        en otro equipo.
      </AppText>
      {needsRemoteLink ? (
        <View style={[styles.backupActions, { marginTop: spacing.md }]}>
          <AppText variant="small" color={colors.warning}>
            Tu cuenta todavía no está en la nube. Pide un código de vinculación a tu
            docente para no perder el progreso si cambias de equipo.
          </AppText>
          <SecondaryButton
            label="Vincular cuenta"
            // La ruta existe; los tipos generados de expo-router aún no la listan.
            onPress={() => router.push('/vincular-cuenta' as never)}
          />
        </View>
      ) : (
        <>
          <AppText variant="small" style={{ marginTop: spacing.sm }}>
            {syncSummary(syncStatus, lastSyncedAt)}
          </AppText>
          <View style={[styles.backupActions, { marginTop: spacing.md }]}>
            <SecondaryButton
              label={isSyncing ? 'Sincronizando…' : 'Sincronizar ahora'}
              onPress={() => void syncNow()}
              loading={isSyncing}
              disabled={isSyncing || syncStatus === 'session_expired'}
            />
          </View>
        </>
      )}
      {syncError ? (
        <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {syncError}
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

function syncSummary(
  status: ProgressSyncStatus,
  lastSyncedAt: string | null,
): string {
  if (status === 'syncing') {
    return 'Sincronizando…';
  }
  if (status === 'synced') {
    return lastSyncedAt
      ? `Guardado el ${new Date(lastSyncedAt).toLocaleString('es-ES')}.`
      : 'Progreso guardado en la nube.';
  }
  if (status === 'offline') {
    return 'Sin conexión. Se guardará al volver la red.';
  }
  if (status === 'session_expired') {
    return 'Tu sesión caducó. Vuelve a iniciar sesión para seguir guardando.';
  }
  if (status === 'error') {
    return 'No se pudo sincronizar. Puedes reintentarlo.';
  }
  return 'Tu cuenta todavía no está en la nube.';
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
