export type DataMode = 'local' | 'hybrid';

/**
 * `local` (por defecto) mantiene el comportamiento offline puro: ningún
 * servicio se consulta. `hybrid` habilita el contenido remoto opcional.
 */
export const DATA_MODE: DataMode =
  process.env.EXPO_PUBLIC_DATA_MODE === 'hybrid' ? 'hybrid' : 'local';

export function isHybrid(): boolean {
  return DATA_MODE === 'hybrid';
}
