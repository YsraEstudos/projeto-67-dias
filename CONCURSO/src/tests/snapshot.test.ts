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
    delete (legacyLike as { calendarEventProgress?: unknown }).calendarEventProgress;

    const normalized = normalizeStateForCurrentPlan(legacyLike);
    expect(normalized.planSettings.startDate).toBe('2026-03-14');
    expect(normalized.planSettings.startDateChangeCount).toBe(0);
    expect(normalized.shellUi.mobilePinnedNav).toEqual(DEFAULT_MOBILE_PINNED_NAV);
    expect(normalized.calendarEventProgress).toEqual({});
    expect(normalized.ankiConfig.pauseWeekdays).toEqual([]);
    expect(normalized.ankiStats.dailyLogs).toEqual({});
  });

  it('marca evento do calendario como feito e atualiza materia vinculada', () => {
    const state = createInitialState();
    const topicId = TOPICS.find((topic) => topic.isLeaf)?.id;
    expect(topicId).toBeDefined();
    if (!topicId) {
      return;
    }

    const updated = appReducer(state, {
      type: 'complete-calendar-event',
      eventId: '2026-04-27-test',
      topicIds: [topicId],
      reviewedAt: '2026-04-27',
      at: '2026-04-27T10:00:00.000Z',
    });

    expect(updated.calendarEventProgress['2026-04-27-test'].status).toBe('done');
    expect(updated.topicProgress[topicId].status).toBe('acertado');
    expect(updated.topicSubmattersByTopic[topicId][0].lastReviewedAt).toBe('2026-04-27');
  });

  it('registra falha de bloco manual e permite desfazer realocacao', () => {
    const state = createInitialState();
    const date = '2026-04-27';
    const manualBlock = {
      id: 'manual-test',
      area: 'Português',
      title: 'Interpretação de texto',
      detail: 'Português',
      contentTargets: [
        {
          topicId: TOPICS.find((topic) => topic.isLeaf)?.id ?? 'missing-topic',
          title: 'Interpretação',
          sourceTitle: 'Português',
          sectionTitle: 'Português',
          sourceRef: 'seed',
          path: 'Português > Interpretação',
        },
      ],
    };

    const failed = appReducer(state, {
      type: 'fail-calendar-manual-block',
      date,
      block: manualBlock,
      at: '2026-04-27T10:00:00.000Z',
    });

    expect(failed.calendarEventProgress['2026-04-27-manual-test'].status).toBe('failed');
    expect(failed.manualBlockReschedules).toContainEqual(
      expect.objectContaining({
        failedAt: date,
        blockId: 'manual-test',
        title: 'Interpretação de texto',
      }),
    );

    const undone = appReducer(failed, {
      type: 'undo-calendar-manual-block-failure',
      date,
      blockId: 'manual-test',
      at: '2026-04-27T11:00:00.000Z',
    });

    expect(undone.calendarEventProgress['2026-04-27-manual-test'].status).toBe('pending');
    expect(undone.manualBlockReschedules).not.toContainEqual(
      expect.objectContaining({ failedAt: date, blockId: 'manual-test' }),
    );
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
      '/correcoes',
      '/simulados-redacoes',
      '/configuracoes',
      '/correcoes',
      '/rota-invalida',
    ];

    const normalized = normalizeStateForCurrentPlan(state);

    expect(normalized.shellUi.mobilePinnedNav).toEqual(['/']);
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

  it('mantem apenas o atalho do novo modulo ao pinar, mover e remover rotas antigas', () => {
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

    expect(moved.shellUi.mobilePinnedNav).toEqual(['/']);

    const removed = appReducer(moved, {
      type: 'remove-mobile-nav-item',
      path: '/correcoes',
    });
    expect(removed.shellUi.mobilePinnedNav).toEqual(['/']);
  });
});
