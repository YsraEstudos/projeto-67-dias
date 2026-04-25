import { createChecklistTemplate } from './checklist';
import {
  AUTO_BACKUP_INTERVAL_MINUTES,
  END_DATE,
  FSRS_WEIGHTS,
  SCHEMA_VERSION,
  START_DATE,
} from './constants';
import { DEFAULT_MOBILE_PINNED_NAV, sanitizeMobilePinnedNav } from './mobileNavigation';
import { buildDayPlans, buildDayPlansByDate, buildMonthlyTargetsFromDayPlans } from './schedule';
import { buildCoverageMatrix, buildTopicsFromSeeds, mapExpectedCoverage } from './topics';
import { clampIsoDateToRange, getLocalTodayIsoDate } from './dateUtils';
import { getTopicDisplayTitle } from './topics';
import type {
  AppState,
  ChecklistItem,
  DayPlan,
  ExamWritingMonthlyTarget,
  ManualBlockReschedule,
  TopicProgress,
} from './types';
import { TOPIC_SECTIONS } from '../data/topicSeeds';
import { normalizeProject } from './projects';
import { migrateTopicSubmattersFromLegacy, normalizeTopicSubmatter } from './contentSubmatters';
import { normalizeTheoreticalContentItem } from './contentTheoreticalFiles';

const normalizePauseWeekdays = (
  pauseWeekdays: AppState['ankiConfig']['pauseWeekdays'] | undefined,
): AppState['ankiConfig']['pauseWeekdays'] => {
  if (!Array.isArray(pauseWeekdays)) {
    return [];
  }

  const validWeekdays = pauseWeekdays.filter(
    (weekday): weekday is AppState['ankiConfig']['pauseWeekdays'][number] =>
      Number.isInteger(weekday) && weekday >= 1 && weekday <= 6,
  );
  return Array.from(new Set(validWeekdays)).sort((left, right) => left - right);
};

const normalizeDailyLogs = (
  dailyLogs: AppState['ankiStats']['dailyLogs'] | undefined,
): AppState['ankiStats']['dailyLogs'] => {
  if (!dailyLogs || typeof dailyLogs !== 'object') {
    return {};
  }

  return Object.entries(dailyLogs).reduce<AppState['ankiStats']['dailyLogs']>((accumulator, [date, log]) => {
    if (!log || typeof log !== 'object') {
      return accumulator;
    }

    if (typeof log.date !== 'string') {
      return accumulator;
    }

    accumulator[date] = {
      date: log.date,
      newCards: Number.isFinite(log.newCards) ? Math.max(0, Math.round(log.newCards)) : 0,
      reviews: Number.isFinite(log.reviews) ? Math.max(0, Math.round(log.reviews)) : 0,
    };
    return accumulator;
  }, {});
};

export const DAY_PLANS = buildDayPlans();
export const DAY_PLANS_BY_DATE = buildDayPlansByDate(DAY_PLANS);
export const MONTHLY_TARGETS_FROM_DAY_PLANS = buildMonthlyTargetsFromDayPlans(DAY_PLANS);

export const TOPICS = buildTopicsFromSeeds(TOPIC_SECTIONS);
export const LEAF_TOPICS = TOPICS.filter((topic) => topic.isLeaf);

export const EXPECTED_COVERAGE = mapExpectedCoverage(TOPIC_SECTIONS);
export const COVERAGE_MATRIX = buildCoverageMatrix(TOPICS, EXPECTED_COVERAGE);

const normalizePlanStartDate = (value: unknown): string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return START_DATE;
  }

  if (value < START_DATE) {
    return START_DATE;
  }

  if (value > END_DATE) {
    return END_DATE;
  }

  return value;
};

export interface PlanRuntime {
  dayPlans: DayPlan[];
  dayPlansByDate: Record<string, DayPlan>;
  monthlyTargets: ExamWritingMonthlyTarget[];
}

export const buildPlanRuntime = (
  planStartDate: string,
  manualBlockReschedules: ManualBlockReschedule[] = [],
): PlanRuntime => {
  const dayPlans = buildDayPlans(planStartDate, manualBlockReschedules);
  return {
    dayPlans,
    dayPlansByDate: buildDayPlansByDate(dayPlans),
    monthlyTargets: buildMonthlyTargetsFromDayPlans(dayPlans),
  };
};

