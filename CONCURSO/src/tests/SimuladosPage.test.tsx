import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createStateWithTopics, renderConcursoApp } from './renderConcursoApp';

describe('SimuladosPage', () => {
  it('atualiza o total de simulados ao marcar um evento do calendario', async () => {
    const user = userEvent.setup();
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-14';
    });

    renderConcursoApp('/simulados-redacoes', state);

    const totalCard = screen.getByText('Meta total').closest('article');
    if (!totalCard) {
      throw new Error('Meta total card not found');
    }

    const getDoneSimulados = (): number => {
      const text = within(totalCard).getByText(/Simulados:/i).textContent ?? '';
      const match = /Simulados:\s*(\d+)\//i.exec(text);
      return match ? Number.parseInt(match[1], 10) : 0;
    };

    const firstSimuladoCheckbox = screen.getAllByRole('checkbox', {
      name: /simulado concluído/i,
    })[0] as HTMLInputElement;

    const before = getDoneSimulados();
    const wasChecked = firstSimuladoCheckbox.checked;

    await user.click(firstSimuladoCheckbox);

    await waitFor(() => {
      expect(getDoneSimulados()).toBe(wasChecked ? before - 1 : before + 1);
    });
  }, 30000);

  it('renderiza os cards mobile da cadencia mensal com mes e contadores', () => {
    const state = createStateWithTopics(() => undefined);

    renderConcursoApp('/simulados-redacoes', state);

    expect(screen.getAllByText(/^Mês:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Simulados/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Redações/i).length).toBeGreaterThan(0);
  }, 10000);
});
