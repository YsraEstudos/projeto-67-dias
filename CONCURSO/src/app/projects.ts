import { PROJECT_PROGRESS_BUCKETS, PROJECT_TECHNOLOGIES } from './constants';
import { technologyLabel } from './formatters';
import type {
  ProjectPhase,
  ProjectRequirement,
  ProjectStatus,
  RequirementDifficulty,
  RequirementPriority,
  StudyProject,
  TechnologyKey,
} from './types';

export type ProjectProgressBucket = (typeof PROJECT_PROGRESS_BUCKETS)[number];

export interface RequirementTotals {
  total: number;
  done: number;
  pending: number;
  progressPercent: number;
}

export interface PointsTotals {
  total: number;
  done: number;
}

export interface TechnologyProgressRow {
  technologyKey: TechnologyKey;
  label: string;
  projectsCount: number;
  requirementsTotal: number;
  requirementsDone: number;
  progressPercent: number;
}

export interface RankedProjectRow {
  projectId: string;
  projectName: string;
  pointsDone: number;
  pointsTotal: number;
  requirementsDone: number;
  requirementsTotal: number;
  progressPercent: number;
}

export interface ProjectTemplateRequirement {
  text: string;
  phase: ProjectPhase;
  technologyKey?: TechnologyKey;
  priority?: RequirementPriority;
  note?: string;
  editalCoverage?: string;
  difficulty: RequirementDifficulty;
}

export interface ProjectTemplate {
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  technologyKeys: TechnologyKey[];
  tags: string[];
  requirements: ProjectTemplateRequirement[];
}

