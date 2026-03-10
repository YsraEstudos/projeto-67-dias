import { useMemo } from 'react';
import { useAppContext } from '../app/AppContext';
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
  const { state, dayPlans, dayPlansByDate, monthlyTargets } = useAppContext();
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
    </section>
  );
};

