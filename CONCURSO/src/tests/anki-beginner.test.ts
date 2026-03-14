import { describe, expect, it } from 'vitest';
import {
  calculateAnkiConsistencyLast7Days,
  calculateAnkiProjection,
  countActiveDaysAvailableToSeptember,
} from '../app/anki';
import { appReducer } from '../app/AppContext';
import { createInitialState } from '../app/seed';

describe('anki beginner helpers', () => {
  it('considera pausa adicional na projeção', () => {
    const withoutPause = calculateAnkiProjection({
      targetCards: 100,
      newCardsPerActiveDay: 10,
      alreadyAdded: 0,
      referenceDate: '2026-03-14',
    });

    const withSaturdayPause = calculateAnkiProjection({
      targetCards: 100,
      newCardsPerActiveDay: 10,
      alreadyAdded: 0,
      pauseWeekdays: [6],
      referenceDate: '2026-03-14',
    });

    expect(withoutPause.estimatedFinishDate).toBe('2026-03-25');
    expect(withSaturdayPause.estimatedFinishDate).toBe('2026-03-27');
  });

  it('usa data base max(hoje, START_DATE)', () => {
    const projection = calculateAnkiProjection({
      targetCards: 25,
      newCardsPerActiveDay: 25,
      alreadyAdded: 0,
      referenceDate: '2026-04-05',
    });

    expect(projection.estimatedFinishDate).toBe('2026-04-06');
  });

  it('calcula consistência de 7 dias com pausas e logs', () => {
    const consistency = calculateAnkiConsistencyLast7Days({
      pauseWeekdays: [6],
      referenceDate: '2026-03-16',
      dailyLogs: {
        '2026-03-10': { date: '2026-03-10', newCards: 20, reviews: 80 },
        '2026-03-12': { date: '2026-03-12', newCards: 25, reviews: 90 },
      },
    });

    expect(consistency.plannedActiveDays).toBe(5);
    expect(consistency.loggedDays).toBe(2);
    expect(consistency.consistencyPercent).toBe(40);
  });

  it('conta dias ativos até setembro com pausas', () => {
    const noPause = countActiveDaysAvailableToSeptember([], '2026-03-14');
    const withPauses = countActiveDaysAvailableToSeptember([3, 6], '2026-03-14');

    expect(noPause).toBeGreaterThan(withPauses);
    expect(withPauses).toBeGreaterThan(0);
  });
});

describe('anki reducer actions', () => {
  it('upsert de log diário atualiza acumulados por delta', () => {
    const initialState = createInitialState();

    const afterFirstLog = appReducer(initialState, {
      type: 'upsert-anki-daily-log',
      log: {
        date: '2026-03-10',
        newCards: 10,
        reviews: 30,
      },
    });

    const afterUpdateSameDate = appReducer(afterFirstLog, {
      type: 'upsert-anki-daily-log',
      log: {
        date: '2026-03-10',
        newCards: 16,
        reviews: 12,
      },
    });

    expect(afterFirstLog.ankiStats.newCardsAdded).toBe(10);
    expect(afterFirstLog.ankiStats.reviewsDone).toBe(30);
    expect(afterUpdateSameDate.ankiStats.newCardsAdded).toBe(16);
    expect(afterUpdateSameDate.ankiStats.reviewsDone).toBe(12);
  });

  it('set-anki-config normaliza pauseWeekdays', () => {
    const state = createInitialState();

    const updated = appReducer(state, {
      type: 'set-anki-config',
      patch: {
        pauseWeekdays: [6, 2, 2, 5],
      },
    });

    expect(updated.ankiConfig.pauseWeekdays).toEqual([2, 5, 6]);
  });
});
