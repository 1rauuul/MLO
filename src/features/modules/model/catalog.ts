/** Las clases agregan contenido sobre el curso base; no cambian de catálogo. */
export const BASE_CATALOG_ID = 'base';

/** El curso base empaquetado usa un nombre interno que no es el del curso visible. */
export const BASE_COURSE_TITLE = 'Ingeniería de Software';

export function displayCourseTitle(course: { catalogId: string; title: string }): string {
  return course.catalogId === BASE_CATALOG_ID && course.title === 'Contenido base'
    ? BASE_COURSE_TITLE
    : course.title;
}
