import { TOPIC_STALE_BUCKETS_DAYS } from './constants';
import type { SubjectKey, TopicGrade, TopicNode, TopicProgress, TopicSubmatter } from './types';
import { getTopicDisplayTitle } from './topics';

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
        title: getTopicDisplayTitle(topic),
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

export interface TopicReviewQueueItem {
  topicId: string;
  topicTitle: string;
  subject: SubjectKey;
  submatterId: string;
  submatterTitle: string;
  grade: TopicGrade;
  lastReviewedAt: string | null;
  daysSinceReview: number | null;
  staleBucket: 'unreviewed' | 'fresh' | 'warning' | 'critical';
  needsReview: boolean;
}

export interface TopicRollup {
  topicId: string;
  total: number;
  byGrade: Record<TopicGrade, number>;
  currentGrade: TopicGrade;
  worstGrade: TopicGrade | null;
  dominantGrade: TopicGrade | null;
  reviewNowCount: number;
  staleCount: number;
  criticalStaleCount: number;
  unreviewedCount: number;
}

const GRADE_SEVERITY: Record<TopicGrade, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
};

const createEmptyGrades = (): Record<TopicGrade, number> => ({
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  E: 0,
});

export const getTopicCurrentGrade = (submatters: TopicSubmatter[]): TopicGrade => {
  const byGrade = createEmptyGrades();

  for (const submatter of submatters) {
    byGrade[submatter.grade] += 1;
  }

  return pickWorstGrade(byGrade) ?? 'E';
};

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

export const getSubmatterReviewAgeDays = (
  submatter: Pick<TopicSubmatter, 'lastReviewedAt'>,
  referenceDate = nowIsoDate(),
): number | null => {
  if (!submatter.lastReviewedAt) {
    return null;
  }

  return Math.max(0, daysBetween(submatter.lastReviewedAt, referenceDate));
};

export const getSubmatterStaleBucket = (
  submatter: Pick<TopicSubmatter, 'lastReviewedAt'>,
  referenceDate = nowIsoDate(),
): TopicReviewQueueItem['staleBucket'] => {
  const daysSinceReview = getSubmatterReviewAgeDays(submatter, referenceDate);

  if (daysSinceReview === null) {
    return 'unreviewed';
  }

  if (daysSinceReview > 15) {
    return 'critical';
  }

  if (daysSinceReview > 7) {
    return 'warning';
  }

  return 'fresh';
};

export const shouldReviewSubmatterNow = (
  submatter: Pick<TopicSubmatter, 'grade' | 'lastReviewedAt'>,
  referenceDate = nowIsoDate(),
): boolean => {
  const daysSinceReview = getSubmatterReviewAgeDays(submatter, referenceDate);

  if (daysSinceReview === null) {
    return true;
  }

  if (submatter.grade === 'E' || submatter.grade === 'D') {
    return true;
  }

  if (submatter.grade === 'C' && daysSinceReview > 7) {
    return true;
  }

  return daysSinceReview > 15;
};

