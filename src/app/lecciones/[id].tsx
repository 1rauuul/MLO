import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/theme/theme-provider';
import { useLessonContent } from '@/viewmodels/useLessonContent';
import { useModuleProgress } from '@/viewmodels/useModuleProgress';

const SECTION_LABELS = ['Concepto', 'En contexto', 'Síntesis'];
const SECTION_PROGRESS = [32, 68, 100];

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = id ?? null;
  const { lesson, isLoading } = useLessonContent(lessonId);
  const { markCompleted } = useModuleProgress();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [section, setSection] = useState(0);

  if (!isLoading && !lesson) {
    return (
      <Screen>
        <EmptyState title="Sin lección" message="No se encontró la lección solicitada." />
      </Screen>
    );
  }

  if (!lesson) {
    return (
      <Screen>
        <EmptyState title="Cargando" message="Preparando el contenido de la lección." />
      </Screen>
    );
  }

  const goToExample = () => {
    void markCompleted(lesson.id);
    router.push({ pathname: '/ejemplos', params: { lesson: lesson.id } });
  };

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow={lesson.eyebrow}
        title="Lecciones"
        trailing={`${section + 1}/3`}
      />

      <View style={[styles.progressTrack, { backgroundColor: colors.soft }]}>
        <View
          style={[
            styles.progressValue,
            { width: `${SECTION_PROGRESS[section]}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <View style={styles.tabs}>
        {SECTION_LABELS.map((label, index) => (
          <SecondaryButton
            key={label}
            label={label}
            onPress={() => setSection(index)}
            style={[
              styles.tab,
              { backgroundColor: section === index ? colors.primary : colors.card },
            ]}
          />
        ))}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
        ]}>
        <AppText variant="eyebrow">{section === 0 ? lesson.eyebrow : lesson.title}</AppText>
        <AppText variant="title">
          {section === 0
            ? lesson.title
            : section === 1
              ? lesson.contextTitle || 'En contexto'
              : 'Síntesis'}
        </AppText>
        {section === 0 && (
          <>
            <AppText style={{ marginTop: spacing.sm }}>{lesson.body}</AppText>
            {lesson.codeSample ? (
              <View style={[styles.code, { backgroundColor: colors.code, borderRadius: radius.control }]}>
                <AppText variant="code" color={colors.text}>
                  {lesson.codeSample}
                </AppText>
              </View>
            ) : null}
          </>
        )}
        {section === 1 && (
          <AppText style={{ marginTop: spacing.sm }}>{lesson.contextBody}</AppText>
        )}
        {section === 2 && (
          <View style={styles.list}>
            {lesson.synthesis.map(item => (
              <View key={item} style={styles.synthesisRow}>
                <AppText color={colors.success} weight="700">
                  ✓
                </AppText>
                <AppText style={styles.flex}>{item}</AppText>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <SecondaryButton
          label="Anterior"
          disabled={section === 0}
          onPress={() => setSection(Math.max(0, section - 1))}
          style={styles.footerButton}
        />
        <PrimaryButton
          label={section === 2 ? 'Ver ejemplo' : 'Continuar'}
          onPress={section === 2 ? goToExample : () => setSection(Math.min(2, section + 1))}
          style={styles.footerButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressTrack: {
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressValue: { height: '100%' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingHorizontal: 8 },
  card: { borderWidth: 1, padding: 20, gap: 6 },
  code: { padding: 16, marginTop: 12 },
  list: { marginTop: 12, gap: 10 },
  synthesisRow: { flexDirection: 'row', gap: 10 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  footerButton: { flex: 1 },
});
