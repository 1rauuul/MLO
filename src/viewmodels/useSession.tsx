import type { Href } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  clearLocation,
  saveLocation,
  selectLocation,
} from '@/data/repositories/locationRepository';
import type { LocationSection } from '@/models/entities';
import { hrefForLocation } from '@/navigation/locationRoutes';

import { useAuth } from './useAuth';

export type { LocationSection };

export interface SessionLocation {
  unitId: string | null;
  lessonId: string | null;
  lessonCode: string | null;
  section: LocationSection | null;
}

export interface RecordLocationInput {
  unitId: string;
  lessonId: string;
  lessonCode?: string | null;
  section: LocationSection;
}

interface SessionContextValue {
  location: SessionLocation;
  record: (input: RecordLocationInput) => void;
  resumeHref: Href | null;
  clear: () => void;
}

const EMPTY_LOCATION: SessionLocation = {
  unitId: null,
  lessonId: null,
  lessonCode: null,
  section: null,
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [location, setLocation] = useState<SessionLocation>(EMPTY_LOCATION);

  useEffect(() => {
    let active = true;
    if (!account) {
      setLocation(EMPTY_LOCATION);
      return () => {
        active = false;
      };
    }
    (async () => {
      try {
        const loaded = await selectLocation(db, account.id);
        if (!active) {
          return;
        }
        setLocation(loaded ?? EMPTY_LOCATION);
      } catch {
        if (active) {
          setLocation(EMPTY_LOCATION);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [db, account]);

  const record = useCallback(
    (input: RecordLocationInput) => {
      setLocation({
        unitId: input.unitId,
        lessonId: input.lessonId,
        lessonCode: input.lessonCode ?? null,
        section: input.section,
      });
      if (account) {
        void saveLocation(db, account.id, input);
      }
    },
    [db, account],
  );

  const clear = useCallback(() => {
    setLocation(EMPTY_LOCATION);
    if (account) {
      void clearLocation(db, account.id);
    }
  }, [db, account]);

  const resumeHref = useMemo(() => hrefForLocation(location), [location]);

  const value = useMemo<SessionContextValue>(
    () => ({ location, record, resumeHref, clear }),
    [location, record, resumeHref, clear],
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
