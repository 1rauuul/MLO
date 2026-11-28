import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
  type ViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme/ThemeProvider';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

type RevealElement = (target: RefObject<ViewInstance | null>) => void;
const RevealElementContext = createContext<RevealElement>(() => {});

/** Reveal a continuation control inside its containing screen. */
export function useRevealElement(): RevealElement {
  return useContext(RevealElementContext);
}

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  keyboardAvoiding?: boolean;
  scrollRef?: RefObject<ScrollViewInstance | null>;
}

export function Screen({
  children,
  scroll = true,
  contentStyle,
  edges = ['top'],
  keyboardAvoiding = false,
  scrollRef,
}: ScreenProps) {
  const { colors, spacing } = useTheme();
  const reducedMotion = useReducedMotion();
  const internalRef = useRef<ScrollViewInstance>(null);
  const viewportRef = scrollRef ?? internalRef;
  const viewportHeight = useRef(0);
  const pendingTarget = useRef<RefObject<ViewInstance | null> | null>(null);
  const frame = useRef<number | null>(null);

  const scheduleReveal = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const target = pendingTarget.current?.current;
      const content = viewportRef.current?.getInnerViewRef();
      if (!target || !content) {
        pendingTarget.current = null;
        return;
      }
      target.measureLayout(content, (_x, y, _width, height) => {
        if (pendingTarget.current?.current !== target) return;
        // Align the action near the bottom, keeping the preceding feedback visible.
        const offset = viewportHeight.current > 0
          ? y + height - viewportHeight.current + spacing.xl
          : y - spacing.lg;
        viewportRef.current?.scrollTo({ y: Math.max(0, offset), animated: !reducedMotion });
        if (!Keyboard.isVisible()) pendingTarget.current = null;
      }, () => { pendingTarget.current = null; });
    });
  }, [viewportRef, reducedMotion, spacing.lg, spacing.xl]);

  const revealElement = useCallback<RevealElement>(target => {
    pendingTarget.current = target;
    Keyboard.dismiss();
    scheduleReveal();
  }, [scheduleReveal]);

  useEffect(() => {
    const keyboard = Keyboard.addListener('keyboardDidHide', () => {
      if (pendingTarget.current) scheduleReveal();
    });
    return () => {
      keyboard.remove();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      pendingTarget.current = null;
    };
  }, [scheduleReveal]);
  const padding: StyleProp<ViewStyle> = [
    { paddingHorizontal: 20, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
    contentStyle,
  ];

  const content = scroll ? (
    <ScrollView
      ref={viewportRef}
      onLayout={event => {
        viewportHeight.current = event.nativeEvent.layout.height;
        if (pendingTarget.current) scheduleReveal();
      }}
      onContentSizeChange={() => {
        if (pendingTarget.current) scheduleReveal();
      }}
      contentContainerStyle={padding}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding]}>{children}</View>
  );

  return (
    <RevealElementContext.Provider value={revealElement}>
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]} edges={edges}>
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {content}
          </KeyboardAvoidingView>
        ) : (
          content
        )}
      </SafeAreaView>
    </RevealElementContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
