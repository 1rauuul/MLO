import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomTabBar, type HomeTab } from '@/components/BottomTabBar';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/Buttons';
import { Screen } from '@/components/Screen';
import { SectionHeading } from '@/components/SectionHeading';
import { SubtopicRow } from '@/components/SubtopicRow';
import { Toggle } from '@/components/Toggle';
import { UnitCard } from '@/components/UnitCard';
import type { LearningStyle, Unit } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { useCatalog } from '@/viewmodels/useCatalog';
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
  const { profile, style, setStyle, darkMode, setDarkMode, largeText, setLargeText } =
    useLearnerProfile();
  const { units, lessonsByUnit, progressMap, refresh } = useCatalog();
  const { results, averageScore, refresh: refreshResults } = useRecentResults();
  const session = useSession();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshResults();
    }, [refresh, refreshResults]),
  );

  const openLesson = (unitId: string, lessonId: string) => {
    session.openLesson(unitId, lessonId);
    router.push({ pathname: '/tema/[id]', params: { id: lessonId } });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Screen contentStyle={styles.content}>
        {tab === 'modules' && (
          <ModulesTab
            units={units}
            lessonsByUnit={lessonsByUnit}
            progressMap={progressMap}
            onOpenUnit={unit => router.push({ pathname: '/lecciones', params: { unit: unit.id } })}
            onOpenLesson={openLesson}
            onOpenProfile={() => setTab('profile')}
          />
        )}
        {tab === 'assessments' && (
          <AssessmentsTab
            results={results}
            onStart={() => {
              const firstUnit = units[0];
              const lesson = firstUnit ? lessonsByUnit[firstUnit.id]?.[0] : undefined;
              if (firstUnit && lesson) {
                session.openLesson(firstUnit.id, lesson.id);
                router.push({ pathname: '/evaluacion', params: { lesson: lesson.id } });
              }
            }}
          />
        )}
        {tab === 'profile' && (
          <ProfileTab
            learnerName={profile?.learnerName ?? 'Valentina Ríos'}
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
          />
        )}
      </Screen>
      <BottomTabBar active={tab} onChange={setTab} />
    </View>
  );
}

interface ModulesTabProps {
  units: Unit[];
  lessonsByUnit: Record<string, import('@/models/entities').Lesson[]>;
  progressMap: Record<string, boolean>;
  onOpenUnit: (unit: Unit) => void;
  onOpenLesson: (unitId: string, lessonId: string) => void;
  onOpenProfile: () => void;
}

function ModulesTab({
  units,
  lessonsByUnit,
  progressMap,
  onOpenUnit,
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
  const currentProgress = currentLessons.length
    ? Math.round((currentDone / currentLessons.length) * 100)
    : 0;

  return (
    <View>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">{greetingDate()}</AppText>
          <AppText variant="title">Hola, Valentina</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={onOpenProfile}
          style={[styles.avatar, { backgroundColor: colors.soft }]}>
          <AppText variant="code" color={colors.primary} weight="700">
            VR
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
          Unidad {currentUnit.number}{'\n'}
          {currentUnit.title}
        </AppText>
        <AppText variant="small" color="#E6ECFF">
          {currentDone} de {currentLessons.length} subtemas · {currentProgress}%
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar unidad"
          onPress={() => onOpenUnit(currentUnit)}
          style={[styles.continueAction, { backgroundColor: colors.onPrimary }]}>
          <AppText color={colors.primary} weight="700" style={styles.continueArrow}>
            →
          </AppText>
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
                onOpen={() => onOpenUnit(unit)}
                onToggleExpand={() => setExpanded(isExpanded ? null : unit.id)}
              />
              {isExpanded && (
                <View style={[styles.inlineSubtopics, { paddingLeft: spacing.md }]}>
                  {lessons.map(lesson => (
                    <SubtopicRow
                      key={lesson.id}
                      lesson={lesson}
                      completed={!!progressMap[lesson.id]}
                      onPress={() => onOpenLesson(unit.id, lesson.id)}
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
  results: { id: number; score: number; correctCount: number; totalCount: number; createdAt: string }[];
  onStart: () => void;
}

function AssessmentsTab({ results, onStart }: AssessmentsTabProps) {
  const { colors, radius } = useTheme();

  return (
    <View>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">Evaluación formativa</AppText>
          <AppText variant="title">Comprobaciones</AppText>
        </View>
        <AppText variant="title" color={colors.primary}>
          ✓
        </AppText>
      </View>

      <View
        style={[styles.assessmentHero, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
        <AppText variant="eyebrow">Recomendada para ti</AppText>
        <AppText variant="heading">Introducción a la ingeniería</AppText>
        <AppText variant="small">2 preguntas · Unidad 01</AppText>
        <PrimaryButton label="Iniciar ahora" onPress={onStart} />
      </View>

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
              style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
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
  style: LearningStyle;
  setStyle: (value: LearningStyle) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  largeText: boolean;
  setLargeText: (value: boolean) => void;
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
}

function ProfileTab({
  learnerName,
  style,
  setStyle,
  darkMode,
  setDarkMode,
  largeText,
  setLargeText,
  completedLessons,
  totalLessons,
  averageScore,
}: ProfileTabProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View>
      <View style={styles.profileHero}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.soft }]}>
          <AppText variant="code" color={colors.primary} weight="700">
            VR
          </AppText>
        </View>
        <View>
          <AppText variant="eyebrow">Estudiante</AppText>
          <AppText variant="title">{learnerName}</AppText>
          <AppText variant="small">Ingeniería de Software</AppText>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[
          { value: `${completedLessons}/${totalLessons}`, label: 'subtemas completados' },
          { value: `${averageScore}%`, label: 'promedio evaluación' },
        ].map(stat => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
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
              <AppText color={active ? colors.onPrimary : colors.text} weight="600" style={styles.stylePillText}>
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
      style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
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
  continueArrow: { fontSize: 20, lineHeight: 22 },
  list: { gap: 12 },
  unitBlock: { gap: 10 },
  inlineSubtopics: { gap: 8 },
  assessmentHero: {
    borderWidth: 1,
    padding: 22,
    gap: 8,
  },
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
});