const POINTS_BY_DIFFICULTY: Record<RequirementDifficulty, number> = {
  simples: 1,
  media: 2,
  dificil: 3,
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    key: 'api-rest-java-spring-sql',
    name: 'API REST Java + Spring + SQL',
    description: 'API CRUD com autenticação JWT, persistência relacional, testes e Docker.',
    status: 'nao_iniciado',
    technologyKeys: [
      'java',
      'spring_boot',
      'jpa_hibernate',
      'rest_swagger_jwt',
      'sql_modelagem_relacional',
      'json',
      'http_rest_pratica',
      'testes',
      'docker',
    ],
    tags: ['backend', 'api', 'java'],
    requirements: [
      {
        text: 'Criar endpoint GET e POST com payload JSON',
        phase: 'implementacao',
        technologyKey: 'http_rest_pratica',
        difficulty: 'media',
        editalCoverage: 'HTTP/REST e JSON na prática',
      },
      {
        text: 'Modelar tabela com chave estrangeira',
        phase: 'planejamento',
        technologyKey: 'sql_modelagem_relacional',
        difficulty: 'media',
        editalCoverage: 'SQL e modelagem relacional',
      },
      {
        text: 'Implementar camada JPA/Hibernate com relacionamento',
        phase: 'implementacao',
        technologyKey: 'jpa_hibernate',
        difficulty: 'dificil',
        editalCoverage: 'JPA/Hibernate',
      },
      {
        text: 'Adicionar autenticação JWT e documentação Swagger',
        phase: 'implementacao',
        technologyKey: 'rest_swagger_jwt',
        difficulty: 'dificil',
        editalCoverage: 'REST/Swagger/JWT',
      },
      {
        text: 'Criar teste unitário de serviço',
        phase: 'testes',
        technologyKey: 'testes',
        difficulty: 'media',
        editalCoverage: 'Testes',
      },
      {
        text: 'Subir aplicação com Docker Compose',
        phase: 'infra_execucao',
        technologyKey: 'docker',
        difficulty: 'media',
        editalCoverage: 'Docker',
      },
    ],
  },
  {
    key: 'frontend-html-css-js-json-http',
    name: 'Frontend HTML/CSS/JS + JSON/HTTP',
    description: 'Interface com formulário validado consumindo API REST.',
    status: 'nao_iniciado',
    technologyKeys: ['html5', 'css3', 'javascript_typescript', 'json', 'http_rest_pratica'],
    tags: ['frontend', 'web'],
    requirements: [
      {
        text: 'Criar formulário HTML5 com validação',
        phase: 'implementacao',
        technologyKey: 'html5',
        difficulty: 'simples',
        editalCoverage: 'HTML5 e formulários',
      },
      {
        text: 'Estilizar layout responsivo com CSS3',
        phase: 'implementacao',
        technologyKey: 'css3',
        difficulty: 'media',
        editalCoverage: 'CSS3',
      },
      {
        text: 'Consumir endpoint GET e POST com fetch',
        phase: 'implementacao',
        technologyKey: 'http_rest_pratica',
        difficulty: 'media',
        editalCoverage: 'HTTP/REST na prática',
      },
      {
        text: 'Tratar payload JSON e exibir feedback',
        phase: 'implementacao',
        technologyKey: 'json',
        difficulty: 'simples',
        editalCoverage: 'JSON',
      },
      {
        text: 'Adicionar testes básicos de fluxo',
        phase: 'testes',
        technologyKey: 'testes',
        difficulty: 'media',
        editalCoverage: 'Testes',
      },
    ],
  },
  {
    key: 'deploy-docker-linux-nginx-logs',
    name: 'Deploy Docker + Linux + Nginx + Logs',
    description: 'Projeto focado em execução, observabilidade e rede.',
    status: 'nao_iniciado',
    technologyKeys: [
      'docker',
      'linux',
      'proxy_reverso_nginx',
      'logs_monitoramento',
      'redes_comandos',
    ],
    tags: ['infra', 'deploy', 'ops'],
    requirements: [
      {
        text: 'Criar Dockerfile e rodar container da aplicação',
        phase: 'infra_execucao',
        technologyKey: 'docker',
        difficulty: 'media',
        editalCoverage: 'Docker',
      },
      {
        text: 'Configurar proxy reverso Nginx para rota da aplicação',
        phase: 'infra_execucao',
        technologyKey: 'proxy_reverso_nginx',
        difficulty: 'dificil',
        editalCoverage: 'Proxy reverso (Nginx)',
      },
      {
        text: 'Executar comandos Linux para inspeção de processo e porta',
        phase: 'infra_execucao',
        technologyKey: 'linux',
        difficulty: 'simples',
        editalCoverage: 'Linux',
      },
      {
        text: 'Registrar evidências de logs e monitoramento',
        phase: 'documentacao',
        technologyKey: 'logs_monitoramento',
        difficulty: 'media',
        editalCoverage: 'Logs/monitoramento (visão prática)',
      },
      {
        text: 'Documentar observações de rede e comandos utilizados',
        phase: 'documentacao',
        technologyKey: 'redes_comandos',
        difficulty: 'simples',
        editalCoverage: 'Redes (observação/comandos)',
      },
    ],
  },
];

export const getRequirementPoints = (difficulty: RequirementDifficulty): number =>
  POINTS_BY_DIFFICULTY[difficulty];

export const getProjectRequirementTotals = (project: StudyProject): RequirementTotals => {
  const total = project.requirements.length;
  const done = project.requirements.filter((requirement) => requirement.isDone).length;
  const pending = Math.max(total - done, 0);
  const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { total, done, pending, progressPercent };
};

export const getProjectPointsTotals = (project: StudyProject): PointsTotals => {
  const total = project.requirements.reduce(
    (sum, requirement) => sum + getRequirementPoints(requirement.difficulty),
    0,
  );
  const done = project.requirements
    .filter((requirement) => requirement.isDone)
    .reduce((sum, requirement) => sum + getRequirementPoints(requirement.difficulty), 0);

  return { total, done };
};

export const getProjectsRequirementTotals = (projects: StudyProject[]): RequirementTotals => {
  const total = projects.reduce((sum, project) => sum + project.requirements.length, 0);
  const done = projects.reduce(
    (sum, project) => sum + project.requirements.filter((requirement) => requirement.isDone).length,
    0,
  );
  const pending = Math.max(total - done, 0);
  const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { total, done, pending, progressPercent };
};

export const getProjectsPointsTotals = (projects: StudyProject[]): PointsTotals =>
  projects.reduce<PointsTotals>(
    (accumulator, project) => {
      const points = getProjectPointsTotals(project);
      return {
        total: accumulator.total + points.total,
        done: accumulator.done + points.done,
      };
    },
    { total: 0, done: 0 },
  );

