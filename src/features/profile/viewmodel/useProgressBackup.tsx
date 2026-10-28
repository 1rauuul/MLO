import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';

import { parseProgressBackup } from '@/features/profile/model/backup.logic';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useClasses } from '@/features/classes/viewmodel/useClasses';
import { isHybrid } from '@/shared/services/data/dataMode';
import { useRepositories } from '@/shared/services/data/DataProvider';

export function useProgressBackup() {
  const { backup, content } = useRepositories();
  const { account, reloadAccount } = useAuth();
  const { classes: currentClasses, refresh: refreshClasses } = useClasses();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const exportProgress = useCallback(async () => {
    if (!account) {
      return;
    }
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const snapshot = await backup.selectProgressBackup(account.id);
      const file = new File(Paths.cache, `mlo-progreso-${account.id}.json`);
      if (file.exists) {
        file.delete();
      }
      file.create({ overwrite: true });
      await file.write(JSON.stringify(snapshot, null, 2));
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Compartir archivos no está disponible en este dispositivo.');
      }
      await Sharing.shareAsync(file.uri, {
        dialogTitle: 'Exportar progreso',
        mimeType: 'application/json',
      });
      setMessage('Respaldo listo para compartir.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo exportar el progreso.');
    } finally {
      setIsBusy(false);
    }
  }, [account, backup]);

  const importProgress = useCallback(async () => {
    if (!account) {
      return false;
    }
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const picked = await File.pickFileAsync({ multipleFiles: false, mimeTypes: ['application/json'] });
      if (picked.canceled) {
        return false;
      }
      const parsed = parseProgressBackup(await picked.result.text());
      const previousKey = account.externalKey;
      const previousClasses = currentClasses;
      const { omitted } = await backup.replaceProgressFromBackup(account.id, parsed);

      // El UUID y las clases del respaldo se aplican a esta cuenta local.
      await reloadAccount();
      await refreshClasses();
      if (isHybrid()) {
        try {
          if (parsed.student && parsed.student.externalKey !== previousKey) {
            // La persona restaurada vuelve a unirse con su identidad original y
            // se retira la identidad temporal de este dispositivo para no
            // duplicarla en la lista del docente.
            for (const klass of parsed.classes) {
              try {
                await content.joinClass(
                  klass.code,
                  parsed.student.externalKey,
                  account.displayName,
                );
              } catch {
                // Si una clase ya no existe, se conserva la copia local.
              }
            }
            for (const klass of previousClasses) {
              try {
                await content.leaveClass(klass.classCode, previousKey);
              } catch {
                // Sin red no se puede limpiar la identidad temporal.
              }
            }
            await refreshClasses();
          }
          if (parsed.classes.length > 0) {
            await content.refreshClassContent();
            await refreshClasses();
          }
        } catch {
          // Sin red queda la caché local; se sincroniza en el próximo arranque.
        }
      }

      setMessage(
        omitted > 0
          ? `Progreso importado. Se omitieron ${omitted} filas de cursos no disponibles.`
          : 'Progreso importado correctamente.',
      );
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo importar el progreso.');
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [account, backup, content, currentClasses, reloadAccount, refreshClasses]);

  return { exportProgress, importProgress, isBusy, error, message };
}
