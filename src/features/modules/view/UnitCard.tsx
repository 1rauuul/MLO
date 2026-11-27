import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Unit } from '@/shared/model/entities';
import { accentForUnit, accentInk } from '@/shared/theme/tokens';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { Icon } from '@/shared/components/Icon';
import { ProgressRing } from '@/features/modules/view/ProgressRing';

interface UnitCardProps {
  unit: Unit;
  subtopicCount: number;
  completedSubtopics?: number;
  progress: number;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

export function UnitCard({
  unit,
  subtopicCount,
  completedSubtopics = 0,
  progress,
  expanded,
  onToggle,
  children,
}: UnitCardProps) {
  const { colors, radius } = useTheme();
  const accent = accentForUnit(unit.color);
  const completed = progress === 100;
  const status = completed ? 'Completada' : progress > 0 ? 'En progreso' : 'Sin comenzar';
  const statusColor = completed ? colors.success : progress > 0 ? colors.primary : colors.muted;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} subtemas de la unidad ${unit.number}, ${unit.title}`}
        onPress={onToggle}
        style={styles.main}>
        <View style={[styles.icon, { backgroundColor: accent, borderRadius: radius.control }]}>
          <AppText color={accentInk} weight="700">
            {String(unit.number).padStart(2, '0')}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="small" weight="600" color={colors.muted}>
            {`Unidad ${unit.number}`}
          </AppText>
          <AppText variant="heading">{unit.title}</AppText>
          <AppText variant="small" color={colors.muted}>
            {unit.description}
          </AppText>
          <View style={styles.meta}>
            <AppText variant="small">
              {`${subtopicCount} ${subtopicCount === 1 ? 'subtema' : 'subtemas'}`}
            </AppText>
            <View style={styles.status}>
              {completed ? (
                <Icon name="check" size={14} color={statusColor} strokeWidth={2.5} />
              ) : null}
              <AppText variant="small" weight="600" color={statusColor}>
                {status}
              </AppText>
            </View>
          </View>
        </View>
        <ProgressRing value={progress} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} subtemas de ${unit.title}`}
        onPress={onToggle}
        style={[styles.expand, { borderTopColor: colors.line }]}>
        <AppText variant="small" color={colors.text} weight="600">
          {expanded ? 'Ocultar subtemas' : 'Ver subtemas'}
        </AppText>
        <Chevron
          direction={expanded ? 'up' : 'down'}
          size={16}
          color={colors.muted}
          strokeWidth={2.2}
        />
      </Pressable>

      {expanded && children ? (
        <View style={[styles.content, { borderTopColor: colors.line }]}>
          <View style={styles.contentHeader}>
            <AppText weight="600">Subtemas</AppText>
            <AppText variant="small">{`${completedSubtopics} de ${subtopicCount} completados`}</AppText>
          </View>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  main: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  icon: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expand: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  content: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 14,
    gap: 10,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
