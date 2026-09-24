import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/theme-provider';
import { fonts } from '@/theme/tokens';

import { AppText } from './AppText';

export function ProgressRing({ value, size = 56 }: { value: number; size?: number }) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 20;
  const circumference = 2 * Math.PI * radius;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${clamped}% completado`}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={{ width: size, height: size }}>
      <Svg viewBox="0 0 48 48" width={size} height={size}>
        <Circle cx={24} cy={24} r={radius} stroke={colors.line} strokeWidth={1} fill="none" />
        <Circle
          cx={24}
          cy={24}
          r={radius}
          stroke={colors.success}
          strokeWidth={3}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <AppText variant="small" color={colors.text} style={styles.label}>
          {clamped}%
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.mono,
  },
});
