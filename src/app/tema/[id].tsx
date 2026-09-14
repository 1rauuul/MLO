import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { HubTile } from '@/components/HubTile';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/theme/theme-provider';
import { useCatalog } from '@/viewmodels/useCatalog';
import { useLessonContent } from '@/viewmodels/useLessonContent';
import { useModuleProgress } from '@/viewmodels/useModuleProgress';
import { useSession } from '@/viewmodels/useSession';

export default function TopicHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = id ?? null;
  const { lesson, isLoading } = useLessonContent(lessonId);
  const { units } = useCatalog();
  const { progressMap } = useModuleProgress();
  const session = useSession();
  const router = useRouter();
  const { colors, radius } = useTheme();

  useEffect(() => {
    if (lesson) {
      session.openLesson(lesson.unitId, lesson.id);
    }
  }, [lesson, session]);

  if (!isLoading && !lesson) {
    return (
      <Screen>
        <EmptyState title="Sin tema" message="No se encontró el tema solicitado." />
      </Screen>
    );
  }

  const unit = units.find(item => item.id === lesson?.unitId);
  const completed = lesson ? !!progressMap[lesson.id] : false;

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow={unit ? `Unidad ${unit.number} · Tema ${lesson?.code}` : `Tema ${lesson?.code ?? ''}`}
        title={lesson?.title ?? 'Cargando'}
      />

      <View
        style={[
          styles.status,
          { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
        ]}>
        <View style={[styles.timer, { backgroundColor: colors.soft }]}>
          <AppText color={colors.primary}>⏱</AppText>
        </View>
        <View style={styles.flex}>
          <AppText weight="600">Tiempos y estados globales</AppText>
          <AppText variant="small">
            {completed ? 'Tema completado' : 'En progreso'} · Objeto de aprendizaje
          </AppText>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <HubTile
            icon="▤"
            label="Lecciones"
            note="Concepto y contexto"
            accent={colors.primary}
            onPress={() => lessonId && router.push({ pathname: '/lecciones/[id]', params: { id: lessonId } })}
          />
          <HubTile
            icon="⇄"
            label="Ejemplos"
            note="Casos resueltos"
            accent={colors.success}
            onPress={() =>
              lessonId &&
              router.push({ pathname: '/ejemplos', params: { lesson: lessonId } })
            }
          />
        </View>
        <View style={styles.gridRow}>
          <HubTile
            icon="◫"
            label="Ejercicios"
            note="Práctica guiada"
            accent={colors.warning}
            onPress={() =>
              lessonId &&
              router.push({ pathname: '/ejercicios', params: { lesson: lessonId } })
            }
          />
          <HubTile
            icon="✓"
            label="Evaluación"
            note="Comprueba tu avance"
            accent={colors.danger}
            onPress={() =>
              lessonId &&
              router.push({ pathname: '/evaluacion', params: { lesson: lessonId } })
            }
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 22,
  },
  timer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
});
