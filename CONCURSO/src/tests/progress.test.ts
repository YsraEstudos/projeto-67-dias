import { describe, expect, it } from 'vitest';
import {
  buildExamProgressSummary,
  getChecklistItemProgress,
  getChecklistProgressPercent,
} from '../app/progress';

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

  it('agrega o progresso dos eventos por mês em uma única passagem', () => {
    const summary = buildExamProgressSummary(
      {
        '2026-03-14': {
          date: '2026-03-14',
          notes: '',
          checklist: [
            {
              id: 'simulado',
              label: 'Simulado',
              kind: 'boolean',
              target: 1,
              done: 1,
              unit: 'ok',
              required: true,
              status: 'concluido',
            },
            {
              id: 'redacao',
              label: 'Redação',
              kind: 'boolean',
              target: 1,
              done: 1,
              unit: 'ok',
              required: true,
              status: 'concluido',
            },
          ],
        },
        '2026-04-02': {
          date: '2026-04-02',
          notes: '',
          checklist: [
            {
              id: 'simulado',
              label: 'Simulado',
              kind: 'boolean',
              target: 1,
              done: 1,
              unit: 'ok',
              required: true,
              status: 'concluido',
            },
            {
              id: 'redacao',
              label: 'Redação',
              kind: 'boolean',
              target: 1,
              done: 0,
              unit: 'ok',
              required: true,
              status: 'pendente',
            },
          ],
        },
      },
      [
        { monthKey: '2026-03', simulados: 2, redacoes: 1 },
        { monthKey: '2026-04', simulados: 1, redacoes: 2 },
      ],
    );

    expect(summary.simuladosDone).toBe(2);
    expect(summary.redacoesDone).toBe(1);
    expect(summary.simuladosTarget).toBe(3);
    expect(summary.redacoesTarget).toBe(3);
    expect(summary.byMonth['2026-03']).toEqual({ simuladosDone: 1, redacoesDone: 1 });
    expect(summary.byMonth['2026-04']).toEqual({ simuladosDone: 1, redacoesDone: 0 });
  });
});
