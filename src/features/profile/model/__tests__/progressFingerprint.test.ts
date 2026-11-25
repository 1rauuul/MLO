import type { ProgressBackup } from '@/features/profile/model/backup.logic';
import {
  progressFingerprint,
  progressFingerprintSource,
  progressHasData,
} from '@/features/profile/model/progressFingerprint';

const snapshot: ProgressBackup = {
  version: 5,
  exportedAt: '2026-01-01T00:00:00.000Z',
  student: { externalKey: '11111111-1111-4111-8111-111111111111' },
  classes: [],
  moduleProgress: [],
  attempts: [],
  evaluationResults: [],
  exampleState: [],
  lastLocation: null,
};

describe('progressFingerprint', () => {
  it('ignora exportedAt', async () => {
    const later = { ...snapshot, exportedAt: '2026-02-01T00:00:00.000Z' };
    expect(progressFingerprintSource(later)).toBe(
      progressFingerprintSource(snapshot),
    );
    await expect(progressFingerprint(later)).resolves.toBe(
      await progressFingerprint(snapshot),
    );
  });

  it('cambia cuando cambia el progreso', () => {
    const completed: ProgressBackup = {
      ...snapshot,
      moduleProgress: [
        {
          lessonId: 'l1',
          completed: true,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    expect(progressFingerprintSource(completed)).not.toBe(
      progressFingerprintSource(snapshot),
    );
  });

  it('distingue un progreso vacío de uno con datos', () => {
    expect(progressHasData(snapshot)).toBe(false);
    expect(
      progressHasData({
        ...snapshot,
        evaluationResults: [
          {
            evaluationId: 'e1',
            score: 80,
            correctCount: 8,
            totalCount: 10,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    ).toBe(true);
  });
});
