import type { Attempt } from '@/shared/model/entities';

import { recommendReview, summarizeAttempts, weakTypes } from '@/features/evaluations/viewmodel/analytics.logic';

const attempt = (itemType: Attempt['itemType'], correct: boolean, id: number): Attempt => ({
  id,
  accountId: 1,
  source: 'practice',
  itemId: `i${id}`,
  itemType,
  lessonId: 'l1.2',
  correct,
  createdAt: '2026-01-01T00:00:00.000Z',
});

describe('analyticsLogic', () => {
  it('resume aciertos y errores por tipo', () => {
    const summary = summarizeAttempts([
      attempt('match', false, 1),
      attempt('match', false, 2),
      attempt('match', false, 3),
      attempt('fill', true, 4),
    ]);
    expect(summary.total).toBe(4);
    expect(summary.correct).toBe(1);
    expect(summary.byType.match).toEqual({ total: 3, correct: 0 });
    expect(weakTypes(summary)).toEqual(['match']);
  });

  it('recomienda leer si la precisión es baja', () => {
    const summary = summarizeAttempts([
      attempt('fill', false, 1),
      attempt('fill', false, 2),
      attempt('fill', false, 3),
    ]);
    expect(recommendReview(summary)).toBe('lesson');
  });

  it('recomienda practicar si hay tipos débiles sin precisión baja global', () => {
    const attempts = [
      attempt('match', false, 1),
      attempt('match', false, 2),
      attempt('match', false, 3),
      ...Array.from({ length: 7 }, (_, index) => attempt('fill', true, 10 + index)),
      ...Array.from({ length: 2 }, (_, index) => attempt('order', false, 20 + index)),
      ...Array.from({ length: 3 }, (_, index) => attempt('order', true, 30 + index)),
    ];
    expect(recommendReview(summarizeAttempts(attempts))).toBe('practice');
  });

  it('no recomienda nada si todo va bien', () => {
    const attempts = Array.from({ length: 6 }, (_, index) => attempt('order', true, index));
    expect(recommendReview(summarizeAttempts(attempts))).toBe('none');
  });

  it('no recomienda nada sin intentos', () => {
    expect(recommendReview(summarizeAttempts([]))).toBe('none');
  });

  it('ignora tipos de actividad desconocidos', () => {
    const legacy = { ...attempt('match', false, 1), itemType: 'justify' as never };
    const summary = summarizeAttempts([legacy, attempt('fill', true, 2)]);
    expect(summary.total).toBe(1);
    expect(summary.byType.justify).toBeUndefined();
  });
});
