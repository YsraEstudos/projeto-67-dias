import { PROJECT_TECHNOLOGIES, SUBJECT_LABELS, WORK_ACTIVITY_LABELS } from './constants';
import type {
  AnkiPauseWeekday,
  ProjectPhase,
  ProjectStatus,
  RequirementDifficulty,
  RequirementPriority,
  SubjectKey,
  TopicGrade,
  TopicStatus,
  TechnologyKey,
  WorkActivity,
} from './types';

export const subjectLabel = (subject: SubjectKey): string => SUBJECT_LABELS[subject];

export const workActivityLabel = (activity: WorkActivity): string => WORK_ACTIVITY_LABELS[activity];

export const formatIsoDatePtBr = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    weekday: 'short',
  });
};

export const topicStatusLabel = (status: TopicStatus): string => {
  switch (status) {
    case 'nao_iniciado':
      return 'Não iniciado';
    case 'pendente':
      return 'Pendente';
    case 'em_progresso':
      return 'Em progresso';
    case 'acertado':
      return 'Acertado';
    default:
      return status;
  }
};

export const topicStatusHint = (status: TopicStatus): string => {
  switch (status) {
    case 'nao_iniciado':
      return 'Ainda não entrou no seu ciclo ativo.';
    case 'pendente':
      return 'Marcada como não estudada e visível no filtro Pendentes.';
    case 'em_progresso':
      return 'Matéria em andamento, sem pendência manual.';
    case 'acertado':
      return 'Rodada e estabilizada no momento.';
    default:
      return '';
  }
};

export const statusLabel = (status: TopicStatus): string => topicStatusLabel(status);

const TECHNOLOGY_LABELS = PROJECT_TECHNOLOGIES.reduce<Record<TechnologyKey, string>>(
  (accumulator, item) => {
    accumulator[item.key] = item.label;
    return accumulator;
  },
  {} as Record<TechnologyKey, string>,
);

export const technologyLabel = (technology: TechnologyKey): string => TECHNOLOGY_LABELS[technology];

export const projectStatusLabel = (status: ProjectStatus): string => {
  switch (status) {
    case 'nao_iniciado':
      return 'Não iniciado';
    case 'em_andamento':
      return 'Em andamento';
    case 'concluido':
      return 'Concluído';
    case 'pausado':
      return 'Pausado';
    default:
      return status;
  }
};

export const projectPhaseLabel = (phase: ProjectPhase): string => {
  switch (phase) {
    case 'planejamento':
      return 'Planejamento';
    case 'implementacao':
      return 'Implementação';
    case 'testes':
      return 'Testes';
    case 'infra_execucao':
      return 'Infra/Execução';
    case 'documentacao':
      return 'Documentação';
    default:
      return phase;
  }
};

export const requirementPriorityLabel = (priority: RequirementPriority): string => {
  switch (priority) {
    case 'baixa':
      return 'Baixa';
    case 'media':
      return 'Média';
    case 'alta':
      return 'Alta';
    default:
      return priority;
  }
};

export const requirementDifficultyLabel = (difficulty: RequirementDifficulty): string => {
  switch (difficulty) {
    case 'simples':
      return 'Simples (1 ponto)';
    case 'media':
      return 'Média (2 pontos)';
    case 'dificil':
      return 'Difícil (3 pontos)';
    default:
      return difficulty;
  }
};

export const ankiPauseWeekdayLabel = (weekday: AnkiPauseWeekday): string => {
  switch (weekday) {
    case 1:
      return 'Segunda';
    case 2:
      return 'Terça';
    case 3:
      return 'Quarta';
    case 4:
      return 'Quinta';
    case 5:
      return 'Sexta';
    case 6:
      return 'Sábado';
    default:
      return String(weekday);
  }
};

export const topicGradeLabel = (grade: TopicGrade): string => {
  switch (grade) {
    case 'A':
      return 'A (melhor)';
    case 'B':
      return 'B';
    case 'C':
      return 'C';
    case 'D':
      return 'D';
    case 'E':
      return 'E (pior)';
    default:
      return grade;
  }
};

