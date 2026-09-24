import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomTabBar, type HomeTab } from '@/components/BottomTabBar';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Chevron } from '@/components/Chevron';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionHeading } from '@/components/SectionHeading';
import { SubtopicRow } from '@/components/SubtopicRow';
import { Toggle } from '@/components/Toggle';
import { UnitCard } from '@/components/UnitCard';
import type { EvaluationResult, LearningStyle, Lesson, Unit } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { initials } from '@/viewmodels/authLogic';
import { useAuth } from '@/viewmodels/useAuth';
import { useCatalog } from '@/viewmodels/useCatalog';
import { useEvaluationsCatalog } from '@/viewmodels/useEvaluationsCatalog';
import { useLearnerProfile } from '@/viewmodels/useLearnerProfile';
import { useRecentResults } from '@/viewmodels/useRecentResults';
import { useSession } from '@/viewmodels/useSession';

const LEARNING_STYLES: LearningStyle[] = ['Activo', 'Reflexivo', 'Teórico', 'Pragmático'];

function greetingDate(): string {
  const formatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatted.toUpperCase();
}

export default function HomeScreen() {
  const [tab, setTab] = useState<HomeTab>('modules');
  const { colors } = useTheme();
  const { account, logout, resetProgress } = useAuth();
  const { style, setStyle, darkMode, setDarkMode, largeText, setLargeText } = useLearnerProfile();
  const { units, lessonsByUnit, progressMap, refresh } = useCatalog();
  const { results, averageScore, refresh: refreshResults } = useRecentResults();
  const session = useSession();
  const router = useRouter();

  const learnerName = account?.displayName ?? 'Estudiante';
  const accountUsername = account?.username ?? '';

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshResults();
    }, [refresh, refreshResults]),
  );

  const openLesson = (unitId: string, lesson: Lesson) => {
    session.openLesson(unitId, lesson.id);
    if (lesson.code === '1.1') {
      router.push({ pathname: '/lecciones/[id]', params: { id: lesson.id } });
    } else {
      router.push({ pathname: '/tema/[id]', params: { id: lesson.id } });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Screen contentStyle={styles.content}>
        {tab === 'modules' && (
          <ModulesTab
            units={units}
            lessonsByUnit={lessonsByUnit}
            progressMap={progressMap}
            learnerName={learnerName}
            onOpenLesson={openLesson}
            onOpenProfile={() => setTab('profile')}
          />
        )}
        {tab === 'assessments' && (
          <AssessmentsTab
            results={results}
            onOpen={lessonId => router.push({ pathname: '/evaluacion', params: { lesson: lessonId } })}
          />
        )}
        {tab === 'profile' && (
          <ProfileTab
            learnerName={learnerName}
            accountUsername={accountUsername}
            style={style}
            setStyle={setStyle}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            largeText={largeText}
            setLargeText={setLargeText}
            completedLessons={Object.values(progressMap).filter(Boolean).length}
            totalLessons={Object.keys(lessonsByUnit).reduce(
              (total, key) => total + (lessonsByUnit[key]?.length ?? 0),
              0,
            )}
            averageScore={averageScore}
            onLogout={() => void logout()}
            onResetProgress={() =>
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
              )
            }
          />
        )}
      </Screen>
      <BottomTabBar active={tab} onChange={setTab} />
    </View>
  );
}

interface ModulesTabProps {
  units: Unit[];
  lessonsByUnit: Record<string, Lesson[]>;
  progressMap: Record<string, boolean>;
  learnerName: string;
  onOpenLesson: (unitId: string, lesson: Lesson) => void;
  onOpenProfile: () => void;
}

