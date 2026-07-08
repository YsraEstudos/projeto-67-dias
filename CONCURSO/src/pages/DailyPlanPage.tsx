import { useMemo, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../app/AppContext';
import { getChecklistProgressPercent } from '../app/progress';
import { formatIsoDatePtBr, subjectLabel, workActivityLabel } from '../app/formatters';
import { getManualBlockContentSummary } from '../app/manualPlanContentRefs';
import type { ChecklistItem, ManualBlock, TopicNode, TopicSubmatter } from '../app/types';
import { PageIntro } from '../components/PageIntro';
import { MetricCard } from '../components/MetricCard';
import { ProgressBar } from '../components/ProgressBar';
import { SectionCard } from '../components/SectionCard';
import '../styles/daily-plan.css';

type SmartReviewItem = {
  submatter: TopicSubmatter;
  topic: TopicNode;
  topicId: string;
};

const isRiskGrade = (grade: string): boolean =>
  grade === 'C' || grade === 'D' || grade === 'E';

const isEliteGrade = (grade: string): boolean =>
  grade === 'A' || grade === 'B';

const EMPTY_CHECKLIST: ChecklistItem[] = [];

const sortSmartReviewByDate = (
  a: { submatter: TopicSubmatter },
  b: { submatter: TopicSubmatter },
) => {
  if (a.submatter.lastReviewedAt === b.submatter.lastReviewedAt) return 0;
  if (a.submatter.lastReviewedAt === null) return -1;
  if (b.submatter.lastReviewedAt === null) return 1;
  return new Date(a.submatter.lastReviewedAt).getTime() - new Date(b.submatter.lastReviewedAt).getTime();
};

export const DailyPlanPage = () => {
  const { state, topics, dayPlansByDate, updateChecklistItem, setDailyNote } = useAppContext();
  const dayPlan = dayPlansByDate[state.selectedDate];
  const record = state.dailyRecords[state.selectedDate];

  const checklist = record?.checklist ?? EMPTY_CHECKLIST;
  const progress = useMemo(
    () => getChecklistProgressPercent(checklist),
    [checklist],
  );
  const requiredItems = useMemo(
    () => checklist.filter((item) => item.required),
    [checklist],
  );
  const optionalItems = useMemo(
    () => checklist.filter((item) => !item.required),
    [checklist],
  );
  const requiredDone = useMemo(
    () =>
      checklist.reduce(
        (count, item) =>
          count + (item.required && item.status === 'concluido' ? 1 : 0),
        0,
      ),
    [checklist],
  );
  const topicById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );
  const dailySmartReview = useMemo(() => {
    const allSubmatters: SmartReviewItem[] = [];

    Object.entries(state.topicSubmattersByTopic ?? {}).forEach(
      ([topicId, submatters]) => {
        const topic = topicById.get(topicId);
        if (!topic || !submatters) return;

        submatters.forEach((submatter) => {
          allSubmatters.push({ submatter, topic, topicId });
        });
      },
    );

    const riskGroup = allSubmatters.filter((item) =>
      isRiskGrade(item.submatter.grade),
    );
    const eliteGroup = allSubmatters.filter((item) =>
      isEliteGrade(item.submatter.grade),
    );

    riskGroup.sort(sortSmartReviewByDate);
    eliteGroup.sort(sortSmartReviewByDate);

    return [...riskGroup.slice(0, 2), ...eliteGroup.slice(0, 1)];
  }, [state.topicSubmattersByTopic, topicById]);

  const handleChecklistChange = (
    itemId: string,
    event: ChangeEvent<HTMLInputElement>,
    type: 'counter' | 'boolean',
  ): void => {
    const done = type === 'boolean' ? (event.target.checked ? 1 : 0) : Number(event.target.value);
    updateChecklistItem(state.selectedDate, itemId, done);
  };

  if (!dayPlan || !record) {
    return (
      <section className="page">
        <p>Dia fora da janela do plano.</p>
      </section>
    );
  }

  const fallbackBlocks: ManualBlock[] = [
    {
      id: 'auto-subject-1',
      area: 'Matéria',
      title: subjectLabel(dayPlan.subjects[0]),
      detail: 'Bloco principal',
    },
    {
      id: 'auto-subject-2',
      area: 'Matéria',
      title: subjectLabel(dayPlan.subjects[1]),
      detail: 'Bloco principal',
    },
    {
      id: 'auto-work',
      area: 'Trabalho',
      title: workActivityLabel(dayPlan.workActivity),
      detail: 'Bloco rotativo no expediente',
    },
    {
      id: 'auto-questions',
      area: 'Meta',
      title: `${dayPlan.targets.objectiveQuestions} questões`,
      detail: dayPlan.hasSimulado ? 'Substituídas por simulado' : 'Meta diária padrão',
    },
  ];

  const visibleBlocks =
    dayPlan.planMode === 'manual' && dayPlan.manualBlocks && dayPlan.manualBlocks.length > 0
      ? dayPlan.manualBlocks
      : fallbackBlocks;

  const eventLabel =
    dayPlan.hasSimulado && dayPlan.hasRedacao
      ? 'Simulado + Redação'
      : dayPlan.hasSimulado
        ? 'Simulado'
        : dayPlan.hasRedacao
          ? 'Redação'
          : 'Sem evento especial';

  return (
    <section className="page">
      <PageIntro
        className="daily-header"
        kicker="Roteiro diário executável"
        title="Plano Diário"
        description="Checklist personalizado por dia, com foco em execução, evidência e leitura operacional."
      />
      <div className="dashboard-quick-stats">
        <MetricCard
          kicker="Data do Plano"
          title="Foco do dia"
          value={formatIsoDatePtBr(state.selectedDate)}
          subtitle="Data do plano ativo"
          emphasis="green"
        />
        <MetricCard
          kicker="Método"
          title="Operação"
          value={dayPlan.planMode === 'manual' ? 'Plano manual' : 'Plano automático'}
          subtitle={dayPlan.planMode === 'manual' ? 'Montagem personalizada' : 'Alocação por algoritmo'}
          emphasis="blue"
        />
        <MetricCard
          kicker="Fase Atual"
          title="Tempo de Ciclo"
          value={dayPlan.planMode === 'manual' ? `Semana ${dayPlan.weekNumber ?? '-'}` : 'Fase automática'}
          subtitle={eventLabel}
          emphasis="orange"
        />
      </div>

      <div className="bento-section">
        <SectionCard className="daily-smart-review" kicker="Dinâmico" title="Algoritmo de Revisão">
        <p className="daily-smart-review-desc">
          Otimizando sua curva de esquecimento: 2 matérias críticas (Risco) e 1 matéria de manutenção (Elite).
        </p>

        {dailySmartReview.length > 0 ? (
          <div className="daily-block-grid">
            {dailySmartReview.map((item) => {
              const isRisk = ['C', 'D', 'E'].includes(item.submatter.grade);
              return (
                <article className="daily-block-card" key={item.submatter.id}>
                  <div className="daily-block-top">
                    <span className={isRisk ? 'badge-risk' : 'badge-elite'}>
                      Nota {item.submatter.grade} {isRisk ? '(Risco)' : '(Elite)'}
                    </span>
                    <span className="daily-block-area">
                      {item.submatter.lastReviewedAt ? formatIsoDatePtBr(item.submatter.lastReviewedAt) : 'Sem revisão'}
                    </span>
                  </div>
                  <p className="daily-block-title">{item.submatter.title}</p>
                  <p className="daily-block-detail">{item.topic.title}</p>
                  <Link
                    to={`/conteudo/topico/${item.topicId}?submatter=${item.submatter.id}`}
                    className="link-action"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" x2="21" y1="14" y2="3"/>
                    </svg>
                    Estudar submatéria
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="daily-smart-review-desc">Nenhuma submatéria avaliada para revisão.</p>
        )}
      </SectionCard>
      </div>

      <div className="bento-section">
      <SectionCard className="daily-progress-panel" kicker="Conclusão" title="Progresso oficial do dia">
        <div className="daily-progress-head">
          <p className="daily-progress-subtitle">
            Obrigatórios concluídos: {requiredDone}/{requiredItems.length}
          </p>
        </div>
        <ProgressBar value={progress} label="Progresso oficial do dia" />
      </SectionCard>
      </div>

      <div className="bento-section">
      <SectionCard className="daily-roadmap" kicker="Sequência" title="Roteiro do dia">
        {dayPlan.isRestDay ? (
          <p>Domingo configurado como descanso fixo, sem pendência obrigatória.</p>
        ) : (
          <div className="daily-block-grid" data-testid="daily-manual-blocks">
            {(() => {
              const studyBlocks = [];

              if (dailyStudy.newMatter) {
                const item = dailyStudy.newMatter;
                const isNew = !dailyStudy.isAllRepeated;
                const submatter = item.submatter;
                
                studyBlocks.push(
                  <article className="daily-block-card" key="slot-new-matter" data-testid="srs-slot-1">
                    <div className="daily-block-top">
                      <span className="daily-block-area" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isNew ? "Estudo: Matéria Nova" : "Revisão SRS 1"}
                      </span>
                      {submatter.lastReviewedAt && (
                        <span className="status-badge-done">
                          Última: {formatIsoDatePtBr(submatter.lastReviewedAt)}
                        </span>
                      )}
                    </div>
                    <p className="daily-block-title">{item.topic.title}</p>
                    <p className="daily-block-detail">
                      {isNew ? "Estudo inicial do tópico" : `Nota ${submatter.grade} | Repetições: ${submatter.srsRepetitions ?? 0}`}
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                      <Link
                        to={`/conteudo/topico/${item.topic.id}?submatter=${submatter.id}`}
                        className="link-action"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" x2="21" y1="14" y2="3"/>
                        </svg>
                        Estudar matéria
                      </Link>
                      
                      <div className="srs-rating-container">
                        <span className="srs-rating-label">
                          Como foi seu desempenho?
                          {submatter.srsNextReview && (
                            <span className="srs-feedback-badge">
                              Intervalo atual: {submatter.srsInterval ?? 0}d
                            </span>
                          )}
                        </span>
                        <div className="srs-buttons-row">
                          <button type="button" className="btn-srs btn-srs-bad" onClick={() => handleSrsRate(item.topic.id, submatter.id, 'bad', isNew)}>Errei</button>
                          <button type="button" className="btn-srs btn-srs-hard" onClick={() => handleSrsRate(item.topic.id, submatter.id, 'hard', isNew)}>Difícil</button>
                          <button type="button" className="btn-srs btn-srs-good" onClick={() => handleSrsRate(item.topic.id, submatter.id, 'good', isNew)}>Bom</button>
                          <button type="button" className="btn-srs btn-srs-easy" onClick={() => handleSrsRate(item.topic.id, submatter.id, 'easy', isNew)}>Fácil</button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }

              if (dailyStudy.reviewMatter) {
                const item = dailyStudy.reviewMatter;
                const isNew = false;
                const submatter = item.submatter;

                studyBlocks.push(
                  <article className="daily-block-card" key="slot-review-matter" data-testid="srs-slot-2">
                    <div className="daily-block-top">
                      <span className="daily-block-area" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {dailyStudy.isAllRepeated ? "Revisão SRS 2" : "Revisão SRS (Matéria Anterior)"}
                      </span>
                      {submatter.lastReviewedAt && (
                        <span className="status-badge-done">
                          Última: {formatIsoDatePtBr(submatter.lastReviewedAt)}
                        </span>
                      )}
                    </div>
                    <p className="daily-block-title">{item.topic.title}</p>
                    <p className="daily-block-detail">
                      Nota {submatter.grade} | Repetições: {submatter.srsRepetitions ?? 0} | Intervalo: {submatter.srsInterval ?? 0}d
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                      <Link
                        to={`/conteudo/topico/${item.topic.id}?submatter=${submatter.id}`}
                        className="link-action"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" x2="21" y1="14" y2="3"/>
                        </svg>
                        Estudar matéria
                      </Link>

                      <div className="srs-rating-container">
                        <span className="srs-rating-label">
                          Como foi seu desempenho?
                          {submatter.srsNextReview && (
                            <span className="srs-feedback-badge">
                              {submatter.srsNextReview <= state.selectedDate ? "Venceu hoje" : `Próxima: ${formatIsoDatePtBr(submatter.srsNextReview)}`}
                            </span>
                          )}
                        </span>
                        <div className="srs-buttons-row">
                          <button type="button" className="btn-srs btn-srs-bad" onClick={() => handleSrsRate(item.topic.id, submatter.id, 'bad', isNew)}>Errei</button>
                          <button type="button" className="btn-srs btn-srs-hard" onClick={() => handleSrsRate(item.topic.id, submatter.id, 'hard', isNew)}>Difícil</button>
                          <button type="button" className="btn-srs btn-srs-good" onClick={() => handleSrsRate(item.topic.id, submatter.id, 'good', isNew)}>Bom</button>
                          <button type="button" className="btn-srs btn-srs-easy" onClick={() => handleSrsRate(item.topic.id, submatter.id, 'easy', isNew)}>Fácil</button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              } else if (!dailyStudy.isAllRepeated) {
                studyBlocks.push(
                  <article className="daily-block-card" key="slot-review-empty">
                    <div className="daily-block-top">
                      <span className="daily-block-area" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revisão SRS</span>
                    </div>
                    <p className="daily-block-title">Sem revisões pendentes</p>
                    <p className="daily-block-detail">
                      Você ainda não estudou nenhuma matéria para iniciar a curva de repetição. Continue completando novas matérias!
                    </p>
                  </article>
                );
              }

              studyBlocks.push(
                <article className="daily-block-card" key="slot-work-block">
                  <div className="daily-block-top">
                    <span className="daily-block-area" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trabalho</span>
                  </div>
                  <p className="daily-block-title">{workActivityLabel(dayPlan.workActivity)}</p>
                  <p className="daily-block-detail">Bloco rotativo no expediente</p>
                </article>
              );

              studyBlocks.push(
                <article className="daily-block-card" key="slot-questions-block">
                  <div className="daily-block-top">
                    <span className="daily-block-area" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meta</span>
                  </div>
                  <p className="daily-block-title">{dayPlan.targets.objectiveQuestions} questões</p>
                  <p className="daily-block-detail">
                    {dayPlan.hasSimulado ? 'Substituídas por simulado' : 'Meta diária padrão'}
                  </p>
                </article>
              );

              return <div className="daily-block-grid">{studyBlocks}</div>;
            })()}
          </div>
        )}
      </SectionCard>
      </div>

      <div className="bento-section">
      <SectionCard className="daily-checklist-panel" data-testid="daily-checklist" kicker="Controle" title="Checklist do dia">

        <p className="section-label" style={{ marginTop: 0 }}>Obrigatórios</p>
        <div>
          {requiredItems.map((item) => {
            let displayLabel = item.label;
            if (item.id === 'new-matter-study') {
              displayLabel = dailyStudy.isAllRepeated
                ? `Revisão SRS 1: ${dailyStudy.newMatter?.topic.title ?? 'Carregando...'}`
                : `Estudo: Matéria Nova - ${dailyStudy.newMatter?.topic.title ?? 'Carregando...'}`;
            } else if (item.id === 'review-matter-study') {
              displayLabel = dailyStudy.isAllRepeated
                ? `Revisão SRS 2: ${dailyStudy.reviewMatter?.topic.title ?? 'Carregando...'}`
                : `Revisão SRS: ${dailyStudy.reviewMatter?.topic.title ?? 'Carregando...'}`;
            }
            return (
              <div className="check-item" key={item.id}>
                <div className="check-item-info">
                  <p>{displayLabel}</p>
                  <div>
                    <span
                      className={item.status === 'concluido' ? 'status-badge-done' : 'status-badge-pending'}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="check-item-controls">
                  {item.kind === 'counter' ? (
                    <div className="counter-row">
                      <input
                        data-testid={`check-${item.id}`}
                        className="checklist-counter-input"
                        type="number"
                        min={0}
                        aria-label={`Atualizar meta ${displayLabel}`}
                        max={Math.max(item.target, item.done, 1)}
                        value={item.done}
                        onChange={(event) => handleChecklistChange(item.id, event, 'counter')}
                      />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                        / {item.target} {item.unit}
                      </span>
                    </div>
                  ) : (
                    <label className="boolean-row">
                      <input
                        data-testid={`check-${item.id}`}
                        type="checkbox"
                        aria-label={`Marcar ${displayLabel} como concluído`}
                        checked={item.done >= 1}
                        onChange={(event) => handleChecklistChange(item.id, event, 'boolean')}
                      />
                      <span>Concluído</span>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {optionalItems.length > 0 ? (
          <>
            <p className="section-label">Opcionais</p>
            <div>
              {optionalItems.map((item) => (
                <div className="check-item" key={item.id}>
                  <div className="check-item-info">
                    <p>{item.label}</p>
                    <div>
                      <span 
                        className={item.status === 'concluido' ? 'status-badge-done' : 'status-badge-pending'}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="check-item-controls">
                    {item.kind === 'counter' ? (
                      <div className="counter-row">
                        <input
                          data-testid={`check-${item.id}`}
                          className="checklist-counter-input"
                          type="number"
                          min={0}
                          aria-label={`Atualizar meta ${item.label}`}
                          max={Math.max(item.target, item.done, 1)}
                          value={item.done}
                          onChange={(event) => handleChecklistChange(item.id, event, 'counter')}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                          / {item.target} {item.unit}
                        </span>
                      </div>
                    ) : (
                      <label className="boolean-row">
                        <input
                          data-testid={`check-${item.id}`}
                          type="checkbox"
                          aria-label={`Marcar ${item.label} como concluído`}
                          checked={item.done >= 1}
                          onChange={(event) => handleChecklistChange(item.id, event, 'boolean')}
                        />
                        <span>Concluído</span>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </SectionCard>
      </div>

      <div className="bento-section">
      <SectionCard className="daily-notes-panel" kicker="Registro" title="Notas de evidência do dia">
        <textarea
          className="textarea"
          rows={5}
          aria-label="Notas de evidência do dia"
          placeholder="Ex.: acertei 42/50 questões, revisar regra de três composta e voz passiva"
          value={record.notes}
          onChange={(event) => setDailyNote(state.selectedDate, event.target.value)}
        />
      </SectionCard>
      </div>
    </section>
  );
};
