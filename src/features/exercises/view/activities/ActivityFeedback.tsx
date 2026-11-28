import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/shared/components/Icon';
import { AppText } from '@/shared/components/AppText';
import { useTheme } from '@/shared/theme/ThemeProvider';

interface ActivityFeedbackProps {
  correct: boolean;
  title: string;
  message?: string;
  detailLabel?: string;
  partial?: boolean;
  action?: ReactNode;
}

/** Shared result surface for interactive learning activities. */
export function ActivityFeedback({
  correct,
  title,
  message,
  detailLabel,
  partial = false,
  action,
}: ActivityFeedbackProps) {
  const { colors, radius } = useTheme();
  const color = correct ? colors.success : partial ? colors.warning : colors.danger;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${correct ? 'Correcto' : 'Por revisar'}: ${title}${message ? `. ${message}` : ''}`}
      style={[
        styles.feedback,
        { backgroundColor: colors.card, borderColor: color, borderRadius: radius.control },
      ]}>
      <View style={styles.feedbackRow}>
        <Icon name={correct ? 'check' : 'refresh'} size={16} color={color} strokeWidth={2.5} />
        <AppText color={color} weight="700">
          {title}
        </AppText>
      </View>
      {message ? (
        <View style={styles.detail}>
          {detailLabel ? <AppText weight="600">{detailLabel}</AppText> : null}
          <AppText variant="small">{message}</AppText>
        </View>
      ) : null}
      {action ? (
        <View style={[styles.action, { borderTopColor: colors.line }]}>{action}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detail: { gap: 4 },
  action: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 8 },
});
