import type { ReactNode, RefObject } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme/ThemeProvider';

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
  const padding: StyleProp<ViewStyle> = [
    { paddingHorizontal: 20, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
    contentStyle,
  ];

  const content = scroll ? (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={padding}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding]}>{children}</View>
      );

  return (
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
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
