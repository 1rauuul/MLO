import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { EmptyState } from '@/shared/components/EmptyState';
import { HubTile } from '@/features/modules/view/HubTile';
import { Icon } from '@/shared/components/Icon';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { useLessonHub } from '@/features/modules/viewmodel/useLessonHub';
import { useSession } from '@/features/auth/viewmodel/useSession';
import type { IconName } from '@/shared/components/Icon';

interface HubAction {
  key: string;
  icon: IconName;
  label: string;
  note: string;
  accent: string;
  onPress: () => void;
}

export default function TopicHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = id ?? null;
  const { lesson, unit, exercises, evaluation, completed } = useLessonHub(lessonId);
  const { record } = useSession();
  const router = useRouter();
  const { colors, radius } = useTheme();

  useFocusEffect(
    useCallback(() => {
      if (lesson) {
        record({
          unitId: lesson.unitId,
          lessonId: lesson.id,
          lessonCode: lesson.code,
          section: 'hub',
        });
      }
    }, [lesson, record]),
  );

  useEffect(() => {
    if (lesson && lesson.code === '1.1') {
      router.replace({ pathname: '/lecciones/[id]', params: { id: lesson.id } });
    }
  }, [lesson, router]);

  if (!lesson || lesson.code === '1.1') {
    return (
      <Screen>
        <EmptyState title="Cargando" message="Preparando el tema." />
      </Screen>
    );
  }

  const actions: HubAction[] = [
    {
      key: 'lesson',
      icon: 'lesson',
      label: 'Lecciones',
      note: 'Concepto y síntesis',
      accent: colors.primary,
      onPress: () => router.push({ pathname: '/lecciones/[id]', params: { id: lesson.id } }),
    },
  ];

  if (exercises.length > 0) {
    actions.push({
      key: 'examples',
      icon: 'examples',
      label: 'Ejemplos',
      note: 'Demostración + acompañamiento',
      accent: colors.success,
      onPress: () => router.push({ pathname: '/ejemplos', params: { lesson: lesson.id } }),
    });
  }

  if (exercises.length > 0) {
    actions.push({
      key: 'exercises',
      icon: 'exercises',
      label: 'Ejercicios',
      note: 'Resuelve el banco de ejercicios',
      accent: colors.warning,
      onPress: () => router.push({ pathname: '/ejercicios', params: { lesson: lesson.id } }),
    });
  }

  if (evaluation) {
    actions.push({
      key: 'eval',
      icon: 'eval',
      label: 'Evaluación',
      note: 'Comprueba tu avance',
      accent: colors.danger,
      onPress: () => router.push({ pathname: '/evaluacion', params: { lesson: lesson.id } }),
    });
  }

  const tileRows: HubAction[][] = [];
  for (let index = 0; index < actions.length; index += 2) {
    tileRows.push(actions.slice(index, index + 2));
  }

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow={unit ? `Unidad ${unit.number} · Tema ${lesson.code}` : `Tema ${lesson.code}`}
        title={lesson.title}
      />

      <View
        style={[
          styles.status,
          {
            backgroundColor: colors.card,
            borderColor: completed ? colors.success : colors.line,
            borderRadius: radius.control,
          },
        ]}>
        <Icon
          name={completed ? 'check' : 'clock'}
          size={18}
          color={completed ? colors.success : colors.primary}
        />
        <AppText weight="600" style={styles.flex}>
          {completed ? 'Tema completado' : 'En progreso'}
        </AppText>
      </View>

      <View style={styles.grid}>
        {tileRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map(action => (
              <HubTile
                key={action.key}
                icon={action.icon}
                label={action.label}
                note={action.note}
                accent={action.accent}
                onPress={action.onPress}
              />
            ))}
          </View>
        ))}
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
    marginBottom: 18,
  },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
});
