import { useFocusEffect, useNavigation, usePreventRemove } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';

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
  const goBackRef = useRef(navigation.goBack);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [visible, setVisible] = useState(false);
  // Tras confirmar, se desactiva la prevención para dejar pasar la acción.
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
    goBackRef.current = navigation.goBack;
  }, [navigation]);

  const disablePrevention = usePreventRemove(active && !bypass, ({ repeat }) => {
    setPending(() => repeat);
    setVisible(true);
  });

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

  useFocusEffect(
    useCallback(() => {
      setBypass(false);
      setExitGuard(request);
      // usePreventRemove no siempre recibe el gesto/tecla de Android:
      // se intercepta antes de que el handler raíz cierre la app.
      const backSubscription =
        Platform.OS === 'web'
          ? null
          : BackHandler.addEventListener('hardwareBackPress', () => {
              request(() => goBackRef.current());
              return true;
            });
      return () => {
        backSubscription?.remove();
        setExitGuard(null);
        setVisible(false);
        setPending(null);
      };
    }, [request]),
  );

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !active });
  }, [navigation, active]);

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
