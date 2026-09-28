import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { IconButton, PrimaryButton } from '@/components/Buttons';
import { useTheme } from '@/theme/theme-provider';
import type { ExerciseEngine } from '@/viewmodels/useExerciseEngine';

const ROW_HEIGHT = 58;
const ROW_GAP = 10;
const STEP = ROW_HEIGHT + ROW_GAP;
const ACCENTS = ['#4D7CFE', '#45D39A', '#F3BC61', '#EE6F7D', '#8B7CFE', '#4DD0E1'];

function accentFor(text: string): string {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash + text.charCodeAt(index)) % 997;
  }
  return ACCENTS[hash % ACCENTS.length]!;
}

interface DraggableRowProps {
  index: number;
  count: number;
  accent: string;
  onMoveTo: (from: number, to: number) => void;
  children: ReactNode;
}

function DraggableRow({ index, count, accent, onMoveTo, children }: DraggableRowProps) {
  const { colors, radius } = useTheme();
  const translateY = useSharedValue(0);
  const active = useSharedValue(0);

  const pan = Gesture.Pan()
    .activateAfterLongPress(180)
    .onBegin(() => {
      active.value = 1;
    })
    .onUpdate(event => {
      translateY.value = event.translationY;
    })
    .onEnd(event => {
      const target = Math.max(
        0,
        Math.min(count - 1, Math.round((index * STEP + event.translationY) / STEP)),
      );
      if (target !== index) {
        runOnJS(onMoveTo)(index, target);
      }
    })
    .onFinalize(() => {
      translateY.value = withSpring(0, { damping: 20, stiffness: 250 });
      active.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: active.value ? 1.03 : 1 }],
    zIndex: active.value ? 10 : 0,
    elevation: active.value ? 6 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.dragRow,
          { backgroundColor: colors.card, borderColor: accent, borderRadius: radius.control },
          animatedStyle,
        ]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

interface OrderExerciseProps {
  engine: ExerciseEngine;
  onSubmit: (answer: string, correct: boolean) => void;
}

export function OrderExercise({ engine, onSubmit }: OrderExerciseProps) {
  const { colors, radius, spacing } = useTheme();

  const check = () => {
    const correct = engine.submit();
    onSubmit(JSON.stringify(engine.steps), correct);
  };

  return (
    <View>
      <View>
        {engine.steps.map((step, index) => {
          const accent = accentFor(step);
          return (
            <DraggableRow
              key={step}
              index={index}
              count={engine.steps.length}
              accent={accent}
              onMoveTo={engine.moveTo}>
              <View style={[styles.badge, { backgroundColor: `${accent}22` }]}>
                <AppText variant="code" color={accent} weight="700">
                  {String(index + 1).padStart(2, '0')}
                </AppText>
              </View>
              <AppText style={styles.flex} weight="600">
                {step}
              </AppText>
              <AppText color={colors.muted} style={styles.handle}>
                ≡
              </AppText>
              <View style={styles.controls}>
                <IconButton
                  glyph="↑"
                  accessibilityLabel={`Subir ${step}`}
                  onPress={() => engine.move(index, -1)}
                  style={{ opacity: index === 0 ? 0.4 : 1 }}
                />
                <IconButton
                  glyph="↓"
                  accessibilityLabel={`Bajar ${step}`}
                  onPress={() => engine.move(index, 1)}
                  style={{ opacity: index === engine.steps.length - 1 ? 0.4 : 1 }}
                />
              </View>
            </DraggableRow>
          );
        })}
      </View>

      <AppText variant="small" color={colors.muted} style={{ marginTop: spacing.sm }}>
        Mantén presionada una opción para arrastrarla, o usa las flechas.
      </AppText>

      <PrimaryButton label="Comprobar orden" onPress={check} style={{ marginTop: spacing.lg }} />

      {engine.checked ? (
        <View
          style={[
            styles.feedback,
            {
              borderColor: engine.isCorrect ? colors.success : colors.danger,
              backgroundColor: colors.card,
              borderRadius: radius.control,
            },
          ]}>
          <AppText color={engine.isCorrect ? colors.success : colors.danger} weight="700">
            {engine.isCorrect ? '✓ Secuencia correcta' : '↻ El orden no es el correcto'}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dragRow: {
    height: ROW_HEIGHT,
    marginBottom: ROW_GAP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
  },
  badge: {
    width: 38,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: { fontSize: 18 },
  controls: { flexDirection: 'row', gap: 6 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
