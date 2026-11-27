import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { Icon } from '@/shared/components/Icon';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { shuffleItems, crosswordScore, type ExerciseScore } from '@/features/exercises/viewmodel/exercise.logic';
import type { CrosswordEngine } from '@/features/exercises/viewmodel/useExerciseEngine';
import { ActivityFeedback } from '@/features/exercises/view/activities/ActivityFeedback';

interface CrosswordExerciseProps {
  engine: CrosswordEngine;
  onSubmit: (answer: string, correct: boolean, score: ExerciseScore) => void;
  locked?: boolean;
  variant?: 'default' | 'example';
  hideCheck?: boolean;
}

const CELL = 24;

export function CrosswordExercise({
  engine,
  onSubmit,
  locked = false,
  variant = 'default',
  hideCheck = false,
}: CrosswordExerciseProps) {
  const { colors, radius, spacing, fonts } = useTheme();
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(false);
  const cellSize = zoom ? 44 : Math.max(20, Math.min(36, Math.floor((width - Math.max(0, engine.cols - 1) * 2) / Math.max(1, engine.cols)) || CELL));
  const example = variant === 'example';
  const cellMap = new Map(engine.cells.map(cell => [`${cell.row}-${cell.col}`, cell]));

  const labels = useMemo(() => {
    const result: string[] = [];
    let across = 0;
    let down = 0;
    for (const entry of engine.entries) {
      if (entry.direction === 'across') {
        across += 1;
        result.push(`H${across}`);
      } else {
        down += 1;
        result.push(`V${down}`);
      }
    }
    return result;
  }, [engine.entries]);

  const startLabels = useMemo(() => {
    const map = new Map<string, string[]>();
    engine.entries.forEach((entry, index) => {
      const key = `${entry.row}-${entry.col}`;
      const list = map.get(key) ?? [];
      list.push(labels[index]!);
      map.set(key, list);
    });
    return map;
  }, [engine.entries, labels]);

  const bank = useMemo(
    () => shuffleItems([...engine.entries.map(entry => entry.word), ...engine.bank], Math.random),
    [engine.entries, engine.bank],
  );

  const check = () => {
    const correct = engine.submit();
    onSubmit(JSON.stringify(engine.letters), correct, crosswordScore(engine.cells, engine.letters));
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

  const selectCellEntry = (row: number, col: number) => {
    const cell = cellMap.get(`${row}-${col}`);
    if (!cell) {
      return;
    }
    const startEntry = cell.entryIndexes.find(
      index =>
        engine.entries[index] !== undefined &&
        engine.entries[index]!.row === row &&
        engine.entries[index]!.col === col,
    );
    const pick = startEntry ?? cell.entryIndexes[0];
    if (pick !== undefined) {
      engine.selectEntry(pick);
    }
  };

  const fillFromBank = (word: string) => {
    if (engine.selectedEntry === null) {
      return;
    }
    const entry = engine.entries[engine.selectedEntry];
    if (entry && entry.word.length === word.length) {
      writeEntry(engine.selectedEntry, word);
    }
  };

  const selected = engine.selectedEntry;
  const activeEntry = selected !== null ? engine.entries[selected] : undefined;

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <AppText variant="small" color={colors.muted} style={styles.instruction}>
        Toca una celda y escribe la palabra que corresponde a la pista. Escribe sin tildes.
      </AppText>

      <SecondaryButton label={zoom ? 'Ajustar tablero' : 'Ampliar tablero'} onPress={() => setZoom(current => !current)} style={{ marginBottom: spacing.sm }} />
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.gridScroll}>
        <View style={styles.grid}>
          {Array.from({ length: engine.rows }).map((_, row) => (
            <View key={`row-${row}`} style={styles.gridRow}>
              {Array.from({ length: engine.cols }).map((_, col) => {
                const cell = cellMap.get(`${row}-${col}`);
                if (!cell) {
                  return <View key={`cell-${row}-${col}`} style={{ width: cellSize, height: cellSize }} />;
                }
                const active = selected !== null && cell.entryIndexes.includes(selected);
                const start = startLabels.get(`${row}-${col}`);
                const typed = (engine.letters[`${row}-${col}`] ?? '').toUpperCase();
                const cellCorrect = typed === cell.solution;
                return (
                  <Pressable
                    key={`cell-${row}-${col}`}
                    accessibilityRole="button"
                    accessibilityLabel={start ? `Inicio ${start.join(', ')}` : 'Celda'}
                    accessibilityState={{ disabled: locked }}
                    disabled={locked}
                    onPress={() => selectCellEntry(row, col)}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize },
                      {
                        borderColor: engine.checked
                          ? cellCorrect
                            ? colors.success
                            : colors.danger
                          : active
                            ? colors.primary
                            : colors.line,
                        backgroundColor: active && !engine.checked ? colors.soft : colors.card,
                      },
                    ]}>
                    {start ? (
                      <AppText variant="code" color={colors.muted} style={styles.cellLabel}>
                        {start.join('/')}
                      </AppText>
                    ) : null}
                    <AppText variant="small" weight="700" style={{ fontSize: zoom ? 20 : 14 }}>
                      {engine.letters[`${row}-${col}`] ?? ''}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {activeEntry ? (
        <View
          style={[
            styles.activeClue,
            { backgroundColor: colors.soft, borderRadius: radius.control, marginTop: spacing.md },
          ]}>
          <View style={[styles.labelBadge, { backgroundColor: colors.primaryStrong }]}>
            <AppText variant="small" color={colors.onPrimary} weight="700">
              {labels[selected!]}
            </AppText>
          </View>
          <AppText variant="small" weight="600" style={styles.flex}>
            {activeEntry.clue}
          </AppText>
        </View>
      ) : (
        <AppText variant="small" color={colors.muted} style={{ marginTop: spacing.md }}>
          Toca una celda o una pista para escribir.
        </AppText>
      )}

      <TextInput
        value={selected !== null ? entryValue(selected) : ''}
        editable={selected !== null && !locked}
        onChangeText={value => (selected !== null ? writeEntry(selected, value) : undefined)}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel={activeEntry ? `Respuesta de ${labels[selected!]}: ${activeEntry.clue}` : 'Respuesta del crucigrama'}
        placeholder={
          activeEntry
            ? `${activeEntry.word.length} letras · ${labels[selected!]}`
            : 'Toca una pista para escribir'
        }
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            borderColor: selected !== null ? colors.primary : colors.line,
            backgroundColor: colors.card,
            color: colors.text,
            fontFamily: fonts.mono,
            borderRadius: radius.control,
            marginTop: spacing.sm,
          },
        ]}
      />

      {example && bank.length > 0 ? (
        <View>
          <AppText variant="eyebrow" style={styles.bankLabel}>
            Palabras disponibles
          </AppText>
          <View style={[styles.bank, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
            {bank.map((word, index) => (
              <Pressable
                key={`${word}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`Usar ${word}`}
                accessibilityState={{ disabled: locked || !activeEntry }}
                disabled={locked || !activeEntry}
                hitSlop={8}
                onPress={() => fillFromBank(word)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.line,
                    borderRadius: radius.pill,
                    opacity: locked || !activeEntry ? 0.5 : 1,
                  },
                ]}>
                <AppText variant="small" weight="600">
                  {word}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={[styles.entries, { marginTop: spacing.md }]}>
        {engine.entries.map((entry, index) => {
          const activeItem = selected === index;
          const correct = entryValue(index).toUpperCase() === entry.word.toUpperCase();
          return (
            <Pressable
              key={`${entry.word}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`${labels[index]} ${entry.clue}`}
              accessibilityState={{ disabled: locked }}
              disabled={locked}
              onPress={() => engine.selectEntry(index)}
              style={[
                styles.clueRow,
                {
                  borderColor: activeItem ? colors.primary : colors.line,
                  backgroundColor: activeItem ? colors.soft : colors.card,
                  borderRadius: radius.control,
                },
              ]}>
              <View style={[styles.labelBadge, { backgroundColor: activeItem ? colors.primary : colors.soft }]}>
                <AppText
                  variant="small"
                  color={activeItem ? colors.onPrimary : colors.muted}
                  weight="700">
                  {labels[index]}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="small">{entry.clue}</AppText>
                <AppText variant="small" color={colors.muted}>
                  {`${entry.word.length} letras · ${entryValue(index) || '—'}`}
                </AppText>
              </View>
              {engine.checked ? (
                <Icon
                  name={correct ? 'check' : 'close'}
                  size={16}
                  color={correct ? colors.success : colors.danger}
                  strokeWidth={2.5}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {hideCheck ? null : (
        <PrimaryButton
          label="Comprobar crucigrama"
          onPress={check}
          disabled={locked}
          style={{ marginTop: spacing.lg }}
        />
      )}

      {example && engine.checked ? (
        <ActivityFeedback
          correct={engine.isCorrect}
          title={engine.isCorrect ? 'Crucigrama correcto' : 'Hay palabras incorrectas'}
          message={
            engine.isCorrect
              ? 'Las palabras coinciden con sus pistas.'
              : 'Revisa las celdas marcadas y vuelve a comprobar.'
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  instruction: { lineHeight: 18, marginBottom: 12 },
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
  cellLabel: { position: 'absolute', top: 0, left: 1, fontSize: 6, lineHeight: 7 },
  blank: { width: CELL, height: CELL },
  activeClue: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  input: { borderWidth: 2, paddingHorizontal: 12, paddingVertical: 10, letterSpacing: 3, fontWeight: '700' },
  entries: { gap: 8 },
  clueRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
  },
  labelBadge: { minWidth: 30, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, alignItems: 'center' },
  bankLabel: { marginTop: 12 },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, marginTop: 12 },
  chip: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
});
