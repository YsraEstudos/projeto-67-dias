import { describe, expect, it } from 'vitest';
import { calculateAnkiProjection } from '../app/anki';

describe('anki projection', () => {
  it('estima termino apos setembro com 25 novos/dia para 4500 cards', () => {
    const projection = calculateAnkiProjection({
      targetCards: 4500,
      newCardsPerActiveDay: 25,
      alreadyAdded: 0,
      referenceDate: '2026-03-10',
    });

    expect(projection.activeDaysNeeded).toBe(180);
    expect(projection.estimatedFinishDate).toBeTruthy();
    expect(projection.estimatedFinishDate).toBe('2026-10-05');
  });
});
