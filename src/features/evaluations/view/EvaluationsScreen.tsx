import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { Screen } from '@/shared/components/Screen';
import { SectionHeading } from '@/shared/components/SectionHeading';
import type { EvaluationResult } from '@/shared/model/entities';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { useEvaluationsCatalog } from '@/features/evaluations/viewmodel/useEvaluationsCatalog';
import { useRecentResults } from '@/features/profile/viewmodel/useRecentResults';

export default function EvaluationsScreen() {
  const { colors, radius } = useTheme();
  const { summaries, isLoading, error } = useEvaluationsCatalog();
  const { results, refresh: refreshResults, isLoading: resultsLoading, error: resultsError } =
    useRecentResults();
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
      {isLoading ? (
        <EmptyState loading title="Cargando" message="Preparando tus evaluaciones." />
      ) : error ? (
        <EmptyState title="No se pudo cargar" message={error} />
      ) : summaries.length === 0 ? (
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
                <Icon name="check" size={16} color={colors.primary} strokeWidth={2.5} />
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
      {resultsLoading ? (
        <EmptyState loading title="Cargando" message="Preparando tu historial." />
      ) : resultsError ? (
        <EmptyState title="No se pudo cargar" message={resultsError} />
      ) : results.length === 0 ? (
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
        <Icon name="check" size={16} color={colors.success} strokeWidth={2.5} />
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
