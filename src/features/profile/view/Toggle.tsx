import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  label: string;
}

export function Toggle({ on, onToggle, label }: ToggleProps) {
  const { colors, mode } = useTheme();
  // El carril apagado necesita contraste con el knob blanco en ambos temas.
  const offTrack = mode === 'dark' ? colors.line : colors.muted;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      hitSlop={8}
      onPress={onToggle}
      style={[styles.track, { backgroundColor: on ? colors.primaryStrong : offTrack }]}>
      <View
        style={[
          styles.knob,
          { backgroundColor: colors.onPrimary, alignSelf: on ? 'flex-end' : 'flex-start' },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 999,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 999,
  },
});
