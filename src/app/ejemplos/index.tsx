import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { MetadataBadge } from '@/components/MetadataBadge';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/theme-provider';
import { useLessonContent } from '@/viewmodels/useLessonContent';

export default function ExamplesScreen() {
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const { lesson, examples } = useLessonContent(lessonParam ?? null);
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow="Práctica guiada"
        title="Ejemplos resueltos"
        trailing={String(examples.length)}
      />
      {examples.length === 0 ? (
        <EmptyState
          title="Sin ejemplos"
          message="Este tema aún no tiene ejemplos asociados. Se agregarán en una próxima actualización."
        />
      ) : (
        <View style={styles.list}>
          {examples.map(example => (
            <Pressable
              key={example.id}
              accessibilityRole="button"
              accessibilityLabel={`Ejemplo: ${example.title}, ${example.complexity}`}
              onPress={() =>
                router.push({ pathname: '/ejemplos/[id]', params: { id: example.id } })
              }
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
                pressed && !reduced ? { transform: [{ scale: 0.99 }] } : null,
              ]}>
              <MetadataBadge>{example.complexity}</MetadataBadge>
              <AppText variant="heading">{example.title}</AppText>
              <AppText variant="small">{example.scenario}</AppText>
            </Pressable>
          ))}
        </View>
      )}
      {lesson ? (
        <AppText variant="small" style={{ marginTop: spacing.lg }}>
          {lesson.title}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { borderWidth: 1, padding: 18, gap: 8 },
});
