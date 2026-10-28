import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseClassRelease } from '@/shared/services/content/remote/validateClassRelease';

const fixture = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      'src/shared/services/content/remote/__fixtures__/panelClassRelease.json',
    ),
    'utf8',
  ),
) as unknown;

describe('release real del panel', () => {
  it('valida el snapshot de una clase con bloques, ejercicio y ejemplo', () => {
    const release = parseClassRelease(fixture, 'ABC234');

    expect(release.version).toBe(2);
    expect(release.class.name).toBe('Clase contrato MLO');
    expect(release.lessons).toHaveLength(1);
    expect(release.lessons[0]?.lessonId).toBe('l1.2');

    const extras = release.lessons[0]?.extras ?? [];
    expect(extras.map(extra => extra.type).sort()).toEqual([
      'example',
      'exercise',
      'lesson',
    ]);

    const exercise = extras.find(extra => extra.type === 'exercise');
    expect(exercise?.content).toEqual(
      expect.objectContaining({
        type: 'order',
        prompt: 'Ordena los pasos',
        correctOrder: ['Requisitos', 'Diseño'],
        lessonId: 'l1.2',
      }),
    );
  });
});
