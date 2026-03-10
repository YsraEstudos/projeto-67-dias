import { describe, expect, it, vi } from 'vitest';
import { appReducer } from '../app/AppContext';
import {
  buildGradesSummary,
  buildStaleSummary,
  migrateTopicSubmattersFromLegacy,
} from '../app/contentSubmatters';
import { createInitialState } from '../app/seed';
import type { TopicNode, TopicProgress, TopicSubmatter } from '../app/types';

const sampleTopic = (id: string, title: string): TopicNode => ({
  id,
  subject: 'especificos',
  title,
  sourceRef: 'ref',
  parentId: 'sec-x',
  isLeaf: true,
  priority: 'media',
});

const submatter = (id: string, patch: Partial<TopicSubmatter> = {}): TopicSubmatter => ({
  id,
  title: `Sub ${id}`,
  grade: 'C',
  lastReviewedAt: null,
  errorNote: '',
  actionNote: '',
  createdAt: '2026-02-26T10:00:00.000Z',
  updatedAt: '2026-02-26T10:00:00.000Z',
  ...patch,
});

describe('content submatters migration', () => {
  it('mapeia status legado para notas A/C/E e preserva evidência', () => {
    const leafTopics = [
      sampleTopic('t1', 'Topico 1'),
      sampleTopic('t2', 'Topico 2'),
      sampleTopic('t3', 'Topico 3'),
    ];
    const legacyProgress: Record<string, TopicProgress> = {
      t1: { status: 'acertado', evidenceNote: 'bom', updatedAt: '2026-02-20T18:00:00.000Z' },
      t2: { status: 'em_progresso', evidenceNote: 'medio', updatedAt: '2026-02-15T09:00:00.000Z' },
      t3: { status: 'nao_iniciado', evidenceNote: '', updatedAt: null },
    };

    const migrated = migrateTopicSubmattersFromLegacy(leafTopics, legacyProgress);
    expect(migrated.t1[0].grade).toBe('A');
    expect(migrated.t2[0].grade).toBe('C');
    expect(migrated.t3[0].grade).toBe('E');
    expect(migrated.t1[0].errorNote).toBe('bom');
    expect(migrated.t1[0].lastReviewedAt).toBe('2026-02-20');
  });
});

describe('content submatters summaries', () => {
  it('calcula distribuicao A-E', () => {
    const summary = buildGradesSummary({
      topic1: [submatter('a', { grade: 'A' }), submatter('b', { grade: 'E' })],
      topic2: [submatter('c', { grade: 'C' })],
    });

    expect(summary.total).toBe(3);
    expect(summary.byGrade.A).toBe(1);
    expect(summary.byGrade.C).toBe(1);
    expect(summary.byGrade.E).toBe(1);
  });

  it('calcula buckets sem revisar 7/15/30 dias', () => {
    const stale = buildStaleSummary(
      {
        topic1: [
          submatter('a', { lastReviewedAt: '2026-02-18' }),
          submatter('b', { lastReviewedAt: '2026-01-20' }),
          submatter('c', { lastReviewedAt: null }),
        ],
      },
      '2026-02-26',
    );

    expect(stale.byDays[7]).toBe(3);
    expect(stale.byDays[15]).toBe(2);
    expect(stale.byDays[30]).toBe(2);
  });
});

describe('content submatters reducer', () => {
  it('executa CRUD e marcação hoje com change token', () => {
    vi.useFakeTimers();
    let state = createInitialState();
    const topicId = Object.keys(state.topicSubmattersByTopic)[0];

    vi.setSystemTime(new Date('2026-02-26T10:00:00.000Z'));
    state = appReducer(state, {
      type: 'add-topic-submatter',
      topicId,
      submatter: submatter('new-1'),
    });
    expect(state.topicSubmattersByTopic[topicId].some((item) => item.id === 'new-1')).toBe(true);
    expect(state.meta.changeToken).toBe(1);

    vi.setSystemTime(new Date('2026-02-26T10:01:00.000Z'));
    state = appReducer(state, {
      type: 'update-topic-submatter',
      topicId,
      submatterId: 'new-1',
      patch: { grade: 'A' },
    });
    const updated = state.topicSubmattersByTopic[topicId].find((item) => item.id === 'new-1');
    expect(updated?.grade).toBe('A');
    expect(updated?.updatedAt).toBe('2026-02-26T10:01:00.000Z');
    expect(state.meta.changeToken).toBe(2);

    vi.setSystemTime(new Date('2026-02-26T10:02:00.000Z'));
    state = appReducer(state, {
      type: 'mark-topic-submatter-reviewed-today',
      topicId,
      submatterId: 'new-1',
      reviewedAt: '2026-02-26',
    });
    const reviewed = state.topicSubmattersByTopic[topicId].find((item) => item.id === 'new-1');
    expect(reviewed?.lastReviewedAt).toBe('2026-02-26');
    expect(state.meta.changeToken).toBe(3);

    vi.setSystemTime(new Date('2026-02-26T10:03:00.000Z'));
    state = appReducer(state, {
      type: 'remove-topic-submatter',
      topicId,
      submatterId: 'new-1',
    });
    expect(state.topicSubmattersByTopic[topicId].some((item) => item.id === 'new-1')).toBe(false);
    expect(state.meta.changeToken).toBe(4);
    vi.useRealTimers();
  });
});
