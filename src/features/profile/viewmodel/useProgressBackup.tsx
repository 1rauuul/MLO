import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';

import { parseProgressBackup } from '@/features/profile/model/backup.logic';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useActiveCatalog } from '@/features/groups/viewmodel/useActiveCatalog';
import { isHybrid } from '@/shared/services/data/dataMode';
import { useRepositories } from '@/shared/services/data/DataProvider';

export function useProgressBackup() {
  const { backup, content, groups, lessons } = useRepositories();
  const { account } = useAuth();
  const { refresh: refreshActiveCatalog } = useActiveCatalog();
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
      file.write(JSON.stringify(snapshot, null, 2));
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
      if (parsed.group) {
        const backupLessons = await lessons.selectLessons(parsed.group.catalogId);
        const hasBackupContent = backupLessons.length > 0;
        let restored = false;

        if (isHybrid()) {
          try {
            const info = await content.fetchGroup(parsed.group.code);
            // El maestro pudo cambiar el curso del grupo: hay que mirar el
            // catálogo que devuelve el servidor, no el que venía en el respaldo.
            const targetLessons = await lessons.selectLessons(info.catalog.id);
            if (targetLessons.length === 0) {
              await content.refreshCatalog(info.catalog.id, true);
              const { failed } = await content.applyStagedContent(info.catalog.id);
              if (failed.length > 0) {
                throw new Error('El curso no se pudo aplicar completo.');
              }
            }
            await groups.saveAccountGroup(account.id, {
              groupId: info.group.id,
              groupCode: parsed.group.code,
              groupName: info.group.name,
              teacherName: info.group.teacherName,
              catalogId: info.catalog.id,
            });
            restored = true;
          } catch {
            // Sin red: si el curso ya está descargado, se restaura el grupo desde el respaldo.
          }
        }

        if (!restored && hasBackupContent) {
          // Sin red no se inventa un group_id: se conserva null hasta sincronizar.
          await groups.saveAccountGroup(account.id, {
            groupId: parsed.group.groupId,
            groupCode: parsed.group.code,
            groupName: parsed.group.name,
            teacherName: parsed.group.teacherName,
            catalogId: parsed.group.catalogId,
          });
          restored = true;
        }

        if (restored) {
          refreshActiveCatalog();
        }
      }
      const { omitted } = await backup.replaceProgressFromBackup(account.id, parsed);
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
  }, [account, backup, content, groups, lessons, refreshActiveCatalog]);

  return { exportProgress, importProgress, isBusy, error, message };
}
