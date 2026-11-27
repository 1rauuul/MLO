import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { useTheme } from '@/shared/theme/ThemeProvider';

interface ResultScoreCardProps {
  eyebrow: string;
  percent: number;
  detail: string;
}

function scoreColor(percent: number, success: string, warning: string, danger: string): string {
  if (percent >= 80) {
    return success;
  }
  return percent >= 60 ? warning : danger;
}

/** Common score treatment for practice and evaluation results. */
export function ResultScoreCard({ eyebrow, percent, detail }: ResultScoreCardProps) {
  const { colors, radius } = useTheme();
  const safePercent = Math.max(0, Math.min(100, percent));
  const color = scoreColor(safePercent, colors.success, colors.warning, colors.danger);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
      <AppText variant="eyebrow">{eyebrow}</AppText>
      <View style={styles.scoreRow}>
        <AppText variant="title" color={color}>
          {`${safePercent}%`}
        </AppText>
        <AppText variant="small" style={styles.detail}>
          {detail}
        </AppText>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`${eyebrow}: ${safePercent}%`}
        accessibilityValue={{ min: 0, max: 100, now: safePercent }}
        style={[styles.track, { backgroundColor: colors.soft }]}>
        <View style={[styles.value, { width: `${safePercent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 18, gap: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  detail: { flex: 1, paddingBottom: 4 },
  track: { height: 6, borderRadius: 999, overflow: 'hidden' },
  value: { height: '100%', borderRadius: 999 },
});
