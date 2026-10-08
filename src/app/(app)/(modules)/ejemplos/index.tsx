import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { ExampleRunner } from '@/components/examples/ExampleRunner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useExamplesEngine } from '@/viewmodels/useExamplesEngine';
import { useLessonContent } from '@/viewmodels/useLessonContent';
import { useSession } from '@/viewmodels/useSession';

export default function ExamplesScreen() {
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const { lesson } = useLessonContent(lessonParam ?? null);
  const engine = useExamplesEngine(lessonParam ?? null);
  const { record } = useSession();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (lesson) {
        record({
          unitId: lesson.unitId,
          lessonId: lesson.id,
          lessonCode: lesson.code,
          section: 'example',
        });
      }
    }, [lesson, record]),
  );

  const header = (
    <ScreenHeader
      onBack={() => router.back()}
      eyebrow={lesson ? `Tema ${lesson.code}` : 'Ejemplos'}
      title="Ejemplos guiados"
    />
  );

  if (engine.isLoading) {
    return (
      <Screen>
        {header}
        <EmptyState title="Cargando" message="Preparando el ejemplo guiado." />
      </Screen>
    );
  }

  if (engine.items.length === 0 || !engine.current) {
    return (
      <Screen>
        {header}
        <EmptyState title="Sin ejemplos" message="Este tema aún no tiene ejercicios para ejemplificar." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ExampleRunner
        key={engine.current.id}
        exercise={engine.current}
        index={engine.index}
        total={engine.total}
        isLast={engine.isLast}
        onNext={engine.next}
        onGoExercises={() => {
          router.push({ pathname: '/ejercicios', params: { lesson: lessonParam } });
        }}
        onBack={() => router.back()}
      />
    </Screen>
  );
}
