import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton } from '@/shared/components/Buttons';
import { Icon } from '@/shared/components/Icon';
import { useTheme } from '@/shared/theme/ThemeProvider';

interface CourseInfoCardProps {
  title: string;
  description?: string;
  level?: string;
  accent: string;
  unitCount: number;
  subtopicCount: number;
  progress: number;
  actionLabel: string;
  actionDisabled?: boolean;
  onAction: () => void;
}

export function CourseInfoCard({
  title,
  description,
  level,
  accent,
  unitCount,
  subtopicCount,
  progress,
  actionLabel,
  actionDisabled,
  onAction,
}: CourseInfoCardProps) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
      ]}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.icon,
            { backgroundColor: `${accent}1C`, borderRadius: radius.control },
          ]}>
          <Icon name="database" size={22} color={accent} />
        </View>
        {level ? (
          <View
            style={[
              styles.levelPill,
              { backgroundColor: `${accent}1C`, borderRadius: radius.pill },
            ]}>
            <AppText variant="small" weight="600" color={accent}>
              {`Nivel ${level}`}
            </AppText>
          </View>
        ) : null}
      </View>

      <AppText variant="heading">{title}</AppText>
      {description ? (
        <AppText variant="small" numberOfLines={3}>
          {description}
        </AppText>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Icon name="module" size={16} color={colors.muted} />
          <AppText variant="small">
            {`${unitCount} ${unitCount === 1 ? 'unidad' : 'unidades'}`}
          </AppText>
        </View>
        <View style={styles.metaItem}>
          <Icon name="book" size={16} color={colors.muted} />
          <AppText variant="small">
            {`${subtopicCount} ${subtopicCount === 1 ? 'subtema' : 'subtemas'}`}
          </AppText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.line }]} />

      <View style={styles.progressHeader}>
        <AppText variant="small">Progreso del curso</AppText>
        <AppText variant="small" weight="700" color={accent}>
          {`${clamped}%`}
        </AppText>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`${clamped}% del curso`}
        accessibilityValue={{ min: 0, max: 100, now: clamped }}
        style={[styles.track, { backgroundColor: colors.soft, borderRadius: radius.pill }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: accent,
              borderRadius: radius.pill,
            },
          ]}
        />
      </View>

      <PrimaryButton
        label={actionLabel}
        onPress={onAction}
        disabled={actionDisabled}
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 18, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  levelPill: { paddingHorizontal: 10, paddingVertical: 5 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: 1, marginVertical: 10 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 6, overflow: 'hidden' },
  fill: { height: '100%' },
  action: { marginTop: 10 },
});
