import { describe, expect, it } from 'vitest';
import { calculateNextSrsState, resolveDailyStudy } from '../app/contentSubmatters';
import type { TopicNode, TopicSubmatter } from '../app/types';

describe('SRS (Spaced Repetition System) SuperMemo-2 algorithm', () => {
  const baseSubmatter: TopicSubmatter = {
    id: 'sub-1',
    title: 'Constitucional: Direitos Fundamentais',
    grade: 'E',
    lastReviewedAt: null,
    errorNote: '',
    actionNote: '',
    createdAt: '2026-07-08',
    updatedAt: '2026-07-08',
    srsInterval: 0,
    srsEase: 2.5,
    srsRepetitions: 0,
    srsNextReview: null,
  };

  it('calcula o proximo estado SRS para avaliacao "bad" (Errei)', () => {
    const nextState = calculateNextSrsState(baseSubmatter, 'bad', '2026-07-08');
    expect(nextState.grade).toBe('E');
    expect(nextState.srsInterval).toBe(1);
    expect(nextState.srsRepetitions).toBe(0);
    expect(nextState.srsEase).toBe(2.3); // 2.5 - 0.2
    expect(nextState.srsNextReview).toBe('2026-07-09');
  });

  it('calcula o proximo estado SRS para avaliacao "hard" (Dificil)', () => {
    const nextState = calculateNextSrsState(baseSubmatter, 'hard', '2026-07-08');
    expect(nextState.grade).toBe('D');
    expect(nextState.srsInterval).toBe(1); // repetitions = 1
    expect(nextState.srsRepetitions).toBe(1);
    expect(nextState.srsEase).toBe(2.35); // 2.5 - 0.15
    expect(nextState.srsNextReview).toBe('2026-07-09');

    // 2nd repetition
    const secondState = calculateNextSrsState({ ...baseSubmatter, srsRepetitions: 1, srsEase: 2.35, srsInterval: 1 }, 'hard', '2026-07-08');
    expect(secondState.srsInterval).toBe(3);
    expect(secondState.srsRepetitions).toBe(2);

    // 3rd repetition
    const thirdState = calculateNextSrsState({ ...baseSubmatter, srsRepetitions: 2, srsEase: 2.2, srsInterval: 3 }, 'hard', '2026-07-08');
    expect(thirdState.srsInterval).toBe(5); // Math.round(3 * 2.2 * 0.8) = Math.round(5.28) = 5
  });

  it('calcula o proximo estado SRS para avaliacao "good" (Bom)', () => {
    const nextState = calculateNextSrsState(baseSubmatter, 'good', '2026-07-08');
    expect(nextState.grade).toBe('B');
    expect(nextState.srsInterval).toBe(1); // repetitions = 1
    expect(nextState.srsRepetitions).toBe(1);
    expect(nextState.srsEase).toBe(2.5); // stays 2.5
    expect(nextState.srsNextReview).toBe('2026-07-09');

    // 2nd repetition
    const secondState = calculateNextSrsState({ ...baseSubmatter, srsRepetitions: 1, srsEase: 2.5, srsInterval: 1 }, 'good', '2026-07-08');
    expect(secondState.srsInterval).toBe(6);
    expect(secondState.srsRepetitions).toBe(2);

    // 3rd repetition
    const thirdState = calculateNextSrsState({ ...baseSubmatter, srsRepetitions: 2, srsEase: 2.5, srsInterval: 6 }, 'good', '2026-07-08');
    expect(thirdState.srsInterval).toBe(15); // Math.round(6 * 2.5) = 15
  });

  it('calcula o proximo estado SRS para avaliacao "easy" (Facil)', () => {
    const nextState = calculateNextSrsState(baseSubmatter, 'easy', '2026-07-08');
    expect(nextState.grade).toBe('A');
    expect(nextState.srsInterval).toBe(2); // repetitions = 1 (easy maps to 2 days)
    expect(nextState.srsRepetitions).toBe(1);
    expect(nextState.srsEase).toBe(2.65); // 2.5 + 0.15
    expect(nextState.srsNextReview).toBe('2026-07-10');

    // 2nd repetition
    const secondState = calculateNextSrsState({ ...baseSubmatter, srsRepetitions: 1, srsEase: 2.65, srsInterval: 2 }, 'easy', '2026-07-08');
    expect(secondState.srsInterval).toBe(8);
    expect(secondState.srsRepetitions).toBe(2);

    // 3rd repetition
    const thirdState = calculateNextSrsState({ ...baseSubmatter, srsRepetitions: 2, srsEase: 2.8, srsInterval: 8 }, 'easy', '2026-07-08');
    expect(thirdState.srsInterval).toBe(28); // Math.round(8 * 2.95 * 1.2) = Math.round(28.32) = 28
  });
});

