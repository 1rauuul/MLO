/**
 * Puerto SQLite de cursos. La implementación vive en `coursesV3` porque la
 * misma transacción que refresca cursos conserva la caché y las membresías.
 */
export {
  loadAccountCourses,
  selectCourse,
  type AccountCourses,
  type RemoteCourse,
} from '@/shared/services/content/coursesV3';
