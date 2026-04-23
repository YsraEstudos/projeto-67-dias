import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appReducer } from '../app/AppContext';
import * as dateUtils from '../app/dateUtils';
import { createInitialState, normalizeStateForCurrentPlan, TOPICS } from '../app/seed';
import { DEFAULT_MOBILE_PINNED_NAV } from '../app/mobileNavigation';
import { buildSnapshot, loadStateSnapshot, saveStateSnapshot } from '../app/storage';
import { FALLBACK_BACKUP_KEY, STORAGE_KEY } from '../app/constants';

describe('snapshot storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      planSettings: { ...state.planSettings },
      ankiConfig: { ...state.ankiConfig },
      ankiStats: {
        newCardsAdded: 10,
        reviewsDone: 20,
      },
    } as unknown as ReturnType<typeof createInitialState>;

    delete (legacyLike.ankiConfig as { pauseWeekdays?: unknown }).pauseWeekdays;
    delete (legacyLike.ankiStats as { dailyLogs?: unknown }).dailyLogs;
    delete (legacyLike as { planSettings?: unknown }).planSettings;
    delete (legacyLike as { shellUi?: unknown }).shellUi;

    const normalized = normalizeStateForCurrentPlan(legacyLike);
    expect(normalized.planSettings.startDate).toBe('2026-03-14');
    expect(normalized.planSettings.startDateChangeCount).toBe(0);
    expect(normalized.shellUi.mobilePinnedNav).toEqual(DEFAULT_MOBILE_PINNED_NAV);
    expect(normalized.ankiConfig.pauseWeekdays).toEqual([]);
    expect(normalized.ankiStats.dailyLogs).toEqual({});
  });

  it('alinha selectedDate com o dia local ao normalizar um snapshot antigo', () => {
    const state = createInitialState();
    state.selectedDate = '2026-04-22';

    const todaySpy = vi.spyOn(dateUtils, 'getLocalTodayIsoDate').mockReturnValue('2026-04-23');
    const normalized = normalizeStateForCurrentPlan(state);

    expect(normalized.selectedDate).toBe('2026-04-23');

    todaySpy.mockRestore();
  });

  it('normaliza mobilePinnedNav com deduplicacao, validacao e limite maximo', () => {
    const state = createInitialState();
    state.shellUi.mobilePinnedNav = [
      '/',
      '/plano-diario',
      '/plano-diario',
      '/conteudo',
      '/anki',
      '/simulados-redacoes',
      '/configuracoes',
      '/correcoes',
      '/rota-invalida',
    ];

    const normalized = normalizeStateForCurrentPlan(state);

    expect(normalized.shellUi.mobilePinnedNav).toEqual([
      '/',
      '/plano-diario',
      '/conteudo',
      '/anki',
      '/simulados-redacoes',
      '/configuracoes',
    ]);
  });

  it('recalcula o plano e contabiliza alteracoes ao mudar a data de inicio', () => {
    const todaySpy = vi.spyOn(dateUtils, 'getLocalTodayIsoDate').mockReturnValue('2026-04-23');
    const state = createInitialState();
    state.selectedDate = '2026-04-17';

    const updated = appReducer(state, {
      type: 'set-plan-start-date',
      startDate: '2026-04-15',
    });

    expect(updated.planSettings.startDate).toBe('2026-04-15');
    expect(updated.planSettings.startDateChangeCount).toBe(1);
    expect(updated.selectedDate).toBe('2026-04-23');
    expect(updated.dailyRecords['2026-04-23']).toBeDefined();
    expect(updated.dailyRecords['2026-04-17']).toBeDefined();
    expect(updated.dailyRecords['2026-03-14']).toBeUndefined();

    todaySpy.mockRestore();
  });

  it('alinha o titulo da submateria padrao com o nome padronizado do topico', () => {
    const state = createInitialState();
    const architectureTopic = TOPICS.find(
      (topic) =>
        topic.isLeaf &&
        topic.title ===
          'Arquitetura de computadores: processador, memória principal/secundária e dispositivos de E/S.',
    );

    expect(architectureTopic).toBeDefined();
    if (!architectureTopic) {
      return;
    }

    state.topicSubmattersByTopic[architectureTopic.id] = [
      {
        ...state.topicSubmattersByTopic[architectureTopic.id][0],
        title: architectureTopic.title,
      },
    ];

    const normalized = normalizeStateForCurrentPlan(state);

    expect(normalized.topicSubmattersByTopic[architectureTopic.id][0].title).toBe(
      'Arquitetura: CPU, memória e I/O',
    );
  });

  it('persiste a ordem dos atalhos mobile ao pinar, mover e remover', () => {
    const state = createInitialState();

    const pinned = appReducer(state, {
      type: 'remove-mobile-nav-item',
      path: '/configuracoes',
    });
    const inserted = appReducer(pinned, {
      type: 'pin-mobile-nav-item',
      path: '/correcoes',
      targetIndex: 1,
    });
    const moved = appReducer(inserted, {
      type: 'move-mobile-nav-item',
      path: '/correcoes',
      targetIndex: 0,
    });

    expect(moved.shellUi.mobilePinnedNav[0]).toBe('/correcoes');

    const removed = appReducer(moved, {
      type: 'remove-mobile-nav-item',
      path: '/correcoes',
    });
    expect(removed.shellUi.mobilePinnedNav).not.toContain('/correcoes');
  });
});
