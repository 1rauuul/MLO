import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chevron } from '@/components/Chevron';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionHeading } from '@/components/SectionHeading';
import type { EvaluationResult } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { useEvaluationsCatalog } from '@/viewmodels/useEvaluationsCatalog';
import { useRecentResults } from '@/viewmodels/useRecentResults';

export default function EvaluationsScreen() {
  const { colors, radius } = useTheme();
  const { summaries } = useEvaluationsCatalog();
  const { results, refresh: refreshResults } = useRecentResults();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      void refreshResults();
    }, [refreshResults]),
  );

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">Evaluación formativa</AppText>
          <AppText variant="title">Comprobaciones</AppText>
        </View>
      </View>

      <SectionHeading
        eyebrow="Disponibles"
        title="Tus evaluaciones"
        trailing={String(summaries.length).padStart(2, '0')}
      />
      {summaries.length === 0 ? (
        <EmptyState title="Sin evaluaciones" message="Aún no hay comprobaciones disponibles." />
      ) : (
        <View style={styles.list}>
          {summaries.map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir evaluación ${item.title}`}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(evaluations)/evaluacion',
                  params: { lesson: item.lessonId },
                })
              }
              style={[
                styles.historyItem,
                { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
              ]}>
              <View style={[styles.historyMark, { backgroundColor: colors.soft }]}>
                <AppText color={colors.primary} weight="700">
                  ✓
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText weight="600">{item.title}</AppText>
                <AppText variant="small">
                  {`Unidad ${String(item.unitNumber).padStart(2, '0')} · ${item.lessonTitle}`}
                </AppText>
              </View>
              <Chevron direction="right" size={16} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          ))}
        </View>
      )}

      <SectionHeading eyebrow="Resultados recientes" title="Tu historial" />
      {results.length === 0 ? (
        <EmptyState
          title="Sin resultados todavía"
          message="Completa una evaluación y aquí verás tu puntuación."
        />
      ) : (
        <View style={styles.list}>
          {results.map(result => (
            <ResultRow key={result.id} result={result} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function ResultRow({ result }: { result: EvaluationResult }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.historyItem,
        { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
      ]}>
      <View style={[styles.historyMark, { backgroundColor: colors.soft }]}>
        <AppText color={colors.success} weight="700">
          ✓
        </AppText>
      </View>
      <View style={styles.flex}>
        <AppText weight="600">{`Comprobación ${result.correctCount}/${result.totalCount}`}</AppText>
        <AppText variant="small">{new Date(result.createdAt).toLocaleDateString('es-ES')}</AppText>
      </View>
      <AppText weight="700" color={colors.primary}>
        {result.score}%
      </AppText>
    </View>
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
  list: { gap: 12 },
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
});
