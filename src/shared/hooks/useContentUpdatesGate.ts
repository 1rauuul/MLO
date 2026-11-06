import { useEffect, useSyncExternalStore } from 'react';

let blocked = 0;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Una pantalla con estado sin guardar (p. ej. una evaluación) bloquea el aviso. */
export function isContentUpdatesBlocked(): boolean {
  return blocked > 0;
}

export function useContentUpdatesBlocked(): boolean {
  return useSyncExternalStore(subscribe, () => blocked > 0);
}

export function useBlockContentUpdates(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    blocked += 1;
    emit();
    return () => {
      blocked -= 1;
      emit();
    };
  }, [active]);
}