export const resolveProgressBucket = (progressPercent: number): ProjectProgressBucket => {
  if (progressPercent <= 0) {
    return '0';
  }
  if (progressPercent >= 100) {
    return '100';
  }
  if (progressPercent < 50) {
    return '1-49';
  }

  return '50-99';
};

export const matchesProgressBucket = (
  project: StudyProject,
  bucket: ProjectProgressBucket,
): boolean => {
  if (bucket === 'all') {
    return true;
  }

  const progress = getProjectRequirementTotals(project).progressPercent;
  return resolveProgressBucket(progress) === bucket;
};

export const buildTechnologyProgressRows = (projects: StudyProject[]): TechnologyProgressRow[] =>
  PROJECT_TECHNOLOGIES.map((technology) => {
    const projectsCount = projects.filter((project) => project.technologyKeys.includes(technology.key)).length;
    const linkedRequirements = projects.flatMap((project) =>
      project.requirements.filter((requirement) => requirement.technologyKey === technology.key),
    );
    const requirementsTotal = linkedRequirements.length;
    const requirementsDone = linkedRequirements.filter((requirement) => requirement.isDone).length;
    const progressPercent = requirementsTotal === 0 ? 0 : Math.round((requirementsDone / requirementsTotal) * 100);

    return {
      technologyKey: technology.key,
      label: technologyLabel(technology.key),
      projectsCount,
      requirementsTotal,
      requirementsDone,
      progressPercent,
    };
  });

export const buildProjectRanking = (projects: StudyProject[]): RankedProjectRow[] =>
  projects
    .map((project) => {
      const points = getProjectPointsTotals(project);
      const requirements = getProjectRequirementTotals(project);

      return {
        projectId: project.id,
        projectName: project.name,
        pointsDone: points.done,
        pointsTotal: points.total,
        requirementsDone: requirements.done,
        requirementsTotal: requirements.total,
        progressPercent: requirements.progressPercent,
      };
    })
    .sort((first, second) => {
      if (second.pointsDone !== first.pointsDone) {
        return second.pointsDone - first.pointsDone;
      }
      if (second.progressPercent !== first.progressPercent) {
        return second.progressPercent - first.progressPercent;
      }
      if (second.pointsTotal !== first.pointsTotal) {
        return second.pointsTotal - first.pointsTotal;
      }
      return first.projectName.localeCompare(second.projectName, 'pt-BR');
    });

export const createProjectFromTemplate = (
  template: ProjectTemplate,
  createId: () => string,
  nowIso: string,
): StudyProject => ({
  id: createId(),
  name: template.name,
  description: template.description,
  status: template.status,
  technologyKeys: [...template.technologyKeys],
  tags: [...template.tags],
  requirements: template.requirements.map((requirement) => ({
    id: createId(),
    text: requirement.text,
    isDone: false,
    phase: requirement.phase,
    technologyKey: requirement.technologyKey,
    priority: requirement.priority,
    note: requirement.note,
    editalCoverage: requirement.editalCoverage,
    difficulty: requirement.difficulty,
  })),
  createdAt: nowIso,
  updatedAt: nowIso,
});

export const duplicateProjectWithNewIds = (
  project: StudyProject,
  createId: () => string,
  nowIso: string,
): StudyProject => ({
  ...project,
  id: createId(),
  name: `${project.name} (cópia)`,
  requirements: project.requirements.map((requirement) => ({
    ...requirement,
    id: createId(),
  })),
  createdAt: nowIso,
  updatedAt: nowIso,
});

export const normalizeProject = (project: StudyProject): StudyProject => ({
  ...project,
  technologyKeys: Array.isArray(project.technologyKeys) ? project.technologyKeys : [],
  tags: Array.isArray(project.tags) ? project.tags : [],
  requirements: Array.isArray(project.requirements)
    ? project.requirements.map((requirement) => normalizeRequirement(requirement))
    : [],
});

const normalizeRequirement = (requirement: ProjectRequirement): ProjectRequirement => ({
  ...requirement,
  difficulty: requirement.difficulty ?? 'media',
  isDone: Boolean(requirement.isDone),
});
