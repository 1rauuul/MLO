import type { Href } from 'expo-router';

import type { LocationSection } from '@/models/entities';

export interface LocationLike {
  lessonId: string | null;
  lessonCode: string | null;
  section: LocationSection | null;
}

export function topicHref(loc: {
  lessonId: string | null;
  lessonCode: string | null;
}): Href | null {
  if (!loc.lessonId) {
    return null;
  }
  if (loc.lessonCode === '1.1') {
    return { pathname: '/lecciones/[id]', params: { id: loc.lessonId } };
  }
  return { pathname: '/tema/[id]', params: { id: loc.lessonId } };
}

export function hrefForLocation(loc: LocationLike): Href | null {
  if (!loc.lessonId || !loc.section) {
    return null;
  }
  switch (loc.section) {
    case 'hub':
      return topicHref(loc);
    case 'lesson':
      return { pathname: '/lecciones/[id]', params: { id: loc.lessonId } };
    case 'example':
      return { pathname: '/ejemplos', params: { lesson: loc.lessonId } };
    case 'exercise':
      return { pathname: '/ejercicios', params: { lesson: loc.lessonId } };
    case 'quiz':
      return { pathname: '/evaluacion', params: { lesson: loc.lessonId } };
    default:
      return null;
  }
}

const SUBTOPIC_SEGMENTS = new Set(['tema', 'lecciones', 'ejemplos', 'ejercicios', 'evaluacion']);

export function isSubtopicPath(pathname: string): boolean {
  const first = pathname.split('/').filter(Boolean)[0];
  return first !== undefined && SUBTOPIC_SEGMENTS.has(first);
}