const resolveSelectedDate = (planStartDate: string): string =>
  clampIsoDateToRange(getLocalTodayIsoDate(), planStartDate, END_DATE);

const createTopicProgress = (): Record<string, TopicProgress> =>
  LEAF_TOPICS.reduce<Record<string, TopicProgress>>((accumulator, topic) => {
    accumulator[topic.id] = {
      status: 'nao_iniciado',
      evidenceNote: '',
      updatedAt: null,
    };
    return accumulator;
  }, {});

const createDailyRecords = (dayPlans: DayPlan[]) =>
  dayPlans.reduce<AppState['dailyRecords']>((accumulator, dayPlan) => {
    accumulator[dayPlan.date] = {
      date: dayPlan.date,
      checklist: createChecklistTemplate(dayPlan),
      notes: '',
    };
    return accumulator;
  }, {});

const createTopicSubmatters = (
  topicProgress: Record<string, TopicProgress>,
): AppState['topicSubmattersByTopic'] => migrateTopicSubmattersFromLegacy(LEAF_TOPICS, topicProgress);

const alignTopicSubmatterTitles = (
  topicSubmattersByTopic: AppState['topicSubmattersByTopic'],
): AppState['topicSubmattersByTopic'] =>
  LEAF_TOPICS.reduce<AppState['topicSubmattersByTopic']>((accumulator, topic) => {
    const current = topicSubmattersByTopic[topic.id] ?? [];
    const displayTitle = getTopicDisplayTitle(topic);

    accumulator[topic.id] = current.map((item) => {
      const normalized = normalizeTopicSubmatter(item);
      if (normalized.title !== topic.title || displayTitle === topic.title) {
        return normalized;
      }

      return {
        ...normalized,
        title: displayTitle,
      };
    });

    return accumulator;
  }, {});

const mergeChecklistForCurrentPlan = (
  template: ChecklistItem[],
  previousChecklist: ChecklistItem[] | undefined,
): ChecklistItem[] => {
  return template.map((templateItem) => {
    const previousItem = previousChecklist?.find((item) => item.id === templateItem.id);
    if (!previousItem || previousItem.kind !== templateItem.kind) {
      return templateItem;
    }

    const done =
      templateItem.kind === 'boolean'
        ? previousItem.done >= 1
          ? 1
          : 0
        : Math.max(
            0,
            Math.min(previousItem.done, templateItem.target === 0 ? previousItem.done : templateItem.target),
          );

    return {
      ...templateItem,
      done,
      status: done >= templateItem.target ? 'concluido' : 'pendente',
    };
  });
};

const normalizeDailyRecords = (state: AppState, dayPlans: DayPlan[]): AppState['dailyRecords'] => {
  return dayPlans.reduce<AppState['dailyRecords']>((accumulator, dayPlan) => {
    const templateChecklist = createChecklistTemplate(dayPlan);
    const previousRecord = state.dailyRecords?.[dayPlan.date];

    accumulator[dayPlan.date] = {
      date: dayPlan.date,
      checklist: mergeChecklistForCurrentPlan(templateChecklist, previousRecord?.checklist),
      notes: previousRecord?.notes ?? '',
    };

    return accumulator;
  }, {});
};

