import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityView } from '@/components/activities/ActivityView';
import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { Exercise } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { useExample } from '@/viewmodels/useExample';

export default function ExampleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { example, isLoading } = useExample(id ?? null);
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [revealedHints, setRevealedHints] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  if (!isLoading && !example) {
    return (
      <Screen>
        <EmptyState title="Sin ejemplo" message="No se encontró el ejemplo solicitado." />
      </Screen>
    );
  }

  if (!example) {
    return (
      <Screen>
        <EmptyState title="Cargando" message="Preparando el ejemplo guiado." />
      </Screen>
    );
  }

  const asExercise: Exercise = {
    id: example.id,
    lessonId: example.lessonId,
    type: example.type,
    prompt: example.prompt,
    instructions: '',
    correctOrder: [],
    config: example.config,
    explanation: example.explanation,
  };

  const goExercises = () =>
    router.push({ pathname: '/ejercicios', params: { lesson: example.lessonId } });

  if (variant === 'A') {
    return (
      <Screen>
        <ScreenHeader
          onBack={() => router.back()}
          eyebrow="Ejemplo A · Demostración"
          title={example.title}
        />

        <AppText variant="eyebrow">{example.prompt}</AppText>

        {example.config.pairs && example.config.pairs.length > 0 ? (
          <View
            style={[
              styles.table,
              { borderColor: colors.line, borderRadius: radius.control, marginTop: spacing.md },
            ]}>
            <View style={[styles.tableRow, { backgroundColor: colors.soft, borderTopWidth: 0 }]}>
              <AppText variant="small" weight="700" style={styles.cell}>
                Concepto
              </AppText>
              <AppText variant="small" weight="700" style={styles.cell}>
                Descripción
              </AppText>
            </View>
            {example.config.pairs.map((pair, index) => (
              <View
                key={`${pair.left}-${index}`}
                style={[styles.tableRow, { borderTopColor: colors.line }]}>
                <AppText variant="small" weight="600" style={styles.cell}>
                  {pair.left}
                </AppText>
                <AppText variant="small" style={styles.cell}>
                  {pair.right}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        <AppText variant="eyebrow" style={{ marginTop: spacing.lg }}>
          Cómo se razona
        </AppText>
        <View style={[styles.steps, { marginTop: spacing.sm }]}>
          {example.steps.map((step, index) => (
            <View
              key={`${step.text}-${index}`}
              style={[styles.node, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
              <AppText variant="code" color={colors.primary} weight="700">
                {String(index + 1).padStart(2, '0')}
              </AppText>
              <View style={styles.flex}>
                <AppText weight="600">{step.text}</AppText>
                <AppText variant="small" color={colors.muted}>
                  {`Por qué: ${step.why}`}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        <PrimaryButton
          label="Ahora inténtalo tú"
          onPress={() => setVariant('B')}
          style={{ marginTop: spacing.lg }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        onBack={() => setVariant('A')}
        eyebrow="Ejemplo B · Acompañamiento"
        title={example.title}
      />

      <AppText variant="eyebrow">{example.prompt}</AppText>

      <View style={{ marginTop: spacing.md }}>
        <ActivityView
          exercise={asExercise}
          allowReset
          onSubmit={(_answer, _correct) => {
            setAnswered(true);
          }}
        />
      </View>

      {example.hints.length > 0 ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {example.hints.slice(0, revealedHints).map((hint, index) => (
            <View
              key={`${hint}-${index}`}
              style={[styles.hint, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
              <AppText variant="small">{`Pista ${index + 1}: ${hint}`}</AppText>
            </View>
          ))}
          {revealedHints < example.hints.length ? (
            <SecondaryButton
              label="Ver una pista"
              onPress={() => setRevealedHints(current => current + 1)}
            />
          ) : null}
        </View>
      ) : null}

      {answered ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {showSolution ? (
            <View
              style={[styles.solution, { borderColor: colors.success, backgroundColor: colors.card, borderRadius: radius.control }]}>
              <AppText variant="eyebrow">Solución completa</AppText>
              <AppText variant="small">{example.explanation}</AppText>
            </View>
          ) : (
            <SecondaryButton label="Ver solución completa y el porqué" onPress={() => setShowSolution(true)} />
          )}
          <PrimaryButton label="Ir a ejercicios" onPress={goExercises} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  steps: { gap: 10 },
  node: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderWidth: 1 },
  table: { borderWidth: 1, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1 },
  cell: { flex: 1, lineHeight: 18, textAlign: 'justify' },
  hint: { padding: 12 },
  solution: { borderWidth: 1, padding: 14, gap: 4 },
});
