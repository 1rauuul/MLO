import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { EmptyState } from '@/shared/components/EmptyState';
import { ExampleRunner } from '@/features/examples/view/ExampleRunner';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useExamplesEngine } from '@/features/examples/viewmodel/useExamplesEngine';
import { useLessonContent } from '@/features/modules/viewmodel/useLessonContent';
import { useSession } from '@/features/auth/viewmodel/useSession';

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
