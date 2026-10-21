type ExitAction = () => void;
type ExitGuard = (next: ExitAction) => void;

let active: ExitGuard | null = null;

/** Screens with unsaved progress register a guard so bottom-tab exits ask first. */
export function setExitGuard(guard: ExitGuard | null): void {
  active = guard;
}

export function runOrGuardExit(next: ExitAction): void {
  if (active) {
    active(next);
  } else {
    next();
  }
}
