import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/shared/components/EmptyState';
import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
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
  const [finished, setFinished] = useState(false);
  const [draw, setDraw] = useState(0);
  const goExercises = () => router.replace({ pathname: '/ejercicios', params: { lesson: lessonParam, from: 'examples' } });
  const redraw = () => { setFinished(false); setDraw(current => current + 1); engine.redraw(); };

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
        <EmptyState loading title="Cargando" message="Preparando el ejemplo guiado." />
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

  if (finished) {
    return (
      <Screen>
        <ScreenHeader onBack={() => router.back()} title="Ejemplos" />
        <View style={{ gap: 20 }}>
          <AppText variant="title">Ejemplos finalizados</AppText>
          <AppText>Has llegado al final de esta selección de ejemplos.</AppText>
          <AppText weight="600">{`Ejemplos recorridos: ${engine.total}/${engine.total}`}</AppText>
          <PrimaryButton label="Continuar a ejercicios" onPress={goExercises} />
          <SecondaryButton label="Nuevo sorteo" onPress={redraw} />
          <SecondaryButton label="Volver al subtema" onPress={() => lesson ? router.navigate({ pathname: '/tema/[id]', params: { id: lesson.topicId ?? `t-${lesson.id}` } }) : router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen keyboardAvoiding>
      <ExampleRunner
        key={`${draw}-${engine.current.id}`}
        exercise={engine.current}
        example={engine.currentExample}
        index={engine.index}
        total={engine.total}
        isLast={engine.isLast}
        onNext={engine.next}
        onRedraw={redraw}
        onGoExercises={() => setFinished(true)}
        onBack={() => router.back()}
      />
    </Screen>
  );
}
