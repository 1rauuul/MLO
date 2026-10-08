import type { ReactNode } from 'react';
import { useCallback, useRef } from 'react';
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

import { accentForText } from './accents';

const ROW_GAP = 10;
const FALLBACK_HEIGHT = 64;

interface DraggableRowProps {
  index: number;
  accent: string;
  onDrop: (index: number, translationY: number) => void;
  onMeasure: (step: string, height: number) => void;
  step: string;
  children: ReactNode;
}

function DraggableRow({ index, accent, onDrop, onMeasure, step, children }: DraggableRowProps) {
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
      runOnJS(onDrop)(index, event.translationY);
    })
    .onFinalize(() => {
      translateY.value = withSpring(0, { damping: 34, stiffness: 320, mass: 0.9 });
      active.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: active.value ? 1.02 : 1 }],
    zIndex: active.value ? 10 : 0,
    elevation: active.value ? 6 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={event => onMeasure(step, event.nativeEvent.layout.height)}
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
  locked?: boolean;
}

export function OrderExercise({ engine, onSubmit, locked = false }: OrderExerciseProps) {
  const { colors, radius, spacing } = useTheme();
  const heights = useRef<Record<string, number>>({});

  const measure = useCallback((step: string, height: number) => {
    heights.current[step] = height;
  }, []);

  const handleDrop = useCallback(
    (index: number, translationY: number) => {
      if (locked) {
        return;
      }
      const steps = engine.steps;
      let top = 0;
      const centers = steps.map(step => {
        const rowHeight = heights.current[step] ?? FALLBACK_HEIGHT;
        const center = top + rowHeight / 2;
        top += rowHeight + ROW_GAP;
        return center;
      });
      const draggedCenter = (centers[index] ?? 0) + translationY;
      let target = index;
      let best = Number.POSITIVE_INFINITY;
      centers.forEach((center, candidate) => {
        const distance = Math.abs(center - draggedCenter);
        if (distance < best) {
          best = distance;
          target = candidate;
        }
      });
      if (target !== index) {
        engine.moveTo(index, target);
      }
    },
    [engine, locked],
  );

  const check = () => {
    const correct = engine.submit();
    onSubmit(JSON.stringify(engine.steps), correct);
  };

  return (
    <View>
      <View>
        {engine.steps.map((step, index) => {
          const accent = accentForText(step);
          return (
            <DraggableRow
              key={step}
              index={index}
              step={step}
              accent={accent}
              onDrop={handleDrop}
              onMeasure={measure}>
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
                  disabled={locked}
                  style={{ opacity: index === 0 ? 0.4 : 1 }}
                />
                <IconButton
                  glyph="↓"
                  accessibilityLabel={`Bajar ${step}`}
                  onPress={() => engine.move(index, 1)}
                  disabled={locked}
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

      <PrimaryButton
        label="Comprobar"
        onPress={check}
        disabled={locked}
        style={{ marginTop: spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dragRow: {
    minHeight: 56,
    marginBottom: ROW_GAP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
  },
  badge: {
    minWidth: 38,
    height: 34,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: { fontSize: 18 },
  controls: { flexDirection: 'row', gap: 6 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
