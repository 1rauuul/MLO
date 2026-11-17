import { File, Paths } from 'expo-file-system';

/** Ruta relativa a `Paths.document`; sobrevive a reinstalaciones y cambios de contenedor. */
export function mediaRelativePath(fileName: string): string {
  return `media/${fileName}`;
}

export function mediaLocalUri(value: string): string {
  return value.startsWith('file:') ? value : new File(Paths.document, value).uri;
}
