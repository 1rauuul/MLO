import type { SQLiteDatabase } from 'expo-sqlite';

import {
  consolidateBibliography,
  type BibliographyReference,
  type ReferenceLinkRow,
} from '@/features/modules/model/bibliography.logic';
import { isString } from '@/shared/utils/validate';

interface LinkRow {
  referenceIds: string;
  catalogId: string;
  groupId: string | null;
  archivedAt: string | null;
  kind: string;
  position: number;
}

interface CatalogRow {
  id: string;
  text: string;
  url: string | null;
  catalogId: string;
  groupId: string;
}

function parseIds(value: unknown): string[] {
  try {
    const parsed: unknown = JSON.parse(String(value ?? '[]'));
    return Array.isArray(parsed) ? parsed.filter(isString) : [];
  } catch {
    return [];
  }
}

/**
 * Reúne las referencias visibles de base, curso activo y grupo activo. La
 * consolidación (visibilidad, dedupe y orden) vive en `bibliography.logic.ts`.
 */
export async function selectReferences(
  db: SQLiteDatabase,
  catalogId: string,
  groupId: string | null,
): Promise<BibliographyReference[]> {
  const links = await db.getAllAsync<LinkRow>(
    `SELECT reference_ids AS referenceIds, catalog_id AS catalogId, group_id AS groupId,
            archived_at AS archivedAt, position, 'lesson' AS kind
       FROM lessons WHERE catalog_id IN ('base', ?)
     UNION ALL
     SELECT reference_ids, catalog_id, group_id, archived_at, position, 'evaluation'
       FROM evaluations WHERE catalog_id IN ('base', ?)
     UNION ALL
     SELECT q.reference_ids, e.catalog_id, e.group_id, e.archived_at, q.order_index, 'question'
       FROM questions q JOIN evaluations e ON e.id = q.evaluation_id
      WHERE e.catalog_id IN ('base', ?)
     UNION ALL
     SELECT reference_ids, catalog_id, group_id, NULL, position, 'exercise'
       FROM exercises WHERE catalog_id IN ('base', ?)
     UNION ALL
     SELECT reference_ids, catalog_id, group_id, NULL, position, 'example'
       FROM examples WHERE catalog_id IN ('base', ?)`,
    catalogId,
    catalogId,
    catalogId,
    catalogId,
    catalogId,
  );

  const catalog = await db.getAllAsync<CatalogRow>(
    `SELECT id, text, url, catalog_id AS catalogId, group_id AS groupId
       FROM content_references WHERE catalog_id IN ('base', ?)`,
    catalogId,
  );

  const expanded: ReferenceLinkRow[] = links.flatMap(link =>
    parseIds(link.referenceIds).map(referenceId => ({
      referenceId,
      catalogId: link.catalogId,
      groupId: link.groupId,
      archivedAt: link.archivedAt,
      kind: link.kind,
      position: link.position,
    })),
  );

  return consolidateBibliography(expanded, catalog, { catalogId, groupId });
}
