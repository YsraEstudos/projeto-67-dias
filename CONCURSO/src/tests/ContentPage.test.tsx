import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { TheoreticalContentMarkdownDownloadSummary } from '../app/contentTheoreticalDownloads';
import {
  createStateWithTopics,
  createSubmatter,
  renderConcursoApp,
  topicIdByTitle,
} from './renderConcursoApp';

const { downloadTheoreticalContentsMarkdown } = vi.hoisted(() => ({
  downloadTheoreticalContentsMarkdown: vi.fn(
    async (): Promise<TheoreticalContentMarkdownDownloadSummary> => ({
    requestedCount: 0,
      topicCount: 0,
      bundleFilename: 'conteudo-pragmatico-2026-04-22.md',
    }),
  ),
}));

vi.mock('../app/contentTheoreticalDownloads', () => ({
  downloadTheoreticalContentsMarkdown,
}));

describe('ContentPage', () => {
  it(
    'mostra a nota atual na lista principal e filtra materias por essa nota',
    async () => {
    const user = userEvent.setup();
    const orthographyTopicId = topicIdByTitle('Domínio da ortografia oficial.');
    const accentuationTopicId = topicIdByTitle('Emprego da acentuação gráfica.');

    const state = createStateWithTopics((draft) => {
      draft.topicSubmattersByTopic[orthographyTopicId] = [
        createSubmatter('ortho-a', { title: 'Ortografia base', grade: 'A' }),
        createSubmatter('ortho-e', { title: 'Ortografia exceções', grade: 'E' }),
      ];
      draft.topicSubmattersByTopic[accentuationTopicId] = [
        createSubmatter('accent-a', { title: 'Acentuação', grade: 'A' }),
      ];
    });

    renderConcursoApp('/conteudo', state);

    const orthographyCard = screen.getByRole('link', { name: 'Domínio da ortografia oficial.' });
    const accentuationCard = screen.getByRole('link', { name: 'Emprego da acentuação gráfica.' });

    expect(within(orthographyCard).getByText('Nota atual E')).toBeInTheDocument();
    expect(within(accentuationCard).getByText('Nota atual A')).toBeInTheDocument();

    await user.click(
      within(screen.getByTestId('content-quick-filters')).getByRole('button', {
        name: /^A$/,
      }),
    );

    expect(screen.getByRole('link', { name: 'Emprego da acentuação gráfica.' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Domínio da ortografia oficial.' })).not.toBeInTheDocument();
    },
    20000,
  );

  it('exibe nomes padronizados quando o plano diario e o conteudo usam a mesma matéria', () => {
    const architectureTopicId = topicIdByTitle(
      'Arquitetura de computadores: processador, memória principal/secundária e dispositivos de E/S.',
    );

    const state = createStateWithTopics((draft) => {
      draft.topicSubmattersByTopic[architectureTopicId] = [
        createSubmatter('architecture-e', { title: 'Arquitetura: CPU, memória e I/O', grade: 'E' }),
      ];
    });

    renderConcursoApp('/conteudo', state);

    expect(
      screen.getByRole('link', { name: 'Arquitetura: CPU, memória e I/O' }),
    ).toBeInTheDocument();
  });

  it('encontra o tópico oficial ao buscar pelo nome do bloco do plano manual', async () => {
    const user = userEvent.setup();

    renderConcursoApp('/conteudo');

    await user.type(screen.getByPlaceholderText('Buscar tópico, submatéria, erro ou ação...'), 'css');

    expect(
      screen.getByRole('link', { name: 'Conceitos de desenvolvimento web: HTML5 e CSS3.' }),
    ).toBeInTheDocument();
  });

  it('mantém a busca curta precisa e não espalha css para tópicos mistos', async () => {
    const user = userEvent.setup();

    renderConcursoApp('/conteudo');

    await user.type(screen.getByPlaceholderText('Buscar tópico, submatéria, erro ou ação...'), 'css');

    expect(
      screen.getByRole('link', { name: 'Conceitos de desenvolvimento web: HTML5 e CSS3.' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Conceitos de XML e JSON.' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Fundamentos de web services: REST, SOAP, Swagger e JWT.' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Redes: DNS, DHCP, LDAP, NTP, SMTP, Syslog e HTTP' }),
    ).not.toBeInTheDocument();
  });

  it('aciona o download global de todo o conteudo teorico a partir da pagina principal', async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const state = createStateWithTopics((draft) => {
      draft.theoreticalContents = [
        {
          id: 'topic-file-1',
          ownerType: 'topic',
          ownerId: topicId,
          topicId,
          submatterId: null,
          filename: 'resumo.md',
          label: 'resumo.md',
          kind: 'markdown',
          mimeType: 'text/markdown',
          storageKey: 'storage-topic-file-1',
          inlineContent: null,
          sizeBytes: 42,
          order: 1,
          completedAt: null,
          createdAt: '2026-03-12T10:00:00.000Z',
          updatedAt: '2026-03-12T10:00:00.000Z',
        },
      ];
    });

    renderConcursoApp('/conteudo', state);

    await user.click(screen.getByRole('button', { name: 'Baixar todo conteúdo teórico' }));

    expect(downloadTheoreticalContentsMarkdown).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: { kind: 'global' },
      }),
    );
  });

  it('informa quando a exportação consolidada falha', async () => {
    const user = userEvent.setup();
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const state = createStateWithTopics((draft) => {
      draft.theoreticalContents = [
        {
          id: 'topic-file-1',
          ownerType: 'topic',
          ownerId: topicId,
          topicId,
          submatterId: null,
          filename: 'resumo.md',
          label: 'resumo.md',
          kind: 'markdown',
          mimeType: 'text/markdown',
          storageKey: 'storage-topic-file-1',
          inlineContent: null,
          sizeBytes: 42,
          order: 1,
          completedAt: null,
          createdAt: '2026-03-12T10:00:00.000Z',
          updatedAt: '2026-03-12T10:00:00.000Z',
        },
      ];
    });

    downloadTheoreticalContentsMarkdown.mockRejectedValueOnce(
      new Error('Falha ao montar o MD consolidado.'),
    );

    renderConcursoApp('/conteudo', state);

    await user.click(screen.getByRole('button', { name: 'Baixar todo conteúdo teórico' }));

    expect(
      await screen.findByText(
        'Falha ao montar o MD consolidado.',
      ),
    ).toBeInTheDocument();
  });

  it(
    'mostra quantas aulas da matéria estão feitas ou pendentes no card do conteúdo pragmático',
    () => {
    const topicId = topicIdByTitle('Domínio da ortografia oficial.');
    const state = createStateWithTopics((draft) => {
      draft.topicSubmattersByTopic[topicId] = [
        createSubmatter('ortho-e', { title: 'Ortografia exceções', grade: 'E' }),
      ];
      draft.theoreticalContents = [
        {
          id: 'topic-file-1',
          ownerType: 'topic',
          ownerId: topicId,
          topicId,
          submatterId: null,
          filename: 'resumo.md',
          label: 'Resumo',
          kind: 'markdown',
          mimeType: 'text/markdown',
          storageKey: 'storage-topic-file-1',
          inlineContent: null,
          sizeBytes: 42,
          order: 1,
          completedAt: '2026-03-16T10:00:00.000Z',
          createdAt: '2026-03-12T10:00:00.000Z',
          updatedAt: '2026-03-12T10:00:00.000Z',
        },
        {
          id: 'sub-file-1',
          ownerType: 'submatter',
          ownerId: 'ortho-e',
          topicId,
          submatterId: 'ortho-e',
          filename: 'lista.pdf',
          label: 'Lista',
          kind: 'pdf',
          mimeType: 'application/pdf',
          storageKey: 'storage-sub-file-1',
          inlineContent: null,
          sizeBytes: 108,
          order: 1,
          completedAt: null,
          createdAt: '2026-03-12T10:00:00.000Z',
          updatedAt: '2026-03-12T10:00:00.000Z',
        },
      ];
    });

    renderConcursoApp('/conteudo', state);

    const topicCard = screen.getByRole('link', { name: 'Domínio da ortografia oficial.' });
    expect(topicCard).toHaveTextContent('Aulas feitas: 1');
    expect(topicCard).toHaveTextContent('Aulas pendentes: 1');
    },
    10000,
  );

  it('destaca matérias pendentes e permite filtrar só o que ficou sem estudo', async () => {
    const user = userEvent.setup();
    const orthographyTopicId = topicIdByTitle('Domínio da ortografia oficial.');
    const accentuationTopicId = topicIdByTitle('Emprego da acentuação gráfica.');

    const state = createStateWithTopics((draft) => {
      draft.topicProgress[orthographyTopicId].status = 'pendente';
      draft.topicProgress[accentuationTopicId].status = 'em_progresso';
      draft.topicSubmattersByTopic[orthographyTopicId] = [
        createSubmatter('ortho-e', { title: 'Ortografia exceções', grade: 'E' }),
      ];
      draft.topicSubmattersByTopic[accentuationTopicId] = [
        createSubmatter('accent-c', { title: 'Acentuação', grade: 'C' }),
      ];
    });

    renderConcursoApp('/conteudo', state);

    const pendingCard = screen.getByRole('link', { name: 'Domínio da ortografia oficial.' });
    expect(within(pendingCard).getByText('Pendente')).toBeInTheDocument();

    await user.click(
      within(screen.getByTestId('content-quick-filters')).getByRole('button', {
        name: 'Pendentes',
      }),
    );

    expect(screen.getByRole('link', { name: 'Domínio da ortografia oficial.' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Emprego da acentuação gráfica.' })).not.toBeInTheDocument();
  });
}, 15000);
