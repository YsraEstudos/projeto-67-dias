import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../app/AppContext';
import { buildGradesSummary, buildReviewQueue } from '../app/contentSubmatters';
import {
  buildExamProgressTotals,
  countCompletedItemById,
  countOverdueDays,
  getChecklistProgressPercent,
} from '../app/progress';
import { formatIsoDatePtBr, subjectLabel, workActivityLabel } from '../app/formatters';
import { calculateAnkiProjection } from '../app/anki';
import { MetricCard } from '../components/MetricCard';
import { ProgressBar } from '../components/ProgressBar';

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
      }),
    [
      state.ankiConfig.additionalCardsTarget,
      state.ankiConfig.newCardsPerActiveDay,
      state.ankiConfig.pauseWeekdays,
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
      <header className="page-header">
        <h2>Dashboard de Execução</h2>
        <p>
          Controle diário, metas mensais e cobertura do edital com foco total no período oficial.
        </p>
      </header>

      <div className="grid-4">
        <MetricCard
          title="Progresso do dia"
          value={`${progress}%`}
          subtitle={plan?.isRestDay ? 'Domingo de descanso' : formatIsoDatePtBr(state.selectedDate)}
          emphasis="blue"
        />
        <MetricCard
          title="Questões hoje"
          value={`${plan?.targets.objectiveQuestions ?? 0}`}
          subtitle={plan?.hasSimulado ? 'Substituído por simulado' : 'Meta ativa'}
          emphasis="orange"
        />
        <MetricCard
          title="Cards restantes"
          value={`${ankiProjection.remainingCards}`}
          subtitle={`Término estimado: ${ankiProjection.estimatedFinishDate ?? 'fora da janela'}`}
          emphasis="green"
        />
        <MetricCard
          title="Dias em atraso"
          value={`${overdueCount}`}
          subtitle="Dias anteriores com progresso < 100%"
          emphasis={overdueCount > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="panel">
        <h3>Plano do dia</h3>
        {plan?.isRestDay ? (
          <p>Domingo reservado para descanso e recuperação de energia.</p>
        ) : plan?.planMode === 'manual' ? (
          <>
            <p>
              Plano manual: <strong>Semana {plan.weekNumber ?? '-'}</strong>
            </p>
            {plan.manualBlocks?.slice(0, 3).map((block) => (
              <p key={block.id}>
                {block.area}: {block.title}
              </p>
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
      </div>

      <div className="grid-2">
        <article className="panel">
          <h3>Metas mensais ({state.selectedDate.slice(0, 7)})</h3>
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
        </article>

        <article className="panel">
          <h3>Metas totais do ciclo</h3>
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
        </article>
      </div>

      <article className="panel review-widget dashboard-review-widget" data-testid="dashboard-content-review-widget">
        <div className="review-widget-header">
          <div>
            <p className="review-widget-kicker">Conteúdo pragmático</p>
            <h3>Mapa rápido de revisão do edital</h3>
            <p className="review-widget-copy">
              Veja quantas submatérias estão frágeis, o que está sem revisar e entre direto na fila
              de revisão.
            </p>
          </div>
          <Link className="button" to="/conteudo?focus=review-now">
            Abrir fila de revisão
          </Link>
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
              className="review-widget-preview"
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
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
};

