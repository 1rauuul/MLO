import { Pressable, StyleSheet, View } from 'react-native';

import type { Unit } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';
import { MetadataBadge } from './MetadataBadge';
import { ProgressRing } from './ProgressRing';

interface UnitCardProps {
  unit: Unit;
  subtopicCount: number;
  progress: number;
  expanded: boolean;
  onOpen: () => void;
  onToggleExpand: () => void;
}

export function UnitCard({
  unit,
  subtopicCount,
  progress,
  expanded,
  onOpen,
  onToggleExpand,
}: UnitCardProps) {
  const { colors, radius, spacing } = useTheme();
  const accent =
    unit.color === 'violet' ? '#8B7CFE' : unit.color === 'green' ? colors.success : colors.primary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir unidad ${unit.number}, ${unit.title}`}
        onPress={onOpen}
        style={styles.main}>
        <View style={[styles.icon, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
          <AppText variant="code" color={accent} weight="700">
            {String(unit.number).padStart(2, '0')}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="eyebrow">Unidad {unit.number}</AppText>
          <AppText variant="heading">{unit.title}</AppText>
          <AppText variant="small" color={colors.muted}>
            {unit.description}
          </AppText>
          <View style={styles.badges}>
            <MetadataBadge>{unit.difficulty}</MetadataBadge>
            <MetadataBadge>{unit.duration}</MetadataBadge>
          </View>
        </View>
        <ProgressRing value={progress} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} temas de ${unit.title}`}
        onPress={onToggleExpand}
        style={[styles.expand, { borderTopColor: colors.line }]}>
        <AppText variant="small" color={colors.text} weight="600">
          {expanded ? 'Ocultar temas' : 'Ver temas'}
        </AppText>
        <AppText variant="small" color={colors.text}>
          {expanded ? '↑' : '↓'}
        </AppText>
      </Pressable>

      {expanded && (
        <View
          style={[
            styles.detail,
            { borderTopColor: colors.line, paddingHorizontal: spacing.lg },
          ]}>
          <AppText variant="small">
            {`Objeto de aprendizaje · ${subtopicCount} subtemas`}
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Explorar subtemas" onPress={onOpen}>
            <AppText color={colors.primary} weight="600">
              Explorar subtemas →
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  main: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  icon: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  expand: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  detail: {
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: 1,
  },
});
