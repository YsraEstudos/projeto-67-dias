import { describe, expect, it } from 'vitest';
import { RestActivity } from '../../../../types';
import {
  QUICK_BREAK_OPTIONS,
  splitRestActivitiesByDate,
} from '../../../../components/views/PomodoroView/lib/breakOptions';

const selectedDate = new Date('2026-04-12T12:00:00');

const createActivity = (overrides: Partial<RestActivity>): RestActivity => ({
  id: overrides.id || Math.random().toString(36).slice(2),
  title: overrides.title || 'Atividade',
  isCompleted: overrides.isCompleted ?? false,
  type: overrides.type || 'DAILY',
  order: overrides.order ?? 0,
  daysOfWeek: overrides.daysOfWeek,
  specificDate: overrides.specificDate,
  completedAt: overrides.completedAt,
  totalSets: overrides.totalSets,
  completedSets: overrides.completedSets,
  notes: overrides.notes,
  links: overrides.links,
  series: overrides.series,
});

describe('Pomodoro break options', () => {
  it('splits rest activities into today and other days', () => {
    const activities: RestActivity[] = [
      createActivity({ id: 'daily', title: 'Respirar', type: 'DAILY' }),
      createActivity({ id: 'weekly-today', title: 'Alongar', type: 'WEEKLY', daysOfWeek: [0] }),
      createActivity({ id: 'once-today', title: 'Comer fruta', type: 'ONCE', specificDate: '2026-04-12' }),
      createActivity({ id: 'weekly-other', title: 'Corrida longa', type: 'WEEKLY', daysOfWeek: [1] }),
      createActivity({ id: 'once-other', title: 'Yoga amanha', type: 'ONCE', specificDate: '2026-04-13' }),
      createActivity({ id: 'completed', title: 'Ja feito', type: 'DAILY', isCompleted: true }),
    ];

    const { today, otherDays } = splitRestActivitiesByDate(activities, selectedDate);

    expect(today.map((item) => item.id)).toEqual(['daily', 'weekly-today', 'once-today']);
    expect(otherDays.map((item) => item.id)).toEqual(['weekly-other', 'once-other']);
  });

  it('offers quick break suggestions for simple options', () => {
    expect(QUICK_BREAK_OPTIONS.map((item) => item.id)).toEqual(
      expect.arrayContaining(['quick-blink-eyes', 'quick-run', 'quick-eat']),
    );
  });
});
