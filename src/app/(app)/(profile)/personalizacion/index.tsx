import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { LearningStyle } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { CHA_ITEMS, isChaComplete, resolveChaStyle, type ChaAnswers } from '@/viewmodels/chaLogic';
import { useLearnerProfile } from '@/viewmodels/useLearnerProfile';

export default function PersonalizationScreen() {
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const { saveQuestionnaire } = useLearnerProfile();
  const [answers, setAnswers] = useState<ChaAnswers>(() => CHA_ITEMS.map(() => null));
  const [resultStyle, setResultStyle] = useState<LearningStyle | null>(null);

  const complete = isChaComplete(answers);

  const setAnswer = (index: number, value: boolean) => {
    setAnswers(previous => previous.map((answer, position) => (position === index ? value : answer)));
  };

  const submit = () => {
    const style = resolveChaStyle(answers);
    if (!style) {
      return;
    }
    saveQuestionnaire(style);
    setResultStyle(style);
  };

  if (resultStyle) {
    return (
      <Screen>
        <ScreenHeader onBack={() => router.back()} eyebrow="Personalización" title="Tu estilo" />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
          ]}>
          <AppText variant="eyebrow">Estilo predominante</AppText>
          <AppText variant="title">{resultStyle}</AppText>
          <AppText variant="small">
            {`Ajustaremos los ejemplos y recomendaciones hacia un enfoque ${resultStyle.toLowerCase()}.`}
          </AppText>
        </View>
        <PrimaryButton
          label="Volver al perfil"
          onPress={() => router.back()}
          style={{ marginTop: spacing.lg }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow="Personalización"
        title="Cuestionario CHAEA"
      />
      <AppText variant="small" style={styles.intro}>
        Marca “De acuerdo” en los enunciados con los que te identifiques. Al terminar guardaremos tu
        estilo predominante.
      </AppText>

      <View style={styles.list}>
        {CHA_ITEMS.map((item, index) => {
          const answer = answers[index];
          return (
            <View
              key={item.id}
              style={[
                styles.item,
                { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
              ]}>
              <AppText weight="600">{item.statement}</AppText>
              <View style={styles.options}>
                {[
                  { value: true, label: 'De acuerdo' },
                  { value: false, label: 'En desacuerdo' },
                ].map(option => {
                  const active = answer === option.value;
                  return (
                    <Pressable
                      key={option.label}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${option.label}: ${item.statement}`}
                      onPress={() => setAnswer(index, option.value)}
                      style={[
                        styles.option,
                        {
                          backgroundColor: active ? colors.primary : colors.soft,
                          borderColor: active ? colors.primary : colors.line,
                          borderRadius: radius.pill,
                        },
                      ]}>
                      <AppText
                        variant="small"
                        weight="600"
                        color={active ? colors.onPrimary : colors.text}>
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      <AppText variant="small" color={colors.muted} style={{ marginTop: spacing.md }}>
        {`${answers.filter(answer => answer !== null).length} de ${CHA_ITEMS.length} respondidos`}
      </AppText>

      <PrimaryButton
        label="Ver mi estilo"
        onPress={submit}
        disabled={!complete}
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 12 },
  list: { gap: 12 },
  item: { borderWidth: 1, padding: 14, gap: 10 },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  card: { borderWidth: 1, padding: 20, gap: 6 },
});
