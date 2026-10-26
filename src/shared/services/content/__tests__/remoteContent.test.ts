import type { HttpClient } from '@/shared/services/http/client';
import {
  loadRemoteContent,
  parseLessonContent,
  parseManifest,
} from '@/shared/services/content/remoteContent';
import { lessonFixture, manifestFixture } from '@/shared/services/http/fixtures';

const client: HttpClient = {
  get: jest.fn(),
  post: jest.fn(),
};

describe('parseManifest / parseLessonContent', () => {
  it('valida el manifiesto y el contenido de la lección', () => {
    expect(parseManifest(manifestFixture).lessons[0]?.lessonId).toBe('l1.2');

    const content = parseLessonContent(lessonFixture, 'l1.2');
    expect(content.exercises[0]?.id).toBe('remote-ord1');
    expect(content.examples[0]?.steps[0]?.why).toBe('Fija el problema.');
    expect(content.questions[0]?.question.id).toBe('remote-q1');
  });

  it('descarta contenido inválido', () => {
    expect(() => parseManifest({ ...manifestFixture, lessons: [{}] })).toThrow(
      'El manifiesto de contenido no es válido.',
    );
    expect(() =>
      parseLessonContent({ ...lessonFixture, exercises: [{ id: 'x' }] }, 'l1.2'),
    ).toThrow('El ejercicio no es válido.');
    expect(() => parseLessonContent(lessonFixture, 'l1.3')).toThrow(
      'El contenido no corresponde a la lección solicitada.',
    );
  });
});

describe('loadRemoteContent', () => {
  beforeEach(() => {
    jest.mocked(client.get).mockReset();
  });

  it('en modo local no hace ninguna llamada de red', async () => {
    await expect(loadRemoteContent(client, 'local-hash', 'local')).resolves.toBeNull();
    expect(client.get).not.toHaveBeenCalled();
  });

  it('descarga el contenido si el hash remoto cambió', async () => {
    jest.mocked(client.get).mockImplementation(async <T,>(path: string) => {
      if (path === '/content/manifest') {
        return manifestFixture as T;
      }
      return lessonFixture as T;
    });

    const content = await loadRemoteContent(client, 'local-hash', 'hybrid');

    expect(content?.lessons).toHaveLength(1);
    expect(content?.hash).toBe('remote-hash');
    expect(client.get).toHaveBeenCalledWith('/content/lessons/l1.2');
  });

  it('no descarga lecciones si el hash coincide', async () => {
    jest.mocked(client.get).mockResolvedValue(manifestFixture as never);

    await expect(loadRemoteContent(client, 'remote-hash', 'hybrid')).resolves.toBeNull();
    expect(client.get).toHaveBeenCalledTimes(1);
  });
});
