import { RestActivity } from '../../../../types';
import { BreakSelection } from '../store/types';

export interface QuickBreakOption {
  id: string;
  label: string;
  description: string;
  recommendedFor: 'shortBreak' | 'longBreak' | 'both';
}

export const QUICK_BREAK_OPTIONS: QuickBreakOption[] = [
  {
    id: 'quick-blink-eyes',
    label: 'Piscar os olhos por 20s',
    description: 'Alivia a tensao visual em pausas curtas.',
    recommendedFor: 'shortBreak',
  },
  {
    id: 'quick-hydrate',
    label: 'Beber um copo de agua',
    description: 'Recupera foco sem perder ritmo.',
    recommendedFor: 'both',
  },
  {
    id: 'quick-run',
    label: 'Correr leve por 5 minutos',
    description: 'Ativa circulacao e energia para o proximo bloco.',
    recommendedFor: 'longBreak',
  },
  {
    id: 'quick-eat',
    label: 'Comer algo leve',
    description: 'Lanche rapido para manter concentracao.',
    recommendedFor: 'both',
  },
  {
    id: 'quick-stretch',
    label: 'Alongar pescoco e ombros',
    description: 'Reduz rigidez de quem ficou muito tempo sentado.',
    recommendedFor: 'shortBreak',
  },
];

const isRestActivityForDate = (activity: RestActivity, selectedDate: Date): boolean => {
  const dateString = selectedDate.toISOString().split('T')[0];
  const dayOfWeek = selectedDate.getDay();

  if (activity.type === 'DAILY') return true;
  if (activity.type === 'WEEKLY') return activity.daysOfWeek?.includes(dayOfWeek) ?? false;
  if (activity.type === 'ONCE') return activity.specificDate === dateString;

  return false;
};

export const splitRestActivitiesByDate = (activities: RestActivity[], selectedDate: Date) => {
  const pendingActivities = [...activities]
    .filter((activity) => !activity.isCompleted)
    .sort((left, right) => left.order - right.order);

  const today: RestActivity[] = [];
  const otherDays: RestActivity[] = [];

  pendingActivities.forEach((activity) => {
    if (isRestActivityForDate(activity, selectedDate)) {
      today.push(activity);
      return;
    }

    otherDays.push(activity);
  });

  return {
    today,
    otherDays,
  };
};

export const createRestBreakSelection = (activity: RestActivity): BreakSelection => ({
  key: `rest:${activity.id}`,
  label: activity.title,
  source: 'REST_ACTIVITY',
});

export const createQuickBreakSelection = (option: QuickBreakOption): BreakSelection => ({
  key: option.id,
  label: option.label,
  source: 'QUICK_OPTION',
});

export const getRestActivityIdFromSelection = (selection: BreakSelection | null): string | null => {
  if (!selection || selection.source !== 'REST_ACTIVITY') return null;
  if (!selection.key.startsWith('rest:')) return null;

  return selection.key.slice('rest:'.length);
};

export const resolveBreakSelectionLabel = (
  selection: BreakSelection | null,
  activities: RestActivity[],
): string | null => {
  if (!selection) return null;

  const restActivityId = getRestActivityIdFromSelection(selection);
  if (!restActivityId) {
    return selection.label;
  }

  const latestActivity = activities.find((activity) => activity.id === restActivityId);
  return latestActivity?.title || selection.label;
};
