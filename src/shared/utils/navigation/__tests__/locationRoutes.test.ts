import {
  hrefForLocation,
  isSubtopicPath,
  nextLessonHref,
  topicHref,
  type LocationLike,
} from '@/shared/utils/navigation/locationRoutes';

const base: LocationLike = { lessonId: 'lesson-2', lessonCode: '2.1', section: null };

describe('topicHref', () => {
  it('targets the topic hub for regular lessons', () => {
    expect(topicHref({ lessonId: 'lesson-2', lessonCode: '2.1' })).toEqual({
      pathname: '/tema/[id]',
      params: { id: 'lesson-2' },
    });
  });

  it('targets the main screen for lesson 1.1, which has no hub', () => {
    expect(topicHref({ lessonId: 'lesson-1', lessonCode: '1.1' })).toBe('/');
  });

  it('returns null without a lesson', () => {
    expect(topicHref({ lessonId: null, lessonCode: null })).toBeNull();
  });
});

describe('nextLessonHref', () => {
  const lessons = [
    { id: 'lesson-1', code: '1.1' },
    { id: 'lesson-2', code: '1.2' },
    { id: 'lesson-3', code: '1.3' },
  ];

  it('targets the next lesson hub', () => {
    expect(nextLessonHref(lessons, 'lesson-1')).toEqual({
      pathname: '/tema/[id]',
      params: { id: 'lesson-2' },
    });
  });

  it('returns the main screen when there is no next lesson', () => {
    expect(nextLessonHref(lessons, 'lesson-3')).toBe('/');
  });

  it('returns the main screen when the current lesson is not found', () => {
    expect(nextLessonHref(lessons, 'missing')).toBe('/');
  });
});

describe('hrefForLocation', () => {
  it('resumes the hub section', () => {
    expect(hrefForLocation({ ...base, section: 'hub' })).toEqual({
      pathname: '/tema/[id]',
      params: { id: 'lesson-2' },
    });
  });

  it('resumes the lesson section', () => {
    expect(hrefForLocation({ ...base, section: 'lesson' })).toEqual({
      pathname: '/lecciones/[id]',
      params: { id: 'lesson-2' },
    });
  });

  it('resumes the example section', () => {
    expect(hrefForLocation({ ...base, section: 'example' })).toEqual({
      pathname: '/ejemplos',
      params: { lesson: 'lesson-2' },
    });
  });

  it('resumes the exercise section', () => {
    expect(hrefForLocation({ ...base, section: 'exercise' })).toEqual({
      pathname: '/ejercicios',
      params: { lesson: 'lesson-2' },
    });
  });

  it('resumes the quiz section', () => {
    expect(hrefForLocation({ ...base, section: 'quiz' })).toEqual({
      pathname: '/evaluacion',
      params: { lesson: 'lesson-2' },
    });
  });

  it('routes a 1.1 hub to the main screen', () => {
    expect(hrefForLocation({ lessonId: 'lesson-1', lessonCode: '1.1', section: 'hub' })).toBe('/');
  });

  it('returns null without a lesson or without a section', () => {
    expect(hrefForLocation({ lessonId: null, lessonCode: null, section: 'hub' })).toBeNull();
    expect(hrefForLocation({ ...base, section: null })).toBeNull();
  });
});

describe('isSubtopicPath', () => {
  it.each(['/tema/lesson-2', '/lecciones/lesson-1', '/ejemplos', '/ejercicios', '/evaluacion'])(
    'recognizes %s as a subtopic',
    pathname => expect(isSubtopicPath(pathname)).toBe(true),
  );

  it.each(['/', '/evaluaciones', '/perfil', '/login', ''])(
    'rejects %s as a subtopic',
    pathname => expect(isSubtopicPath(pathname)).toBe(false),
  );
});
