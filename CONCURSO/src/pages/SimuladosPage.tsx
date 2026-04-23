import { useMemo } from 'react';
import { useAppContext } from '../app/AppContext';
import { buildExamProgressSummary } from '../app/progress';
import { formatIsoDatePtBr } from '../app/formatters';
import { PageIntro } from '../components/PageIntro';
import { SectionCard } from '../components/SectionCard';

const EMPTY_MONTH_PROGRESS = {
  simuladosDone: 0,
  redacoesDone: 0,
};

export const SimuladosPage = () => {
  const { state, dayPlans, updateChecklistItem, monthlyTargets } = useAppContext();

  const eventDays = useMemo(
    () => dayPlans.filter((day) => day.hasSimulado || day.hasRedacao),
    [dayPlans],
  );
  const examProgress = useMemo(
    () => buildExamProgressSummary(state.dailyRecords, monthlyTargets),
    [state.dailyRecords, monthlyTargets],
  );
  const monthlyProgressRows = useMemo(
    () =>
      monthlyTargets.map((target) => ({
        target,
        progress: examProgress.byMonth[target.monthKey] ?? EMPTY_MONTH_PROGRESS,
      })),
    [examProgress, monthlyTargets],
  );

  return (
    <section className="page">
      <PageIntro
        kicker="Calendário operacional"
        title="Simulados e Redações"
        description="Metas mensais, cadência real e eventos efetivos derivados automaticamente do cronograma diário."
      />

      <div className="grid-2">
        <SectionCard as="article" kicker="Volume" title="Meta total">
          <p>
            Simulados: <strong>{examProgress.simuladosDone}/{examProgress.simuladosTarget}</strong>
          </p>
          <p>
            Redações: <strong>{examProgress.redacoesDone}/{examProgress.redacoesTarget}</strong>
          </p>
        </SectionCard>

        <SectionCard as="article" kicker="Operação" title="Regra operacional">
          <p>Dia de simulado: questões objetivas podem ser substituídas.</p>
          <p>Dias de redação seguem a meta específica definida no plano daquela data.</p>
        </SectionCard>
      </div>

      <SectionCard className="table-wrap" kicker="Cadência" title="Cadência mensal oficial">
        <div className="hidden md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Meta Simulados</th>
                <th>Realizado</th>
                <th>Meta Redações</th>
                <th>Realizado</th>
              </tr>
            </thead>
            <tbody>
              {monthlyProgressRows.map(({ target, progress }) => (
                <tr key={target.monthKey}>
                  <td>{target.monthKey}</td>
                  <td>{target.simulados}</td>
                  <td>{progress.simuladosDone}</td>
                  <td>{target.redacoes}</td>
                  <td>{progress.redacoesDone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="block md:hidden">
          {monthlyProgressRows.map(({ target, progress }) => (
            <div className="mobile-list-card" key={target.monthKey}>
              <div className="mobile-list-card-header">
                Mês: {target.monthKey}
              </div>
              <div className="mobile-list-card-body">
                <div className="mobile-list-card-stat">
                  <span>Simulados</span>
                  <strong>
                    {progress.simuladosDone} / {target.simulados}
                  </strong>
                </div>
                <div className="mobile-list-card-stat">
                  <span>Redações</span>
                  <strong>
                    {progress.redacoesDone} / {target.redacoes}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard kicker="Timeline" title="Calendário efetivo de eventos">
        <div className="event-list">
          {eventDays.map((day) => {
            const record = state.dailyRecords[day.date];
            const simuladoItem = record?.checklist.find((item) => item.id === 'simulado');
            const redacaoItem = record?.checklist.find((item) => item.id === 'redacao');

            return (
              <article className="event-card" key={day.date}>
                <div>
                  <p className="event-date">{formatIsoDatePtBr(day.date)}</p>
                  <p>
                    {day.hasSimulado ? 'Simulado' : ''}
                    {day.hasSimulado && day.hasRedacao ? ' + ' : ''}
                    {day.hasRedacao ? 'Redação' : ''}
                  </p>
                </div>
                <div className="event-actions">
                  {simuladoItem ? (
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={simuladoItem.done >= 1}
                        onChange={(event) =>
                          updateChecklistItem(day.date, 'simulado', event.target.checked ? 1 : 0)
                        }
                      />
                      Simulado concluído
                    </label>
                  ) : null}
                  {redacaoItem ? (
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={redacaoItem.done >= 1}
                        onChange={(event) =>
                          updateChecklistItem(day.date, 'redacao', event.target.checked ? 1 : 0)
                        }
                      />
                      Redação concluída
                    </label>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </section>
  );
};

