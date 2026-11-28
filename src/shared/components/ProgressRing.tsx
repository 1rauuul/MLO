import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';

interface ProgressRingProps {
  value: number;
  size?: number;
  label?: string;
  color?: string;
}

export function ProgressRing({ value, size = 56, label, color }: ProgressRingProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeColor =
    color ?? (clamped >= 100 ? colors.success : clamped > 0 ? colors.primary : colors.line);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? `${clamped}% completado`}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={{ width: size, height: size }}>
      <Svg viewBox="0 0 48 48" width={size} height={size}>
        <Circle cx={24} cy={24} r={radius} stroke={colors.line} strokeWidth={1} fill="none" />
        <Circle
          cx={24}
          cy={24}
          r={radius}
          stroke={strokeColor}
          strokeWidth={Math.max(1.5, size / 16)}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <AppText
          variant="small"
          color={clamped > 0 ? colors.text : colors.muted}
          style={[styles.label, { fontSize: Math.max(11, size * 0.2), lineHeight: size * 0.24 }]}>
          {label ?? `${clamped}%`}
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
    fontWeight: '700',
  },
});
