import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { selectLessonsByUnit, selectUnits } from '@/data/repositories/lessonRepository';
import { selectProgressMap } from '@/data/repositories/progressRepository';
import type { Lesson, Unit } from '@/models/entities';

interface CatalogResult {
  units: Unit[];
  lessonsByUnit: Record<string, Lesson[]>;
  progressMap: Record<string, boolean>;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useCatalog(): CatalogResult {
  const db = useSQLiteContext();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, Lesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [loadedUnits, progress] = await Promise.all([selectUnits(db), selectProgressMap(db)]);
    const grouped: Record<string, Lesson[]> = {};
    for (const unit of loadedUnits) {
      grouped[unit.id] = await selectLessonsByUnit(db, unit.id);
    }
    setUnits(loadedUnits);
    setLessonsByUnit(grouped);
    setProgressMap(progress);
    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { units, lessonsByUnit, progressMap, isLoading, refresh };
}
