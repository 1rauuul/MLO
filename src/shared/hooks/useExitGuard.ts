import { useFocusEffect, useNavigation, usePreventRemove } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { setExitGuard } from '@/shared/services/navigation/exitGuard';

export interface ExitGuardState {
  visible: boolean;
  request: (next: () => void) => void;
  confirm: () => void;
  cancel: () => void;
}

/**
 * Cubre el botón físico de Android, el gesto de iOS, el atrás del header y la
 * barra inferior. El gesto nativo se desactiva mientras hay progreso sin guardar.
 */
export function useExitGuard(active: boolean): ExitGuardState {
  const navigation = useNavigation();
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [visible, setVisible] = useState(false);
  // Tras confirmar, se desactiva la prevención para dejar pasar la acción.
  const [bypass, setBypass] = useState(false);

  const disablePrevention = usePreventRemove(active && !bypass, ({ repeat }) => {
    setPending(() => repeat);
    setVisible(true);
  });

  useFocusEffect(
    useCallback(() => {
      setBypass(false);
    }, []),
  );

  useEffect(() => {
    if (!active) {
      setBypass(false);
    }
  }, [active]);

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
    setBypass(true);
    disablePrevention();
    action?.();
  }, [pending, disablePrevention]);

  return { visible, request, confirm, cancel };
}
