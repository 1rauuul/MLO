import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { replaceProgressFromBackup, selectProgressBackup } from '@/features/profile/model/backupRepository';
import { parseProgressBackup } from '@/features/profile/model/backup.logic';
import { useAuth } from '@/features/auth/viewmodel/useAuth';

export function useProgressBackup() {
  const db = useSQLiteContext();
  const { account } = useAuth();
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
      const backup = await selectProgressBackup(db, account.id);
      const file = new File(Paths.cache, `mlo-progreso-${account.id}.json`);
      if (file.exists) {
        file.delete();
      }
      file.create({ overwrite: true });
      file.write(JSON.stringify(backup, null, 2));
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
  }, [account, db]);

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
      const backup = parseProgressBackup(await picked.result.text());
      await replaceProgressFromBackup(db, account.id, backup);
      setMessage('Progreso importado correctamente.');
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo importar el progreso.');
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [account, db]);

  return { exportProgress, importProgress, isBusy, error, message };
}
