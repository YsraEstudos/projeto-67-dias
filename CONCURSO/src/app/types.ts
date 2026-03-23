export type SubjectKey = 'portugues' | 'rlm' | 'legislacao' | 'especificos';

export type TechnologyKey =
  | 'html5'
  | 'css3'
  | 'javascript_typescript'
  | 'json'
  | 'http_rest_pratica'
  | 'java'
  | 'spring_boot'
  | 'jpa_hibernate'
  | 'rest_swagger_jwt'
  | 'sql_modelagem_relacional'
  | 'testes'
  | 'docker'
  | 'linux'
  | 'redes_comandos'
  | 'logs_monitoramento'
  | 'proxy_reverso_nginx';

export type ProjectStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'pausado';
export type ProjectPhase =
  | 'planejamento'
  | 'implementacao'
  | 'testes'
  | 'infra_execucao'
  | 'documentacao';
export type RequirementPriority = 'baixa' | 'media' | 'alta';
export type RequirementDifficulty = 'simples' | 'media' | 'dificil';

export type TopicPriority = 'alta' | 'media' | 'baixa';
export type TopicStatus = 'nao_iniciado' | 'em_progresso' | 'acertado';
export type TopicGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type TheoreticalContentKind = 'markdown' | 'pdf';
export type TheoreticalContentOwnerType = 'topic' | 'submatter';

export interface TopicSeedSection {
  id: string;
  subject: SubjectKey;
  title: string;
  sourceRef: string;
  items: string[];
}

export interface TopicNode {
  id: string;
  subject: SubjectKey;
  title: string;
  displayTitle?: string;
  sourceRef: string;
  parentId: string | null;
  isLeaf: boolean;
  priority: TopicPriority;
}

export interface TopicProgress {
  status: TopicStatus;
  evidenceNote: string;
  updatedAt: string | null;
}

export interface TopicSubmatter {
  id: string;
  title: string;
  grade: TopicGrade;
  lastReviewedAt: string | null;
  errorNote: string;
  actionNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface TheoreticalContentItem {
  id: string;
  ownerType: TheoreticalContentOwnerType;
  ownerId: string;
  topicId: string;
  submatterId: string | null;
  filename: string;
  label: string;
  kind: TheoreticalContentKind;
  mimeType: string;
  storageKey: string;
  inlineContent: string | null;
  sizeBytes: number;
  order: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WorkActivity = 'programacao' | 'questoes_matematica' | 'raciocinio_logico';

export type PlanMode = 'manual' | 'auto';

export interface ManualContentTarget {
  topicId: string;
  title: string;
  sourceTitle: string;
  sectionTitle: string;
  sourceRef: string;
  path: string;
}

export interface ManualBlock {
  id: string;
  area: string;
  title: string;
  detail: string;
  contentRefs?: string[];
  contentTargets?: ManualContentTarget[];
  movedFromSunday?: boolean;
}

export interface ManualChecklistSpecItem {
  id: string;
  label: string;
  kind: 'counter' | 'boolean';
  target: number;
  unit: string;
  required: boolean;
}

export interface DayTargets {
  mainStudyMinutes: number;
  ankiMainMinutes: number;
  workAnkiMinutes: number;
  workActivityMinutes: number;
  objectiveQuestions: number;
}

export interface DayPlan {
  date: string;
  planMode: PlanMode;
  isRestDay: boolean;
  subjects: [SubjectKey, SubjectKey];
  workActivity: WorkActivity;
  hasSimulado: boolean;
  hasRedacao: boolean;
  targets: DayTargets;
  monthKey: string;
  weekNumber?: number;
  manualBlocks?: ManualBlock[];
  manualChecklistSpec?: ManualChecklistSpecItem[];
}

export type ChecklistItemKind = 'counter' | 'boolean';

export interface ChecklistItem {
  id: string;
  label: string;
  kind: ChecklistItemKind;
  target: number;
  done: number;
  unit: string;
  required: boolean;
  status: 'pendente' | 'concluido';
}

export interface DailyRecord {
  date: string;
  checklist: ChecklistItem[];
  notes: string;
}

export type CorrectionStatus = 'pendente' | 'corrigida' | 'revisar_card';

export interface CorrectionLink {
  id: string;
  topicId: string;
  questionUrl: string;
  correctionUrl: string;
  hasAnkiCard: boolean;
  status: CorrectionStatus;
  note: string;
  createdAt: string;
}

export interface AnkiConfig {
  fsrsWeights: number[];
  retentionTarget: number;
  additionalCardsTarget: number;
  newCardsPerActiveDay: number;
  maxReviewsPerDay: number;
  pauseWeekdays: AnkiPauseWeekday[];
}

export type AnkiPauseWeekday = 1 | 2 | 3 | 4 | 5 | 6;

export interface AnkiDailyLog {
  date: string;
  newCards: number;
  reviews: number;
}

export interface AnkiStats {
  newCardsAdded: number;
  reviewsDone: number;
  dailyLogs: Record<string, AnkiDailyLog>;
}

export interface ExamWritingMonthlyTarget {
  monthKey: string;
  simulados: number;
  redacoes: number;
}

export interface CoverageMatrixRow {
  subject: SubjectKey;
  sourceLines: number;
  registeredLines: number;
  coveragePercent: number;
}

export interface ProjectRequirement {
  id: string;
  text: string;
  isDone: boolean;
  phase: ProjectPhase;
  technologyKey?: TechnologyKey;
  priority?: RequirementPriority;
  note?: string;
  editalCoverage?: string;
  difficulty: RequirementDifficulty;
}

export interface StudyProject {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  technologyKeys: TechnologyKey[];
  tags: string[];
  requirements: ProjectRequirement[];
  createdAt: string;
  updatedAt: string;
}

export interface BackupMeta {
  lastBackupAt: string | null;
  lastBackupMode: 'file' | 'snapshot' | null;
  lastBackupError: string | null;
  lastFallbackSnapshotAt: string | null;
  autoBackupIntervalMinutes: number;
}

export interface MetaState {
  changeToken: number;
  lastChangedAt: string | null;
  backup: BackupMeta;
}

export interface PlanSettings {
  startDate: string;
  startDateChangeCount: number;
}

export interface ShellUiState {
  mobilePinnedNav: string[];
}

export interface AppState {
  schemaVersion: number;
  planSettings: PlanSettings;
  shellUi: ShellUiState;
  selectedDate: string;
  topicProgress: Record<string, TopicProgress>;
  topicSubmattersByTopic: Record<string, TopicSubmatter[]>;
  theoreticalContents: TheoreticalContentItem[];
  dailyRecords: Record<string, DailyRecord>;
  correctionLinks: CorrectionLink[];
  projects: StudyProject[];
  ankiConfig: AnkiConfig;
  ankiStats: AnkiStats;
  meta: MetaState;
}

export interface AppSnapshot {
  schemaVersion: number;
  exportedAt: string;
  appState: AppState;
}

export interface ExamProgressTotals {
  simuladosDone: number;
  simuladosTarget: number;
  redacoesDone: number;
  redacoesTarget: number;
}
