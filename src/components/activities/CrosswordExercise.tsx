import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { useTheme } from '@/theme/theme-provider';
import type { CrosswordEngine } from '@/viewmodels/useExerciseEngine';

interface CrosswordExerciseProps {
  engine: CrosswordEngine;
  onSubmit: (answer: string, correct: boolean) => void;
}

const CELL = 22;

export function CrosswordExercise({ engine, onSubmit }: CrosswordExerciseProps) {
  const { colors, radius, spacing } = useTheme();
  const cellMap = new Map(engine.cells.map(cell => [`${cell.row}-${cell.col}`, cell]));

  const check = () => {
    const correct = engine.submit();
    onSubmit(JSON.stringify(engine.letters), correct);
  };

  const entryValue = (index: number): string => {
    const entry = engine.entries[index];
    if (!entry) {
      return '';
    }
    const stepRow = entry.direction === 'down' ? 1 : 0;
    const stepCol = entry.direction === 'across' ? 1 : 0;
    return entry.word
      .split('')
      .map((_, offset) => engine.letters[`${entry.row + stepRow * offset}-${entry.col + stepCol * offset}`] ?? '')
      .join('');
  };

  const writeEntry = (index: number, value: string) => {
    const entry = engine.entries[index];
    if (!entry) {
      return;
    }
    const stepRow = entry.direction === 'down' ? 1 : 0;
    const stepCol = entry.direction === 'across' ? 1 : 0;
    const chars = value.toUpperCase().replace(/[^A-ZÑ]/g, '');
    for (let offset = 0; offset < entry.word.length; offset += 1) {
      const char = chars[offset] ?? '';
      const row = entry.row + stepRow * offset;
      const col = entry.col + stepCol * offset;
      if ((engine.letters[`${row}-${col}`] ?? '') !== char) {
        engine.setLetter(row, col, char);
      }
    }
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
        <View style={styles.grid}>
        {Array.from({ length: engine.rows }).map((_, row) => (
          <View key={`row-${row}`} style={styles.gridRow}>
            {Array.from({ length: engine.cols }).map((_, col) => {
              const cell = cellMap.get(`${row}-${col}`);
              const active = cell?.entryIndexes.includes(engine.selectedEntry ?? -1) ?? false;
              return cell ? (
                <View
                  key={`cell-${row}-${col}`}
                  style={[
                    styles.cell,
                    {
                      borderColor: colors.line,
                      backgroundColor: active ? colors.soft : colors.card,
                    },
                  ]}>
                  <AppText variant="small" weight="700">
                    {engine.letters[`${row}-${col}`] ?? ''}
                  </AppText>
                </View>
              ) : (
                <View key={`cell-${row}-${col}`} style={styles.blank} />
              );
            })}
          </View>
        ))}
        </View>
      </ScrollView>

      <View style={[styles.entries, { marginTop: spacing.lg }]}>
        {engine.entries.map((entry, index) => (
          <View key={`${entry.word}-${index}`} style={styles.entry}>
            <AppText variant="small" color={colors.muted} style={styles.clue}>
              {`${entry.direction === 'across' ? 'Horizontal' : 'Vertical'} · ${entry.clue}`}
            </AppText>
            <TextInput
              value={entryValue(index)}
              onFocus={() => engine.selectEntry(index)}
              onChangeText={value => writeEntry(index, value)}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={entry.word.length}
              placeholder={String(entry.word.length)}
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { borderColor: colors.line, backgroundColor: colors.card, color: colors.text, borderRadius: radius.control },
              ]}
            />
          </View>
        ))}
      </View>

      <PrimaryButton label="Comprobar crucigrama" onPress={check} style={{ marginTop: spacing.lg }} />

      {engine.checked ? (
        <View
          style={[
            styles.feedback,
            { borderColor: engine.isCorrect ? colors.success : colors.danger, backgroundColor: colors.card, borderRadius: radius.control },
          ]}>
          <AppText color={engine.isCorrect ? colors.success : colors.danger} weight="700">
            {engine.isCorrect ? '✓ Crucigrama correcto' : '↻ Hay palabras incorrectas'}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gridScroll: { paddingVertical: 2 },
  grid: { gap: 2 },
  gridRow: { flexDirection: 'row', gap: 2 },
  cell: {
    width: CELL,
    height: CELL,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blank: { width: CELL, height: CELL },
  entries: { gap: 10 },
  entry: { gap: 4 },
  clue: { lineHeight: 16 },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, letterSpacing: 2, fontWeight: '700' },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
