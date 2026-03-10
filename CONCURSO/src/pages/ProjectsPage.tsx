import { useMemo, useState, type FormEvent } from 'react';
import { useAppContext } from '../app/AppContext';
import {
  PROJECT_PHASE_OPTIONS,
  PROJECT_PROGRESS_BUCKETS,
  PROJECT_STATUS_OPTIONS,
  PROJECT_TECHNOLOGIES,
  REQUIREMENT_DIFFICULTY_OPTIONS,
  REQUIREMENT_PRIORITY_OPTIONS,
} from '../app/constants';
import {
  projectPhaseLabel,
  projectStatusLabel,
  requirementDifficultyLabel,
  requirementPriorityLabel,
  technologyLabel,
} from '../app/formatters';
import {
  PROJECT_TEMPLATES,
  buildProjectRanking,
  buildTechnologyProgressRows,
  getProjectPointsTotals,
  getProjectRequirementTotals,
  getProjectsPointsTotals,
  getProjectsRequirementTotals,
  matchesProgressBucket,
  type ProjectProgressBucket,
} from '../app/projects';
import type {
  ProjectPhase,
  ProjectStatus,
  RequirementDifficulty,
  RequirementPriority,
  TechnologyKey,
} from '../app/types';
import { MetricCard } from '../components/MetricCard';
import { ProgressBar } from '../components/ProgressBar';

interface ProjectFormState {
  name: string;
  description: string;
  status: ProjectStatus;
  technologyKeys: TechnologyKey[];
  tagsText: string;
  templateKey: string;
}

interface RequirementFormState {
  text: string;
  isDone: boolean;
  phase: ProjectPhase;
  technologyKey: TechnologyKey | '';
  priority: RequirementPriority | '';
  note: string;
  editalCoverage: string;
  difficulty: RequirementDifficulty;
}

const initialProjectForm: ProjectFormState = {
  name: '',
  description: '',
  status: 'nao_iniciado',
  technologyKeys: [],
  tagsText: '',
  templateKey: '',
};

const initialRequirementForm: RequirementFormState = {
  text: '',
  isDone: false,
  phase: 'implementacao',
  technologyKey: '',
  priority: '',
  note: '',
  editalCoverage: '',
  difficulty: 'media',
};

const progressLabels: Record<ProjectProgressBucket, string> = {
  all: 'Todo progresso',
  '0': '0%',
  '1-49': '1-49%',
  '50-99': '50-99%',
  '100': '100%',
};

const toggleItem = <T,>(items: T[], value: T): T[] =>
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

const parseTags = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

