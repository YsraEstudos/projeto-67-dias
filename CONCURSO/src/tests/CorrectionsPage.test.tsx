import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createStateWithTopics, renderConcursoApp, topicIdByTitle } from './renderConcursoApp';

describe('CorrectionsPage', () => {
  it('fecha o bottom sheet apos cadastrar um novo link de correcao', async () => {
    const user = userEvent.setup();
    const topicTitle = 'Domínio da ortografia oficial.';
    const topicId = topicIdByTitle(topicTitle);

    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-14';
    });

    renderConcursoApp('/correcoes', state);

    await user.click(screen.getByRole('button', { name: /novo link/i }));
    expect(screen.getByRole('dialog', { name: /novo link de correção/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Tópico'), topicId);
    await user.type(screen.getByLabelText('URL da questão'), 'https://questao.example');
    await user.type(screen.getByLabelText('URL da correção'), 'https://correcao.example');
    await user.click(screen.getByRole('button', { name: /adicionar link/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /novo link de correção/i })).not.toBeInTheDocument();
    });

    expect(screen.getAllByText(topicTitle).length).toBeGreaterThan(0);
  }, 15000);

  it('filtra os links cadastrados por materia', async () => {
    const user = userEvent.setup();
    const portugueseTopicTitle = 'Domínio da ortografia oficial.';
    const specificTopicTitle =
      'Arquitetura de computadores: processador, memória principal/secundária e dispositivos de E/S.';

    const state = createStateWithTopics((draft) => {
      draft.correctionLinks = [
        {
          id: 'corr-pt',
          topicId: topicIdByTitle(portugueseTopicTitle),
          questionUrl: 'https://questao-pt.example',
          correctionUrl: 'https://correcao-pt.example',
          hasAnkiCard: false,
          status: 'pendente',
          note: 'PT',
          createdAt: '2026-03-14T12:00:00.000Z',
        },
        {
          id: 'corr-esp',
          topicId: topicIdByTitle(specificTopicTitle),
          questionUrl: 'https://questao-esp.example',
          correctionUrl: 'https://correcao-esp.example',
          hasAnkiCard: true,
          status: 'corrigida',
          note: 'ESP',
          createdAt: '2026-03-14T13:00:00.000Z',
        },
      ];
    });

    renderConcursoApp('/correcoes', state);

    expect(screen.getAllByText(portugueseTopicTitle).length).toBeGreaterThan(0);
    expect(screen.getAllByText(specificTopicTitle).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByDisplayValue('Todas as matérias'), 'portugues');

    expect(screen.getAllByText(portugueseTopicTitle).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(specificTopicTitle)).toHaveLength(0);
  }, 10000);
});
