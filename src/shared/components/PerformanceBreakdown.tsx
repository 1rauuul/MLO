import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { useTheme } from '@/shared/theme/ThemeProvider';

export interface PerformanceRow {
  key: string;
  label: string;
  percent: number;
  detail: string;
}

interface PerformanceBreakdownProps {
  rows: PerformanceRow[];
  correct?: number;
  incorrect?: number;
}

/** Diagnóstico compartido por evaluación y práctica: aciertos y desempeño por tipo. */
export function PerformanceBreakdown({ rows, correct, incorrect }: PerformanceBreakdownProps) {
  const { colors, radius } = useTheme();
  const split = correct !== undefined && incorrect !== undefined;

  if (!split && rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.root}>
      {split ? (
        <View style={styles.split}>
          <View style={[styles.count, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
            <AppText variant="title" color={colors.success} center>
              {correct}
            </AppText>
            <AppText variant="small" center>
              Correctos
            </AppText>
          </View>
          <View style={[styles.count, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
            <AppText variant="title" color={colors.danger} center>
              {incorrect}
            </AppText>
            <AppText variant="small" center>
              Incorrectos
            </AppText>
          </View>
        </View>
      ) : null}

      {rows.length > 0 ? (
        <>
          <AppText variant="heading" style={styles.heading}>
            Desempeño por tipo
          </AppText>
          <View style={styles.list}>
            {rows.map(row => {
              const percent = Math.max(0, Math.min(100, Math.round(row.percent)));
              const color = percent >= 100 ? colors.success : percent === 0 ? colors.danger : colors.warning;
              return (
                <View key={row.key} style={styles.row}>
                  <View style={styles.rowHeader}>
                    <AppText weight="600" style={styles.flex}>
                      {row.label}
                    </AppText>
                    <AppText color={color} weight="700">
                      {`${percent}%`}
                    </AppText>
                  </View>
                  <View
                    accessibilityRole="progressbar"
                    accessibilityLabel={`${row.label}: ${percent}%`}
                    accessibilityValue={{ min: 0, max: 100, now: percent }}
                    style={[styles.track, { backgroundColor: colors.soft }]}>
                    <View style={[styles.value, { width: `${percent}%`, backgroundColor: color }]} />
                  </View>
                  <AppText variant="small">{row.detail}</AppText>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14, marginTop: 16 },
  split: { flexDirection: 'row', gap: 12 },
  count: { flex: 1, borderWidth: 1, padding: 14, gap: 2 },
  heading: { marginTop: 4 },
  list: { gap: 14 },
  row: { gap: 6 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1, minWidth: 0 },
  track: { height: 6, borderRadius: 999, overflow: 'hidden' },
  value: { height: '100%', borderRadius: 999 },
});
