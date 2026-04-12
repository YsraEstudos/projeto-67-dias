import {
  DailyPlannerBlock,
  DailyPlannerDayInputs,
  DailyPlannerPlan,
  DailyPlannerPreferences,
  DailyPlannerSession,
  DailyPlannerTimeSummary,
} from '../types';

export const DAILY_PLANNER_DEFAULTS: DailyPlannerPreferences = {
  defaultSleepTime: '22:00',
  defaultWindDownMinutes: 10,
  mealDurationMinutes: 20,
  dogDurationMinutes: 25,
};

export const DAILY_PLANNER_WIND_DOWN_BLOCK_ID = 'wind-down_close-the-day';
export const DAILY_PLANNER_WIND_DOWN_BLOCK_TITLE = 'Escovar os dentes e preparar para dormir';

const padTime = (value: number): string => value.toString().padStart(2, '0');

export const formatMinutesAsTime = (minutes: number): string => {
  const normalized = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${padTime(hours)}:${padTime(mins)}`;
};

export const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return (hours * 60) + minutes;
};

export const getCurrentTimeLabel = (now = new Date()): string =>
  `${padTime(now.getHours())}:${padTime(now.getMinutes())}`;

export const getCurrentMinutes = (now = new Date()): number =>
  (now.getHours() * 60) + now.getMinutes();

export const getReservedMinutes = (inputs: DailyPlannerDayInputs): number =>
  (inputs.mealPending ? inputs.mealDurationMinutes : 0)
  + (inputs.dogPending ? inputs.dogDurationMinutes : 0);

export const getWindDownStartTime = (
  sleepTime: string,
  windDownMinutes: number,
): string => formatMinutesAsTime(parseTimeToMinutes(sleepTime) - windDownMinutes);

export const createDailyPlannerInputs = (
  preferences: DailyPlannerPreferences = DAILY_PLANNER_DEFAULTS,
): DailyPlannerDayInputs => ({
  sleepTime: preferences.defaultSleepTime,
  windDownMinutes: preferences.defaultWindDownMinutes,
  mealPending: false,
  mealDurationMinutes: preferences.mealDurationMinutes,
  dogPending: false,
  dogDurationMinutes: preferences.dogDurationMinutes,
  pendingTasksText: '',
});

export const createDailyPlannerSession = (
  date: string,
  preferences: DailyPlannerPreferences = DAILY_PLANNER_DEFAULTS,
): DailyPlannerSession => ({
  date,
  dayInputs: createDailyPlannerInputs(preferences),
  draftMessage: '',
  messages: [],
  latestPlan: null,
  completedBlockIds: [],
  isLoading: false,
  error: null,
  lastUpdatedAt: Date.now(),
});

export const buildDailyPlannerTimeSummary = (
  inputs: DailyPlannerDayInputs,
  scheduledBlocks: DailyPlannerBlock[] = [],
  now = new Date(),
): DailyPlannerTimeSummary => {
  const currentTime = getCurrentTimeLabel(now);
  const currentMinutes = getCurrentMinutes(now);
  const windDownStart = getWindDownStartTime(inputs.sleepTime, inputs.windDownMinutes);
  const windDownStartMinutes = parseTimeToMinutes(windDownStart);
  const availableMinutes = Math.max(0, windDownStartMinutes - currentMinutes);
  const reservedMinutes = getReservedMinutes(inputs);
  const scheduledMinutes = scheduledBlocks
    .filter((block) => block.category !== 'wind-down')
    .reduce((total, block) => total + block.durationMinutes, 0);
  const freeBufferMinutes = Math.max(0, availableMinutes - reservedMinutes - scheduledMinutes);

  return {
    currentTime,
    sleepTime: inputs.sleepTime,
    windDownStart,
    availableMinutes,
    reservedMinutes,
    scheduledMinutes,
    freeBufferMinutes,
  };
};

export const getCompletedBlockSummaries = (
  blocks: DailyPlannerBlock[],
  completedBlockIds: string[],
): string[] => {
  const completedSet = new Set(completedBlockIds);

  return blocks
    .filter((block) => completedSet.has(block.id))
    .map((block) => `${block.title} (${block.startTime}-${block.endTime})`);
};

export const buildWindDownBlock = (
  inputs: DailyPlannerDayInputs,
): DailyPlannerBlock => {
  const startTime = getWindDownStartTime(inputs.sleepTime, inputs.windDownMinutes);
  const endTime = inputs.sleepTime;
  const durationMinutes = Math.max(1, inputs.windDownMinutes);

  return {
    id: DAILY_PLANNER_WIND_DOWN_BLOCK_ID,
    title: DAILY_PLANNER_WIND_DOWN_BLOCK_TITLE,
    category: 'wind-down',
    startTime,
    endTime,
    durationMinutes,
    reason: 'Os minutos finais do dia sao reservados para higiene, desacelerar e deitar sem novas demandas.',
    required: true,
  };
};

export const ensureWindDownBlock = (
  plan: DailyPlannerPlan | null,
  inputs: DailyPlannerDayInputs,
): DailyPlannerPlan | null => {
  if (!plan) return null;

  const hasWindDownBlock = plan.scheduledBlocks.some(
    (block) => block.id === DAILY_PLANNER_WIND_DOWN_BLOCK_ID || block.category === 'wind-down',
  );

  if (hasWindDownBlock) {
    return plan;
  }

  return {
    ...plan,
    scheduledBlocks: [...plan.scheduledBlocks, buildWindDownBlock(inputs)],
  };
};

export const createPlannerBlockId = (block: Omit<DailyPlannerBlock, 'id'>): string => {
  const safeTitle = block.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return [
    block.category,
    safeTitle || 'bloco',
    block.startTime.replace(':', ''),
    block.endTime.replace(':', ''),
    String(block.durationMinutes),
  ].join('_');
};
