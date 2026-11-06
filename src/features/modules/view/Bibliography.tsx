import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { BibliographyReference } from '@/features/modules/model/bibliography.logic';
import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { useTheme } from '@/shared/theme/ThemeProvider';

interface BibliographyProps {
  references: BibliographyReference[];
}

/** Desplegable único del curso; las actividades no repiten la bibliografía. */
export function Bibliography({ references }: BibliographyProps) {
  const { colors, radius } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} referencias bibliográficas`}
        onPress={() => setExpanded(value => !value)}
        style={styles.header}>
        <View style={styles.copy}>
          <AppText variant="eyebrow">Bibliografía del curso</AppText>
          <AppText variant="heading">Referencias bibliográficas</AppText>
          <AppText variant="small" color={colors.muted}>
            {references.length === 0
              ? 'Sin referencias'
              : references.length === 1
                ? '1 referencia en APA 7'
                : `${references.length} referencias en APA 7`}
          </AppText>
        </View>
        <Chevron
          direction={expanded ? 'up' : 'down'}
          size={16}
          color={colors.muted}
          strokeWidth={2.2}
        />
      </Pressable>

      {expanded ? (
        <View style={[styles.content, { borderTopColor: colors.line }]}>
          {references.length === 0 ? (
            <AppText variant="small">Este curso aún no tiene referencias bibliográficas.</AppText>
          ) : (
            references.map(reference => (
              <AppText key={reference.id} variant="small" color={colors.text}>
                {reference.text}
              </AppText>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden', marginTop: 28 },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  copy: { flex: 1, gap: 4 },
  content: { borderTopWidth: 1, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 14, gap: 10 },
});
