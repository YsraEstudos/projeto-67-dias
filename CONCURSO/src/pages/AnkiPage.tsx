import { useMemo, useState, type FormEvent } from 'react';
import { calculateAnkiConsistencyLast7Days, calculateAnkiProjection } from '../app/anki';
import { useAppContext } from '../app/AppContext';
import { ANKI_PAUSE_WEEKDAY_OPTIONS, FSRS_IFRAME_SRC } from '../app/constants';
import { getLocalTodayIsoDate } from '../app/dateUtils';
import { ankiPauseWeekdayLabel, formatIsoDatePtBr } from '../app/formatters';
import type { AnkiPauseWeekday } from '../app/types';
import { MetricCard } from '../components/MetricCard';
import { PageIntro } from '../components/PageIntro';
import { ProgressBar } from '../components/ProgressBar';
import { SectionCard } from '../components/SectionCard';

const getTodayIso = (): string => getLocalTodayIsoDate();

export const AnkiPage = () => {
  const { state, setAnkiConfig, upsertAnkiDailyLog } = useAppContext();
  const initialDate = getTodayIso();
  const initialLog = state.ankiStats.dailyLogs[initialDate];
  const [logDate, setLogDate] = useState<string>(initialDate);
  const [logNewCards, setLogNewCards] = useState<number>(initialLog?.newCards ?? 0);
  const [logReviews, setLogReviews] = useState<number>(initialLog?.reviews ?? 0);

  const projection = useMemo(
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

  const consistency = useMemo(
    () =>
      calculateAnkiConsistencyLast7Days({
        pauseWeekdays: state.ankiConfig.pauseWeekdays,
        dailyLogs: state.ankiStats.dailyLogs,
      }),
    [state.ankiConfig.pauseWeekdays, state.ankiStats.dailyLogs],
  );

  const cardsProgressPercent =
    state.ankiConfig.additionalCardsTarget <= 0
      ? 0
      : Math.round((state.ankiStats.newCardsAdded / state.ankiConfig.additionalCardsTarget) * 100);

  const onTogglePauseWeekday = (weekday: AnkiPauseWeekday) => {
    const current = state.ankiConfig.pauseWeekdays;
    const next = current.includes(weekday)
      ? current.filter((item) => item !== weekday)
      : [...current, weekday].sort((left, right) => left - right);

    setAnkiConfig({ pauseWeekdays: next });
  };

  const handleRegisterSession = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    upsertAnkiDailyLog({
      date: logDate,
      newCards: Math.max(0, Math.round(logNewCards)),
      reviews: Math.max(0, Math.round(logReviews)),
    });
  };

  const handleLogDateChange = (nextDate: string) => {
    const existingLog = state.ankiStats.dailyLogs[nextDate];
    setLogDate(nextDate);
    setLogNewCards(existingLog?.newCards ?? 0);
    setLogReviews(existingLog?.reviews ?? 0);
  };

  return (
    <section className="page">
      <PageIntro
        kicker="Memória e revisão"
        title="Anki & FSRS"
        description="Painel de consistência para ajustar meta, registrar sessões e acompanhar o ritmo sem se perder nos parâmetros avançados."
      />

      <SectionCard as="article" className="anki-beginner-panel" kicker="Guia rápido" title="Comece por aqui">
        <ol className="anki-beginner-steps">
          <li>Defina a meta total e quantos novos cards quer por dia ativo.</li>
          <li>Marque os dias de pausa (domingo já é descanso fixo).</li>
          <li>Registre sua sessão diária para atualizar progresso e consistência.</li>
        </ol>
      </SectionCard>

      <SectionCard as="article" className="anki-beginner-controls" kicker="Controle operacional" title="Controles simples">
        <div className="grid-2">
          <label className="field-label">
            Meta total de novos cards
            <input
              className="input"
              type="number"
              min={0}
              data-testid="anki-target-cards"
              value={state.ankiConfig.additionalCardsTarget}
              onChange={(event) =>
                setAnkiConfig({ additionalCardsTarget: Math.max(0, Number(event.target.value) || 0) })
              }
            />
          </label>
          <label className="field-label">
            Novos cards por dia ativo
            <input
              className="input"
              type="number"
              min={0}
              data-testid="anki-new-cards-day"
              value={state.ankiConfig.newCardsPerActiveDay}
              onChange={(event) =>
                setAnkiConfig({ newCardsPerActiveDay: Math.max(0, Number(event.target.value) || 0) })
              }
            />
          </label>
        </div>
        <fieldset className="anki-beginner-pause-group">
          <legend>Dias de pausa extras (seg-sáb)</legend>
          <div className="anki-beginner-pause-grid">
            {ANKI_PAUSE_WEEKDAY_OPTIONS.map((option) => (
              <label key={option.value} className="checkbox-line">
                <input
                  type="checkbox"
                  data-testid={`anki-pause-${option.value}`}
                  checked={state.ankiConfig.pauseWeekdays.includes(option.value)}
                  onChange={() => onTogglePauseWeekday(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="anki-beginner-help">Domingo permanece automaticamente sem meta de novos cards.</p>
        </fieldset>
      </SectionCard>

      <div className="grid-4">
        <MetricCard
          kicker="Meta"
          title="Cards adicionados"
          value={`${state.ankiStats.newCardsAdded}/${state.ankiConfig.additionalCardsTarget}`}
          subtitle="progresso da meta"
          emphasis="green"
        />
        <MetricCard kicker="Volume" title="Revisões acumuladas" value={`${state.ankiStats.reviewsDone}`} emphasis="blue" />
        <MetricCard
          kicker="Constância"
          title="Consistência (7 dias)"
          value={`${consistency.consistencyPercent}%`}
          subtitle={`${consistency.loggedDays}/${consistency.plannedActiveDays} dias ativos com registro`}
          emphasis="orange"
        />
        <MetricCard
          kicker="Projeção"
          title="Previsão de término"
          value={projection.estimatedFinishDate ? formatIsoDatePtBr(projection.estimatedFinishDate) : 'Fora da janela'}
          subtitle={`${projection.activeDaysNeeded} dias ativos necessários`}
          emphasis="blue"
        />
      </div>

      <SectionCard as="article" className="anki-beginner-summary" kicker="Resumo" title="Resumo essencial">
        <ProgressBar value={cardsProgressPercent} label="Progresso da meta de novos cards" />
        <p>
          Restantes: <strong>{projection.remainingCards}</strong> cards.
        </p>
        <p data-testid="anki-consistency">
          Consistência nos últimos 7 dias: <strong>{consistency.loggedDays}</strong> de{' '}
          <strong>{consistency.plannedActiveDays}</strong> dias ativos planejados.
        </p>
        <p>
          Dias ativos disponíveis até 30/09: <strong>{projection.activeDaysAvailableToSeptember}</strong>. Pausas
          configuradas:{' '}
          <strong>
            {state.ankiConfig.pauseWeekdays.length > 0
              ? state.ankiConfig.pauseWeekdays.map((weekday) => ankiPauseWeekdayLabel(weekday)).join(', ')
            : 'nenhuma'}
          </strong>
          .
        </p>
      </SectionCard>

      <SectionCard as="article" className="anki-quicklog-panel" kicker="Ação imediata" title="Registro diário rápido">
        <form className="anki-quicklog-form" onSubmit={handleRegisterSession} data-testid="anki-quicklog-form">
          <label className="field-label">
            Data
            <input
              className="input"
              type="date"
              data-testid="anki-log-date"
              value={logDate}
              onChange={(event) => handleLogDateChange(event.target.value)}
            />
          </label>
          <label className="field-label">
            Novos cards do dia
            <input
              className="input"
              type="number"
              min={0}
              data-testid="anki-log-new-cards"
              value={logNewCards}
              onChange={(event) => setLogNewCards(Number(event.target.value) || 0)}
            />
          </label>
          <label className="field-label">
            Revisões do dia
            <input
              className="input"
              type="number"
              min={0}
              data-testid="anki-log-reviews"
              value={logReviews}
              onChange={(event) => setLogReviews(Number(event.target.value) || 0)}
            />
          </label>
          <button className="button" type="submit" data-testid="anki-log-submit">
            Registrar sessão
          </button>
        </form>
      </SectionCard>

      <details className="panel anki-advanced-panel" data-testid="anki-advanced-panel">
        <summary>Ferramenta avançada FSRS</summary>
        <p className="anki-advanced-copy">
          Use esta seção apenas para ajustes finos. Glossário rápido: Again/Hard/Good/Easy = avaliação da resposta;
          retention = retenção desejada; stability = estabilidade da memória.
        </p>
        <iframe title="FSRS Visualizer" src={FSRS_IFRAME_SRC} loading="lazy" className="anki-iframe" />
      </details>
    </section>
  );
};
