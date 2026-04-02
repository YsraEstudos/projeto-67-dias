import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAppContext } from '../app/AppContext';
import { buildGradesSummary, buildReviewQueue } from '../app/contentSubmatters';
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
import { ProgressBar } from '../components/ProgressBar';
import { SectionCard } from '../components/SectionCard';

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
  const nextRedacao = findNextEventDate(
    state.selectedDate,
    dayPlans,
    (date) => dayPlansByDate[date]?.hasRedacao ?? false,
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
  const contentGrades = useMemo(
    () => buildGradesSummary(state.topicSubmattersByTopic),
    [state.topicSubmattersByTopic],
  );
  const contentReviewQueue = useMemo(
    () => buildReviewQueue(state.topicSubmattersByTopic, topics),
    [state.topicSubmattersByTopic, topics],
  );
  const reviewNowCount = contentReviewQueue.filter((item) => item.needsReview).length;
  const reviewPreview = contentReviewQueue.filter((item) => item.needsReview).slice(0, 3);

  return (
    <section className="page">
      <PageIntro
        kicker="Visão geral do plano"
        title="Dashboard de Execução"
        description="Controle diário, metas mensais e pressão real do edital com foco em prioridade e ritmo."
        actions={<ActionButton to="/conteudo?focus=review-now">Abrir revisão crítica</ActionButton>}
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
                  <div key={block.id}>
                    <p>
                      {block.area}: {block.title}
                    </p>
                    {block.contentRefs?.length ? (
                      <p>Conteúdo programático: {getManualBlockContentSummary(block)}</p>
                    ) : null}
                  </div>
                ))}
                <p>
                  Simulado: {plan?.hasSimulado ? 'sim' : 'não'} | Redação: {plan?.hasRedacao ? 'sim' : 'não'}
                </p>
              </>
            ) : (
              <>
                <p>
                  Matérias do ciclo: <strong>{subjectLabel(plan?.subjects[0] ?? 'portugues')}</strong> e{' '}
                  <strong>{subjectLabel(plan?.subjects[1] ?? 'rlm')}</strong>
                </p>
                <p>Atividade no trabalho: {workActivityLabel(plan?.workActivity ?? 'programacao')}</p>
                <p>
                  Simulado: {plan?.hasSimulado ? 'sim' : 'não'} | Redação: {plan?.hasRedacao ? 'sim' : 'não'}
                </p>
              </>
            )}
            <ProgressBar value={progress} label="Barra oficial do dia" />
          </SectionCard>
        </div>

        <div className="dashboard-column-side">
          <SectionCard as="article" kicker="Cadência" title={`Metas mensais (${state.selectedDate.slice(0, 7)})`}>
            <p>
              Simulados: {monthSimuladosDone}/{monthTarget?.simulados ?? 0}
            </p>
            <p>
              Redações: {monthRedacoesDone}/{monthTarget?.redacoes ?? 0}
            </p>
            <ProgressBar
              value={
                monthTarget
                  ? Math.round(
                      ((monthSimuladosDone + monthRedacoesDone) /
                        Math.max(monthTarget.simulados + monthTarget.redacoes, 1)) *
                        100,
                    )
                  : 0
              }
              label="Cumprimento mensal"
            />
          </SectionCard>

          <SectionCard as="article" kicker="Janela completa" title="Metas totais do ciclo">
            <p>
              Simulados: {totals.simuladosDone}/{totals.simuladosTarget}
            </p>
            <p>
              Redações: {totals.redacoesDone}/{totals.redacoesTarget}
            </p>
            <p>
              Próximo simulado: {nextSimulado ? formatIsoDatePtBr(nextSimulado) : 'sem data futura'}
            </p>
            <p>
              Próxima redação: {nextRedacao ? formatIsoDatePtBr(nextRedacao) : 'sem data futura'}
            </p>
          </SectionCard>

          <SectionCard
            as="article"
            className="review-widget dashboard-review-widget"
            data-testid="dashboard-content-review-widget"
            kicker="Conteúdo pragmático"
            title="Mapa rápido de revisão do edital"
            aside={<ActionButton to="/conteudo?focus=review-now">Abrir fila</ActionButton>}
          >
            <div className="review-widget-header">
              <p className="review-widget-copy">
                Veja quantas submatérias estão frágeis, o que está sem revisar e entre direto na fila
                de revisão.
              </p>
            </div>

            <div className="review-widget-metrics">
              <article className="review-widget-metric">
                <span className="review-widget-metric-label">Total de submatérias</span>
                <strong className="review-widget-metric-value">{contentGrades.total}</strong>
              </article>
              <article className="review-widget-metric review-widget-metric-alert">
                <span className="review-widget-metric-label">Revisar agora</span>
                <strong className="review-widget-metric-value" data-testid="dashboard-review-now-count">
                  {reviewNowCount}
                </strong>
              </article>
            </div>

            <div className="grade-pill-row" data-testid="dashboard-grade-distribution">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((grade, index) => (
                <div
                  key={grade}
                  className={`grade-pill grade-pill-${grade.toLowerCase()} grade-pill-animated`}
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <span className="grade-pill-letter">{grade}</span>
                  <span className="grade-pill-count">{contentGrades.byGrade[grade]}</span>
                </div>
              ))}
            </div>

            <div className="review-widget-preview-list">
              {reviewPreview.map((item) => (
                <Link
                  key={item.submatterId}
                  className={`review-widget-preview review-widget-preview-${item.grade.toLowerCase()}`}
                  to={`/conteudo/topico/${item.topicId}?submatter=${item.submatterId}`}
                >
                  <span className={`grade-dot grade-dot-${item.grade.toLowerCase()}`} aria-hidden="true" />
                  <span className="review-widget-preview-body">
                    <strong>{item.submatterTitle}</strong>
                    <span>
                      {item.topicTitle} ·{' '}
                      {item.daysSinceReview === null ? 'sem revisão' : `${item.daysSinceReview} dia(s)`}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-muted" opacity={0.5} />
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </section>
  );
};

