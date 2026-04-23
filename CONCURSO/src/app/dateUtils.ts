export const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10);

export const getLocalTodayIsoDate = (now: Date = new Date()): string => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getMillisecondsUntilNextLocalMidnight = (now: Date = new Date()): number => {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);

  return Math.max(1, nextMidnight.getTime() - now.getTime());
};

export const clampIsoDateToRange = (isoDate: string, minIsoDate: string, maxIsoDate: string): string => {
  if (isoDate < minIsoDate) {
    return minIsoDate;
  }

  if (isoDate > maxIsoDate) {
    return maxIsoDate;
  }

  return isoDate;
};

export const parseIsoDate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const enumerateDateRange = (startIso: string, endIso: string): string[] => {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const dates: string[] = [];

  for (let current = start; current <= end; current = new Date(current.getTime() + 24 * 60 * 60 * 1000)) {
    dates.push(toIsoDate(current));
  }

  return dates;
};

export const getWeekday = (isoDate: string): number => parseIsoDate(isoDate).getUTCDay();

export const isSunday = (isoDate: string): boolean => getWeekday(isoDate) === 0;

export const monthKeyOf = (isoDate: string): string => isoDate.slice(0, 7);

export const isBetweenInclusive = (isoDate: string, startIso: string, endIso: string): boolean =>
  isoDate >= startIso && isoDate <= endIso;
