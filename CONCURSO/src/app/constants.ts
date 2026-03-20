import type {
  AnkiPauseWeekday,
  ExamWritingMonthlyTarget,
  ProjectPhase,
  ProjectStatus,
  RequirementDifficulty,
  RequirementPriority,
  TopicGrade,
  SubjectKey,
  TechnologyKey,
  WorkActivity,
} from './types';

export const SCHEMA_VERSION = 7;

export const START_DATE = '2026-03-14';
export const END_DATE = '2026-11-19';

export const SUBJECT_ORDER: SubjectKey[] = ['portugues', 'rlm', 'legislacao', 'especificos'];

export const SUBJECT_LABELS: Record<SubjectKey, string> = {
  portugues: 'Português',
  rlm: 'Raciocínio Lógico-Matemático',
  legislacao: 'Legislação',
  especificos: 'Específicos TI / Segurança / Inglês',
};

export const WORK_ACTIVITY_ROTATION: WorkActivity[] = [
  'programacao',
  'questoes_matematica',
  'raciocinio_logico',
];

export const WORK_ACTIVITY_LABELS: Record<WorkActivity, string> = {
  programacao: 'Programação',
  questoes_matematica: 'Questões aleatórias de Matemática',
  raciocinio_logico: 'Questões de Raciocínio Lógico',
};

export const MONTHLY_TARGETS: ExamWritingMonthlyTarget[] = [
  { monthKey: '2026-03', simulados: 1, redacoes: 2 },
  { monthKey: '2026-04', simulados: 1, redacoes: 3 },
  { monthKey: '2026-05', simulados: 2, redacoes: 4 },
  { monthKey: '2026-06', simulados: 2, redacoes: 4 },
  { monthKey: '2026-07', simulados: 2, redacoes: 5 },
  { monthKey: '2026-08', simulados: 3, redacoes: 6 },
  { monthKey: '2026-09', simulados: 3, redacoes: 6 },
  { monthKey: '2026-10', simulados: 4, redacoes: 8 },
  { monthKey: '2026-11', simulados: 0, redacoes: 0 },
];

export const FSRS_WEIGHTS = [
  0.1408, 0.4669, 0.644, 0.8469, 6.3774, 0.9018, 2.8736, 0.001, 1.8617, 0.1693,
  0.7913, 1.623, 0.0561, 0.4666, 1.7359, 0.5987, 1.8704, 0.5629, 0.1838, 0.1159,
  0.2253,
];

export const FSRS_IFRAME_SRC =
  'https://open-spaced-repetition.github.io/anki_fsrs_visualizer/?w=0.1408,0.4669,0.6440,0.8469,6.3774,0.9018,2.8736,0.0010,1.8617,0.1693,0.7913,1.6230,0.0561,0.4666,1.7359,0.5987,1.8704,0.5629,0.1838,0.1159,0.2253';

export const ANKI_PAUSE_WEEKDAY_OPTIONS: Array<{ value: AnkiPauseWeekday; label: string }> = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export const STORAGE_KEY = 'concurso.study.snapshot.v1';
export const FALLBACK_BACKUP_KEY = 'concurso.study.auto-backup.fallback';
export const AUTO_BACKUP_INTERVAL_MINUTES = 10;

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', shortLabel: 'Painel' },
  { to: '/plano-diario', label: 'Plano Diário', shortLabel: 'Plano' },
  { to: '/conteudo', label: 'Conteúdo Pragmático', shortLabel: 'Conteúdo' },
  { to: '/anki', label: 'Anki & FSRS', shortLabel: 'Anki' },
  { to: '/correcoes', label: 'Links de Correção', shortLabel: 'Correções' },
  { to: '/simulados-redacoes', label: 'Simulados e Redações', shortLabel: 'Simulados' },
  { to: '/projetos', label: 'Projetos', shortLabel: 'Projetos' },
  { to: '/notas-de-corte', label: 'Notas de Corte', shortLabel: 'Cortes' },
  { to: '/configuracoes', label: 'Configurações', shortLabel: 'Config' },
] as const;

export const PROJECT_TECHNOLOGIES: Array<{ key: TechnologyKey; label: string }> = [
  { key: 'html5', label: 'HTML5' },
  { key: 'css3', label: 'CSS3' },
  { key: 'javascript_typescript', label: 'JavaScript / TypeScript' },
  { key: 'json', label: 'JSON' },
  { key: 'http_rest_pratica', label: 'HTTP / REST (na prática)' },
  { key: 'java', label: 'Java' },
  { key: 'spring_boot', label: 'Spring / Spring Boot' },
  { key: 'jpa_hibernate', label: 'JPA / Hibernate' },
  { key: 'rest_swagger_jwt', label: 'REST / Swagger / JWT' },
  { key: 'sql_modelagem_relacional', label: 'SQL / modelagem relacional' },
  { key: 'testes', label: 'Testes' },
  { key: 'docker', label: 'Docker' },
  { key: 'linux', label: 'Linux' },
  { key: 'redes_comandos', label: 'Redes (observação/comandos)' },
  { key: 'logs_monitoramento', label: 'Logs / monitoramento (visão prática)' },
  { key: 'proxy_reverso_nginx', label: 'Proxy reverso (Nginx)' },
];

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  'nao_iniciado',
  'em_andamento',
  'concluido',
  'pausado',
];

export const PROJECT_PHASE_OPTIONS: ProjectPhase[] = [
  'planejamento',
  'implementacao',
  'testes',
  'infra_execucao',
  'documentacao',
];

export const REQUIREMENT_PRIORITY_OPTIONS: RequirementPriority[] = ['baixa', 'media', 'alta'];
export const REQUIREMENT_DIFFICULTY_OPTIONS: RequirementDifficulty[] = ['simples', 'media', 'dificil'];

export const PROJECT_PROGRESS_BUCKETS = ['all', '0', '1-49', '50-99', '100'] as const;

export const TOPIC_GRADE_OPTIONS: TopicGrade[] = ['A', 'B', 'C', 'D', 'E'];

export const TOPIC_GRADE_LABELS: Record<TopicGrade, string> = {
  A: 'A (melhor)',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E (pior)',
};

export const TOPIC_STALE_BUCKETS_DAYS = [7, 15, 30] as const;

export const THEORETICAL_CONTENT_ACCEPT = '.md,.pdf,application/pdf,text/markdown';