const compareByPriority = (
  left: Pick<TopicReviewQueueItem, 'grade' | 'daysSinceReview' | 'staleBucket' | 'topicTitle' | 'submatterTitle'>,
  right: Pick<TopicReviewQueueItem, 'grade' | 'daysSinceReview' | 'staleBucket' | 'topicTitle' | 'submatterTitle'>,
): number => {
  const severityDiff = GRADE_SEVERITY[right.grade] - GRADE_SEVERITY[left.grade];
  if (severityDiff !== 0) {
    return severityDiff;
  }

  const leftAge = left.daysSinceReview ?? Number.POSITIVE_INFINITY;
  const rightAge = right.daysSinceReview ?? Number.POSITIVE_INFINITY;
  if (rightAge !== leftAge) {
    return rightAge - leftAge;
  }

  if (left.staleBucket !== right.staleBucket) {
    const staleOrder = {
      unreviewed: 3,
      critical: 2,
      warning: 1,
      fresh: 0,
    } as const;
    return staleOrder[right.staleBucket] - staleOrder[left.staleBucket];
  }

  const topicDiff = left.topicTitle.localeCompare(right.topicTitle, 'pt-BR');
  if (topicDiff !== 0) {
    return topicDiff;
  }

  return left.submatterTitle.localeCompare(right.submatterTitle, 'pt-BR');
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

export const buildReviewQueue = (
  topicSubmattersByTopic: Record<string, TopicSubmatter[]>,
  topics: TopicNode[],
  referenceDate = nowIsoDate(),
): TopicReviewQueueItem[] => {
  const topicMap = topics.reduce<Record<string, TopicNode>>((accumulator, topic) => {
    accumulator[topic.id] = topic;
    return accumulator;
  }, {});

  return Object.entries(topicSubmattersByTopic)
    .flatMap(([topicId, submatters]) => {
      const topic = topicMap[topicId];
      if (!topic || !topic.isLeaf) {
        return [];
      }

      return submatters.map<TopicReviewQueueItem>((submatter) => ({
        topicId,
        topicTitle: getTopicDisplayTitle(topic),
        subject: topic.subject,
        submatterId: submatter.id,
        submatterTitle: submatter.title,
        grade: submatter.grade,
        lastReviewedAt: submatter.lastReviewedAt,
        daysSinceReview: getSubmatterReviewAgeDays(submatter, referenceDate),
        staleBucket: getSubmatterStaleBucket(submatter, referenceDate),
        needsReview: shouldReviewSubmatterNow(submatter, referenceDate),
      }));
    })
    .sort(compareByPriority);
};

const pickWorstGrade = (byGrade: Record<TopicGrade, number>): TopicGrade | null => {
  const gradesDescending: TopicGrade[] = ['E', 'D', 'C', 'B', 'A'];
  return gradesDescending.find((grade) => byGrade[grade] > 0) ?? null;
};

const pickDominantGrade = (byGrade: Record<TopicGrade, number>): TopicGrade | null => {
  const gradesDescending: TopicGrade[] = ['E', 'D', 'C', 'B', 'A'];

  return gradesDescending.reduce<TopicGrade | null>((best, candidate) => {
    if (!best) {
      return byGrade[candidate] > 0 ? candidate : null;
    }

    if (byGrade[candidate] > byGrade[best]) {
      return candidate;
    }

    return best;
  }, null);
};

export const buildTopicRollups = (
  topicSubmattersByTopic: Record<string, TopicSubmatter[]>,
  topics: TopicNode[],
  referenceDate = nowIsoDate(),
): Record<string, TopicRollup> => {
  return topics.reduce<Record<string, TopicRollup>>((accumulator, topic) => {
    if (!topic.isLeaf) {
      return accumulator;
    }

    const submatters = topicSubmattersByTopic[topic.id] ?? [];
    const byGrade = createEmptyGrades();
    let reviewNowCount = 0;
    let staleCount = 0;
    let criticalStaleCount = 0;
    let unreviewedCount = 0;

    for (const submatter of submatters) {
      byGrade[submatter.grade] += 1;

      const staleBucket = getSubmatterStaleBucket(submatter, referenceDate);
      if (staleBucket === 'warning' || staleBucket === 'critical' || staleBucket === 'unreviewed') {
        staleCount += 1;
      }
      if (staleBucket === 'critical') {
        criticalStaleCount += 1;
      }
      if (staleBucket === 'unreviewed') {
        unreviewedCount += 1;
      }
      if (shouldReviewSubmatterNow(submatter, referenceDate)) {
        reviewNowCount += 1;
      }
    }

    accumulator[topic.id] = {
      topicId: topic.id,
      total: submatters.length,
      byGrade,
      currentGrade: getTopicCurrentGrade(submatters),
      worstGrade: pickWorstGrade(byGrade),
      dominantGrade: pickDominantGrade(byGrade),
      reviewNowCount,
      staleCount,
      criticalStaleCount,
      unreviewedCount,
    };

    return accumulator;
  }, {});
};

export const getTodayIsoDate = (): string => nowIsoDate();