export const ProjectsPage = () => {
  const {
    state,
    createProject,
    updateProject,
    removeProject,
    duplicateProject,
    addProjectRequirement,
    updateProjectRequirement,
    removeProjectRequirement,
  } = useAppContext();

  const [projectForm, setProjectForm] = useState<ProjectFormState>(initialProjectForm);
  const [requirementForm, setRequirementForm] = useState<RequirementFormState>(initialRequirementForm);
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [technologyFilter, setTechnologyFilter] = useState<'all' | TechnologyKey>('all');
  const [progressFilter, setProgressFilter] = useState<ProjectProgressBucket>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.projects
      .filter((project) => {
        if (term && !project.name.toLowerCase().includes(term)) {
          return false;
        }
        if (statusFilter !== 'all' && project.status !== statusFilter) {
          return false;
        }
        if (technologyFilter !== 'all' && !project.technologyKeys.includes(technologyFilter)) {
          return false;
        }
        return matchesProgressBucket(project, progressFilter);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [progressFilter, search, state.projects, statusFilter, technologyFilter]);

  const activeProjectId = useMemo(() => {
    if (filteredProjects.length === 0) {
      return null;
    }
    if (selectedProjectId && filteredProjects.some((project) => project.id === selectedProjectId)) {
      return selectedProjectId;
    }

    return filteredProjects[0].id;
  }, [filteredProjects, selectedProjectId]);

  const selectedProject = useMemo(
    () => state.projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, state.projects],
  );

  const overviewRequirements = useMemo(() => getProjectsRequirementTotals(state.projects), [state.projects]);
  const overviewPoints = useMemo(() => getProjectsPointsTotals(state.projects), [state.projects]);
  const technologies = useMemo(() => buildTechnologyProgressRows(state.projects), [state.projects]);
  const ranking = useMemo(() => buildProjectRanking(state.projects), [state.projects]);

  const createNewProject = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const name = projectForm.name.trim();
    if (!name) {
      return;
    }
    const createdId = createProject({
      name,
      description: projectForm.description.trim() || undefined,
      status: projectForm.status,
      technologyKeys: projectForm.technologyKeys,
      tags: parseTags(projectForm.tagsText),
    });
    setProjectForm(initialProjectForm);
    setSelectedProjectId(createdId);
  };

  const createTemplateProject = (): void => {
    const template = PROJECT_TEMPLATES.find((item) => item.key === projectForm.templateKey);
    if (!template) {
      return;
    }
    const createdId = createProject({
      name: template.name,
      description: template.description,
      status: template.status,
      technologyKeys: template.technologyKeys,
      tags: template.tags,
      requirements: template.requirements.map((requirement) => ({ ...requirement, isDone: false })),
    });
    setProjectForm(initialProjectForm);
    setSelectedProjectId(createdId);
  };

  const submitRequirement = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!selectedProject || !requirementForm.text.trim()) {
      return;
    }

    const payload = {
      text: requirementForm.text.trim(),
      isDone: requirementForm.isDone,
      phase: requirementForm.phase,
      technologyKey: requirementForm.technologyKey || undefined,
      priority: requirementForm.priority || undefined,
      note: requirementForm.note.trim() || undefined,
      editalCoverage: requirementForm.editalCoverage.trim() || undefined,
      difficulty: requirementForm.difficulty,
    };

    if (editingRequirementId) {
      updateProjectRequirement(selectedProject.id, editingRequirementId, payload);
    } else {
      addProjectRequirement(selectedProject.id, payload);
    }

    setRequirementForm(initialRequirementForm);
    setEditingRequirementId(null);
  };

  return (
    <section className="page">
      <header className="page-header">
        <h2>Projetos</h2>
        <p>Painel de projetos praticos por tecnologia, checklist, cobertura e ranking.</p>
      </header>

      <div className="grid-4 projects-grid-5">
        <MetricCard title="Projetos" value={`${state.projects.length}`} subtitle="Total cadastrado" emphasis="blue" />
        <MetricCard
          title="Em andamento"
          value={`${state.projects.filter((project) => project.status === 'em_andamento').length}`}
          subtitle="Status ativo"
          emphasis="orange"
        />
        <MetricCard
          title="Concluidos"
          value={`${state.projects.filter((project) => project.status === 'concluido').length}`}
          subtitle="Status finalizado"
          emphasis="green"
        />
        <MetricCard
          title="Exigencias"
          value={`${overviewRequirements.done}/${overviewRequirements.total}`}
          subtitle={`${overviewRequirements.progressPercent}%`}
          emphasis="blue"
        />
        <MetricCard
          title="Pontos"
          value={`${overviewPoints.done}/${overviewPoints.total}`}
          subtitle="Gamificacao"
          emphasis="green"
        />
      </div>

      <div className="panel projects-creation-panel">
        <h3>Novo projeto</h3>
        <form className="form-grid" onSubmit={createNewProject}>
          <label className="field-label">
            Nome
            <input
              className="input"
              data-testid="project-create-name"
              value={projectForm.name}
              onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label className="field-label">
            Status
            <select
              className="input"
              value={projectForm.status}
              onChange={(event) =>
                setProjectForm((current) => ({ ...current, status: event.target.value as ProjectStatus }))
              }
            >
              {PROJECT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {projectStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label full">
            Descricao
            <textarea
              className="textarea"
              rows={2}
              value={projectForm.description}
              onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <label className="field-label full">
            Tags (virgula)
            <input
              className="input"
              value={projectForm.tagsText}
              onChange={(event) => setProjectForm((current) => ({ ...current, tagsText: event.target.value }))}
            />
          </label>
          <div className="field-label full">
            Tecnologias
            <div className="projects-chip-grid">
              {PROJECT_TECHNOLOGIES.map((technology) => (
                <label className="projects-chip" key={technology.key}>
                  <input
                    type="checkbox"
                    checked={projectForm.technologyKeys.includes(technology.key)}
                    onChange={() =>
                      setProjectForm((current) => ({
                        ...current,
                        technologyKeys: toggleItem(current.technologyKeys, technology.key),
                      }))
                    }
                  />
                  <span>{technology.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="button" type="submit" data-testid="project-create-submit">
            Criar projeto
          </button>
        </form>
        <div className="projects-template-row">
          <select
            className="input"
            value={projectForm.templateKey}
            onChange={(event) => setProjectForm((current) => ({ ...current, templateKey: event.target.value }))}
          >
            <option value="">Template rapido...</option>
            {PROJECT_TEMPLATES.map((template) => (
              <option key={template.key} value={template.key}>
                {template.name}
              </option>
            ))}
          </select>
          <button className="button" onClick={createTemplateProject} disabled={!projectForm.templateKey}>
            Criar via template
          </button>
        </div>
      </div>

      <div className="panel projects-filter-panel">
        <h3>Busca e filtros</h3>
        <div className="projects-filter-grid">
          <input
            className="input"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | ProjectStatus)}
          >
            <option value="all">Todos os status</option>
            {PROJECT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {projectStatusLabel(status)}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={technologyFilter}
            onChange={(event) => setTechnologyFilter(event.target.value as 'all' | TechnologyKey)}
          >
            <option value="all">Todas as tecnologias</option>
            {PROJECT_TECHNOLOGIES.map((technology) => (
              <option key={technology.key} value={technology.key}>
                {technology.label}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={progressFilter}
            onChange={(event) => setProgressFilter(event.target.value as ProjectProgressBucket)}
          >
            {PROJECT_PROGRESS_BUCKETS.map((bucket) => (
              <option key={bucket} value={bucket}>
                {progressLabels[bucket]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="projects-layout">
        <div className="panel">
          <h3>Lista de projetos ({filteredProjects.length})</h3>
          <div className="projects-list">
            {filteredProjects.map((project) => {
              const totals = getProjectRequirementTotals(project);
              const points = getProjectPointsTotals(project);
              return (
                <article
                  key={project.id}
                  className={activeProjectId === project.id ? 'projects-card projects-card-selected' : 'projects-card'}
                >
                  <div className="projects-card-head">
                    <p className="projects-card-title">{project.name}</p>
                    <span className="status-done">{projectStatusLabel(project.status)}</span>
                  </div>
                  <p className="projects-card-meta">
                    Exigencias: {totals.done}/{totals.total} | Pontos: {points.done}/{points.total}
                  </p>
                  <ProgressBar value={totals.progressPercent} compact />
                  <div className="button-row">
                    <button className="button" type="button" onClick={() => setSelectedProjectId(project.id)}>
                      Detalhar
                    </button>
                    <button className="button" type="button" onClick={() => duplicateProject(project.id)}>
                      Duplicar
                    </button>
                    <button className="button button-danger" type="button" onClick={() => removeProject(project.id)}>
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })}
            {filteredProjects.length === 0 ? <p>Nenhum projeto encontrado.</p> : null}
          </div>
        </div>

        <div className="panel">
          <h3>Detalhe do projeto</h3>
          {!selectedProject ? (
            <p>Selecione um projeto para editar.</p>
          ) : (
            <div className="projects-detail">
              <div className="form-grid">
                <label className="field-label">
                  Nome
                  <input
                    className="input"
                    value={selectedProject.name}
                    onChange={(event) => updateProject(selectedProject.id, { name: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  Status
                  <select
                    className="input"
                    value={selectedProject.status}
                    onChange={(event) =>
                      updateProject(selectedProject.id, { status: event.target.value as ProjectStatus })
                    }
                  >
                    {PROJECT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {projectStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label full">
                  Descricao
                  <textarea
                    className="textarea"
                    rows={2}
                    value={selectedProject.description ?? ''}
                    onChange={(event) =>
                      updateProject(selectedProject.id, { description: event.target.value || undefined })
                    }
                  />
                </label>
                <label className="field-label full">
                  Tags
                  <input
                    className="input"
                    value={selectedProject.tags.join(', ')}
                    onChange={(event) => updateProject(selectedProject.id, { tags: parseTags(event.target.value) })}
                  />
                </label>
                <div className="field-label full">
                  Tecnologias do projeto
                  <div className="projects-chip-grid">
                    {PROJECT_TECHNOLOGIES.map((technology) => (
                      <label className="projects-chip" key={`${selectedProject.id}-${technology.key}`}>
                        <input
                          type="checkbox"
                          checked={selectedProject.technologyKeys.includes(technology.key)}
                          onChange={() =>
                            updateProject(selectedProject.id, {
                              technologyKeys: toggleItem(selectedProject.technologyKeys, technology.key),
                            })
                          }
                        />
                        <span>{technology.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="projects-summary-inline">
                <p>
                  Criado: {new Date(selectedProject.createdAt).toLocaleString('pt-BR')} | Atualizado:{' '}
                  {new Date(selectedProject.updatedAt).toLocaleString('pt-BR')}
                </p>
                <p>
                  Exigencias: {getProjectRequirementTotals(selectedProject).done}/
                  {getProjectRequirementTotals(selectedProject).total} | Pontos:{' '}
                  {getProjectPointsTotals(selectedProject).done}/{getProjectPointsTotals(selectedProject).total}
                </p>
                <ProgressBar value={getProjectRequirementTotals(selectedProject).progressPercent} />
              </div>

              <form className="panel form-grid" onSubmit={submitRequirement}>
                <h3>{editingRequirementId ? 'Editar exigencia' : 'Nova exigencia'}</h3>
                <label className="field-label full">
                  Texto
                  <input
                    className="input"
                    data-testid="project-requirement-text"
                    value={requirementForm.text}
                    onChange={(event) => setRequirementForm((current) => ({ ...current, text: event.target.value }))}
                    required
                  />
                </label>
                <label className="field-label">
                  Fase
                  <select
                    className="input"
                    value={requirementForm.phase}
                    onChange={(event) =>
                      setRequirementForm((current) => ({ ...current, phase: event.target.value as ProjectPhase }))
                    }
                  >
                    {PROJECT_PHASE_OPTIONS.map((phase) => (
                      <option key={phase} value={phase}>
                        {projectPhaseLabel(phase)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Tecnologia
                  <select
                    className="input"
                    value={requirementForm.technologyKey}
                    onChange={(event) =>
                      setRequirementForm((current) => ({
                        ...current,
                        technologyKey: event.target.value as TechnologyKey | '',
                      }))
                    }
                  >
                    <option value="">Sem tecnologia</option>
                    {PROJECT_TECHNOLOGIES.map((technology) => (
                      <option key={technology.key} value={technology.key}>
                        {technology.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Prioridade
                  <select
                    className="input"
                    value={requirementForm.priority}
                    onChange={(event) =>
                      setRequirementForm((current) => ({
                        ...current,
                        priority: event.target.value as RequirementPriority | '',
                      }))
                    }
                  >
                    <option value="">Sem prioridade</option>
                    {REQUIREMENT_PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {requirementPriorityLabel(priority)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Dificuldade
                  <select
                    className="input"
                    value={requirementForm.difficulty}
                    onChange={(event) =>
                      setRequirementForm((current) => ({
                        ...current,
                        difficulty: event.target.value as RequirementDifficulty,
                      }))
                    }
                  >
                    {REQUIREMENT_DIFFICULTY_OPTIONS.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {requirementDifficultyLabel(difficulty)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label full">
                  Cobertura no edital
                  <input
                    className="input"
                    value={requirementForm.editalCoverage}
                    onChange={(event) =>
                      setRequirementForm((current) => ({ ...current, editalCoverage: event.target.value }))
                    }
                  />
                </label>
                <label className="field-label full">
                  Observacao
                  <textarea
                    className="textarea"
                    rows={2}
                    value={requirementForm.note}
                    onChange={(event) => setRequirementForm((current) => ({ ...current, note: event.target.value }))}
                  />
                </label>
                <label className="checkbox-line full">
                  <input
                    type="checkbox"
                    checked={requirementForm.isDone}
                    onChange={(event) =>
                      setRequirementForm((current) => ({ ...current, isDone: event.target.checked }))
                    }
                  />
                  Atendida
                </label>
                <div className="button-row">
                  <button className="button" type="submit" data-testid="project-add-requirement">
                    {editingRequirementId ? 'Salvar exigencia' : 'Adicionar exigencia'}
                  </button>
                  {editingRequirementId ? (
                    <button
                      className="button"
                      type="button"
                      onClick={() => {
                        setRequirementForm(initialRequirementForm);
                        setEditingRequirementId(null);
                      }}
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="projects-requirements-list" data-testid="project-requirements-list">
                {PROJECT_PHASE_OPTIONS.map((phase) => {
                  const list = selectedProject.requirements.filter((requirement) => requirement.phase === phase);
                  const done = list.filter((requirement) => requirement.isDone).length;
                  return (
                    <article className="panel" key={phase}>
                      <h3>
                        {projectPhaseLabel(phase)} ({done}/{list.length})
                      </h3>
                      {list.length === 0 ? <p>Nenhuma exigencia nesta fase.</p> : null}
                      <div className="projects-requirement-items">
                        {list.map((requirement) => (
                          <div className="projects-requirement-item" key={requirement.id}>
                            <div className="projects-requirement-top">
                              <label className="checkbox-line">
                                <input
                                  type="checkbox"
                                  checked={requirement.isDone}
                                  onChange={(event) =>
                                    updateProjectRequirement(selectedProject.id, requirement.id, {
                                      isDone: event.target.checked,
                                    })
                                  }
                                />
                                <span>{requirement.isDone ? 'Atendida' : 'Nao atendida'}</span>
                              </label>
                              <div className="button-row">
                                <button
                                  className="button"
                                  type="button"
                                  onClick={() => {
                                    setEditingRequirementId(requirement.id);
                                    setRequirementForm({
                                      text: requirement.text,
                                      isDone: requirement.isDone,
                                      phase: requirement.phase,
                                      technologyKey: requirement.technologyKey ?? '',
                                      priority: requirement.priority ?? '',
                                      note: requirement.note ?? '',
                                      editalCoverage: requirement.editalCoverage ?? '',
                                      difficulty: requirement.difficulty,
                                    });
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  className="button button-danger"
                                  type="button"
                                  onClick={() => removeProjectRequirement(selectedProject.id, requirement.id)}
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                            <p className="projects-requirement-title">{requirement.text}</p>
                            <p className="projects-card-meta">
                              {requirement.technologyKey
                                ? `Tecnologia: ${technologyLabel(requirement.technologyKey)}`
                                : 'Sem tecnologia'}{' '}
                              |{' '}
                              {requirement.priority
                                ? `Prioridade: ${requirementPriorityLabel(requirement.priority)}`
                                : 'Sem prioridade'}{' '}
                              |{' '}
                              {requirementDifficultyLabel(requirement.difficulty)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel table-wrap">
          <h3>Painel por tecnologia</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Tecnologia</th>
                <th>Projetos</th>
                <th>Exigencias</th>
                <th>Concluidas</th>
                <th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              {technologies.map((row) => (
                <tr key={row.technologyKey}>
                  <td>{row.label}</td>
                  <td>{row.projectsCount}</td>
                  <td>{row.requirementsTotal}</td>
                  <td>{row.requirementsDone}</td>
                  <td>{row.progressPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel table-wrap">
          <h3>Ranking de projetos</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Pontos</th>
                <th>Exigencias</th>
                <th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row) => (
                <tr key={row.projectId}>
                  <td>{row.projectName}</td>
                  <td>{row.pointsDone}/{row.pointsTotal}</td>
                  <td>{row.requirementsDone}/{row.requirementsTotal}</td>
                  <td>{row.progressPercent}%</td>
                </tr>
              ))}
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={4}>Sem projetos para ranking.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
