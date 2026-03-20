import { describe, expect, it } from 'vitest';
import { getTopicCurrentGrade } from '../app/contentSubmatters';
import type { TopicSubmatter } from '../app/types';

const submatter = (id: string, patch: Partial<TopicSubmatter> = {}): TopicSubmatter => ({
  id,
  title: `Sub ${id}`,
  grade: 'C',
  lastReviewedAt: null,
  errorNote: '',
  actionNote: '',
  createdAt: '2026-03-12T10:00:00.000Z',
  updatedAt: '2026-03-12T10:00:00.000Z',
  ...patch,
});

describe('content topic current grade', () => {
  it('usa a pior nota entre as submaterias como nota atual da materia', () => {
    expect(
      getTopicCurrentGrade([
        submatter('a', { grade: 'A' }),
        submatter('b', { grade: 'C' }),
        submatter('c', { grade: 'E' }),
      ]),
    ).toBe('E');

    expect(
      getTopicCurrentGrade([
        submatter('a', { grade: 'A' }),
        submatter('b', { grade: 'B' }),
      ]),
    ).toBe('B');
  });

  it('mantem E como fallback quando a materia esta sem submaterias', () => {
    expect(getTopicCurrentGrade([])).toBe('E');
  });
});
