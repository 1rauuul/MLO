import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { saveProfile, selectProfile } from '@/data/repositories/profileRepository';
import type { LearnerProfile, LearningStyle } from '@/models/entities';

interface LearnerProfileContextValue {
  profile: LearnerProfile | null;
  isLoading: boolean;
  style: LearningStyle;
  darkMode: boolean;
  largeText: boolean;
  setStyle: (style: LearningStyle) => void;
  setDarkMode: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  saveQuestionnaire: (style: LearningStyle) => void;
}

const DEFAULT_PROFILE: LearnerProfile = {
  id: 1,
  learnerName: 'Valentina Ríos',
  learningStyle: 'Pragmático',
  darkMode: true,
  largeText: false,
};

const LearnerProfileContext = createContext<LearnerProfileContextValue | null>(null);

export function LearnerProfileProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileRef = useRef<LearnerProfile | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const loaded = (await selectProfile(db)) ?? DEFAULT_PROFILE;
      if (!active) {
        return;
      }
      profileRef.current = loaded;
      setProfile(loaded);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db]);

  const update = useCallback(
    (changes: Partial<LearnerProfile>) => {
      const current = profileRef.current;
      if (!current) {
        return;
      }
      const next = { ...current, ...changes };
      profileRef.current = next;
      setProfile(next);
      void saveProfile(db, next);
    },
    [db],
  );

  const setStyle = useCallback((style: LearningStyle) => update({ learningStyle: style }), [update]);
  const setDarkMode = useCallback((darkMode: boolean) => update({ darkMode }), [update]);
  const setLargeText = useCallback((largeText: boolean) => update({ largeText }), [update]);

  const value = useMemo<LearnerProfileContextValue>(
    () => ({
      profile,
      isLoading,
      style: profile?.learningStyle ?? DEFAULT_PROFILE.learningStyle,
      darkMode: profile?.darkMode ?? DEFAULT_PROFILE.darkMode,
      largeText: profile?.largeText ?? DEFAULT_PROFILE.largeText,
      setStyle,
      setDarkMode,
      setLargeText,
      saveQuestionnaire: setStyle,
    }),
    [profile, isLoading, setStyle, setDarkMode, setLargeText],
  );

  return <LearnerProfileContext.Provider value={value}>{children}</LearnerProfileContext.Provider>;
}

export function useLearnerProfile(): LearnerProfileContextValue {
  const context = useContext(LearnerProfileContext);
  if (!context) {
    throw new Error('useLearnerProfile debe usarse dentro de LearnerProfileProvider');
  }
  return context;
}
