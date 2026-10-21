import { runOrGuardExit, setExitGuard } from '@/shared/services/navigation/exitGuard';

afterEach(() => setExitGuard(null));

it('ejecuta la navegación cuando ninguna pantalla guarda la salida', () => {
  const next = jest.fn();

  runOrGuardExit(next);

  expect(next).toHaveBeenCalledTimes(1);
});

it('entrega la navegación al guardián mientras hay una actividad en curso', () => {
  const next = jest.fn();
  const guard = jest.fn();
  setExitGuard(guard);

  runOrGuardExit(next);

  expect(guard).toHaveBeenCalledWith(next);
  expect(next).not.toHaveBeenCalled();
});

it('vuelve a navegar directo al retirarse el guardián', () => {
  const next = jest.fn();
  setExitGuard(jest.fn());
  setExitGuard(null);

  runOrGuardExit(next);

  expect(next).toHaveBeenCalledTimes(1);
});
