import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'check'
  | 'close'
  | 'refresh'
  | 'reorder'
  | 'arrow-up'
  | 'arrow-down'
  | 'home'
  | 'module'
  | 'tile'
  | 'lesson'
  | 'examples'
  | 'exercises'
  | 'eval'
  | 'user'
  | 'clock';

type ChildConfig =
  | { kind: 'path'; d: string }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx?: number; fill?: boolean };

const DEFS: Record<IconName, ChildConfig[]> = {
  check: [{ kind: 'path', d: 'M5 12.5 L9.5 17 L19 7' }],
  close: [
    { kind: 'path', d: 'M6.5 6.5 L17.5 17.5' },
    { kind: 'path', d: 'M17.5 6.5 L6.5 17.5' },
  ],
  refresh: [
    { kind: 'path', d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' },
    { kind: 'path', d: 'M3 3v5h5' },
  ],
  reorder: [
    { kind: 'path', d: 'M5 6.5h14' },
    { kind: 'path', d: 'M5 12h14' },
    { kind: 'path', d: 'M5 17.5h14' },
  ],
  'arrow-up': [
    { kind: 'path', d: 'M12 19V5' },
    { kind: 'path', d: 'M5 12l7-7 7 7' },
  ],
  'arrow-down': [
    { kind: 'path', d: 'M12 5v14' },
    { kind: 'path', d: 'M19 12l-7 7-7-7' },
  ],
  home: [
    { kind: 'path', d: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { kind: 'path', d: 'M9 22V12h6v10' },
  ],
  module: [
    { kind: 'rect', x: 4, y: 4, width: 7, height: 7, rx: 1.5 },
    { kind: 'rect', x: 13, y: 4, width: 7, height: 7, rx: 1.5 },
    { kind: 'rect', x: 4, y: 13, width: 7, height: 7, rx: 1.5 },
    { kind: 'rect', x: 13, y: 13, width: 7, height: 7, rx: 1.5 },
  ],
  tile: [
    { kind: 'rect', x: 4.5, y: 4.5, width: 15, height: 15, rx: 2 },
    { kind: 'circle', cx: 12, cy: 12, r: 1.8, fill: true },
  ],
  lesson: [
    { kind: 'path', d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z' },
    { kind: 'path', d: 'M14 2v5h5' },
    { kind: 'path', d: 'M9 12h6' },
    { kind: 'path', d: 'M9 16h6' },
  ],
  examples: [
    { kind: 'path', d: 'm17 2 4 4-4 4' },
    { kind: 'path', d: 'M3 11v-1a4 4 0 0 1 4-4h14' },
    { kind: 'path', d: 'm7 22-4-4 4-4' },
    { kind: 'path', d: 'M21 13v1a4 4 0 0 1-4 4H3' },
  ],
  exercises: [
    { kind: 'path', d: 'M9 6h11' },
    { kind: 'path', d: 'M9 12h11' },
    { kind: 'path', d: 'M9 18h11' },
    { kind: 'path', d: 'M4.5 5l1.5 1.5 2.5-3' },
    { kind: 'path', d: 'M4.5 11l1.5 1.5 2.5-3' },
    { kind: 'path', d: 'M4.5 17l1.5 1.5 2.5-3' },
  ],
  eval: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M8.5 12.5l2.5 2.5 4.5-5.5' },
  ],
  user: [
    { kind: 'circle', cx: 12, cy: 8.5, r: 3.5 },
    { kind: 'path', d: 'M4.5 19.5a7.5 7.5 0 0 1 15 0' },
  ],
  clock: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M12 6.5V12l3.5 2' },
  ],
};

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color, strokeWidth = 2 }: IconProps) {
  const children = DEFS[name].map((config, index) => {
    const stroke = color;
    if (config.kind === 'path') {
      return (
        <Path
          key={index}
          d={config.d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    if (config.kind === 'circle') {
      return (
        <Circle
          key={index}
          cx={config.cx}
          cy={config.cy}
          r={config.r}
          fill={config.fill ? color : 'none'}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
    return (
      <Rect
        key={index}
        x={config.x}
        y={config.y}
        width={config.width}
        height={config.height}
        rx={config.rx ?? 0}
        fill={config.fill ? color : 'none'}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  });

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {children}
      </Svg>
    </View>
  );
}