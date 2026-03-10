import { TOPIC_STALE_BUCKETS_DAYS } from './constants';
import type { TopicGrade, TopicNode, TopicProgress, TopicSubmatter } from './types';

const nowIsoDate = (): string => new Date().toISOString().slice(0, 10);

const createSubmatterId = (topicId: string): string =>
  `sub-${topicId}-${Math.random().toString(16).slice(2)}-${Date.now()}`;

const mapLegacyStatusToGrade = (status: TopicProgress['status']): TopicGrade => {
  switch (status) {
    case 'acertado':
      return 'A';
    case 'em_progresso':
      return 'C';
    case 'nao_iniciado':
      return 'E';
    default:
      return 'E';
  }
};

const toIsoDate = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

export const normalizeTopicSubmatter = (submatter: TopicSubmatter): TopicSubmatter => {
  const timestamp = new Date().toISOString();
  return {
    ...submatter,
    grade: submatter.grade ?? 'E',
    lastReviewedAt: toIsoDate(submatter.lastReviewedAt),
    errorNote: submatter.errorNote ?? '',
    actionNote: submatter.actionNote ?? '',
    createdAt: submatter.createdAt ?? timestamp,
    updatedAt: submatter.updatedAt ?? timestamp,
  };
};

export const migrateTopicSubmattersFromLegacy = (
  leafTopics: TopicNode[],
  topicProgress: Record<string, TopicProgress>,
): Record<string, TopicSubmatter[]> => {
  const timestamp = new Date().toISOString();

  return leafTopics.reduce<Record<string, TopicSubmatter[]>>((accumulator, topic) => {
    const legacy = topicProgress[topic.id];
    accumulator[topic.id] = [
      {
        id: createSubmatterId(topic.id),
        title: topic.title,
        grade: mapLegacyStatusToGrade(legacy?.status ?? 'nao_iniciado'),
        lastReviewedAt: toIsoDate(legacy?.updatedAt ?? null),
        errorNote: legacy?.evidenceNote ?? '',
        actionNote: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];

    return accumulator;
  }, {});
};

export interface TopicGradesSummary {
  byGrade: Record<TopicGrade, number>;
  total: number;
}

export interface TopicStaleSummary {
  byDays: Record<number, number>;
}

const createEmptyGrades = (): Record<TopicGrade, number> => ({
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  E: 0,
});

export const buildGradesSummary = (
  topicSubmattersByTopic: Record<string, TopicSubmatter[]>,
): TopicGradesSummary => {
  const byGrade = createEmptyGrades();
  const allItems = Object.values(topicSubmattersByTopic).flat();

  for (const submatter of allItems) {
    byGrade[submatter.grade] += 1;
  }

  return {
    byGrade,
    total: allItems.length,
  };
};

const daysBetween = (fromIsoDate: string, toIsoDate: string): number => {
  const from = new Date(`${fromIsoDate}T00:00:00Z`);
  const to = new Date(`${toIsoDate}T00:00:00Z`);
  const diff = to.getTime() - from.getTime();
  return Math.floor(diff / 86_400_000);
};

export const buildStaleSummary = (
  topicSubmattersByTopic: Record<string, TopicSubmatter[]>,
  referenceDate = nowIsoDate(),
): TopicStaleSummary => {
  const byDays = TOPIC_STALE_BUCKETS_DAYS.reduce<Record<number, number>>((accumulator, days) => {
    accumulator[days] = 0;
    return accumulator;
  }, {});

  const allItems = Object.values(topicSubmattersByTopic).flat();
  for (const item of allItems) {
    if (!item.lastReviewedAt) {
      for (const bucket of TOPIC_STALE_BUCKETS_DAYS) {
        byDays[bucket] += 1;
      }
      continue;
    }

    const gap = daysBetween(item.lastReviewedAt, referenceDate);
    for (const bucket of TOPIC_STALE_BUCKETS_DAYS) {
      if (gap > bucket) {
        byDays[bucket] += 1;
      }
    }
  }

  return { byDays };
};

export const getTodayIsoDate = (): string => nowIsoDate();
