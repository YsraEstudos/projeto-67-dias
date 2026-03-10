import type { ChangeEvent } from 'react';
import { useAppContext } from '../app/AppContext';
import { getChecklistProgressPercent } from '../app/progress';
import { formatIsoDatePtBr, subjectLabel, workActivityLabel } from '../app/formatters';
import { ProgressBar } from '../components/ProgressBar';

export const DailyPlanPage = () => {
  const { state, dayPlansByDate, updateChecklistItem, setDailyNote } = useAppContext();
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

  const fallbackBlocks: Array<{
    id: string;
    area: string;
    title: string;
    detail: string;
    movedFromSunday?: boolean;
  }> = [
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

  return (
    <section className="page">
      <header className="page-header daily-header">
        <div>
          <p className="daily-kicker">Roteiro diário executável</p>
          <h2>Plano Diário</h2>
          <p>Checklist personalizado por dia, com foco em execução e evidência.</p>
        </div>

        <div className="daily-meta-grid">
          <article className="daily-meta-card">
            <p className="daily-meta-label">Data</p>
            <p className="daily-meta-value">{formatIsoDatePtBr(state.selectedDate)}</p>
          </article>
          <article className="daily-meta-card">
            <p className="daily-meta-label">Modo</p>
            <p className="daily-meta-value">
              {dayPlan.planMode === 'manual' ? 'Plano manual' : 'Plano automático'}
            </p>
          </article>
          <article className="daily-meta-card">
            <p className="daily-meta-label">Semana / Evento</p>
            <p className="daily-meta-value">
              {dayPlan.planMode === 'manual' ? `Semana ${dayPlan.weekNumber ?? '-'}` : 'Fase automática'}
            </p>
            <p className="daily-meta-note">{eventLabel}</p>
          </article>
        </div>
      </header>

      <div className="panel daily-progress-panel">
        <div className="daily-progress-head">
          <p className="daily-progress-title">Progresso oficial do dia</p>
          <p className="daily-progress-subtitle">
            Obrigatórios concluídos: {requiredDone}/{requiredItems.length}
          </p>
        </div>
        <ProgressBar value={progress} label="Progresso oficial do dia" />
      </div>

      <div className="panel daily-roadmap">
        <h3>Roteiro do dia</h3>
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
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="panel daily-checklist-panel" data-testid="daily-checklist">
        <h3>Checklist do dia</h3>

        <p className="daily-checklist-title">Obrigatórios</p>
        <div className="checklist">
          {requiredItems.map((item) => (
            <div className="check-item" key={item.id}>
              <div className="check-item-info">
                <p>{item.label}</p>
                <div>
                  <span className={item.status === 'concluido' ? 'status-done' : 'status-pending'}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="check-item-controls">
                {item.kind === 'counter' ? (
                  <div className="counter-row">
                    <input
                      data-testid={`check-${item.id}`}
                      className="input"
                      style={{ width: '80px', textAlign: 'center' }}
                      type="number"
                      min={0}
                      max={Math.max(item.target, item.done, 1)}
                      value={item.done}
                      onChange={(event) => handleChecklistChange(item.id, event, 'counter')}
                    />
                    <span style={{ color: 'var(--ink-soft)' }}>
                      / {item.target} {item.unit}
                    </span>
                  </div>
                ) : (
                  <label className="boolean-row">
                    <input
                      data-testid={`check-${item.id}`}
                      type="checkbox"
                      style={{ width: '20px', height: '20px', accentColor: 'var(--cyan)' }}
                      checked={item.done >= 1}
                      onChange={(event) => handleChecklistChange(item.id, event, 'boolean')}
                    />
                    <span style={{ fontWeight: 500 }}>Concluído</span>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        {optionalItems.length > 0 ? (
          <>
            <p className="daily-checklist-title">Opcionais</p>
            <div className="checklist">
              {optionalItems.map((item) => (
                <div className="check-item" key={item.id}>
                  <div className="check-item-info">
                    <p>{item.label}</p>
                    <div>
                      <span className={item.status === 'concluido' ? 'status-done' : 'status-pending'}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="check-item-controls">
                    {item.kind === 'counter' ? (
                      <div className="counter-row">
                        <input
                          data-testid={`check-${item.id}`}
                          className="input"
                          style={{ width: '80px', textAlign: 'center' }}
                          type="number"
                          min={0}
                          max={Math.max(item.target, item.done, 1)}
                          value={item.done}
                          onChange={(event) => handleChecklistChange(item.id, event, 'counter')}
                        />
                        <span style={{ color: 'var(--ink-soft)' }}>
                          / {item.target} {item.unit}
                        </span>
                      </div>
                    ) : (
                      <label className="boolean-row">
                        <input
                          data-testid={`check-${item.id}`}
                          type="checkbox"
                          style={{ width: '20px', height: '20px', accentColor: 'var(--cyan)' }}
                          checked={item.done >= 1}
                          onChange={(event) => handleChecklistChange(item.id, event, 'boolean')}
                        />
                        <span style={{ fontWeight: 500 }}>Concluído</span>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="panel daily-notes-panel">
        <h3>Notas de evidência do dia</h3>
        <textarea
          className="textarea"
          rows={5}
          placeholder="Ex.: acertei 42/50 questões, revisar regra de três composta e voz passiva"
          value={record.notes}
          onChange={(event) => setDailyNote(state.selectedDate, event.target.value)}
        />
      </div>
    </section>
  );
};