export const createInitialState = (planStartDate: string = START_DATE): AppState => {
  const normalizedPlanStartDate = normalizePlanStartDate(planStartDate);
  const runtime = buildPlanRuntime(normalizedPlanStartDate);
  const topicProgress = createTopicProgress();

  return {
    schemaVersion: SCHEMA_VERSION,
    planSettings: {
      startDate: normalizedPlanStartDate,
      startDateChangeCount: 0,
    },
    shellUi: {
      mobilePinnedNav: [...DEFAULT_MOBILE_PINNED_NAV],
    },
    selectedDate: resolveSelectedDate(normalizedPlanStartDate),
    topicProgress,
    topicSubmattersByTopic: createTopicSubmatters(topicProgress),
    theoreticalContents: [],
    dailyRecords: createDailyRecords(runtime.dayPlans),
    correctionLinks: [],
    projects: [],
    manualBlockReschedules: [],
    ankiConfig: {
      fsrsWeights: FSRS_WEIGHTS,
      retentionTarget: 90,
      additionalCardsTarget: 4500,
      newCardsPerActiveDay: 25,
      maxReviewsPerDay: 9999,
      pauseWeekdays: [],
    },
    ankiStats: {
      newCardsAdded: 0,
      reviewsDone: 0,
      dailyLogs: {},
    },
    meta: {
      changeToken: 0,
      lastChangedAt: null,
      backup: {
        lastBackupAt: null,
        lastBackupMode: null,
        lastBackupError: null,
        lastFallbackSnapshotAt: null,
        autoBackupIntervalMinutes: AUTO_BACKUP_INTERVAL_MINUTES,
      },
    },
  };
};

export const normalizeStateForCurrentPlan = (state: AppState): AppState => {
  const planStartDate = normalizePlanStartDate(state.planSettings?.startDate);
  const fallback = createInitialState(planStartDate);
  const manualBlockReschedules = Array.isArray(state.manualBlockReschedules)
    ? state.manualBlockReschedules
    : fallback.manualBlockReschedules;
  const runtime = buildPlanRuntime(planStartDate, manualBlockReschedules);
  const dailyRecords = normalizeDailyRecords(state, runtime.dayPlans);

  const topicProgress = { ...fallback.topicProgress };
  for (const topicId of Object.keys(topicProgress)) {
    const previous = state.topicProgress?.[topicId];
    if (previous) {
      topicProgress[topicId] = previous;
    }
  }

  const selectedDate = resolveSelectedDate(planStartDate);

  const topicSubmattersByTopic = (() => {
    const legacyProgress = state.topicProgress ?? fallback.topicProgress;
    const migratedFallback = migrateTopicSubmattersFromLegacy(LEAF_TOPICS, legacyProgress);
    if (!state.topicSubmattersByTopic) {
      return alignTopicSubmatterTitles(migratedFallback);
    }

    const normalized = LEAF_TOPICS.reduce<AppState['topicSubmattersByTopic']>((accumulator, topic) => {
      const current = state.topicSubmattersByTopic?.[topic.id];
      if (!Array.isArray(current) || current.length === 0) {
        accumulator[topic.id] = migratedFallback[topic.id];
        return accumulator;
      }

      accumulator[topic.id] = current.map((item) => normalizeTopicSubmatter(item));
      return accumulator;
    }, {});

    return alignTopicSubmatterTitles(normalized);
  })();

  return {
    ...fallback,
    ...state,
    schemaVersion: SCHEMA_VERSION,
    planSettings: {
      startDate: planStartDate,
      startDateChangeCount: Number.isFinite(state.planSettings?.startDateChangeCount)
        ? Math.max(0, Math.round(state.planSettings.startDateChangeCount))
        : 0,
    },
    shellUi: {
      mobilePinnedNav: sanitizeMobilePinnedNav(state.shellUi?.mobilePinnedNav),
    },
    selectedDate,
    topicProgress,
    topicSubmattersByTopic,
    theoreticalContents: Array.isArray(state.theoreticalContents)
      ? state.theoreticalContents.map((item) => normalizeTheoreticalContentItem(item))
      : fallback.theoreticalContents,
    dailyRecords,
    correctionLinks: Array.isArray(state.correctionLinks) ? state.correctionLinks : fallback.correctionLinks,
    projects: Array.isArray(state.projects)
      ? state.projects.map((project) => normalizeProject(project))
      : fallback.projects,
    manualBlockReschedules,
    ankiConfig: {
      ...fallback.ankiConfig,
      ...state.ankiConfig,
      pauseWeekdays: normalizePauseWeekdays(state.ankiConfig?.pauseWeekdays),
    },
    ankiStats: {
      ...fallback.ankiStats,
      ...state.ankiStats,
      dailyLogs: normalizeDailyLogs(state.ankiStats?.dailyLogs),
    },
    meta: {
      ...fallback.meta,
      ...state.meta,
      backup: {
        ...fallback.meta.backup,
        ...state.meta?.backup,
      },
    },
  };
};
