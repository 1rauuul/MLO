import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { VideoPlayer } from '@/features/modules/view/VideoPlayer';
import type { ContentBlock } from '@/shared/model/entities';
import { mediaLocalUri } from '@/shared/services/content/mediaPath';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { youtubeThumbnail, youtubeVideoId } from '@/shared/utils/youtube';

import { AppText } from '@/shared/components/AppText';

export function RichContent({ blocks }: { blocks: ContentBlock[] }) {
  const { colors, spacing } = useTheme();

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
            return <TableBlock key={key} block={block} />;
          case 'image':
            return <ImageBlock key={key} block={block} />;
          case 'video':
            return <VideoBlock key={key} block={block} />;
          default:
            return (
              <AppText key={key} color={colors.muted}>
                Contenido no disponible.
              </AppText>
            );
        }
      })}
    </View>
  );
}

function TableBlock({
  block,
}: {
  block: Extract<ContentBlock, { type: 'table' }>;
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[styles.table, { borderColor: colors.line, borderRadius: radius.control }]}>
      <View style={[styles.tableRow, { backgroundColor: colors.soft, borderTopWidth: 0 }]}>
        {block.header.map((cell, cellIndex) => (
          <AppText key={`h${cellIndex}`} variant="small" weight="700" style={styles.cell}>
            {cell}
          </AppText>
        ))}
      </View>
      {block.rows.map((row, rowIndex) => (
        <View
          key={`r${rowIndex}`}
          style={[styles.tableRow, { borderTopColor: colors.line }]}>
          {row.map((cell, cellIndex) => (
            <AppText
              key={`r${rowIndex}c${cellIndex}`}
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

function ImageBlock({ block }: { block: Extract<ContentBlock, { type: 'image' }> }) {
  const { colors, radius, spacing } = useTheme();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <AppText color={colors.muted} style={styles.center}>
        Imagen no disponible sin conexión.
      </AppText>
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <View
        style={{
          padding: spacing.sm,
          borderRadius: radius.control,
          backgroundColor: colors.soft,
        }}>
        <Image
          testID="lesson-image"
          accessibilityLabel={block.alt}
          source={{ uri: block.localSrc ? mediaLocalUri(block.localSrc) : block.src }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          style={{
            width: '100%',
            aspectRatio: Math.max(1, block.width) / Math.max(1, block.height),
            borderRadius: radius.control,
            backgroundColor: colors.card,
          }}
        />
      </View>
      {block.caption ? (
        <AppText variant="small" color={colors.muted} style={styles.center}>
          {block.caption}
        </AppText>
      ) : null}
    </View>
  );
}

function VideoBlock({ block }: { block: Extract<ContentBlock, { type: 'video' }> }) {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const videoId = youtubeVideoId(block.url);

  if (!videoId) {
    return (
      <AppText color={colors.muted}>Video no disponible.</AppText>
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <Pressable
        testID="lesson-video"
        accessibilityRole="button"
        accessibilityLabel={`Reproducir ${block.title}`}
        onPress={() => setOpen(true)}
        style={[
          styles.video,
          { borderColor: colors.line, borderRadius: radius.control },
        ]}>
        <Image
          source={{ uri: youtubeThumbnail(videoId) }}
          resizeMode="cover"
          style={[styles.videoThumb, { backgroundColor: colors.soft }]}
        />
        <View style={styles.videoOverlay}>
          <AppText color="#fff" weight="700" style={styles.play}>
            ▶
          </AppText>
        </View>
        <AppText weight="600" style={styles.videoTitle} numberOfLines={2}>
          {block.title}
        </AppText>
      </Pressable>
      <AppText variant="small" color={colors.muted}>
        Requiere conexión
      </AppText>
      {open && (
        <VideoPlayer
          videoId={videoId}
          title={block.title}
          visible={open}
          onClose={() => setOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  flex: { flex: 1, textAlign: 'justify' },
  paragraph: { fontSize: 14, lineHeight: 21, textAlign: 'justify' },
  heading: { marginTop: 4, textAlign: 'justify' },
  list: { gap: 10 },
  listRow: { flexDirection: 'row', gap: 10 },
  listMark: { width: 20 },
  table: { borderWidth: 1, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1 },
  cell: { flex: 1, lineHeight: 18, textAlign: 'justify' },
  center: { textAlign: 'center' },
  video: { overflow: 'hidden', borderWidth: 1 },
  videoThumb: { width: '100%', aspectRatio: 16 / 9 },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000033',
  },
  play: { fontSize: 42, lineHeight: 48 },
  videoTitle: { paddingHorizontal: 12, paddingVertical: 10 },
});
