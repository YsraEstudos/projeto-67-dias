import { screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createStateWithTopics, renderConcursoApp } from './renderConcursoApp'; 

describe('DailyPlanPage', () => {
  it('mostra o conteudo programatico oficial nos blocos do plano manual', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-14';
    });

    renderConcursoApp('/plano-diario', state);

    expect(screen.getByText('Web: HTML semântico + forms')).toBeInTheDocument();
    expect(screen.getAllByText(/Conteúdo programático:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/HTML/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: /HTML/i }),
    ).toHaveAttribute('href', expect.stringMatching(/^\/conteudo\/topico\/item-/));
  }, 20000);

  it('permite alterar o input do checklist opcional', () => {
    const state = createStateWithTopics((draft) => {
      const optionalCounterDate = Object.values(draft.dailyRecords).find((record) =>
        record.checklist.some((item) => item.id === 'objective-questions' && item.required === false),
      )?.date;

      if (!optionalCounterDate) {
        throw new Error('Nenhum dia com contador opcional encontrado no plano.');
      }

      draft.selectedDate = optionalCounterDate;
    });

    renderConcursoApp('/plano-diario', state);

    const input = screen.getByTestId('check-objective-questions');
    expect(input).toBeInTheDocument();
    
    fireEvent.change(input, { target: { value: '1' } });
    expect(input).toHaveValue(1);
  }, 20000);

  it('expõe labels acessíveis para controles opcionais em fluxos mobile', () => {
    const optionalCounterState = createStateWithTopics((draft) => {
      const optionalCounterDate = Object.values(draft.dailyRecords).find((record) =>
        record.checklist.some((item) => item.id === 'objective-questions' && item.required === false),
      )?.date;

      if (!optionalCounterDate) {
        throw new Error('Nenhum dia com contador opcional encontrado no plano.');
      }

      draft.selectedDate = optionalCounterDate;
    });

    const firstRender = renderConcursoApp('/plano-diario', optionalCounterState);

    const optionalCounter = screen.getByTestId('check-objective-questions');
    expect(optionalCounter).toHaveAccessibleName(/Atualizar meta/i);

    firstRender.unmount();

    const optionalBooleanState = createStateWithTopics((draft) => {
      const restDayDate = Object.values(draft.dailyRecords).find((record) =>
        record.checklist.some((item) => item.id === 'rest-day' && item.required === false),
      )?.date;

      if (!restDayDate) {
        throw new Error('Nenhum dia de descanso encontrado no plano.');
      }

      draft.selectedDate = restDayDate;
    });

    renderConcursoApp('/plano-diario', optionalBooleanState);

    const optionalBoolean = screen.getByTestId('check-rest-day');
    expect(optionalBoolean).toBeInTheDocument();
    expect(optionalBoolean).toHaveAccessibleName(/Marcar .* como concluído/i);
  }, 20000);
});
