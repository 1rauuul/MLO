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
  // examples/exercises/evaluations/questions no guardan catalog_id: el curso
  // se hereda de su lección (o de la evaluación, para las preguntas).
  const links = await db.getAllAsync<LinkRow>(
    `SELECT l.reference_ids AS referenceIds, l.catalog_id AS catalogId, l.group_id AS groupId,
            l.archived_at AS archivedAt, l.position, 'lesson' AS kind
       FROM lessons l WHERE l.catalog_id IN ('base', ?)
     UNION ALL
     SELECT e.reference_ids, l.catalog_id, e.group_id, COALESCE(e.archived_at, l.archived_at),
            e.position, 'evaluation'
       FROM evaluations e JOIN lessons l ON l.id = e.lesson_id
      WHERE l.catalog_id IN ('base', ?)
     UNION ALL
     SELECT q.reference_ids, l.catalog_id, e.group_id, COALESCE(e.archived_at, l.archived_at),
            q.order_index, 'question'
       FROM questions q
       JOIN evaluations e ON e.id = q.evaluation_id
       JOIN lessons l ON l.id = e.lesson_id
      WHERE l.catalog_id IN ('base', ?)
     UNION ALL
     SELECT x.reference_ids, l.catalog_id, x.group_id, l.archived_at, x.position, 'exercise'
       FROM exercises x JOIN lessons l ON l.id = x.lesson_id
      WHERE l.catalog_id IN ('base', ?)
     UNION ALL
     SELECT x.reference_ids, l.catalog_id, x.group_id, l.archived_at, x.position, 'example'
       FROM examples x JOIN lessons l ON l.id = x.lesson_id
      WHERE l.catalog_id IN ('base', ?)`,
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
