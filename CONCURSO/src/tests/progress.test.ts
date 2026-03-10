import { describe, expect, it } from 'vitest';
import { getChecklistItemProgress, getChecklistProgressPercent } from '../app/progress';

describe('progress helpers', () => {
  it('calcula progresso por item com limite em 100%', () => {
    expect(
      getChecklistItemProgress({
        id: 'x',
        label: 'foo',
        kind: 'counter',
        target: 50,
        done: 75,
        unit: 'q',
        required: true,
        status: 'concluido',
      }),
    ).toBe(1);
  });

  it('calcula progresso medio somente com itens obrigatorios', () => {
    const progress = getChecklistProgressPercent([
      {
        id: 'a',
        label: 'A',
        kind: 'counter',
        target: 100,
        done: 50,
        unit: 'min',
        required: true,
        status: 'pendente',
      },
      {
        id: 'b',
        label: 'B',
        kind: 'boolean',
        target: 1,
        done: 1,
        unit: 'ok',
        required: true,
        status: 'concluido',
      },
      {
        id: 'c',
        label: 'C',
        kind: 'boolean',
        target: 1,
        done: 0,
        unit: 'ok',
        required: false,
        status: 'pendente',
      },
    ]);

    expect(progress).toBe(75);
  });
});
