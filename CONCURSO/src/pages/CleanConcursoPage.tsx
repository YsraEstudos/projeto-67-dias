import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Filter,
  Map as MapIcon,
  Play,
  RotateCcw,
  Search,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppContext } from '../app/AppContext';
import {
  buildCleanCalendarEvents,
  buildCleanDayShortcuts,
  buildCleanPlanContentItems,
  buildReviewSchedule,
  findNextSubjectPlanDate,
  getManualBlockSubjectLabel,
} from '../app/cleanConcursoModule';
import { getLocalTodayIsoDate } from '../app/dateUtils';
import { buildReviewQueue, buildTopicRollups } from '../app/contentSubmatters';
import { formatIsoDateCompactPtBr, formatIsoDatePtBr, subjectLabel } from '../app/formatters';
import { getTopicDisplayTitle } from '../app/topics';
import type { ManualBlock, SubjectKey, TopicGrade } from '../app/types';

type ModuleView = 'dia' | 'conteudo' | 'calendario';
type ContentFilter = 'all' | 'review' | TopicGrade;

const gradeFilters: ContentFilter[] = ['all', 'review', 'A', 'B', 'C', 'D', 'E'];

const gradeLabel = (filter: ContentFilter): string => {
  if (filter === 'all') return 'Tudo';
  if (filter === 'review') return 'Revisar';
  return `Nota ${filter}`;
};

const calendarToneLabel: Record<string, string> = {
  study: 'Estudo',
  review: 'Revisão',
  exam: 'Simulado',
  writing: 'Redação',
  rest: 'Descanso',
  failed: 'Realocado',
};

const inferTopicTargetsFromBlock = (block: ManualBlock): string[] =>
  Array.from(new Set((block.contentTargets ?? []).map((target) => target.topicId)));

const groupPlanItemsBySubject = (
  items: Array<{ subject: SubjectKey | null }>,
): Record<SubjectKey, number> =>
  items.reduce<Record<SubjectKey, number>>(
    (accumulator, topic) => {
      if (topic.subject) {
        accumulator[topic.subject] += 1;
      }
      return accumulator;
    },
    {
      portugues: 0,
      rlm: 0,
      legislacao: 0,
      especificos: 0,
    },
  );

const pickPlanItemGrade = (
  topicIds: string[],
  rollups: ReturnType<typeof buildTopicRollups>,
): TopicGrade => {
  const order: TopicGrade[] = ['E', 'D', 'C', 'B', 'A'];
  const grades = topicIds.map((topicId) => rollups[topicId]?.currentGrade ?? 'E');
  return order.find((grade) => grades.includes(grade)) ?? 'E';
};

const hasPlanItemReviewNow = (
  topicIds: string[],
  reviewQueue: ReturnType<typeof buildReviewQueue>,
): boolean => {
  const targetIds = new Set(topicIds);
  return reviewQueue.some((item) => targetIds.has(item.topicId) && item.needsReview);
};

