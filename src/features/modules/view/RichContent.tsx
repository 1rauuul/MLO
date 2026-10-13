import { StyleSheet, View } from 'react-native';

import type { ContentBlock } from '@/shared/model/entities';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';

export function RichContent({ blocks }: { blocks: ContentBlock[] }) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View style={[styles.root, { marginTop: spacing.sm, gap: spacing.md }]}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case 'p':
            return (
              <AppText key={key} style={styles.paragraph}>
                {block.text}
              </AppText>
            );
          case 'h':
            return (
              <AppText key={key} variant="heading" style={styles.heading}>
                {block.text}
              </AppText>
            );
          case 'bullets':
          case 'numbers':
            return (
              <View key={key} style={styles.list}>
                {block.items.map((item, itemIndex) => (
                  <View key={`${key}-${itemIndex}`} style={styles.listRow}>
                    <AppText color={colors.primary} weight="700" style={styles.listMark}>
                      {block.type === 'bullets' ? '•' : `${itemIndex + 1}.`}
                    </AppText>
                    <AppText style={styles.flex}>{item}</AppText>
                  </View>
                ))}
              </View>
            );
          case 'table':
            return (
              <View
                key={key}
                style={[styles.table, { borderColor: colors.line, borderRadius: radius.control }]}>
                <View style={[styles.tableRow, { backgroundColor: colors.soft, borderTopWidth: 0 }]}>
                  {block.header.map((cell, cellIndex) => (
                    <AppText key={`${key}-h${cellIndex}`} variant="small" weight="700" style={styles.cell}>
                      {cell}
                    </AppText>
                  ))}
                </View>
                {block.rows.map((row, rowIndex) => (
                  <View
                    key={`${key}-r${rowIndex}`}
                    style={[styles.tableRow, { borderTopColor: colors.line }]}>
                    {row.map((cell, cellIndex) => (
                      <AppText
                        key={`${key}-r${rowIndex}c${cellIndex}`}
                        variant="small"
                        weight={cellIndex === 0 ? '600' : '400'}
                        style={styles.cell}>
                        {cell}
                      </AppText>
                    ))}
                  </View>
                ))}
              </View>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  flex: { flex: 1 },
  paragraph: { fontSize: 14, lineHeight: 21, textAlign: 'justify' },
  heading: { marginTop: 4 },
  list: { gap: 10 },
  listRow: { flexDirection: 'row', gap: 10 },
  listMark: { width: 20 },
  table: { borderWidth: 1, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1 },
  cell: { flex: 1, lineHeight: 18, textAlign: 'justify' },
});
