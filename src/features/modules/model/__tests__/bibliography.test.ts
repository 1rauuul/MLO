import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  consolidateBibliography,
  type BibliographyReference,
  type ReferenceCatalogRow,
  type ReferenceLinkRow,
} from '@/features/modules/model/bibliography.logic';

const FIXTURE = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'shared',
  'services',
  'content',
  'remote',
  '__fixtures__',
  'v3',
  'x05',
  'references-release.json',
);

interface FixtureItem {
  id: string;
  referenceIds?: string[];
}

interface FixtureRelease {
  catalogId: string;
  references: { id: string; text: string; url?: string }[];
  lessons: FixtureItem[];
  evaluations: FixtureItem[];
  questions: FixtureItem[];
  exercises: FixtureItem[];
  examples: FixtureItem[];
}

function loadFixture(): FixtureRelease {
  const text = readFileSync(FIXTURE, 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n');
  return JSON.parse(text) as FixtureRelease;
}

function fixtureLinks(release: FixtureRelease): ReferenceLinkRow[] {
  const collections: [string, FixtureItem[]][] = [
    ['lesson', release.lessons],
    ['evaluation', release.evaluations],
    ['question', release.questions],
    ['exercise', release.exercises],
    ['example', release.examples],
  ];
  return collections.flatMap(([kind, items]) =>
    items.flatMap((item, position) =>
      (item.referenceIds ?? []).map(referenceId => ({
        referenceId,
        catalogId: release.catalogId,
        groupId: null,
        archivedAt: null,
        kind,
        position,
      })),
    ),
  );
}

function fixtureCatalog(release: FixtureRelease): ReferenceCatalogRow[] {
  return release.references.map(reference => ({
    id: reference.id,
    text: reference.text,
    url: reference.url ?? null,
    catalogId: release.catalogId,
    groupId: '',
  }));
}

function reference(id: string, text: string, groupId = ''): ReferenceCatalogRow {
  return { id, text, url: null, catalogId: 'demo', groupId };
}

function link(
  referenceId: string,
  overrides: Partial<ReferenceLinkRow> = {},
): ReferenceLinkRow {
  return {
    referenceId,
    catalogId: 'demo',
    groupId: null,
    archivedAt: null,
    kind: 'lesson',
    position: 0,
    ...overrides,
  };
}

describe('consolidateBibliography', () => {
  it('el fixture x05 usa LF sin BOM y conserva el hash del productor', () => {
    const raw = readFileSync(FIXTURE);
    const text = raw.toString('utf8');
    const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

    expect(raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf).toBe(false);
    expect(normalized).not.toContain('\r');
    expect(createHash('sha256').update(normalized, 'utf8').digest('hex')).toBe(
      '2c6355a639ec34f264e2b608ac72bf185e89e317f0dff8f6ecc80cccb1aa4d3f',
    );
  });

  it('deduplica las referencias del fixture por id y las ordena en español', () => {
    const release = loadFixture();

    const result = consolidateBibliography(fixtureLinks(release), fixtureCatalog(release), {
      catalogId: release.catalogId,
      groupId: null,
    });

    expect(result.map(reference => reference.id)).toEqual(['demo-ref-apa-2', 'demo-ref-apa-1']);
    expect(result.map(reference => reference.text)).toEqual([
      release.references[1]?.text,
      release.references[0]?.text,
    ]);
    expect(result).toHaveLength(2);
  });

  it('conserva la primera aparición: base, luego curso y luego grupo', () => {
    const catalog = [
      reference('r1', 'Grupo', 'g1'),
      reference('r1', 'Curso'),
      { ...reference('r1', 'Base'), catalogId: 'base' },
    ];
    const links = [
      link('r1', { groupId: 'g1', kind: 'lesson' }),
      link('r1', { kind: 'lesson' }),
      link('r1', { catalogId: 'base', kind: 'lesson' }),
    ];

    const result = consolidateBibliography(links, catalog, {
      catalogId: 'demo',
      groupId: 'g1',
    });

    expect(result).toEqual([{ id: 'r1', text: 'Base' }]);
  });

  it('ignora una discrepancia posterior del mismo id', () => {
    const catalog = [reference('r1', 'Curso'), reference('r1', 'Grupo', 'g1')];

    const result = consolidateBibliography([link('r1'), link('r1', { groupId: 'g1' })], catalog, {
      catalogId: 'demo',
      groupId: 'g1',
    });

    expect(result).toEqual([{ id: 'r1', text: 'Curso' }]);
  });

  it('no filtra referencias de otros grupos', () => {
    const catalog = [
      reference('r1', 'Propia', 'g1'),
      reference('r2', 'Ajena', 'g2'),
      reference('r3', 'Curso'),
    ];
    const links = [
      link('r1', { groupId: 'g1' }),
      link('r2', { groupId: 'g2' }),
      link('r3', { kind: 'evaluation' }),
    ];

    const result = consolidateBibliography(links, catalog, {
      catalogId: 'demo',
      groupId: 'g1',
    });

    expect(result.map(reference => reference.text)).toEqual(['Curso', 'Propia']);
  });

  it('excluye referencias de elementos archivados', () => {
    const catalog = [reference('r1', 'Archivada'), reference('r2', 'Visible')];
    const links = [
      link('r1', { archivedAt: '2026-11-06T00:00:00.000Z' }),
      link('r2', { kind: 'question' }),
    ];

    const result = consolidateBibliography(links, catalog, {
      catalogId: 'demo',
      groupId: null,
    });

    expect(result.map(reference => reference.id)).toEqual(['r2']);
  });

  it('ignora enlaces de otros catálogos', () => {
    const catalog = [reference('r1', 'Propia'), { ...reference('r2', 'Otra'), catalogId: 'otro' }];
    const links = [link('r1'), link('r2', { catalogId: 'otro' })];

    const result = consolidateBibliography(links, catalog, {
      catalogId: 'demo',
      groupId: null,
    });

    expect(result.map(reference => reference.id)).toEqual(['r1']);
  });

  it('ordena alfabéticamente con locale español', () => {
    const catalog = [reference('r1', 'Zeta, A. (2020).'), reference('r2', 'Álvarez, B. (2019).')];
    const result = consolidateBibliography([link('r1'), link('r2')], catalog, {
      catalogId: 'demo',
      groupId: null,
    });

    expect(result.map(reference => reference.id)).toEqual(['r2', 'r1']);
  });

  it('devuelve vacío sin referencias visibles', () => {
    const result: BibliographyReference[] = consolidateBibliography([], [], {
      catalogId: 'demo',
      groupId: null,
    });

    expect(result).toEqual([]);
  });
});
