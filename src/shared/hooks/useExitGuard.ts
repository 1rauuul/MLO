import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { setExitGuard } from '@/shared/services/navigation/exitGuard';

export interface ExitGuardState {
  visible: boolean;
  request: (next: () => void) => void;
  confirm: () => void;
  cancel: () => void;
}

/**
 * Cubre el botón físico de Android, el gesto de iOS, el atrás del header y la
 * barra inferior. El gesto nativo no puede cancelarse desde beforeRemove, por
 * eso también se desactiva mientras hay progreso sin guardar.
 */
export function useExitGuard(active: boolean): ExitGuardState {
  const navigation = useNavigation();
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [visible, setVisible] = useState(false);
  // El reintento de la acción confirmada vuelve a emitir beforeRemove.
  const allowRef = useRef(false);

  const request = useCallback(
    (next: () => void) => {
      if (!active) {
        next();
        return;
      }
      setPending(() => next);
      setVisible(true);
    },
    [active],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (!active) {
        return;
      }
      if (allowRef.current) {
        allowRef.current = false;
        return;
      }
      event.preventDefault();
      setPending(() => () => navigation.dispatch(event.data.action));
      setVisible(true);
    });
    return unsubscribe;
  }, [navigation, active]);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !active });
  }, [navigation, active]);

  useEffect(() => {
    setExitGuard(request);
    return () => setExitGuard(null);
  }, [request]);

  const cancel = useCallback(() => {
    setVisible(false);
    setPending(null);
  }, []);

  const confirm = useCallback(() => {
    const action = pending;
    setVisible(false);
    setPending(null);
    allowRef.current = true;
    action?.();
  }, [pending]);

  return { visible, request, confirm, cancel };
}
