import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAppContext } from '../app/AppContext';
import { buildReviewQueue } from '../app/contentSubmatters';
import {
  buildExamProgressTotals,
  countCompletedItemById,
  countOverdueDays,
  getChecklistProgressPercent,
} from '../app/progress';
import { formatIsoDatePtBr, subjectLabel, workActivityLabel } from '../app/formatters';
import { getManualBlockContentSummary } from '../app/manualPlanContentRefs';
import { calculateAnkiProjection } from '../app/anki';
import { ActionButton } from '../components/ActionButton';
import { MetricCard } from '../components/MetricCard';
import { PageIntro } from '../components/PageIntro';
import { SectionCard } from '../components/SectionCard';
import { RadialProgress } from '../components/RadialProgress';

const findNextEventDate = (
  fromDate: string,
  plans: ReturnType<typeof useAppContext>['dayPlans'],
  predicate: (date: string) => boolean,
): string | null => {
  for (const dayPlan of plans) {
    if (dayPlan.date >= fromDate && predicate(dayPlan.date)) {
      return dayPlan.date;
    }
  }

  return null;
};

export const DashboardPage = () => {
  const { state, dayPlans, dayPlansByDate, monthlyTargets, topics } = useAppContext();
  const plan = dayPlansByDate[state.selectedDate];
  const record = state.dailyRecords[state.selectedDate];

  const reviewQueue = useMemo(
    () => buildReviewQueue(state.topicSubmattersByTopic, topics, state.selectedDate).slice(0, 6),
    [state.topicSubmattersByTopic, topics, state.selectedDate]
  );

  const progress = record ? getChecklistProgressPercent(record.checklist) : 0;
  const monthTarget = monthlyTargets.find((target) => target.monthKey === state.selectedDate.slice(0, 7));

  const totals = buildExamProgressTotals(state.dailyRecords, monthlyTargets);
  const monthSimuladosDone = countCompletedItemById(
    state.dailyRecords,
    'simulado',
    state.selectedDate.slice(0, 7),
  );
  const monthRedacoesDone = countCompletedItemById(
    state.dailyRecords,
    'redacao',
    state.selectedDate.slice(0, 7),
  );

  const overdueCount = countOverdueDays(dayPlansByDate, state.dailyRecords, state.selectedDate);

  const nextSimulado = findNextEventDate(
    state.selectedDate,
    dayPlans,
    (date) => dayPlansByDate[date]?.hasSimulado ?? false,
  );
  const ankiProjection = useMemo(
    () =>
      calculateAnkiProjection({
        targetCards: state.ankiConfig.additionalCardsTarget,
        newCardsPerActiveDay: state.ankiConfig.newCardsPerActiveDay,
        alreadyAdded: state.ankiStats.newCardsAdded,
        pauseWeekdays: state.ankiConfig.pauseWeekdays,
        referenceDate: state.planSettings.startDate,
      }),
    [
      state.ankiConfig.additionalCardsTarget,
      state.ankiConfig.newCardsPerActiveDay,
      state.ankiConfig.pauseWeekdays,
      state.planSettings.startDate,
      state.ankiStats.newCardsAdded,
    ],
  );

  return (
    <section className="page dashboard-mobile-page">
      <PageIntro
        kicker="SESSÃO ATIVA • UTC-3"
        title="Dashboard de Execução"
        description="Controle diário, metas mensais e pressão real do edital com foco em prioridade e ritmo."
        actions={
          <ActionButton
            to="/conteudo?focus=review-now"
            style={{
              background: '#d9f349',
              color: '#0e0e0e',
              border: 'none',
              boxShadow: '0 0 20px rgba(217, 243, 73, 0.25)',
              fontWeight: 800,
            }}
          >
            ⚡ Abrir revisão crítica
          </ActionButton>
        }
      />

      <div className="dashboard-quick-stats">
        <MetricCard
          kicker="Hoje"
          title="Progresso do dia"
          value={`${progress}%`}
          subtitle={plan?.isRestDay ? 'Domingo de descanso' : formatIsoDatePtBr(state.selectedDate)}
          emphasis="green"
        />
        <MetricCard
          kicker="Meta ativa"
          title="Questões hoje"
          value={`${plan?.targets.objectiveQuestions ?? 0}`}
          subtitle={plan?.hasSimulado ? 'Substituído por simulado' : 'Meta ativa'}
          emphasis="orange"
        />
        <MetricCard
          kicker="Memória"
          title="Cards restantes"
          value={`${ankiProjection.remainingCards}`}
          subtitle={`Término estimado: ${ankiProjection.estimatedFinishDate ?? 'fora da janela'}`}
          emphasis="blue"
        />
        <MetricCard
          kicker="Risco"
          title="Dias em atraso"
          value={`${overdueCount}`}
          subtitle="Dias anteriores com progresso < 100%"
          emphasis={overdueCount > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="dashboard-grid-asymmetric">
        <div className="dashboard-column-main">
          <SectionCard
            kicker="Foco de execução"
            title="Plano do dia"
            aside={<span className="eyebrow-badge">{plan?.hasSimulado || plan?.hasRedacao ? 'Evento especial' : 'Fluxo normal'}</span>}
          >
            {plan?.isRestDay ? (
              <p>Domingo reservado para descanso e recuperação de energia.</p>
            ) : plan?.planMode === 'manual' ? (
              <>
                <p>
                  Plano manual: <strong>Semana {plan.weekNumber ?? '-'}</strong>
                </p>
                {plan.manualBlocks?.slice(0, 3).map((block) => (
                  <div key={block.id} className="task-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem', margin: '0 0 4px' }}>
                        {block.area}: {block.title}
                      </p>
                      {block.contentRefs?.length ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{getManualBlockContentSummary(block)}</p>
                      ) : null}
                    </div>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ccc' }}>
                      IN PROGRESS
                    </span>
                  </div>
                ))}
                <p>
                  Simulado: {plan?.hasSimulado ? 'sim' : 'não'} | Redação: {plan?.hasRedacao ? 'sim' : 'não'}
                </p>
              </>
            ) : (
              <>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem', margin: '0 0 4px' }}>
                      {subjectLabel(plan?.subjects[0] ?? 'portugues')}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      Matéria primária do ciclo
                    </p>
                  </div>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ccc' }}>
                    IN PROGRESS
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem', margin: '0 0 4px' }}>
                      {subjectLabel(plan?.subjects[1] ?? 'rlm')}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      Matéria secundária
                    </p>
                  </div>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    PENDING
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem', margin: '0 0 4px' }}>
                      Trabalho
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      {workActivityLabel(plan?.workActivity ?? 'programacao')}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    PENDING
                  </span>
                </div>
                <p style={{ marginTop: '16px', opacity: 0.7, fontSize: '0.8rem' }}>
                  Simulado: {plan?.hasSimulado ? 'sim' : 'não'} | Redação: {plan?.hasRedacao ? 'sim' : 'não'}
                </p>
              </>
            )}
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Progresso do dia</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 600 }}>{progress}% <span style={{fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 400}}>Concluído</span></h3>
              </div>
              <RadialProgress progress={progress} size={60} strokeWidth={5} />
            </div>
          </SectionCard>
        </div>

        <div className="dashboard-column-side">
          <SectionCard as="article" title="Metas mensais" aside={<span style={{fontSize:'1rem'}}>📈</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Simulados</span>
                  <span style={{ color: 'var(--color-primary)' }}>{monthSimuladosDone}/{monthTarget?.simulados ?? 0}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ width: monthTarget?.simulados && monthTarget.simulados > 0 ? `${Math.min((monthSimuladosDone/monthTarget.simulados)*100, 100)}%` : '0%', height: '100%', background: 'var(--color-primary)', borderRadius: '2px', boxShadow: '0 0 10px var(--color-primary)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Redações</span>
                  <span style={{ color: 'var(--color-secondary)' }}>{monthRedacoesDone}/{monthTarget?.redacoes ?? 0}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ width: monthTarget?.redacoes && monthTarget.redacoes > 0 ? `${Math.min((monthRedacoesDone/monthTarget.redacoes)*100, 100)}%` : '0%', height: '100%', background: 'var(--color-secondary)', borderRadius: '2px', boxShadow: '0 0 10px var(--color-secondary)' }} />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard as="article" title="Metas totais do ciclo" aside={<span style={{fontSize:'1rem'}}>🔄</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>{totals.simuladosDone}/{totals.simuladosTarget} Simulados</span>
                  <span style={{ color: 'var(--color-primary)' }}>{(totals.simuladosDone/Math.max(totals.simuladosTarget,1)*100).toFixed(0)}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ width: `${Math.min((totals.simuladosDone/Math.max(totals.simuladosTarget,1)*100), 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '2px', boxShadow: '0 0 10px var(--color-primary)' }} />
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Próximo: {nextSimulado ? formatIsoDatePtBr(nextSimulado) : 'N/A'}
              </p>
            </div>
          </SectionCard>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <SectionCard
          as="article"
          className="review-widget dashboard-review-widget"
          title="Mapa rápido de revisão do edital"
          aside={<Link to="/conteudo" style={{ cursor: 'pointer', fontSize: '0.85rem', alignSelf: 'center', textDecoration: 'none', color: 'var(--text-main)' }}>Ver mapa completo ➔</Link>}
        >
          <div className="review-grid">
            {reviewQueue.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0' }}>Você está em dia com as revisões.</p>
            ) : (
              reviewQueue.map(item => {
                const STALE_ICONS: Record<string, string> = {
                  unreviewed: '📄',
                  critical: '🚨',
                  warning: '⚠️',
                  fresh: '✅',
                };
                
                return (
                  <Link 
                    key={item.submatterId}
                    to={`/conteudo/topico/${item.topicId}?submatter=${item.submatterId}`}
                    className="review-map-card"
                  >
                    <div className="review-map-card-label">
                      <span className="review-map-card-icon">{STALE_ICONS[item.staleBucket] || '📄'}</span>
                      <span>{item.submatterTitle}</span>
                    </div>
                    <span className="review-map-card-arrow"><ChevronRight size={18} /></span>
                  </Link>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>
    </section>
  );
};

