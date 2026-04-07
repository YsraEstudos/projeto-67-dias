import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../app/AppContext';
import { getChecklistProgressPercent } from '../app/progress';
import { formatIsoDatePtBr, subjectLabel, workActivityLabel } from '../app/formatters';
import { getManualBlockContentSummary } from '../app/manualPlanContentRefs';
import type { ManualBlock, TopicNode, TopicSubmatter } from '../app/types';
import { PageIntro } from '../components/PageIntro';
import { MetricCard } from '../components/MetricCard';
import { ProgressBar } from '../components/ProgressBar';
import { SectionCard } from '../components/SectionCard';
import '../styles/daily-plan.css';

export const DailyPlanPage = () => {
  const { state, topics, dayPlansByDate, updateChecklistItem, setDailyNote } = useAppContext();
  const dayPlan = dayPlansByDate[state.selectedDate];
  const record = state.dailyRecords[state.selectedDate];

  if (!dayPlan || !record) {
    return (
      <section className="page">
        <p>Dia fora da janela do plano.</p>
      </section>
    );
  }

  const progress = getChecklistProgressPercent(record.checklist);
  const requiredItems = record.checklist.filter((item) => item.required);
  const optionalItems = record.checklist.filter((item) => !item.required);
  const requiredDone = requiredItems.filter((item) => item.status === 'concluido').length;

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

  const handleChecklistChange = (
    itemId: string,
    event: ChangeEvent<HTMLInputElement>,
    type: 'counter' | 'boolean',
  ): void => {
    const done = type === 'boolean' ? (event.target.checked ? 1 : 0) : Number(event.target.value);
    updateChecklistItem(state.selectedDate, itemId, done);
  };

  // Smart Review Logic
  const allSubmatters: { submatter: TopicSubmatter; topic: TopicNode; topicId: string }[] = [];
  if (state.topicSubmattersByTopic) {
    Object.entries(state.topicSubmattersByTopic).forEach(([topicId, submatters]) => {
      const topic = topics.find((t) => t.id === topicId);
      if (topic && submatters) {
        submatters.forEach((submatter) => {
          allSubmatters.push({ submatter, topic, topicId });
        });
      }
    });
  }

  const riskGroup = allSubmatters.filter((item) => ['C', 'D', 'E'].includes(item.submatter.grade));
  const eliteGroup = allSubmatters.filter((item) => ['A', 'B'].includes(item.submatter.grade));

  const sortByDate = (
    a: { submatter: TopicSubmatter },
    b: { submatter: TopicSubmatter }
  ) => {
    if (a.submatter.lastReviewedAt === b.submatter.lastReviewedAt) return 0;
    if (a.submatter.lastReviewedAt === null) return -1;
    if (b.submatter.lastReviewedAt === null) return 1;
    return new Date(a.submatter.lastReviewedAt).getTime() - new Date(b.submatter.lastReviewedAt).getTime();
  };

  const sortedRisk = [...riskGroup].sort(sortByDate);
  const sortedElite = [...eliteGroup].sort(sortByDate);

  const dailySmartReview = [
    ...sortedRisk.slice(0, 2),
    ...sortedElite.slice(0, 1),
  ];

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
            {visibleBlocks.map((block) => (
              <article className="daily-block-card" key={block.id}>
                <div className="daily-block-top">
                  <span className="daily-block-area">{block.area}</span>
                  {block.movedFromSunday ? (
                    <span className="status-badge-pending">Realocado do domingo</span>
                  ) : null}
                </div>
                <p className="daily-block-title">{block.title}</p>
                <p className="daily-block-detail">{block.detail}</p>
                {block.contentRefs?.length ? (
                  <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    <p className="daily-block-detail" style={{ marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--text-main)' }}>Conteúdo programático:</strong> {getManualBlockContentSummary(block)}
                    </p>
                    {block.contentTargets?.length ? (
                      <ul className="target-list">
                        {block.contentTargets.map((target) => (
                          <li key={target.topicId}>
                            <Link to={target.path}>{target.title}</Link>
                            <span style={{ color: 'var(--text-dim)' }}>{target.sectionTitle ? ` (${target.sectionTitle})` : ''}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </SectionCard>
      </div>

      <div className="bento-section">
      <SectionCard className="daily-checklist-panel" data-testid="daily-checklist" kicker="Controle" title="Checklist do dia">

        <p className="section-label" style={{ marginTop: 0 }}>Obrigatórios</p>
        <div>
          {requiredItems.map((item) => (
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
