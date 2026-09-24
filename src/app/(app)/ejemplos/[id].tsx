import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/theme/theme-provider';
import { useExample } from '@/viewmodels/useExample';
import { useLearnerProfile } from '@/viewmodels/useLearnerProfile';

export default function ExampleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { example, isLoading } = useExample(id ?? null);
  const { style } = useLearnerProfile();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();

  if (!isLoading && !example) {
    return (
      <Screen>
        <EmptyState title="Sin ejemplo" message="No se encontró el ejemplo solicitado." />
      </Screen>
    );
  }

  if (!example) {
    return (
      <Screen>
        <EmptyState title="Cargando" message="Preparando el ejemplo." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader onBack={() => router.back()} eyebrow="Práctica guiada" title="Ejemplo resuelto" trailing="1/1" />

      <View style={styles.intro}>
        <AppText variant="eyebrow">{`${style.toUpperCase()} · APLICACIÓN`}</AppText>
        <AppText variant="title">{example.title}</AppText>
        <AppText style={{ marginTop: spacing.sm }}>{example.scenario}</AppText>
      </View>

      <View style={styles.flow}>
        <View
          style={[styles.node, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
          <AppText variant="eyebrow">Antes</AppText>
          <AppText weight="600">{example.before}</AppText>
          <AppText variant="small">Los cambios y fallos no quedan trazados.</AppText>
        </View>
        <AppText color={colors.muted} center>
          ↓
        </AppText>
        <View
          style={[styles.node, { backgroundColor: colors.card, borderColor: colors.success, borderRadius: radius.card }]}>
          <AppText variant="eyebrow">Después</AppText>
          <AppText weight="600">{example.after}</AppText>
          <AppText variant="small">El proceso hace visible qué se decidió y cómo se validó.</AppText>
        </View>
      </View>

      <PrimaryButton
        label="Volver al tema"
        onPress={() => router.back()}
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 4, marginBottom: 20 },
  flow: { gap: 12 },
  node: { borderWidth: 1, padding: 18, gap: 6 },
});
