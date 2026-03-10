import { describe, expect, it, vi } from 'vitest';
import { appReducer } from '../app/AppContext';
import { createInitialState } from '../app/seed';
import {
  buildProjectRanking,
  buildTechnologyProgressRows,
  getProjectPointsTotals,
  getProjectRequirementTotals,
  matchesProgressBucket,
} from '../app/projects';
import type { ProjectRequirement, StudyProject } from '../app/types';

const requirement = (id: string, patch: Partial<ProjectRequirement> = {}): ProjectRequirement => ({
  id,
  text: 'Exigencia',
  isDone: false,
  phase: 'implementacao',
  difficulty: 'media',
  ...patch,
});

const project = (id: string, patch: Partial<StudyProject> = {}): StudyProject => ({
  id,
  name: `Projeto ${id}`,
  status: 'nao_iniciado',
  technologyKeys: ['java'],
  tags: [],
  requirements: [],
  createdAt: '2026-02-26T00:00:00.000Z',
  updatedAt: '2026-02-26T00:00:00.000Z',
  ...patch,
});

describe('projects helpers', () => {
  it('calcula progresso por exigencias inclusive projeto vazio', () => {
    const empty = getProjectRequirementTotals(project('p1'));
    expect(empty.total).toBe(0);
    expect(empty.done).toBe(0);
    expect(empty.progressPercent).toBe(0);

    const filled = getProjectRequirementTotals(
      project('p2', {
        requirements: [
          requirement('r1', { isDone: true }),
          requirement('r2', { isDone: false }),
          requirement('r3', { isDone: true }),
        ],
      }),
    );

    expect(filled.total).toBe(3);
    expect(filled.done).toBe(2);
    expect(filled.pending).toBe(1);
    expect(filled.progressPercent).toBe(67);
  });

  it('calcula pontuacao por dificuldade', () => {
    const totals = getProjectPointsTotals(
      project('p3', {
        requirements: [
          requirement('r1', { difficulty: 'simples', isDone: true }),
          requirement('r2', { difficulty: 'media', isDone: false }),
          requirement('r3', { difficulty: 'dificil', isDone: true }),
        ],
      }),
    );

    expect(totals.total).toBe(6);
    expect(totals.done).toBe(4);
  });

  it('agrega tecnologia apenas com exigencias vinculadas', () => {
    const rows = buildTechnologyProgressRows([
      project('p4', {
        technologyKeys: ['java'],
        requirements: [
          requirement('r1', { technologyKey: 'java', isDone: true }),
          requirement('r2', { technologyKey: 'java', isDone: false }),
          requirement('r3', { isDone: true }),
        ],
      }),
    ]);

    const javaRow = rows.find((row) => row.technologyKey === 'java');
    expect(javaRow).toBeDefined();
    expect(javaRow?.projectsCount).toBe(1);
    expect(javaRow?.requirementsTotal).toBe(2);
    expect(javaRow?.requirementsDone).toBe(1);
    expect(javaRow?.progressPercent).toBe(50);
  });

  it('classifica buckets de progresso', () => {
    expect(matchesProgressBucket(project('p5'), '0')).toBe(true);
    expect(
      matchesProgressBucket(
        project('p6', {
          requirements: [requirement('r1', { isDone: true }), requirement('r2')],
        }),
        '50-99',
      ),
    ).toBe(true);
    expect(
      matchesProgressBucket(
        project('p7', { requirements: [requirement('r1', { isDone: true })] }),
        '100',
      ),
    ).toBe(true);
  });

  it('gera ranking por pontos e progresso', () => {
    const rows = buildProjectRanking([
      project('a', {
        name: 'A',
        requirements: [requirement('r1', { difficulty: 'dificil', isDone: true })],
      }),
      project('b', {
        name: 'B',
        requirements: [requirement('r2', { difficulty: 'media', isDone: true })],
      }),
    ]);

    expect(rows[0].projectName).toBe('A');
    expect(rows[1].projectName).toBe('B');
  });
});

describe('projects reducer flow', () => {
  it('executa CRUD de projetos e exigencias com change token e updatedAt', () => {
    vi.useFakeTimers();

    let state = createInitialState();

    vi.setSystemTime(new Date('2026-02-26T10:00:00.000Z'));
    state = appReducer(state, {
      type: 'add-project',
      project: project('project-1'),
    });
    expect(state.projects).toHaveLength(1);
    expect(state.meta.changeToken).toBe(1);

    vi.setSystemTime(new Date('2026-02-26T10:01:00.000Z'));
    state = appReducer(state, {
      type: 'update-project',
      id: 'project-1',
      patch: { name: 'Projeto Atualizado' },
    });
    expect(state.projects[0].name).toBe('Projeto Atualizado');
    expect(state.projects[0].updatedAt).toBe('2026-02-26T10:01:00.000Z');
    expect(state.meta.changeToken).toBe(2);

    vi.setSystemTime(new Date('2026-02-26T10:02:00.000Z'));
    state = appReducer(state, {
      type: 'add-project-requirement',
      projectId: 'project-1',
      requirement: requirement('req-1'),
    });
    expect(state.projects[0].requirements).toHaveLength(1);
    expect(state.projects[0].updatedAt).toBe('2026-02-26T10:02:00.000Z');
    expect(state.meta.changeToken).toBe(3);

    vi.setSystemTime(new Date('2026-02-26T10:03:00.000Z'));
    state = appReducer(state, {
      type: 'update-project-requirement',
      projectId: 'project-1',
      requirementId: 'req-1',
      patch: { isDone: true },
    });
    expect(state.projects[0].requirements[0].isDone).toBe(true);
    expect(state.projects[0].updatedAt).toBe('2026-02-26T10:03:00.000Z');
    expect(state.meta.changeToken).toBe(4);

    vi.setSystemTime(new Date('2026-02-26T10:04:00.000Z'));
    state = appReducer(state, {
      type: 'remove-project-requirement',
      projectId: 'project-1',
      requirementId: 'req-1',
    });
    expect(state.projects[0].requirements).toHaveLength(0);
    expect(state.projects[0].updatedAt).toBe('2026-02-26T10:04:00.000Z');
    expect(state.meta.changeToken).toBe(5);

    vi.setSystemTime(new Date('2026-02-26T10:05:00.000Z'));
    state = appReducer(state, {
      type: 'duplicate-project',
      project: project('project-2', {
        name: 'Projeto Atualizado (copia)',
      }),
    });
    expect(state.projects).toHaveLength(2);
    expect(state.meta.changeToken).toBe(6);

    vi.setSystemTime(new Date('2026-02-26T10:06:00.000Z'));
    state = appReducer(state, {
      type: 'remove-project',
      id: 'project-1',
    });
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].id).toBe('project-2');
    expect(state.meta.changeToken).toBe(7);

    vi.useRealTimers();
  });
});
