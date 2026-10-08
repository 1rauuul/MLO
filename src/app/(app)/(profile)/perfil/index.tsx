import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Screen } from '@/components/Screen';
import { SectionHeading } from '@/components/SectionHeading';
import { Toggle } from '@/components/Toggle';
import type { LearningStyle } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { initials } from '@/viewmodels/authLogic';
import { useAuth } from '@/viewmodels/useAuth';
import { useCatalog } from '@/viewmodels/useCatalog';
import { useLearnerProfile } from '@/viewmodels/useLearnerProfile';
import { useRecentResults } from '@/viewmodels/useRecentResults';

const LEARNING_STYLES: LearningStyle[] = ['Activo', 'Reflexivo', 'Teórico', 'Pragmático'];

export default function ProfileScreen() {
  const { colors, radius, spacing } = useTheme();
  const { account, logout, resetProgress } = useAuth();
  const { style, setStyle, darkMode, setDarkMode, largeText, setLargeText } = useLearnerProfile();
  const { lessonsByUnit, progressMap, refresh } = useCatalog();
  const { averageScore, refresh: refreshResults } = useRecentResults();

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshResults();
    }, [refresh, refreshResults]),
  );

  const learnerName = account?.displayName ?? 'Estudiante';
  const accountUsername = account?.username ?? '';
  const completedLessons = Object.values(progressMap).filter(Boolean).length;
  const totalLessons = Object.values(lessonsByUnit).reduce((total, lessons) => total + lessons.length, 0);

  const onResetProgress = () =>
    Alert.alert(
      'Reiniciar progreso',
      'Se borrarán tus lecciones completadas y resultados. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            void resetProgress().then(() => Promise.all([refresh(), refreshResults()]));
          },
        },
      ],
    );

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

      <SectionHeading eyebrow="Estilo de aprendizaje" title="¿Cómo te resulta mejor?" />
      <View style={styles.styleSelector}>
        {LEARNING_STYLES.map(option => {
          const active = option === style;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setStyle(option)}
              style={[
                styles.stylePill,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.line,
                  borderRadius: radius.pill,
                },
              ]}>
              <AppText
                color={active ? colors.onPrimary : colors.text}
                weight="600"
                style={styles.stylePillText}>
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="small" style={{ marginTop: spacing.sm }}>
        {`Personalizaremos los ejemplos y recomendaciones hacia un enfoque ${style.toLowerCase()}.`}
      </AppText>

      <SectionHeading eyebrow="Accesibilidad" title="Ajustes de lectura" />
      <View style={styles.list}>
        <SettingRow
          title="Apariencia oscura"
          subtitle="Reduce el brillo para estudiar"
          control={<Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} label="Apariencia oscura" />}
        />
        <SettingRow
          title="Texto ampliado"
          subtitle="Facilita la lectura prolongada"
          control={<Toggle on={largeText} onToggle={() => setLargeText(!largeText)} label="Texto ampliado" />}
        />
      </View>

      <SectionHeading eyebrow="Cuenta" title="Sesión" />
      <View style={styles.list}>
        <SettingRow title={learnerName} subtitle={`@${accountUsername}`} control={null} />
      </View>
      <View style={[styles.sessionActions, { marginTop: spacing.md }]}>
        <PrimaryButton label="Cerrar sesión" onPress={() => void logout()} />
        <SecondaryButton label="Reiniciar mi progreso" onPress={onResetProgress} />
      </View>
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
  styleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stylePill: {
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stylePillText: { fontSize: 13 },
  list: { gap: 12 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
  },
  sessionActions: { gap: 8 },
});
