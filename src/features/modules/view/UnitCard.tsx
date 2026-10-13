import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Unit } from '@/shared/model/entities';
import { accentForUnit } from '@/shared/theme/tokens';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { MetadataBadge } from '@/shared/components/MetadataBadge';
import { ProgressRing } from '@/features/modules/view/ProgressRing';

interface UnitCardProps {
  unit: Unit;
  subtopicCount: number;
  progress: number;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

export function UnitCard({
  unit,
  subtopicCount,
  progress,
  expanded,
  onToggle,
  children,
}: UnitCardProps) {
  const { colors, radius } = useTheme();
  const accent = accentForUnit(unit.color);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} temas de la unidad ${unit.number}, ${unit.title}`}
        onPress={onToggle}
        style={styles.main}>
        <View style={[styles.icon, { backgroundColor: accent, borderRadius: radius.control }]}>
          <AppText variant="code" color={colors.onPrimary} weight="700">
            {String(unit.number).padStart(2, '0')}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="eyebrow">{`Unidad ${unit.number}`}</AppText>
          <AppText variant="heading">{unit.title}</AppText>
          <AppText variant="small" color={colors.muted}>
            {unit.description}
          </AppText>
          <View style={styles.badges}>
            <MetadataBadge>{unit.difficulty}</MetadataBadge>
            <MetadataBadge>{`${subtopicCount} subtemas`}</MetadataBadge>
          </View>
        </View>
        <ProgressRing value={progress} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} temas de ${unit.title}`}
        onPress={onToggle}
        style={[styles.expand, { borderTopColor: colors.line }]}>
        <AppText variant="small" color={colors.text} weight="600">
          {expanded ? 'Ocultar temas' : 'Ver temas'}
        </AppText>
        <Chevron
          direction={expanded ? 'up' : 'down'}
          size={16}
          color={colors.muted}
          strokeWidth={2.2}
        />
      </Pressable>

      {expanded && children ? (
        <View style={[styles.content, { borderTopColor: colors.line }]}>{children}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  main: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  icon: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  expand: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  content: { borderTopWidth: 1, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 14 },
});
