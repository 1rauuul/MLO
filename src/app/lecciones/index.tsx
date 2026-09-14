import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SubtopicRow } from '@/components/SubtopicRow';
import { useTheme } from '@/theme/theme-provider';
import { useCatalog } from '@/viewmodels/useCatalog';
import { useSession } from '@/viewmodels/useSession';

export default function UnitLessonsScreen() {
  const { unit: unitParam } = useLocalSearchParams<{ unit?: string }>();
  const { units, lessonsByUnit, progressMap } = useCatalog();
  const session = useSession();
  const router = useRouter();
  const { spacing } = useTheme();

  const unit = units.find(item => item.id === unitParam) ?? units[0];

  if (!unit) {
    return (
      <Screen>
        <EmptyState title="Sin unidad" message="No se encontró la unidad solicitada." />
      </Screen>
    );
  }

  const lessons = lessonsByUnit[unit.id] ?? [];
  const done = lessons.filter(lesson => progressMap[lesson.id]).length;

  const openLesson = (lessonId: string) => {
    session.openLesson(unit.id, lessonId);
    router.push({ pathname: '/tema/[id]', params: { id: lessonId } });
  };

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow={`Unidad ${unit.number}`}
        title={unit.title}
        trailing={`${done}/${lessons.length}`}
      />
      <View style={styles.intro}>
        <AppText variant="eyebrow">Ruta de la unidad</AppText>
        <AppText variant="title">{unit.title}</AppText>
        <AppText variant="small" style={{ marginTop: spacing.sm }}>
          {unit.description}
        </AppText>
      </View>
      <View style={styles.list}>
        {lessons.map(lesson => (
          <SubtopicRow
            key={lesson.id}
            lesson={lesson}
            completed={!!progressMap[lesson.id]}
            onPress={() => openLesson(lesson.id)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 22, gap: 4 },
  list: { gap: 10 },
});
