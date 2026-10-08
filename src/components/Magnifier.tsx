import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

interface MagnifierProps {
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Magnifier({ size = 18, color, strokeWidth = 2 }: MagnifierProps) {
  return (
    <View style={[styles.host, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 16 16">
        <Circle
          cx={6.5}
          cy={6.5}
          r={4.5}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <Line
          x1={10.2}
          y1={10.2}
          x2={14}
          y2={14}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
