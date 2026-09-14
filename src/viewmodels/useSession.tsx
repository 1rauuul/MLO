import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type HubSection = 'lesson' | 'example' | 'exercise' | 'quiz';

interface SessionContextValue {
  unitId: string | null;
  lessonId: string | null;
  activeSection: HubSection | null;
  openLesson: (unitId: string, lessonId: string) => void;
  setActiveSection: (section: HubSection) => void;
  clear: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [unitId, setUnitId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [activeSection, setActiveSectionState] = useState<HubSection | null>(null);

  const openLesson = useCallback((nextUnitId: string, nextLessonId: string) => {
    setUnitId(nextUnitId);
    setLessonId(nextLessonId);
    setActiveSectionState(null);
  }, []);

  const setActiveSection = useCallback((section: HubSection) => {
    setActiveSectionState(section);
  }, []);

  const clear = useCallback(() => {
    setUnitId(null);
    setLessonId(null);
    setActiveSectionState(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ unitId, lessonId, activeSection, openLesson, setActiveSection, clear }),
    [unitId, lessonId, activeSection, openLesson, setActiveSection, clear],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }
  return context;
}
