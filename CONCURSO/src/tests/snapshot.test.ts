import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, normalizeStateForCurrentPlan } from '../app/seed';
import { buildSnapshot, loadStateSnapshot, saveStateSnapshot } from '../app/storage';
import { FALLBACK_BACKUP_KEY, STORAGE_KEY } from '../app/constants';

describe('snapshot storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('salva e recarrega estado no localStorage', () => {
    const state = createInitialState();
    saveStateSnapshot(state);

    const loaded = loadStateSnapshot();
    expect(loaded?.appState.selectedDate).toBe(state.selectedDate);
    expect(loaded?.schemaVersion).toBe(state.schemaVersion);
  });

  it('gera snapshot compatível para exportação', () => {
    const snapshot = buildSnapshot(createInitialState());
    expect(snapshot.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(snapshot.appState.schemaVersion).toBe(snapshot.schemaVersion);
  });

  it('ignora payload inválido', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"foo": "bar"}');
    expect(loadStateSnapshot()).toBeNull();
  });

  it('não quebra quando quota estoura e tenta fallback', () => {
    const originalSetItem = Storage.prototype.setItem;
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    let callCount = 0;

    setItemSpy.mockImplementation(function (this: Storage, key: string, value: string): void {
      callCount += 1;
      if (callCount === 1 && key === STORAGE_KEY) {
        throw new DOMException('quota', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    });

    window.localStorage.setItem(FALLBACK_BACKUP_KEY, '{"old":"backup"}');

    expect(() => saveStateSnapshot(createInitialState())).not.toThrow();
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    setItemSpy.mockRestore();
  });

  it('normaliza novos campos de anki em snapshot legado', () => {
    const state = createInitialState();
    const legacyLike = {
      ...state,
      ankiConfig: { ...state.ankiConfig },
      ankiStats: {
        newCardsAdded: 10,
        reviewsDone: 20,
      },
    } as unknown as ReturnType<typeof createInitialState>;

    delete (legacyLike.ankiConfig as { pauseWeekdays?: unknown }).pauseWeekdays;
    delete (legacyLike.ankiStats as { dailyLogs?: unknown }).dailyLogs;

    const normalized = normalizeStateForCurrentPlan(legacyLike);
    expect(normalized.ankiConfig.pauseWeekdays).toEqual([]);
    expect(normalized.ankiStats.dailyLogs).toEqual({});
  });
});
