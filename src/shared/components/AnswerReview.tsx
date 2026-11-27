import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { Icon } from '@/shared/components/Icon';
import { useTheme } from '@/shared/theme/ThemeProvider';

export interface ReviewItem {
  questionId: string;
  prompt: string;
  correct: boolean;
  response: string;
  solution: string;
  explanation: string;
}

export function AnswerReview({ items }: { items: ReviewItem[] }) {
  const { colors, radius } = useTheme();
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = items.filter(item => filter === 'all' || item.correct === (filter === 'correct'));
  return (
    <View style={styles.root}>
      <AppText variant="heading">Revisión de respuestas</AppText>
      <View accessibilityRole="tablist" style={styles.filters}>
        {(['all', 'correct', 'incorrect'] as const).map((value, index) => (
          <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: filter === value }}
            onPress={() => setFilter(value)} style={[styles.filter, { backgroundColor: filter === value ? colors.soft : 'transparent', borderColor: colors.line, borderRadius: radius.control }]}>
            <AppText variant="small" weight="600" color={filter === value ? colors.primary : colors.text}>
              {['Todas', 'Correctas', 'Incorrectas'][index]}
            </AppText>
          </Pressable>
        ))}
      </View>
      {visible.length === 0 ? <AppText variant="small">No hay respuestas en este filtro.</AppText> : null}
      {visible.map(item => {
        const open = expanded === item.questionId;
        const index = items.indexOf(item);
        return (
          <View key={item.questionId} style={[styles.item, { borderColor: colors.line, borderRadius: radius.card }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Reactivo ${index + 1}: ${item.prompt}`}
              accessibilityState={{ expanded: open }} onPress={() => setExpanded(open ? null : item.questionId)} style={styles.toggle}>
              <Icon name={item.correct ? 'check' : 'close'} size={20} color={item.correct ? colors.success : colors.danger} />
              <View style={styles.copy}>
                <AppText weight="600">{item.prompt}</AppText>
                <AppText variant="small">{`Reactivo ${index + 1} · ${item.correct ? 'Correcto' : 'Por revisar'}`}</AppText>
              </View>
              <Chevron direction={open ? 'up' : 'down'} size={18} color={colors.muted} />
            </Pressable>
            {open ? (
              <View style={styles.detail}>
                <AppText weight="600">Tu respuesta</AppText>
                <AppText>{item.response}</AppText>
                <AppText weight="600" color={colors.success}>Respuesta correcta</AppText>
                <AppText>{item.solution}</AppText>
                {item.explanation ? <AppText variant="small">{item.explanation}</AppText> : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, marginTop: 24 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1 },
  item: { borderWidth: 1, overflow: 'hidden' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 64 },
  copy: { flex: 1, minWidth: 0 },
  detail: { padding: 16, paddingTop: 0, gap: 10 },
});
