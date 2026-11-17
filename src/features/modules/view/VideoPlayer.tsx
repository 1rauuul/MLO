import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { AppText } from '@/shared/components/AppText';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { youtubeEmbedUrl } from '@/shared/utils/youtube';

export function VideoPlayer({
  videoId,
  title,
  visible,
  onClose,
}: {
  videoId: string;
  title: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, radius, spacing } = useTheme();
  const [failed, setFailed] = useState(false);
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View testID="video-player" style={[styles.root, { backgroundColor: '#000' }]}>
        <View style={[styles.header, { padding: spacing.md }]}>
          <AppText color="#fff" weight="600" style={styles.title} numberOfLines={1}>
            {title}
          </AppText>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12}>
            <AppText color="#fff" weight="600">
              Cerrar
            </AppText>
          </Pressable>
        </View>

        {visible &&
          (failed ? (
            <View style={[styles.fallback, { gap: spacing.md, padding: spacing.xl }]}>
              <AppText color="#fff" style={styles.center}>
                No se pudo cargar el video. Verifica tu conexión.
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL(url)}
                style={[
                  styles.open,
                  { backgroundColor: colors.primary, borderRadius: radius.control },
                ]}>
                <AppText color={colors.onPrimary} weight="700">
                  Abrir en YouTube
                </AppText>
              </Pressable>
            </View>
          ) : (
            <WebView
              source={{ uri: youtubeEmbedUrl(videoId) }}
              style={styles.webview}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['https://www.youtube.com', 'https://youtube.com', 'https://*.youtube.com']}
              onShouldStartLoadWithRequest={request => {
                const allowed =
                  request.url === 'about:blank' ||
                  /^https:\/\/([a-z0-9-]+\.)*youtube\.com\//i.test(request.url);
                if (!allowed) void Linking.openURL(request.url);
                return allowed;
              }}
              onError={() => setFailed(true)}
              onHttpError={() => setFailed(true)}
            />
          ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#000' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  open: { paddingHorizontal: 16, paddingVertical: 10 },
});
