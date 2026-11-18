import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useClasses } from '@/features/classes/viewmodel/useClasses';
import { useCourses } from '@/features/modules/viewmodel/useCourses';
import { isHybrid } from '@/shared/services/data/dataMode';
import { useRepositories } from '@/shared/services/data/DataProvider';
import {
  fetchRemoteClasses,
  fetchRemoteProgress,
  uploadRemoteProgress,
} from '@/shared/services/content/studentProgress';

export function useProgressSync() {
  const { account, reloadAccount } = useAuth();
  const { backup, content, classes: classRepository } = useRepositories();
  const { refresh: refreshClasses } = useClasses();
  const { refresh: refreshCourses } = useCourses();
  const [busyAction, setBusyAction] = useState<'save' | 'sync' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isBusy = busyAction !== null;

  const saveProgress = useCallback(async () => {
    if (!account) {
      return;
    }
    if (!isHybrid()) {
      setError('Guardar progreso requiere conexión y el modo híbrido.');
      return;
    }
    setBusyAction('save');
    setError(null);
    setMessage(null);
    try {
      const snapshot = await backup.selectProgressBackup(account.id);
      const updatedAt = await uploadRemoteProgress(
        account.externalKey,
        account.displayName,
        snapshot,
      );
      setMessage(`Progreso guardado (${new Date(updatedAt).toLocaleString('es-ES')}).`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar el progreso.');
    } finally {
      setBusyAction(null);
    }
  }, [account, backup]);

  const syncProgress = useCallback(async () => {
    if (!account) {
      return;
    }
    if (!isHybrid()) {
      setError('Sincronizar requiere conexión y el modo híbrido.');
      return;
    }
    setBusyAction('sync');
    setError(null);
    setMessage(null);
    try {
      const remote = await fetchRemoteProgress(account.externalKey);
      if (!remote) {
        setMessage('No hay progreso guardado en la nube.');
        return;
      }
      if (
        remote.progress.student &&
        remote.progress.student.externalKey !== account.externalKey
      ) {
        throw new Error('El progreso guardado pertenece a otra cuenta.');
      }

      await backup.replaceProgressFromBackup(account.id, remote.progress);
      await reloadAccount();

      const remoteClasses = await fetchRemoteClasses(account.externalKey);
      for (const item of remoteClasses) {
        await classRepository.saveAccountClass(
          account.id,
          item.code,
          item.preview,
          item.preview.course?.catalogId ?? 'base',
          item.preview.course?.title ?? '',
        );
      }

      await Promise.all([refreshClasses(), refreshCourses()]);
      await content.refreshClassContent();
      setMessage('Progreso sincronizado.');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'No se pudo sincronizar el progreso.',
      );
    } finally {
      setBusyAction(null);
    }
  }, [
    account,
    backup,
    classRepository,
    content,
    refreshClasses,
    refreshCourses,
    reloadAccount,
  ]);

  return { saveProgress, syncProgress, busyAction, isBusy, error, message };
}