export const CleanConcursoPage = () => {
  const {
    state,
    topics,
    dayPlans,
    dayPlansByDate,
    setSelectedDate,
    failManualBlock,
    setTopicStatus,
    updateTopicSubmatter,
    markTopicSubmatterReviewedToday,
  } = useAppContext();
  const [activeView, setActiveView] = useState<ModuleView>('dia');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectKey>('all');
  const [search, setSearch] = useState('');
  const [mappedTopicId, setMappedTopicId] = useState<string | null>(null);

  const today = getLocalTodayIsoDate();
  const dayShortcuts = useMemo(() => buildCleanDayShortcuts(today), [today]);
  const selectedPlan = dayPlansByDate[state.selectedDate];
  const selectedBlocks = selectedPlan?.manualBlocks ?? [];
  const reviewQueue = useMemo(
    () => buildReviewQueue(state.topicSubmattersByTopic, topics, state.selectedDate),
    [state.topicSubmattersByTopic, state.selectedDate, topics],
  );
  const rollups = useMemo(
    () => buildTopicRollups(state.topicSubmattersByTopic, topics, state.selectedDate),
    [state.topicSubmattersByTopic, state.selectedDate, topics],
  );
  const leafTopics = useMemo(() => topics.filter((topic) => topic.isLeaf), [topics]);
  const planContentItems = useMemo(() => buildCleanPlanContentItems(dayPlans), [dayPlans]);
  const planItemsBySubject = useMemo(() => groupPlanItemsBySubject(planContentItems), [planContentItems]);
  const failedBlocksByDate = useMemo(
    () =>
      state.manualBlockReschedules.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.failedAt] = (accumulator[item.failedAt] ?? 0) + 1;
        return accumulator;
      }, {}),
    [state.manualBlockReschedules],
  );
  const calendarEvents = useMemo(
    () =>
      buildCleanCalendarEvents(
        dayPlans,
        state.topicSubmattersByTopic,
        topics,
        dayPlans[0]?.date,
      ),
    [dayPlans, state.topicSubmattersByTopic, topics],
  );
  const mappedTopic = useMemo(
    () => leafTopics.find((topic) => topic.id === mappedTopicId) ?? leafTopics[0] ?? null,
    [leafTopics, mappedTopicId],
  );
  const mappedSubmatters = mappedTopic ? state.topicSubmattersByTopic[mappedTopic.id] ?? [] : [];

  const filteredPlanItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return planContentItems.filter((item) => {
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false;

      const currentGrade = pickPlanItemGrade(item.topicIds, rollups);

      if (contentFilter !== 'all' && contentFilter !== 'review' && currentGrade !== contentFilter) {
        return false;
      }

      if (contentFilter === 'review' && !hasPlanItemReviewNow(item.topicIds, reviewQueue)) {
        return false;
      }

      if (!normalizedSearch) return true;
      return [
        item.block.title,
        item.block.detail,
        item.block.area,
        getManualBlockSubjectLabel(item.block),
        ...(item.block.contentTargets ?? []).map((target) => `${target.title} ${target.sectionTitle}`),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [contentFilter, planContentItems, reviewQueue, rollups, search, subjectFilter]);

  const dashboardStats = useMemo(() => {
    const reviewNow = reviewQueue.filter((item) => item.needsReview).length;
    const completedItems = planContentItems.filter((item) => pickPlanItemGrade(item.topicIds, rollups) === 'A').length;
    const failedBlocks = state.manualBlockReschedules.length;
    const progress = planContentItems.length > 0 ? Math.round((completedItems / planContentItems.length) * 100) : 0;

    return {
      reviewNow,
      failedBlocks,
      progress,
      totalTopics: leafTopics.length,
      totalPlanItems: planContentItems.length,
      calendarEvents: calendarEvents.length,
    };
  }, [calendarEvents.length, leafTopics.length, planContentItems, reviewQueue, rollups, state.manualBlockReschedules.length]);

  const handleBlockFailure = (block: ManualBlock): void => {
    failManualBlock(state.selectedDate, block.id);

    inferTopicTargetsFromBlock(block).forEach((topicId) => {
      setTopicStatus(topicId, 'pendente');
      const [firstSubmatter] = state.topicSubmattersByTopic[topicId] ?? [];
      if (firstSubmatter) {
        updateTopicSubmatter(topicId, firstSubmatter.id, {
          grade: 'E',
          actionNote: `Reagendada por falha em ${formatIsoDateCompactPtBr(state.selectedDate)}.`,
        });
      }
    });
  };

  const handleReviewTopic = (topicId: string): void => {
    const [firstSubmatter] = state.topicSubmattersByTopic[topicId] ?? [];
    if (firstSubmatter) {
      markTopicSubmatterReviewedToday(topicId, firstSubmatter.id);
    }
  };

  const handleOpenTopicMap = (topicId: string): void => {
    if (!topicId) return;
    setMappedTopicId(topicId);
    setActiveView('conteudo');
  };

  return (
    <section className="clean-module-page" data-testid="clean-concurso-module">
      <header className="clean-hero">
        <div className="clean-hero-copy">
          <span className="clean-kicker">
            <Trophy size={16} />
            Novo módulo de concurso
          </span>
          <h1>Lumina Study Command Center</h1>
          <p>
            Um painel direto para executar o dia, consultar o conteúdo programático completo,
            ver revisões e realocar automaticamente qualquer matéria que falhar.
          </p>
        </div>
        <div className="clean-hero-panel">
          <span>Progresso do edital</span>
          <strong>{dashboardStats.progress}%</strong>
          <div className="clean-meter">
            <div style={{ width: `${dashboardStats.progress}%` }} />
          </div>
        </div>
      </header>

      <nav className="clean-tabs" aria-label="Visões do novo módulo">
        {[
          { key: 'dia', label: 'Dia', icon: Play },
          { key: 'conteudo', label: 'Conteúdo', icon: BookOpen },
          { key: 'calendario', label: 'Calendário', icon: CalendarDays },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.key}
              className={activeView === item.key ? 'clean-tab clean-tab-active' : 'clean-tab'}
              onClick={() => setActiveView(item.key as ModuleView)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="clean-stats-grid">
        <article className="clean-stat-card">
          <Target size={18} />
          <span>Matérias mapeadas</span>
          <strong>{dashboardStats.totalPlanItems}</strong>
        </article>
        <article className="clean-stat-card">
          <RotateCcw size={18} />
          <span>Revisar agora</span>
          <strong>{dashboardStats.reviewNow}</strong>
        </article>
        <article className="clean-stat-card">
          <XCircle size={18} />
          <span>Falhas realocadas</span>
          <strong>{dashboardStats.failedBlocks}</strong>
        </article>
      </div>

      {activeView === 'dia' ? (
        <div className="clean-day-grid">
          <section className="clean-panel clean-day-panel">
            <div className="clean-panel-head">
              <div>
                <span className="clean-kicker">Filtro por dia</span>
                <h2>{formatIsoDatePtBr(state.selectedDate)}</h2>
              </div>
              <input
                type="date"
                value={state.selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="clean-date-input"
                aria-label="Escolher data do plano"
              />
            </div>

            <div className="clean-day-shortcuts">
              {dayShortcuts.map((shortcut) => (
                <button
                  type="button"
                  key={shortcut.key}
                  className={state.selectedDate === shortcut.date ? 'clean-day-chip active' : 'clean-day-chip'}
                  onClick={() => setSelectedDate(shortcut.date)}
                >
                  <span>{shortcut.label}</span>
                  <strong>{formatIsoDateCompactPtBr(shortcut.date)}</strong>
                </button>
              ))}
            </div>

            {selectedPlan?.isRestDay ? (
              <div className="clean-empty-state">Esse dia está reservado para descanso fixo.</div>
            ) : (
              <div className="clean-task-list">
                {selectedBlocks.map((block) => {
                  const nextDate = findNextSubjectPlanDate(dayPlans, state.selectedDate, block);
                  return (
                    <article className="clean-task-card" key={block.id}>
                      <div>
                        <span className="clean-task-area">{getManualBlockSubjectLabel(block)}</span>
                        <h3>{block.title}</h3>
                        <p>{block.detail}</p>
                        {nextDate ? (
                          <small>Se falhar, volta no próximo ciclo compatível: {formatIsoDateCompactPtBr(nextDate)}</small>
                        ) : null}
                      </div>
                      <div className="clean-task-actions">
                        {block.contentTargets?.[0] ? (
                          <button
                            type="button"
                            className="clean-icon-link"
                            onClick={() => handleOpenTopicMap(block.contentTargets?.[0]?.topicId ?? '')}
                          >
                            <Play size={15} />
                            Estudar
                          </button>
                        ) : null}
                        <button type="button" className="clean-fail-button" onClick={() => handleBlockFailure(block)}>
                          <XCircle size={15} />
                          Falhei
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="clean-panel clean-review-panel">
            <div className="clean-panel-head compact">
              <div>
                <span className="clean-kicker">Revisão crítica</span>
                <h2>Fila automática</h2>
              </div>
              <RotateCcw size={20} />
            </div>
            <div className="clean-review-list">
              {reviewQueue.slice(0, 7).map((item) => (
                <article className="clean-review-item" key={item.submatterId}>
                  <span>Nota {item.grade}</span>
                  <strong>{item.submatterTitle}</strong>
                  <p>{item.topicTitle}</p>
                  <button type="button" onClick={() => handleReviewTopic(item.topicId)}>
                    <CheckCircle2 size={14} />
                    Revisado hoje
                  </button>
                </article>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {activeView === 'conteudo' ? (
        <div className="clean-content-grid">
          <section className="clean-panel">
            <div className="clean-panel-head">
              <div>
                <span className="clean-kicker">Edital completo</span>
                <h2>Conteúdo Programático</h2>
              </div>
              <span className="clean-count">
                {filteredPlanItems.length} de {planContentItems.length} blocos
              </span>
            </div>

            <div className="clean-filter-bar">
              <label className="clean-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar matéria..."
                />
              </label>
              <label className="clean-select-label">
                <Filter size={16} />
                <select
                  value={subjectFilter}
                  onChange={(event) => setSubjectFilter(event.target.value as 'all' | SubjectKey)}
                >
                  <option value="all">Todas</option>
                  <option value="portugues">Português</option>
                  <option value="rlm">RLM</option>
                  <option value="legislacao">Legislação</option>
                  <option value="especificos">Específicos</option>
                </select>
              </label>
            </div>

            <div className="clean-grade-filters">
              {gradeFilters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={contentFilter === filter ? 'clean-grade-chip active' : 'clean-grade-chip'}
                  onClick={() => setContentFilter(filter)}
                >
                  {gradeLabel(filter)}
                </button>
              ))}
            </div>

            <div className="clean-topic-list">
              {filteredPlanItems.map((item) => {
                const grade = pickPlanItemGrade(item.topicIds, rollups);
                const firstTopicId = item.topicIds[0];
                return (
                  <article className="clean-topic-row" key={item.id}>
                    <div className={`clean-grade-dot grade-${grade.toLowerCase()}`} />
                    <div className="clean-topic-main">
                      <span>
                        {getManualBlockSubjectLabel(item.block)}
                        {item.weekNumber ? ` | Semana ${item.weekNumber}` : ''} | {formatIsoDateCompactPtBr(item.date)}
                      </span>
                      <h3>{item.block.title}</h3>
                      <p>
                        {item.block.detail}
                        {item.block.contentTargets?.length ? ` | ${item.block.contentTargets.length} tópico(s) oficial(is)` : ''}
                      </p>
                    </div>
                    <div className="clean-topic-actions">
                      {firstTopicId ? (
                        <button type="button" className="clean-icon-link" onClick={() => handleOpenTopicMap(firstTopicId)}>
                          <Play size={15} />
                          Estudar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={!firstTopicId}
                        onClick={() => firstTopicId && handleReviewTopic(firstTopicId)}
                      >
                        <RotateCcw size={15} />
                        Revisão
                      </button>
                      <button
                        type="button"
                        disabled={!firstTopicId}
                        onClick={() => firstTopicId && setMappedTopicId(firstTopicId)}
                      >
                        <MapIcon size={15} />
                        Mapa
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="clean-panel clean-map-panel">
            <div className="clean-panel-head compact">
              <div>
                <span className="clean-kicker">Mapa</span>
                <h2>{mappedTopic ? getTopicDisplayTitle(mappedTopic) : 'Selecione uma matéria'}</h2>
              </div>
              <BarChart3 size={20} />
            </div>
            {mappedTopic ? (
              <div className="clean-map-body">
                <p>{subjectLabel(mappedTopic.subject)}</p>
                {mappedSubmatters.map((submatter) => (
                  <article className="clean-map-card" key={submatter.id}>
                    <span>Nota {submatter.grade}</span>
                    <strong>{submatter.title}</strong>
                    <div>
                      {buildReviewSchedule(submatter, state.selectedDate).map((item) => (
                        <small key={`${submatter.id}-${item.date}`}>
                          {item.label}: {formatIsoDateCompactPtBr(item.date)}
                        </small>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      {activeView === 'calendario' ? (
        <section className="clean-panel">
          <div className="clean-panel-head">
            <div>
              <span className="clean-kicker">Agenda completa</span>
              <h2>Calendário de estudos e revisões</h2>
            </div>
            <span className="clean-count">{dashboardStats.calendarEvents} eventos</span>
          </div>
          <div className="clean-calendar-list">
            {calendarEvents.map((event) => (
              <article className={`clean-calendar-event tone-${event.tone}`} key={event.id}>
                <time>{formatIsoDateCompactPtBr(event.date)}</time>
                <div>
                  <span>{calendarToneLabel[event.tone]}</span>
                  <strong>{event.title}</strong>
                  <p>{event.subtitle}</p>
                  {failedBlocksByDate[event.date] ? (
                    <small>{failedBlocksByDate[event.date]} falha(s) realocada(s) deste dia.</small>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="clean-subject-strip" aria-label="Resumo por matéria">
        {(Object.keys(planItemsBySubject) as SubjectKey[]).map((subject) => (
          <article key={subject}>
            <span>{subjectLabel(subject)}</span>
            <strong>{planItemsBySubject[subject]}</strong>
          </article>
        ))}
      </section>
    </section>
  );
};
