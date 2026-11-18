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

import { useRepositories } from '@/shared/services/data/DataProvider';
import type { LearnerProfile, LearningStyle } from '@/shared/model/entities';

import { useAuth } from '@/features/auth/viewmodel/useAuth';

interface LearnerProfileContextValue {
  profile: LearnerProfile | null;
  isLoading: boolean;
  style: LearningStyle;
  darkMode: boolean;
  showBaseCourse: boolean;
  setStyle: (style: LearningStyle) => void;
  setDarkMode: (value: boolean) => void;
  setShowBaseCourse: (value: boolean) => void;
  saveQuestionnaire: (style: LearningStyle) => void;
}

const FALLBACK_STYLE: LearningStyle = 'Pragmático';
const LearnerProfileContext = createContext<LearnerProfileContextValue | null>(null);

export function LearnerProfileProvider({ children }: { children: ReactNode }) {
  const { profile: profileRepository } = useRepositories();
  const { account } = useAuth();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBaseCourse, setShowBaseCourseState] = useState(true);
  const profileRef = useRef<LearnerProfile | null>(null);

  useEffect(() => {
    let active = true;
    if (!account) {
      profileRef.current = null;
      setProfile(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }
    (async () => {
      try {
        const loaded = await profileRepository.selectProfile(account.id);
        const showBase = await profileRepository.selectShowBaseCourse();
        if (!active) {
          return;
        }
        profileRef.current = loaded;
        setProfile(loaded);
        setShowBaseCourseState(showBase);
      } catch (caught) {
        if (__DEV__) {
          console.error('[profile] carga fallida', caught);
        }
        if (active) {
          profileRef.current = null;
          setProfile(null);
          setShowBaseCourseState(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [profileRepository, account]);

  const update = useCallback(
    (changes: Partial<LearnerProfile>) => {
      const current = profileRef.current;
      if (!current) {
        return;
      }
      const next = { ...current, ...changes };
      profileRef.current = next;
      setProfile(next);
      void profileRepository.saveProfile(next);
    },
    [profileRepository],
  );

  const setStyle = useCallback((style: LearningStyle) => update({ learningStyle: style }), [update]);
  const setDarkMode = useCallback((darkMode: boolean) => update({ darkMode }), [update]);
  const setShowBaseCourse = useCallback(
    (value: boolean) => {
      setShowBaseCourseState(value);
      void profileRepository.saveShowBaseCourse(value);
    },
    [profileRepository],
  );

  const value = useMemo<LearnerProfileContextValue>(
    () => ({
      profile,
      isLoading,
      style: profile?.learningStyle ?? FALLBACK_STYLE,
      darkMode: profile?.darkMode ?? true,
      showBaseCourse,
      setStyle,
      setDarkMode,
      setShowBaseCourse,
      saveQuestionnaire: setStyle,
    }),
    [profile, isLoading, showBaseCourse, setStyle, setDarkMode, setShowBaseCourse],
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
