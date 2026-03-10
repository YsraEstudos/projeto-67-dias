import { useAppContext } from '../app/AppContext';
import { countCompletedItemById } from '../app/progress';
import { formatIsoDatePtBr } from '../app/formatters';

export const SimuladosPage = () => {
  const { state, dayPlans, updateChecklistItem, monthlyTargets } = useAppContext();

  const eventDays = dayPlans.filter((day) => day.hasSimulado || day.hasRedacao);

  const totalSimuladosDone = countCompletedItemById(state.dailyRecords, 'simulado');
  const totalRedacoesDone = countCompletedItemById(state.dailyRecords, 'redacao');
  const totalSimuladosTarget = monthlyTargets.reduce((sum, target) => sum + target.simulados, 0);
  const totalRedacoesTarget = monthlyTargets.reduce((sum, target) => sum + target.redacoes, 0);

  return (
    <section className="page">
      <header className="page-header">
        <h2>Simulados e Redações</h2>
        <p>Metas mensais derivadas automaticamente do cronograma diário executável.</p>
      </header>

      <div className="grid-2">
        <article className="panel">
          <h3>Meta total</h3>
          <p>
            Simulados: <strong>{totalSimuladosDone}/{totalSimuladosTarget}</strong>
          </p>
          <p>
            Redações: <strong>{totalRedacoesDone}/{totalRedacoesTarget}</strong>
          </p>
        </article>

        <article className="panel">
          <h3>Regra operacional</h3>
          <p>Dia de simulado: questões objetivas podem ser substituídas.</p>
          <p>Dias de redação seguem a meta específica definida no plano daquela data.</p>
        </article>
      </div>

      <div className="panel table-wrap">
        <h3>Cadência mensal oficial</h3>
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
            {monthlyTargets.map((target) => (
              <tr key={target.monthKey}>
                <td>{target.monthKey}</td>
                <td>{target.simulados}</td>
                <td>{countCompletedItemById(state.dailyRecords, 'simulado', target.monthKey)}</td>
                <td>{target.redacoes}</td>
                <td>{countCompletedItemById(state.dailyRecords, 'redacao', target.monthKey)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Calendário efetivo de eventos</h3>
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
      </div>
    </section>
  );
};