function ModulesTab({
  units,
  lessonsByUnit,
  progressMap,
  learnerName,
  onOpenLesson,
  onOpenProfile,
}: ModulesTabProps) {
  const { colors, radius, spacing } = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (units.length === 0) {
    return <EmptyState title="Cargando catálogo" message="Preparando las unidades del curso." />;
  }

  const currentUnit =
    units.find(unit => {
      const lessons = lessonsByUnit[unit.id] ?? [];
      return lessons.some(lesson => !progressMap[lesson.id]);
    }) ?? units[0];
  const currentLessons = lessonsByUnit[currentUnit.id] ?? [];
  const currentDone = currentLessons.filter(lesson => progressMap[lesson.id]).length;
  const nextLesson = currentLessons.find(lesson => !progressMap[lesson.id]) ?? currentLessons[0];

  return (
    <View>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">{greetingDate()}</AppText>
          <AppText variant="title">{`Hola, ${learnerName}`}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={onOpenProfile}
          style={[styles.avatar, { backgroundColor: colors.soft }]}>
          <AppText variant="code" color={colors.primary} weight="700">
            {initials(learnerName)}
          </AppText>
        </Pressable>
      </View>

      <View
        style={[
          styles.continueCard,
          { backgroundColor: colors.primary, borderRadius: radius.tile },
        ]}>
        <AppText variant="eyebrow" color="#DCE6FF">
          Continúa donde lo dejaste
        </AppText>
        <AppText style={styles.continueTitle} color={colors.onPrimary} weight="700">
          Unidad {currentUnit.number}
          {'\n'}
          {currentUnit.title}
        </AppText>
        <AppText variant="small" color="#E6ECFF">
          {`${currentDone} de ${currentLessons.length} subtemas`}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar unidad"
          disabled={!nextLesson}
          onPress={() => nextLesson && onOpenLesson(currentUnit.id, nextLesson)}
          style={[styles.continueAction, { backgroundColor: colors.onPrimary }]}>
          <Chevron direction="right" size={18} color={colors.primary} strokeWidth={2.4} />
        </Pressable>
      </View>

      <SectionHeading
        eyebrow="Ruta de aprendizaje"
        title="Tus unidades"
        trailing={String(units.length).padStart(2, '0')}
      />

      <View style={styles.list}>
        {units.map(unit => {
          const lessons = lessonsByUnit[unit.id] ?? [];
          const done = lessons.filter(lesson => progressMap[lesson.id]).length;
          const progress = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
          const isExpanded = expanded === unit.id;
          return (
            <View key={unit.id} style={styles.unitBlock}>
              <UnitCard
                unit={unit}
                subtopicCount={lessons.length}
                progress={progress}
                expanded={isExpanded}
                onToggle={() => setExpanded(isExpanded ? null : unit.id)}
              />
              {isExpanded && (
                <View style={[styles.inlineSubtopics, { paddingLeft: spacing.md }]}>
                  {lessons.map(lesson => (
                    <SubtopicRow
                      key={lesson.id}
                      lesson={lesson}
                      completed={!!progressMap[lesson.id]}
                      onPress={() => onOpenLesson(unit.id, lesson)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface AssessmentsTabProps {
  results: EvaluationResult[];
  onOpen: (lessonId: string) => void;
}

function AssessmentsTab({ results, onOpen }: AssessmentsTabProps) {
  const { colors, radius } = useTheme();
  const { summaries } = useEvaluationsCatalog();

  return (
    <View>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">Evaluación formativa</AppText>
          <AppText variant="title">Comprobaciones</AppText>
        </View>
      </View>

      <SectionHeading
        eyebrow="Disponibles"
        title="Tus evaluaciones"
        trailing={String(summaries.length).padStart(2, '0')}
      />
      {summaries.length === 0 ? (
        <EmptyState title="Sin evaluaciones" message="Aún no hay comprobaciones disponibles." />
      ) : (
        <View style={styles.list}>
          {summaries.map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir evaluación ${item.title}`}
              onPress={() => onOpen(item.lessonId)}
              style={[
                styles.historyItem,
                { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
              ]}>
              <View style={[styles.historyMark, { backgroundColor: colors.soft }]}>
                <AppText color={colors.primary} weight="700">
                  ✓
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText weight="600">{item.title}</AppText>
                <AppText variant="small">
                  {`Unidad ${String(item.unitNumber).padStart(2, '0')} · ${item.lessonTitle}`}
                </AppText>
              </View>
              <Chevron direction="right" size={16} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          ))}
        </View>
      )}

      <SectionHeading eyebrow="Resultados recientes" title="Tu historial" />
      {results.length === 0 ? (
        <EmptyState
          title="Sin resultados todavía"
          message="Completa una evaluación y aquí verás tu puntuación."
        />
      ) : (
        <View style={styles.list}>
          {results.map(result => (
            <View
              key={result.id}
              style={[
                styles.historyItem,
                { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
              ]}>
              <View style={[styles.historyMark, { backgroundColor: colors.soft }]}>
                <AppText color={colors.success} weight="700">
                  ✓
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText weight="600">{`Comprobación ${result.correctCount}/${result.totalCount}`}</AppText>
                <AppText variant="small">
                  {new Date(result.createdAt).toLocaleDateString('es-ES')}
                </AppText>
              </View>
              <AppText weight="700" color={colors.primary}>
                {result.score}%
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

interface ProfileTabProps {
  learnerName: string;
  accountUsername: string;
  style: LearningStyle;
  setStyle: (value: LearningStyle) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  largeText: boolean;
  setLargeText: (value: boolean) => void;
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  onLogout: () => void;
  onResetProgress: () => void;
}

function ProfileTab({
  learnerName,
  accountUsername,
  style,
  setStyle,
  darkMode,
  setDarkMode,
  largeText,
  setLargeText,
  completedLessons,
  totalLessons,
  averageScore,
  onLogout,
  onResetProgress,
}: ProfileTabProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View>
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
          control={
            <Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} label="Apariencia oscura" />
          }
        />
        <SettingRow
          title="Texto ampliado"
          subtitle="Facilita la lectura prolongada"
          control={
            <Toggle on={largeText} onToggle={() => setLargeText(!largeText)} label="Texto ampliado" />
          }
        />
      </View>

      <SectionHeading eyebrow="Cuenta" title="Sesión" />
      <View style={styles.list}>
        <SettingRow title={learnerName} subtitle={`@${accountUsername}`} control={null} />
      </View>
      <View style={[styles.sessionActions, { marginTop: spacing.md }]}>
        <PrimaryButton label="Cerrar sesión" onPress={onLogout} />
        <SecondaryButton label="Reiniciar mi progreso" onPress={onResetProgress} />
      </View>
    </View>
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
  root: { flex: 1 },
  content: { paddingBottom: 32 },
  flex: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCard: {
    position: 'relative',
    padding: 22,
    gap: 6,
    overflow: 'hidden',
  },
  continueTitle: { fontSize: 22, lineHeight: 24 },
  continueAction: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: 12 },
  unitBlock: { gap: 10 },
  inlineSubtopics: { gap: 8 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  historyMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
  },
  sessionActions: { gap: 8 },
});
