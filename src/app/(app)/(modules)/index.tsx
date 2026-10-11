import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chevron } from '@/components/Chevron';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionHeading } from '@/components/SectionHeading';
import { SubtopicRow } from '@/components/SubtopicRow';
import { UnitCard } from '@/components/UnitCard';
import type { Lesson } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { initials } from '@/viewmodels/authLogic';
import { useAuth } from '@/viewmodels/useAuth';
import { useCatalog } from '@/viewmodels/useCatalog';
import { useSession } from '@/viewmodels/useSession';

function greetingDate(): string {
  const formatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatted.toUpperCase();
}

export default function ModulesScreen() {
  const { colors, radius } = useTheme();
  const { account } = useAuth();
  const { units, lessonsByUnit, progressMap, error, refresh } = useCatalog();
  const { location, resumeHref } = useSession();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const learnerName = account?.displayName ?? 'Estudiante';
  const openDestination = (lesson: Lesson) => {
    if (lesson.code === '1.1') {
      router.push({ pathname: '/lecciones/[id]', params: { id: lesson.id } });
    } else {
      router.push({ pathname: '/tema/[id]', params: { id: lesson.id } });
    }
  };

  if (units.length === 0) {
    return (
      <Screen contentStyle={styles.content}>
        <EmptyState
          title={error ? 'No se pudo cargar' : 'Cargando catálogo'}
          message={error ?? 'Preparando las unidades del curso.'}
        />
      </Screen>
    );
  }

  const currentUnit =
    units.find(unit => {
      const lessons = lessonsByUnit[unit.id] ?? [];
      return lessons.some(lesson => !progressMap[lesson.id]);
    }) ?? units[0];
  const currentLessons = lessonsByUnit[currentUnit.id] ?? [];
  const nextLesson = currentLessons.find(lesson => !progressMap[lesson.id]) ?? currentLessons[0];

  const allLessons = units.flatMap(unit => lessonsByUnit[unit.id] ?? []);
  const resumedLesson = location.lessonId
    ? allLessons.find(lesson => lesson.id === location.lessonId) ?? null
    : null;
  const resumedUnit = resumedLesson
    ? units.find(unit => unit.id === resumedLesson.unitId) ?? null
    : null;
  const canResume = resumedLesson !== null && resumedUnit !== null && resumeHref !== null;
  const heroUnit = canResume && resumedUnit ? resumedUnit : currentUnit;
  const heroLessons = lessonsByUnit[heroUnit.id] ?? [];
  const heroDone = heroLessons.filter(lesson => progressMap[lesson.id]).length;
  const heroProgress = heroLessons.length ? Math.round((heroDone / heroLessons.length) * 100) : 0;
  const heroTitle = canResume && resumedLesson ? resumedLesson.title : heroUnit.title;

  const handleContinue = () => {
    if (canResume && resumeHref) {
      router.push(resumeHref);
      return;
    }
    if (nextLesson) {
      openDestination(nextLesson);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">{greetingDate()}</AppText>
          <AppText variant="title">{`Hola, ${learnerName}`}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={() => router.navigate('/(app)/(profile)/perfil')}
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
          Unidad {heroUnit.number}
          {'\n'}
          {heroTitle}
        </AppText>
        <AppText variant="small" color="#E6ECFF">
          {`${heroDone} de ${heroLessons.length} subtemas · ${heroProgress}%`}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar unidad"
          disabled={!canResume && !nextLesson}
          onPress={handleContinue}
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
          const nextLessonInUnit = lessons.find(lesson => !progressMap[lesson.id]) ?? lessons[0];
          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              subtopicCount={lessons.length}
              progress={progress}
              expanded={isExpanded}
              onToggle={() => setExpanded(isExpanded ? null : unit.id)}>
              <AppText variant="eyebrow">{`Objetos de aprendizaje · ${lessons.length} subtemas`}</AppText>
              <View style={styles.subtopics}>
                {lessons.map((lesson, index) => (
                  <View key={lesson.id}>
                    {index > 0 ? (
                      <View style={[styles.divider, { backgroundColor: colors.line }]} />
                    ) : null}
                    <SubtopicRow
                      inline
                      lesson={lesson}
                      completed={!!progressMap[lesson.id]}
                      onPress={() => openDestination(lesson)}
                    />
                  </View>
                ))}
              </View>
              {nextLessonInUnit ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Explorar subtemas"
                  onPress={() => openDestination(nextLessonInUnit)}
                  style={styles.explore}>
                  <AppText variant="small" color={colors.primary} weight="700">
                    Explorar subtemas
                  </AppText>
                  <Chevron direction="right" size={16} color={colors.primary} strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </UnitCard>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  subtopics: { marginTop: 6 },
  divider: { height: 1 },
  explore: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
});
