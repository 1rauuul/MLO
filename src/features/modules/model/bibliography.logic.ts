import { BASE_CATALOG_ID } from '@/features/modules/model/catalog';

/** Referencia publicada por el CMS: `{id, text, url?}` con texto APA 7 (DEC-07). */
export interface BibliographyReference {
  id: string;
  text: string;
  url?: string;
}

/** Fila de `content_references`, ya separada por ámbito (curso o grupo). */
export interface ReferenceCatalogRow {
  id: string;
  text: string;
  url: string | null;
  catalogId: string;
  /** `''` para el release de curso; id del grupo para su release. */
  groupId: string;
}

/** Asociación de un elemento visible con una referencia del release. */
export interface ReferenceLinkRow {
  referenceId: string;
  catalogId: string;
  groupId: string | null;
  archivedAt: string | null;
  /** lesson | example | exercise | evaluation | question */
  kind: string;
  position: number;
}

export interface BibliographyScope {
  catalogId: string;
  groupId: string | null;
}

const KIND_ORDER: Record<string, number> = {
  lesson: 0,
  example: 1,
  exercise: 2,
  evaluation: 3,
  question: 4,
};

function scopeRank(catalogId: string): number {
  if (catalogId === BASE_CATALOG_ID) {
    return 0;
  }
  return 1;
}

/**
 * Consolida base + curso + grupo activo. Solo entran elementos visibles; el
 * aislamiento por grupo se resuelve con el `group_id` del elemento. Los
 * duplicados por `id` conservan la primera aparición en el orden base → curso →
 * grupo y las discrepancias posteriores se ignoran (DEC-07).
 */
export function consolidateBibliography(
  links: ReferenceLinkRow[],
  catalog: ReferenceCatalogRow[],
  scope: BibliographyScope,
): BibliographyReference[] {
  const visible = links
    .filter(link => {
      if (link.archivedAt !== null) {
        return false;
      }
      if (link.catalogId !== BASE_CATALOG_ID && link.catalogId !== scope.catalogId) {
        return false;
      }
      return link.groupId === null || link.groupId === scope.groupId;
    })
    .sort(
      (a, b) =>
        scopeRank(a.catalogId) - scopeRank(b.catalogId) ||
        (a.groupId === null ? 0 : 1) - (b.groupId === null ? 0 : 1) ||
        (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99) ||
        a.position - b.position ||
        a.referenceId.localeCompare(b.referenceId),
    );

  const byScope = new Map(
    catalog.map(reference => [
      `${reference.catalogId}\u0000${reference.groupId}\u0000${reference.id}`,
      reference,
    ]),
  );

  const consolidated = new Map<string, BibliographyReference>();
  for (const link of visible) {
    if (consolidated.has(link.referenceId)) {
      continue;
    }
    const reference = byScope.get(
      `${link.catalogId}\u0000${link.groupId ?? ''}\u0000${link.referenceId}`,
    );
    if (!reference) {
      continue;
    }
    consolidated.set(
      reference.id,
      reference.url === null
        ? { id: reference.id, text: reference.text }
        : { id: reference.id, text: reference.text, url: reference.url },
    );
  }

  return [...consolidated.values()].sort(
    (a, b) => a.text.localeCompare(b.text, 'es') || a.id.localeCompare(b.id),
  );
}
