import { Image, type ImageSourcePropType } from 'react-native';

import { Icon, type IconName } from './Icon';

const IMAGES = {
  code: require('../../../assets/course-icons/code.png'),
  checklist: require('../../../assets/course-icons/checklist.png'),
  graduation: require('../../../assets/course-icons/graduation.png'),
  ai: require('../../../assets/course-icons/ai.png'),
  software: require('../../../assets/course-icons/software.png'),
  network: require('../../../assets/course-icons/network.png'),
  brain: require('../../../assets/course-icons/brain.png'),
} satisfies Record<string, ImageSourcePropType>;

type ImageKey = keyof typeof IMAGES;

/** Los PNG de línea se tiñen con el accent del curso; los ilustrados no. */
const LINE_IMAGES = new Set<ImageKey>(['code', 'graduation', 'software', 'brain']);

const SVG_KEYS = new Set<IconName>([
  'module',
  'tile',
  'database',
  'book',
  'lesson',
  'examples',
  'exercises',
  'eval',
  'clock',
  'info',
  'user',
  'home',
  'algorithm',
  'math',
  'security',
  'graphics',
  'mobile',
  'cloud',
  'chip',
  'nlp',
  'robot',
  'game',
  'chart',
]);

export function CourseIcon({
  name,
  color,
  size = 20,
}: {
  name?: string | null;
  color: string;
  size?: number;
}) {
  const key = name ?? '';

  if (key && Object.prototype.hasOwnProperty.call(IMAGES, key)) {
    const imageKey = key as ImageKey;
    return (
      <Image
        source={IMAGES[imageKey]}
        resizeMode="contain"
        style={{
          width: size,
          height: size,
          tintColor: LINE_IMAGES.has(imageKey) ? color : undefined,
        }}
      />
    );
  }

  if (SVG_KEYS.has(key as IconName)) {
    return <Icon name={key as IconName} size={size} color={color} />;
  }

  return (
    <Image
      source={IMAGES.code}
      resizeMode="contain"
      style={{ width: size, height: size, tintColor: color }}
    />
  );
}
