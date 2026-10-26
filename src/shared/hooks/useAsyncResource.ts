import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

export interface AsyncResource<T> extends AsyncState<T> {
  reload: () => void;
}

/**
 * Estado de carga uniforme para recursos asíncronos. `key` reinicia la carga
 * cuando cambia el recurso; el último resultado montado gana.
 */
export function useAsyncResource<T>(
  load: () => Promise<T>,
  key: string,
  initialData: T | null = null,
  fallbackMessage = 'No se pudo cargar la información.',
): AsyncResource<T> {
  const loadRef = useRef(load);
  const [state, setState] = useState<AsyncState<T>>({
    status: 'loading',
    data: initialData,
    error: null,
  });
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion(current => current + 1), []);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let active = true;
    setState(previous => ({ ...previous, status: 'loading', error: null }));
    loadRef
      .current()
      .then(data => {
        if (active) {
          setState({ status: 'success', data, error: null });
        }
      })
      .catch(caught => {
        if (active) {
          setState({
            status: 'error',
            data: null,
            error: caught instanceof Error ? caught.message : fallbackMessage,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [key, version, fallbackMessage]);

  return { ...state, reload };
}
