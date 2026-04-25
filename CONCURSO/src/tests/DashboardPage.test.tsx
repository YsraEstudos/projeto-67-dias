import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { appReducer } from '../app/AppContext';
import { getLocalTodayIsoDate } from '../app/dateUtils';
import { buildPlanRuntime } from '../app/seed';
import { createStateWithTopics, renderConcursoApp } from './renderConcursoApp';

describe('DashboardPage', () => {
  it('renderiza sem crash e mostra os blocos principais', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-14';
    });

    renderConcursoApp('/', state);

    expect(screen.getByRole('heading', { name: /Dashboard de Execução/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Progresso do dia/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Mapa rápido de revisão do edital/i)).toBeInTheDocument();
  });

  it('expõe atalhos de interação com rotas prontas para toque no dashboard', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-14';
    });

    renderConcursoApp('/', state);

    const ctaLink = screen.getByRole('link', { name: /abrir revisão crítica/i });
    expect(ctaLink).toHaveAttribute('href', '/conteudo?focus=review-now');

    const mapLink = screen.getByRole('link', { name: /ver mapa completo/i });
    expect(mapLink).toHaveAttribute('href', '/conteudo');
  });

  it('permite abrir a matéria direto do card do plano manual no dashboard', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-14';
    });

    renderConcursoApp('/', state);

    const subjectLink = screen.getAllByRole('link', { name: /abrir matéria/i })[0];
    expect(subjectLink).toHaveAttribute('href', expect.stringMatching(/^\/conteudo\/topico\/item-/));
  });

  it('move a matéria para o próximo dia útil quando o usuário marca falhei', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-16';
    });
    const plan = buildPlanRuntime(state.planSettings.startDate).dayPlansByDate[state.selectedDate];
    const failedBlock = plan.manualBlocks?.[0];
    const nextOriginalPlan = buildPlanRuntime(state.planSettings.startDate).dayPlansByDate['2026-03-17'];
    const nextOverflowBlock = nextOriginalPlan.manualBlocks?.at(-1);

    expect(failedBlock).toBeDefined();
    expect(nextOverflowBlock).toBeDefined();

    if (!failedBlock || !nextOverflowBlock) {
      throw new Error('Plano manual sem blocos suficientes para testar remanejamento.');
    }

    const updatedState = appReducer(state, {
      type: 'fail-manual-block',
      date: state.selectedDate,
      blockId: failedBlock.id,
      at: '2026-03-16T12:00:00.000Z',
    });
    const updatedRuntime = buildPlanRuntime(
      updatedState.planSettings.startDate,
      updatedState.manualBlockReschedules,
    );

    expect(updatedRuntime.dayPlansByDate['2026-03-16'].manualBlocks?.map((block) => block.id)).not.toContain(
      failedBlock.id,
    );
    expect(updatedRuntime.dayPlansByDate['2026-03-17'].manualBlocks?.[0].id).toBe(failedBlock.id);
    expect(updatedRuntime.dayPlansByDate['2026-03-18'].manualBlocks?.[0].id).toBe(nextOverflowBlock.id);
  });

  it('registra a falha sem reconstruir todos os registros diários no clique', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-16';
    });
    const failedBlock = buildPlanRuntime(state.planSettings.startDate).dayPlansByDate[state.selectedDate]
      .manualBlocks?.[0];

    expect(failedBlock).toBeDefined();

    if (!failedBlock) {
      throw new Error('Plano manual sem bloco para testar o registro de falha.');
    }

    const updatedState = appReducer(state, {
      type: 'fail-manual-block',
      date: state.selectedDate,
      blockId: failedBlock.id,
      at: '2026-03-16T12:00:00.000Z',
    });

    expect(updatedState.dailyRecords).toBe(state.dailyRecords);
    expect(updatedState.manualBlockReschedules).toHaveLength(1);
  });

  it('mostra o botão Falhei no card e remove o bloco do dia após o clique', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-16';
    });
    const failedBlock = buildPlanRuntime(state.planSettings.startDate).dayPlansByDate[state.selectedDate]
      .manualBlocks?.[0];

    expect(failedBlock).toBeDefined();

    if (!failedBlock) {
      throw new Error('Plano manual sem bloco para testar o botão Falhei.');
    }

    renderConcursoApp('/', state);

    fireEvent.click(screen.getAllByRole('button', { name: /falhei/i })[0]);

    expect(screen.queryByText(`${failedBlock.area}: ${failedBlock.title}`)).not.toBeInTheDocument();
  });

  it('recalcula o card do plano quando a data de início muda sem trocar o dia ativo', () => {
    const selectedDate = getLocalTodayIsoDate();
    const initialState = createStateWithTopics((draft) => {
      draft.selectedDate = selectedDate;
    });

    const beforePlan = buildPlanRuntime(initialState.planSettings.startDate).dayPlansByDate[selectedDate];

    const updatedState = appReducer(initialState, {
      type: 'set-plan-start-date',
      startDate: '2026-04-15',
    });

    const afterPlan = buildPlanRuntime(updatedState.planSettings.startDate).dayPlansByDate[selectedDate];

    expect(updatedState.selectedDate).toBe(selectedDate);
    expect(beforePlan.weekNumber).not.toBe(afterPlan.weekNumber);

    renderConcursoApp('/', updatedState);

    expect(
      screen.getByText((_, element) => element?.textContent === `Plano manual: Semana ${afterPlan.weekNumber}`),
    ).toBeInTheDocument();

    const firstManualBlock = afterPlan.manualBlocks?.[0];
    expect(firstManualBlock).toBeDefined();

    if (!firstManualBlock) {
      throw new Error('Plano manual sem blocos para a data selecionada no teste.');
    }

    expect(
      screen.getByText(`${firstManualBlock.area}: ${firstManualBlock.title}`),
    ).toBeInTheDocument();
  });
}, 30000);
