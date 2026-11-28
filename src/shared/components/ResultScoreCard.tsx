import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { ProgressRing } from '@/shared/components/ProgressRing';
import { useTheme } from '@/shared/theme/ThemeProvider';

interface ResultScoreCardProps {
  eyebrow: string;
  percent: number;
  detail: string;
  title?: string;
}

function scoreColor(percent: number, success: string, warning: string, danger: string): string {
  if (percent >= 80) {
    return success;
  }
  return percent >= 60 ? warning : danger;
}

/** Common score treatment for practice and evaluation results. */
export function ResultScoreCard({ eyebrow, percent, detail, title }: ResultScoreCardProps) {
  const { colors, radius } = useTheme();
  const safePercent = Math.max(0, Math.min(100, percent));
  const color = scoreColor(safePercent, colors.success, colors.warning, colors.danger);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
      <AppText variant="eyebrow">{eyebrow}</AppText>
      <View style={styles.ring}>
        <ProgressRing value={safePercent} size={148} color={color} label={`${safePercent}%`} />
      </View>
      {title ? (
        <AppText variant="heading" center>
          {title}
        </AppText>
      ) : null}
      <AppText variant="small" center style={styles.detail}>
        {detail}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 18, gap: 8, alignItems: 'center' },
  ring: { marginVertical: 6 },
  detail: { maxWidth: 260 },
});
