import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type ChevronDirection = 'right' | 'down' | 'left' | 'up';

const ROTATION: Record<ChevronDirection, string> = {
  right: '0deg',
  down: '90deg',
  left: '180deg',
  up: '270deg',
};

interface ChevronProps {
  direction?: ChevronDirection;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Chevron({ direction = 'right', size = 16, color, strokeWidth = 2 }: ChevronProps) {
  return (
    <View style={[styles.host, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        style={{ transform: [{ rotate: ROTATION[direction] }] }}>
        <Path
          d="M6 3.5 L10.5 8 L6 12.5"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
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
