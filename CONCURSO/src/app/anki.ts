import { END_DATE, START_DATE } from './constants';
import { enumerateDateRange, getWeekday, isSunday, parseIsoDate, toIsoDate } from './dateUtils';
import type { AnkiPauseWeekday, AppState } from './types';

interface ProjectionInput {
  targetCards: number;
  newCardsPerActiveDay: number;
  alreadyAdded: number;
  pauseWeekdays?: AnkiPauseWeekday[];
  referenceDate?: string;
}

interface ConsistencyInput {
  pauseWeekdays: AnkiPauseWeekday[];
  dailyLogs: AppState['ankiStats']['dailyLogs'];
  referenceDate?: string;
}

const normalizePauseWeekdays = (pauseWeekdays: AnkiPauseWeekday[] | undefined): Set<AnkiPauseWeekday> =>
  new Set(
    (pauseWeekdays ?? []).filter(
      (weekday): weekday is AnkiPauseWeekday => Number.isInteger(weekday) && weekday >= 1 && weekday <= 6,
    ),
  );

const resolveProjectionBaseDate = (referenceDate: string | undefined): string => {
  const today = referenceDate ?? new Date().toISOString().slice(0, 10);
  return today > START_DATE ? today : START_DATE;
};

const isActiveDate = (isoDate: string, pauseWeekdays: Set<AnkiPauseWeekday>): boolean => {
  if (isSunday(isoDate)) {
    return false;
  }

  const weekday = getWeekday(isoDate);
  if (weekday === 0) {
    return false;
  }

  return !pauseWeekdays.has(weekday as AnkiPauseWeekday);
};

const buildWindowDates = (referenceDate: string, days: number): string[] => {
  const end = parseIsoDate(referenceDate);
  const dates: string[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(end.getTime() - offset * 86_400_000);
    dates.push(toIsoDate(current));
  }

  return dates;
};

export const countActiveDaysAvailableToSeptember = (
  pauseWeekdays: AnkiPauseWeekday[],
  referenceDate?: string,
): number => {
  const pauseSet = normalizePauseWeekdays(pauseWeekdays);
  const baseDate = resolveProjectionBaseDate(referenceDate);
  const rangeEnd = END_DATE < '2026-09-30' ? END_DATE : '2026-09-30';

  if (baseDate > rangeEnd) {
    return 0;
  }

  return enumerateDateRange(baseDate, rangeEnd).filter((date) => isActiveDate(date, pauseSet)).length;
};

export const calculateAnkiConsistencyLast7Days = ({
  pauseWeekdays,
  dailyLogs,
  referenceDate,
}: ConsistencyInput): {
  plannedActiveDays: number;
  loggedDays: number;
  consistencyPercent: number;
} => {
  const pauseSet = normalizePauseWeekdays(pauseWeekdays);
  const windowEnd = referenceDate ?? new Date().toISOString().slice(0, 10);
  const windowDates = buildWindowDates(windowEnd, 7);

  let plannedActiveDays = 0;
  let loggedDays = 0;

  for (const date of windowDates) {
    const active = isActiveDate(date, pauseSet);
    if (!active) {
      continue;
    }

    plannedActiveDays += 1;
    if (dailyLogs[date]) {
      loggedDays += 1;
    }
  }

  const consistencyPercent =
    plannedActiveDays === 0 ? 100 : Math.round((loggedDays / plannedActiveDays) * 100);

  return {
    plannedActiveDays,
    loggedDays,
    consistencyPercent,
  };
};

export const calculateAnkiProjection = ({
  targetCards,
  newCardsPerActiveDay,
  alreadyAdded,
  pauseWeekdays = [],
  referenceDate,
}: ProjectionInput): {
  remainingCards: number;
  estimatedFinishDate: string | null;
  activeDaysNeeded: number;
  activeDaysAvailableToSeptember: number;
} => {
  const pauseSet = normalizePauseWeekdays(pauseWeekdays);
  const baseDate = resolveProjectionBaseDate(referenceDate);
  const activeDates =
    baseDate > END_DATE
      ? []
      : enumerateDateRange(baseDate, END_DATE).filter((date) => isActiveDate(date, pauseSet));
  const activeDatesToSeptember = activeDates.filter((date) => date <= '2026-09-30');

  const remainingCards = Math.max(0, targetCards - alreadyAdded);

  if (remainingCards === 0) {
    return {
      remainingCards,
      estimatedFinishDate: baseDate,
      activeDaysNeeded: 0,
      activeDaysAvailableToSeptember: activeDatesToSeptember.length,
    };
  }

  if (newCardsPerActiveDay <= 0) {
    return {
      remainingCards,
      estimatedFinishDate: null,
      activeDaysNeeded: 0,
      activeDaysAvailableToSeptember: activeDatesToSeptember.length,
    };
  }

  const activeDaysNeeded = Math.ceil(remainingCards / newCardsPerActiveDay);
  const estimatedFinishDate = activeDates[activeDaysNeeded - 1] ?? null;

  return {
    remainingCards,
    estimatedFinishDate,
    activeDaysNeeded,
    activeDaysAvailableToSeptember: activeDatesToSeptember.length,
  };
};
