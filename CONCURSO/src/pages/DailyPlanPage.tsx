import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../app/AppContext';
import { getChecklistProgressPercent } from '../app/progress';
import { formatIsoDatePtBr, subjectLabel, workActivityLabel } from '../app/formatters';
import { getManualBlockContentSummary } from '../app/manualPlanContentRefs';
import type { ManualBlock, TopicNode, TopicSubmatter } from '../app/types';
import { PageIntro } from '../components/PageIntro';
import { ProgressBar } from '../components/ProgressBar';
import { SectionCard } from '../components/SectionCard';

const metaIconStyle = { width: '18px', height: '18px', marginRight: '6px', color: 'var(--cyan)' };

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

  const sortedRisk = riskGroup.sort(sortByDate);
  const sortedElite = eliteGroup.sort(sortByDate);

  const dailySmartReview = [
    ...sortedRisk.slice(0, 2),
    ...sortedElite.slice(0, 1),
  ];

  const getSubmatterBadgeStyle = (grade: string) => {
    const isElite = ['A', 'B'].includes(grade);
    return {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '8px',
      backgroundColor: isElite ? 'rgba(45, 212, 191, 0.12)' : 'rgba(248, 113, 113, 0.12)',
      color: isElite ? '#2dd4bf' : '#f87171',
      fontWeight: 700,
      fontSize: '0.75rem',
      border: `1px solid ${isElite ? 'rgba(45, 212, 191, 0.25)' : 'rgba(248, 113, 113, 0.25)'}`
    };
  };

  return (
    <section className="page dashboard-bento-grid">
      <div className="bento-intro">
        <PageIntro
          className="daily-header"
          kicker="Roteiro diário executável"
          title="Plano Diário"
          description="Checklist personalizado por dia, com foco em execução, evidência e leitura operacional."
          meta={
            <div className="daily-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', background: 'transparent' }}>
              <article className="daily-meta-card" style={{ padding: '20px', background: 'rgba(20, 20, 23, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p className="daily-meta-label" style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <svg style={metaIconStyle} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                  Data do Plano
                </p>
                <p className="daily-meta-value" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--ink)' }}>{formatIsoDatePtBr(state.selectedDate)}</p>
              </article>
              <article className="daily-meta-card" style={{ padding: '20px', background: 'rgba(20, 20, 23, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p className="daily-meta-label" style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <svg style={metaIconStyle} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Modo de Operação
                </p>
                <p className="daily-meta-value" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {dayPlan.planMode === 'manual' ? 'Plano manual' : 'Plano automático'}
                </p>
              </article>
              <article className="daily-meta-card" style={{ padding: '20px', background: 'rgba(20, 20, 23, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p className="daily-meta-label" style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <svg style={metaIconStyle} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 21 5-5-5-5"/><path d="M21 16H9a7 7 0 0 1-7-7v-5"/></svg>
                  Ciclo Atual
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <p className="daily-meta-value" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {dayPlan.planMode === 'manual' ? `Semana ${dayPlan.weekNumber ?? '-'}` : 'Fase automática'}
                  </p>
                  <p className="daily-meta-note" style={{ margin: 0, padding: '4px 10px', background: 'rgba(255,255,255,0.1)', color: 'var(--ink)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {eventLabel}
                  </p>
                </div>
              </article>
            </div>
          }
        />
      </div>

      <div className="bento-smart-review">
        <SectionCard className="daily-smart-review" kicker="Dinâmico" title="Algoritmo de Revisão">
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Otimizando sua curva de esquecimento: 2 matérias críticas (Risco) e 1 matéria de manutenção (Elite).
        </p>
        
        {dailySmartReview.length > 0 ? (
          <div className="daily-block-grid">
            {dailySmartReview.map((item) => {
              const isRisk = ['C', 'D', 'E'].includes(item.submatter.grade);
              return (
                <article className="daily-block" key={item.submatter.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="daily-block-top">
                    <span style={getSubmatterBadgeStyle(item.submatter.grade)}>
                      Nota {item.submatter.grade} {isRisk ? '(Risco)' : '(Elite)'}
                    </span>
                    <span className="daily-block-area" style={{ opacity: 0.7 }}>
                      {item.submatter.lastReviewedAt ? formatIsoDatePtBr(item.submatter.lastReviewedAt) : 'Sem revisão'}
                    </span>
                  </div>
                  <p className="daily-block-title" style={{ marginTop: '8px' }}>{item.submatter.title}</p>
                  <p className="daily-block-detail">{item.topic.title}</p>
                  <div className="daily-block-detail" style={{ marginTop: 'auto', paddingTop: '12px' }}>
                    <Link 
                      to={`/conteudo?topicId=${item.topicId}`} 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: 'var(--ink-soft)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                      Estudar submatéria
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p>Nenhuma submatéria avaliada para revisão.</p>
        )}
      </SectionCard>
      </div>

      <div className="bento-progress">
      <SectionCard className="daily-progress-panel" kicker="Conclusão" title="Progresso oficial do dia">
        <div className="daily-progress-head">
          <p className="daily-progress-subtitle">
            Obrigatórios concluídos: {requiredDone}/{requiredItems.length}
          </p>
        </div>
        <ProgressBar value={progress} label="Progresso oficial do dia" />
      </SectionCard>
      </div>

      <div className="bento-roadmap">
      <SectionCard className="daily-roadmap" kicker="Sequência" title="Roteiro do dia">
        {dayPlan.isRestDay ? (
          <p>Domingo configurado como descanso fixo, sem pendência obrigatória.</p>
        ) : (
          <div className="daily-block-grid" data-testid="daily-manual-blocks">
            {visibleBlocks.map((block) => (
              <article className="daily-block" key={block.id}>
                <div className="daily-block-top">
                  <span className="daily-block-area">{block.area}</span>
                  {block.movedFromSunday ? (
                    <span className="daily-block-badge">Realocado do domingo</span>
                  ) : null}
                </div>
                <p className="daily-block-title">{block.title}</p>
                <p className="daily-block-detail">{block.detail}</p>
                {block.contentRefs?.length ? (
                  <div className="daily-block-detail">
                    <p className="daily-block-detail">
                      <strong>Conteúdo programático:</strong> {getManualBlockContentSummary(block)}
                    </p>
                    {block.contentTargets?.length ? (
                      <ul>
                        {block.contentTargets.map((target) => (
                          <li key={target.topicId}>
                            <Link to={target.path}>{target.title}</Link>
                            {target.sectionTitle ? ` (${target.sectionTitle})` : ''}
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

      <div className="bento-checklist">
      <SectionCard className="daily-checklist-panel" data-testid="daily-checklist" kicker="Controle" title="Checklist do dia">

        <p className="daily-checklist-title" style={{ marginTop: 0 }}>Obrigatórios</p>
        <div className="checklist" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requiredItems.map((item) => (
            <div className="check-item" key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', borderRadius: '12px' }}>
              <div className="check-item-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{item.label}</p>
                <div>
                  <span 
                    className={item.status === 'concluido' ? 'status-done' : 'status-pending'}
                    style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: item.status === 'concluido' ? 'rgba(187, 247, 208, 0.1)' : 'rgba(252, 211, 77, 0.1)' }}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="check-item-controls">
                {item.kind === 'counter' ? (
                  <div className="counter-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
                    <input
                      data-testid={`check-${item.id}`}
                      style={{ 
                        width: '50px', textAlign: 'center', background: 'transparent', border: 'none', 
                        borderBottom: '1px solid var(--ink-soft)', color: 'var(--ink)', fontSize: '1rem', outline: 'none' 
                      }}
                      type="number"
                      min={0}
                      max={Math.max(item.target, item.done, 1)}
                      value={item.done}
                      onChange={(event) => handleChecklistChange(item.id, event, 'counter')}
                    />
                    <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', fontWeight: 500 }}>
                      / {item.target} {item.unit}
                    </span>
                  </div>
                ) : (
                  <label className="boolean-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '8px' }}>
                    <input
                      data-testid={`check-${item.id}`}
                      type="checkbox"
                      style={{ width: '22px', height: '22px', accentColor: 'var(--cyan)', cursor: 'pointer' }}
                      checked={item.done >= 1}
                      onChange={(event) => handleChecklistChange(item.id, event, 'boolean')}
                    />
                    <span style={{ fontWeight: 600 }}>Concluído</span>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        {optionalItems.length > 0 ? (
          <>
            <p className="daily-checklist-title" style={{ marginTop: '24px' }}>Opcionais</p>
            <div className="checklist" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {optionalItems.map((item) => (
                <div className="check-item" key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', borderRadius: '12px', opacity: 0.85 }}>
                  <div className="check-item-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p style={{ fontWeight: 500, margin: 0 }}>{item.label}</p>
                    <div>
                      <span 
                        className={item.status === 'concluido' ? 'status-done' : 'status-pending'}
                        style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: item.status === 'concluido' ? 'rgba(187, 247, 208, 0.1)' : 'rgba(252, 211, 77, 0.1)' }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="check-item-controls">
                    {item.kind === 'counter' ? (
                      <div className="counter-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
                        <input
                          data-testid={`check-${item.id}`}
                          style={{ 
                            width: '50px', textAlign: 'center', background: 'transparent', border: 'none', 
                            borderBottom: '1px solid var(--ink-soft)', color: 'var(--ink)', fontSize: '1rem', outline: 'none' 
                          }}
                          type="number"
                          min={0}
                          max={Math.max(item.target, item.done, 1)}
                          value={item.done}
                          onChange={(event) => handleChecklistChange(item.id, event, 'counter')}
                        />
                        <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', fontWeight: 500 }}>
                          / {item.target} {item.unit}
                        </span>
                      </div>
                    ) : (
                      <label className="boolean-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '8px' }}>
                        <input
                          data-testid={`check-${item.id}`}
                          type="checkbox"
                          style={{ width: '22px', height: '22px', accentColor: 'var(--cyan)', cursor: 'pointer' }}
                          checked={item.done >= 1}
                          onChange={(event) => handleChecklistChange(item.id, event, 'boolean')}
                        />
                        <span style={{ fontWeight: 600 }}>Concluído</span>
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

      <div className="bento-notes">
      <SectionCard className="daily-notes-panel" kicker="Registro" title="Notas de evidência do dia">
        <textarea
          className="textarea"
          rows={5}
          placeholder="Ex.: acertei 42/50 questões, revisar regra de três composta e voz passiva"
          value={record.notes}
          onChange={(event) => setDailyNote(state.selectedDate, event.target.value)}
        />
      </SectionCard>
      </div>
    </section>
  );
};