describe('resolveDailyStudy', () => {
  const topics: TopicNode[] = [
    { id: 't1', subject: 'portugues', title: 'Português 1', parentId: null, isLeaf: true, priority: 'alta', sourceRef: '' },
    { id: 't2', subject: 'rlm', title: 'RLM 1', parentId: null, isLeaf: true, priority: 'media', sourceRef: '' },
    { id: 't3', subject: 'legislacao', title: 'Legis 1', parentId: null, isLeaf: true, priority: 'alta', sourceRef: '' },
  ];

  it('resolve materia nova e materia de revisao a partir do estado', () => {
    const mockState = {
      topicSubmattersByTopic: {
        t1: [{ id: 'sub-t1', title: 'Português 1 Sub', grade: 'E' as const, lastReviewedAt: null, errorNote: '', actionNote: '', createdAt: '2026-07-08', updatedAt: '2026-07-08' }],
        t2: [{ id: 'sub-t2', title: 'RLM 1 Sub', grade: 'C' as const, lastReviewedAt: '2026-07-01', srsNextReview: '2026-07-08', srsInterval: 7, srsEase: 2.5, srsRepetitions: 1, errorNote: '', actionNote: '', createdAt: '2026-07-01', updatedAt: '2026-07-01' }],
        t3: [{ id: 'sub-t3', title: 'Legis 1 Sub', grade: 'A' as const, lastReviewedAt: '2026-07-01', srsNextReview: '2026-07-15', srsInterval: 14, srsEase: 2.5, srsRepetitions: 2, errorNote: '', actionNote: '', createdAt: '2026-07-01', updatedAt: '2026-07-01' }],
      },
    };

    const study = resolveDailyStudy(mockState, '2026-07-08', topics);

    expect(study.isAllRepeated).toBe(false);
    expect(study.newMatter?.topic.id).toBe('t1'); // unstudied
    expect(study.reviewMatter?.topic.id).toBe('t2'); // studied and due today (2026-07-08)
  });

  it('retorna duas revisoes se todos os topicos ja foram estudados', () => {
    const mockState = {
      topicSubmattersByTopic: {
        t1: [{ id: 'sub-t1', title: 'Português 1 Sub', grade: 'C' as const, lastReviewedAt: '2026-07-02', srsNextReview: '2026-07-08', srsInterval: 6, srsEase: 2.5, srsRepetitions: 1, errorNote: '', actionNote: '', createdAt: '2026-07-02', updatedAt: '2026-07-02' }],
        t2: [{ id: 'sub-t2', title: 'RLM 1 Sub', grade: 'E' as const, lastReviewedAt: '2026-07-07', srsNextReview: '2026-07-08', srsInterval: 1, srsEase: 2.3, srsRepetitions: 0, errorNote: '', actionNote: '', createdAt: '2026-07-07', updatedAt: '2026-07-07' }],
        t3: [{ id: 'sub-t3', title: 'Legis 1 Sub', grade: 'A' as const, lastReviewedAt: '2026-07-01', srsNextReview: '2026-07-15', srsInterval: 14, srsEase: 2.5, srsRepetitions: 2, errorNote: '', actionNote: '', createdAt: '2026-07-01', updatedAt: '2026-07-01' }],
      },
    };

    const study = resolveDailyStudy(mockState, '2026-07-08', topics);

    expect(study.isAllRepeated).toBe(true);
    expect(study.newMatter?.topic.id).toBe('t2'); // most urgent (grade E)
    expect(study.reviewMatter?.topic.id).toBe('t1'); // second most urgent (grade C)
  });
});
