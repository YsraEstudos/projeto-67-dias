import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { updateChecklistValue } from './checklist';
import {
  type CloudUser,
  loadCloudSnapshot,
  loginWithGoogleCloud,
  saveCloudSnapshot,
  subscribeCloudAuthChanges,
} from './cloudStorage';
import { AUTO_BACKUP_INTERVAL_MINUTES } from './constants';
import {
  downloadSnapshot,
  loadFallbackSnapshotTimestamp,
  pickBackupFileHandle,
  saveFallbackSnapshot,
  writeSnapshotToHandle,
} from './backup';
import {
  buildPlanRuntime,
  COVERAGE_MATRIX,
  LEAF_TOPICS,
  TOPICS,
  createInitialState,
  normalizeStateForCurrentPlan,
} from './seed';
import { getTodayIsoDate } from './contentSubmatters';
import {
  createPastedMarkdownFile,
  getNextTheoreticalContentOrder,
  getPastedMarkdownLabel,
  inferTheoreticalContentKind,
  moveTheoreticalContent,
  reorderTheoreticalContent,
  toggleTheoreticalContentCompleted,
} from './contentTheoreticalFiles';
import { saveTheoreticalContentBinary, removeTheoreticalContentBinary } from './contentTheoreticalFileStore';
import { duplicateProjectWithNewIds } from './projects';
import { buildSnapshot, loadStateSnapshot, saveStateSnapshot } from './storage';
import {
  insertMobilePinnedNavAt,
  moveMobilePinnedNav,
  removeMobilePinnedNav,
  sanitizeMobilePinnedNav,
  type NavPath,
} from './mobileNavigation';
import type {
  AnkiDailyLog,
  AppSnapshot,
  AppState,
  CorrectionLink,
  DayPlan,
  ExamWritingMonthlyTarget,
  ProjectRequirement,
  ProjectStatus,
  StudyProject,
  TechnologyKey,
  TheoreticalContentItem,
  TheoreticalContentOwnerType,
  TopicGrade,
  TopicSubmatter,
  TopicStatus,
} from './types';

const nowIso = (): string => new Date().toISOString();

const markChanged = (state: AppState): AppState => ({
  ...state,
  meta: {
    ...state.meta,
    changeToken: state.meta.changeToken + 1,
    lastChangedAt: nowIso(),
  },
});

type Action =
  | { type: 'set-selected-date'; date: string }
  | { type: 'set-plan-start-date'; startDate: string }
  | { type: 'update-checklist-item'; date: string; itemId: string; done: number }
  | { type: 'set-daily-note'; date: string; notes: string }
  | { type: 'set-topic-status'; topicId: string; status: TopicStatus }
  | { type: 'set-topic-evidence'; topicId: string; evidenceNote: string }
  | { type: 'add-topic-submatter'; topicId: string; submatter: TopicSubmatter }
  | {
      type: 'update-topic-submatter';
      topicId: string;
      submatterId: string;
      patch: Partial<Omit<TopicSubmatter, 'id' | 'createdAt'>>;
    }
  | { type: 'remove-topic-submatter'; topicId: string; submatterId: string }
  | {
      type: 'mark-topic-submatter-reviewed-today';
      topicId: string;
      submatterId: string;
      reviewedAt: string;
    }
  | { type: 'add-theoretical-content'; item: TheoreticalContentItem }
  | {
      type: 'move-theoretical-content';
      ownerType: TheoreticalContentOwnerType;
      ownerId: string;
      itemId: string;
      direction: 'up' | 'down';
    }
  | {
      type: 'reorder-theoretical-content';
      ownerType: TheoreticalContentOwnerType;
      ownerId: string;
      itemId: string;
      targetItemId: string;
    }
  | {
      type: 'set-theoretical-content-completed';
      itemId: string;
      completedAt: string | null;
    }
  | { type: 'remove-theoretical-content'; itemId: string }
  | { type: 'add-correction-link'; link: CorrectionLink }
  | {
      type: 'update-correction-link';
      id: string;
      patch: Partial<Omit<CorrectionLink, 'id' | 'createdAt'>>;
    }
  | { type: 'remove-correction-link'; id: string }
  | { type: 'add-project'; project: StudyProject }
  | {
      type: 'update-project';
      id: string;
      patch: Partial<Pick<StudyProject, 'name' | 'description' | 'status' | 'technologyKeys' | 'tags'>>;
    }
  | { type: 'remove-project'; id: string }
  | { type: 'duplicate-project'; project: StudyProject }
  | { type: 'add-project-requirement'; projectId: string; requirement: ProjectRequirement }
  | {
      type: 'update-project-requirement';
      projectId: string;
      requirementId: string;
      patch: Partial<Omit<ProjectRequirement, 'id'>>;
    }
  | { type: 'remove-project-requirement'; projectId: string; requirementId: string }
  | { type: 'set-anki-config'; patch: Partial<AppState['ankiConfig']> }
  | { type: 'set-anki-stats'; patch: Partial<AppState['ankiStats']> }
  | { type: 'upsert-anki-daily-log'; log: AnkiDailyLog }
  | { type: 'set-mobile-pinned-nav'; paths: string[] }
  | { type: 'pin-mobile-nav-item'; path: string; targetIndex?: number }
  | { type: 'remove-mobile-nav-item'; path: string }
  | { type: 'move-mobile-nav-item'; path: string; targetIndex: number }
  | { type: 'import-state'; state: AppState }
  | {
      type: 'record-backup';
      at: string;
      mode: 'file' | 'snapshot';
      error: string | null;
      fallbackAt: string | null;
    };

export type AppAction = Action;

const touchProject = (project: StudyProject): StudyProject => ({
  ...project,
  updatedAt: nowIso(),
});

const normalizePauseWeekdays = (
  pauseWeekdays: AppState['ankiConfig']['pauseWeekdays'],
): AppState['ankiConfig']['pauseWeekdays'] =>
  Array.from(new Set(pauseWeekdays.filter((weekday) => weekday >= 1 && weekday <= 6))).sort(
    (left, right) => left - right,
  ) as AppState['ankiConfig']['pauseWeekdays'];

export const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'set-selected-date': {
      return { ...state, selectedDate: action.date };
    }
    case 'set-mobile-pinned-nav': {
      const nextPaths = sanitizeMobilePinnedNav(action.paths);
      if (nextPaths.join('|') === state.shellUi.mobilePinnedNav.join('|')) {
        return state;
      }

      return markChanged({
        ...state,
        shellUi: {
          ...state.shellUi,
          mobilePinnedNav: nextPaths,
        },
      });
    }
    case 'pin-mobile-nav-item': {
      const nextPaths = insertMobilePinnedNavAt(
        state.shellUi.mobilePinnedNav,
        action.path,
        action.targetIndex ?? state.shellUi.mobilePinnedNav.length,
      );
      if (nextPaths.join('|') === state.shellUi.mobilePinnedNav.join('|')) {
        return state;
      }

      return markChanged({
        ...state,
        shellUi: {
          ...state.shellUi,
          mobilePinnedNav: nextPaths,
        },
      });
    }
    case 'remove-mobile-nav-item': {
      const nextPaths = removeMobilePinnedNav(state.shellUi.mobilePinnedNav, action.path);
      if (nextPaths.join('|') === state.shellUi.mobilePinnedNav.join('|')) {
        return state;
      }

      return markChanged({
        ...state,
        shellUi: {
          ...state.shellUi,
          mobilePinnedNav: nextPaths,
        },
      });
    }
    case 'move-mobile-nav-item': {
      const nextPaths = moveMobilePinnedNav(state.shellUi.mobilePinnedNav, action.path, action.targetIndex);
      if (nextPaths.join('|') === state.shellUi.mobilePinnedNav.join('|')) {
        return state;
      }

      return markChanged({
        ...state,
        shellUi: {
          ...state.shellUi,
          mobilePinnedNav: nextPaths,
        },
      });
    }
    case 'set-plan-start-date': {
      if (action.startDate === state.planSettings.startDate) {
        return state;
      }

      return markChanged(
        normalizeStateForCurrentPlan({
          ...state,
          planSettings: {
            ...state.planSettings,
            startDate: action.startDate,
            startDateChangeCount: state.planSettings.startDateChangeCount + 1,
          },
        }),
      );
    }
    case 'update-checklist-item': {
      const record = state.dailyRecords[action.date];
      if (!record) {
        return state;
      }

      const nextRecord = {
        ...record,
        checklist: updateChecklistValue(record.checklist, action.itemId, action.done),
      };

      return markChanged({
        ...state,
        dailyRecords: {
          ...state.dailyRecords,
          [action.date]: nextRecord,
        },
      });
    }
    case 'set-daily-note': {
      const record = state.dailyRecords[action.date];
      if (!record) {
        return state;
      }

      return markChanged({
        ...state,
        dailyRecords: {
          ...state.dailyRecords,
          [action.date]: {
            ...record,
            notes: action.notes,
          },
        },
      });
    }
    case 'set-topic-status': {
      const current = state.topicProgress[action.topicId];
      if (!current) {
        return state;
      }

      return markChanged({
        ...state,
        topicProgress: {
          ...state.topicProgress,
          [action.topicId]: {
            ...current,
            status: action.status,
            updatedAt: nowIso(),
          },
        },
      });
    }
    case 'set-topic-evidence': {
      const current = state.topicProgress[action.topicId];
      if (!current) {
        return state;
      }

      return markChanged({
        ...state,
        topicProgress: {
          ...state.topicProgress,
          [action.topicId]: {
            ...current,
            evidenceNote: action.evidenceNote,
            updatedAt: nowIso(),
          },
        },
      });
    }
    case 'add-topic-submatter': {
      return markChanged({
        ...state,
        topicSubmattersByTopic: {
          ...state.topicSubmattersByTopic,
          [action.topicId]: [...(state.topicSubmattersByTopic[action.topicId] ?? []), action.submatter],
        },
      });
    }
    case 'update-topic-submatter': {
      const current = state.topicSubmattersByTopic[action.topicId];
      if (!current) {
        return state;
      }

      return markChanged({
        ...state,
        topicSubmattersByTopic: {
          ...state.topicSubmattersByTopic,
          [action.topicId]: current.map((submatter) =>
            submatter.id === action.submatterId
              ? {
                  ...submatter,
                  ...action.patch,
                  updatedAt: nowIso(),
                }
              : submatter,
          ),
        },
      });
    }
    case 'remove-topic-submatter': {
      const current = state.topicSubmattersByTopic[action.topicId];
      if (!current) {
        return state;
      }

      return markChanged({
        ...state,
        topicSubmattersByTopic: {
          ...state.topicSubmattersByTopic,
          [action.topicId]: current.filter((submatter) => submatter.id !== action.submatterId),
        },
      });
    }
    case 'mark-topic-submatter-reviewed-today': {
      const current = state.topicSubmattersByTopic[action.topicId];
      if (!current) {
        return state;
      }

      return markChanged({
        ...state,
        topicSubmattersByTopic: {
          ...state.topicSubmattersByTopic,
          [action.topicId]: current.map((submatter) =>
            submatter.id === action.submatterId
              ? {
                  ...submatter,
                  lastReviewedAt: action.reviewedAt,
                  updatedAt: nowIso(),
                }
              : submatter,
          ),
        },
      });
    }
    case 'add-theoretical-content': {
      return markChanged({
        ...state,
        theoreticalContents: [...state.theoreticalContents, action.item],
      });
    }
    case 'move-theoretical-content': {
      return markChanged({
        ...state,
        theoreticalContents: moveTheoreticalContent(state.theoreticalContents, {
          ownerType: action.ownerType,
          ownerId: action.ownerId,
          itemId: action.itemId,
          direction: action.direction,
        }),
      });
    }
    case 'reorder-theoretical-content': {
      return markChanged({
        ...state,
        theoreticalContents: reorderTheoreticalContent(state.theoreticalContents, {
          ownerType: action.ownerType,
          ownerId: action.ownerId,
          itemId: action.itemId,
          targetItemId: action.targetItemId,
        }),
      });
    }
    case 'set-theoretical-content-completed': {
      return markChanged({
        ...state,
        theoreticalContents: toggleTheoreticalContentCompleted(state.theoreticalContents, {
          itemId: action.itemId,
          completedAt: action.completedAt,
        }),
      });
    }
    case 'remove-theoretical-content': {
      return markChanged({
        ...state,
        theoreticalContents: state.theoreticalContents.filter((item) => item.id !== action.itemId),
      });
    }
    case 'add-correction-link': {
      return markChanged({
        ...state,
        correctionLinks: [action.link, ...state.correctionLinks],
      });
    }
    case 'update-correction-link': {
      return markChanged({
        ...state,
        correctionLinks: state.correctionLinks.map((link) =>
          link.id === action.id ? { ...link, ...action.patch } : link,
        ),
      });
    }
    case 'remove-correction-link': {
      return markChanged({
        ...state,
        correctionLinks: state.correctionLinks.filter((link) => link.id !== action.id),
      });
    }
    case 'add-project': {
      return markChanged({
        ...state,
        projects: [action.project, ...state.projects],
      });
    }
    case 'update-project': {
      return markChanged({
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.id ? touchProject({ ...project, ...action.patch }) : project,
        ),
      });
    }
    case 'remove-project': {
      return markChanged({
        ...state,
        projects: state.projects.filter((project) => project.id !== action.id),
      });
    }
    case 'duplicate-project': {
      return markChanged({
        ...state,
        projects: [action.project, ...state.projects],
      });
    }
    case 'add-project-requirement': {
      return markChanged({
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? touchProject({
                ...project,
                requirements: [...project.requirements, action.requirement],
              })
            : project,
        ),
      });
    }
    case 'update-project-requirement': {
      return markChanged({
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? touchProject({
                ...project,
                requirements: project.requirements.map((requirement) =>
                  requirement.id === action.requirementId
                    ? { ...requirement, ...action.patch }
                    : requirement,
                ),
              })
            : project,
        ),
      });
    }
    case 'remove-project-requirement': {
      return markChanged({
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? touchProject({
                ...project,
                requirements: project.requirements.filter(
                  (requirement) => requirement.id !== action.requirementId,
                ),
              })
            : project,
        ),
      });
    }
    case 'set-anki-stats': {
      return markChanged({
        ...state,
        ankiStats: {
          ...state.ankiStats,
          ...action.patch,
        },
      });
    }
    case 'set-anki-config': {
      const patch: Partial<AppState['ankiConfig']> = { ...action.patch };
      if (patch.pauseWeekdays) {
        patch.pauseWeekdays = normalizePauseWeekdays(patch.pauseWeekdays);
      }

      return markChanged({
        ...state,
        ankiConfig: {
          ...state.ankiConfig,
          ...patch,
        },
      });
    }
    case 'upsert-anki-daily-log': {
      const previous = state.ankiStats.dailyLogs[action.log.date];
      const nextNewCardsAdded =
        state.ankiStats.newCardsAdded - (previous?.newCards ?? 0) + action.log.newCards;
      const nextReviewsDone = state.ankiStats.reviewsDone - (previous?.reviews ?? 0) + action.log.reviews;

      return markChanged({
        ...state,
        ankiStats: {
          ...state.ankiStats,
          newCardsAdded: Math.max(0, nextNewCardsAdded),
          reviewsDone: Math.max(0, nextReviewsDone),
          dailyLogs: {
            ...state.ankiStats.dailyLogs,
            [action.log.date]: action.log,
          },
        },
      });
    }
    case 'import-state': {
      return action.state;
    }
    case 'record-backup': {
      return {
        ...state,
        meta: {
          ...state.meta,
          backup: {
            ...state.meta.backup,
            lastBackupAt: action.at,
            lastBackupMode: action.mode,
            lastBackupError: action.error,
            lastFallbackSnapshotAt: action.fallbackAt,
          },
        },
      };
    }
    default:
      return state;
  }
};

interface AppContextValue {
  state: AppState;
  dayPlans: DayPlan[];
  dayPlansByDate: Record<string, DayPlan>;
  topics: typeof TOPICS;
  leafTopics: typeof LEAF_TOPICS;
  coverageMatrix: typeof COVERAGE_MATRIX;
  monthlyTargets: ExamWritingMonthlyTarget[];
  setMobilePinnedNav: (paths: string[]) => void;
  pinMobileNavItem: (path: NavPath, targetIndex?: number) => void;
  removeMobileNavItem: (path: NavPath) => void;
  moveMobileNavItem: (path: NavPath, targetIndex: number) => void;
  setSelectedDate: (date: string) => void;
  setPlanStartDate: (date: string) => void;
  updateChecklistItem: (date: string, itemId: string, done: number) => void;
  setDailyNote: (date: string, notes: string) => void;
  setTopicStatus: (topicId: string, status: TopicStatus) => void;
  setTopicEvidence: (topicId: string, evidenceNote: string) => void;
  addTopicSubmatter: (
    topicId: string,
    input: {
      title: string;
      grade: TopicGrade;
      lastReviewedAt: string | null;
      errorNote: string;
      actionNote: string;
    },
  ) => void;
  updateTopicSubmatter: (
    topicId: string,
    submatterId: string,
    patch: Partial<Omit<TopicSubmatter, 'id' | 'createdAt'>>,
  ) => void;
  removeTopicSubmatter: (topicId: string, submatterId: string) => void;
  markTopicSubmatterReviewedToday: (topicId: string, submatterId: string) => void;
  addTheoreticalContent: (input: {
    ownerType: TheoreticalContentOwnerType;
    ownerId: string;
    topicId: string;
    submatterId: string | null;
    files?: File[];
    pastedMarkdown?: string;
    pastedLabel?: string;
  }) => Promise<void>;
  moveTheoreticalContent: (
    ownerType: TheoreticalContentOwnerType,
    ownerId: string,
    itemId: string,
    direction: 'up' | 'down',
  ) => void;
  reorderTheoreticalContent: (
    ownerType: TheoreticalContentOwnerType,
    ownerId: string,
    itemId: string,
    targetItemId: string,
  ) => void;
  setTheoreticalContentCompleted: (itemId: string, completed: boolean) => void;
  removeTheoreticalContent: (itemId: string, storageKey: string | null) => Promise<void>;
  addCorrectionLink: (input: Omit<CorrectionLink, 'id' | 'createdAt'>) => void;
  updateCorrectionLink: (
    id: string,
    patch: Partial<Omit<CorrectionLink, 'id' | 'createdAt'>>,
  ) => void;
  removeCorrectionLink: (id: string) => void;
  createProject: (input: {
    name: string;
    description?: string;
    status: ProjectStatus;
    technologyKeys: TechnologyKey[];
    tags: string[];
    requirements?: Array<Omit<ProjectRequirement, 'id'>>;
  }) => string;
  updateProject: (
    id: string,
    patch: Partial<Pick<StudyProject, 'name' | 'description' | 'status' | 'technologyKeys' | 'tags'>>,
  ) => void;
  removeProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  addProjectRequirement: (projectId: string, requirement: Omit<ProjectRequirement, 'id'>) => void;
  updateProjectRequirement: (
    projectId: string,
    requirementId: string,
    patch: Partial<Omit<ProjectRequirement, 'id'>>,
  ) => void;
  removeProjectRequirement: (projectId: string, requirementId: string) => void;
  setAnkiConfig: (patch: Partial<AppState['ankiConfig']>) => void;
  setAnkiStats: (patch: Partial<AppState['ankiStats']>) => void;
  upsertAnkiDailyLog: (input: { date: string; newCards: number; reviews: number }) => void;
  runManualBackup: () => Promise<void>;
  connectBackupFile: () => Promise<void>;
  importSnapshot: (snapshot: AppSnapshot) => void;
  exportSnapshot: () => void;
  cloudSync: {
    status: 'checking' | 'local-only' | 'connected' | 'syncing' | 'error';
    email: string | null;
    name: string | null;
    lastSyncedAt: string | null;
    lastRemoteChangeAt: string | null;
    error: string | null;
  };
  connectGoogleCloud: () => Promise<void>;
  syncToCloudNow: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const createId = (): string => {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const loadedSnapshot = loadStateSnapshot();
  const initialState = loadedSnapshot?.appState
    ? normalizeStateForCurrentPlan(loadedSnapshot.appState)
    : createInitialState();
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    meta: {
      ...initialState.meta,
      backup: {
        ...initialState.meta.backup,
        lastFallbackSnapshotAt:
          initialState.meta.backup.lastFallbackSnapshotAt ?? loadFallbackSnapshotTimestamp(),
      },
    },
  });

  const backupHandleRef = useRef<FileSystemFileHandle | null>(null);
  const lastBackedTokenRef = useRef<number>(state.meta.changeToken);
  const lastAutoBackupTickRef = useRef<number>(0);
  const stateRef = useRef(state);
  const cloudUserRef = useRef<CloudUser | null>(null);
  const hasLoadedCloudSnapshotRef = useRef(false);
  const saveCloudTimeoutRef = useRef<number | null>(null);
  const lastCloudSavedTokenRef = useRef<number>(state.meta.changeToken);
  const lastCloudSavedAtRef = useRef<string | null>(null);
  const [cloudSync, setCloudSync] = useReducer(
    (
      current: AppContextValue['cloudSync'],
      patch: Partial<AppContextValue['cloudSync']>,
    ): AppContextValue['cloudSync'] => ({
      ...current,
      ...patch,
    }),
    {
      status: 'checking',
      email: null,
      name: null,
      lastSyncedAt: null,
      lastRemoteChangeAt: null,
      error: null,
    },
  );

  useEffect(() => {
    if (lastAutoBackupTickRef.current === 0) {
      lastAutoBackupTickRef.current = Date.now();
    }
  }, []);

  const planRuntime = useMemo(
    () => buildPlanRuntime(state.planSettings.startDate),
    [state.planSettings.startDate],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    saveStateSnapshot(state);
  }, [state]);

  const persistSnapshot = useCallback(
    async (mode: 'manual' | 'auto'): Promise<void> => {
      const snapshot = buildSnapshot(state);
      const backupTime = nowIso();

      try {
        if (backupHandleRef.current) {
          await writeSnapshotToHandle(backupHandleRef.current, snapshot);
          dispatch({
            type: 'record-backup',
            at: backupTime,
            mode: 'file',
            error: null,
            fallbackAt: state.meta.backup.lastFallbackSnapshotAt,
          });
        } else if (mode === 'manual') {
          downloadSnapshot(snapshot, `concurso-backup-${snapshot.exportedAt.slice(0, 10)}.json`);
          dispatch({
            type: 'record-backup',
            at: backupTime,
            mode: 'snapshot',
            error: null,
            fallbackAt: state.meta.backup.lastFallbackSnapshotAt,
          });
        } else {
          saveFallbackSnapshot(snapshot);
          dispatch({
            type: 'record-backup',
            at: backupTime,
            mode: 'snapshot',
            error: null,
            fallbackAt: snapshot.exportedAt,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro inesperado no backup.';
        dispatch({
          type: 'record-backup',
          at: backupTime,
          mode: backupHandleRef.current ? 'file' : 'snapshot',
          error: message,
          fallbackAt: state.meta.backup.lastFallbackSnapshotAt,
        });
        throw error;
      }
    },
    [state],
  );

  const syncSnapshotToCloud = useCallback(async (sourceState: AppState): Promise<void> => {
    const user = cloudUserRef.current;
    if (!user || user.isAnonymous) {
      return;
    }

    setCloudSync({
      status: 'syncing',
      error: null,
    });

    const snapshot = buildSnapshot(sourceState);
    await saveCloudSnapshot(user, snapshot);
    lastCloudSavedTokenRef.current = sourceState.meta.changeToken;
    lastCloudSavedAtRef.current = snapshot.exportedAt;
    setCloudSync({
      status: 'connected',
      lastSyncedAt: snapshot.exportedAt,
      lastRemoteChangeAt: sourceState.meta.lastChangedAt ?? snapshot.exportedAt,
      error: null,
    });
  }, []);

  useEffect(() => {
    let isDisposed = false;
    let unsubscribe: () => void = () => {};

    void subscribeCloudAuthChanges(async (user) => {
      if (isDisposed) {
        return;
      }

      cloudUserRef.current = user;
      hasLoadedCloudSnapshotRef.current = false;

      if (!user || user.isAnonymous) {
        lastCloudSavedTokenRef.current = stateRef.current.meta.changeToken;
        setCloudSync({
          status: 'local-only',
          email: null,
          name: null,
          error: null,
          lastRemoteChangeAt: null,
        });
        return;
      }

      setCloudSync({
        status: 'checking',
        email: user.email ?? null,
        name: user.displayName ?? null,
        error: null,
      });

      try {
        const remote = await loadCloudSnapshot(user.uid);
        const localState = stateRef.current;
        const localChangedAt = localState.meta.lastChangedAt ?? null;
        const remoteChangedAt = remote.lastChangedAt;

        if (
          remote.snapshot?.appState &&
          remoteChangedAt &&
          (!localChangedAt || remoteChangedAt > localChangedAt)
        ) {
          const normalizedRemoteState = normalizeStateForCurrentPlan(remote.snapshot.appState);
          dispatch({ type: 'import-state', state: normalizedRemoteState });
          stateRef.current = normalizedRemoteState;
          lastCloudSavedTokenRef.current = normalizedRemoteState.meta.changeToken;
          lastCloudSavedAtRef.current = remote.snapshot.exportedAt;
        } else {
          lastCloudSavedTokenRef.current = localState.meta.changeToken;
        }

        hasLoadedCloudSnapshotRef.current = true;
        setCloudSync({
          status: 'connected',
          email: user.email ?? null,
          name: user.displayName ?? null,
          lastSyncedAt: lastCloudSavedAtRef.current,
          lastRemoteChangeAt: remoteChangedAt,
          error: null,
        });

        if (!remote.snapshot || (localChangedAt && remoteChangedAt && localChangedAt > remoteChangedAt)) {
          void syncSnapshotToCloud(stateRef.current).catch((error) => {
            setCloudSync({
              status: 'error',
              error: error instanceof Error ? error.message : 'Falha ao sincronizar com a nuvem.',
            });
          });
        }
      } catch (error) {
        hasLoadedCloudSnapshotRef.current = true;
        setCloudSync({
          status: 'error',
          email: user.email ?? null,
          name: user.displayName ?? null,
          error: error instanceof Error ? error.message : 'Falha ao carregar dados da nuvem.',
        });
      }
    }).then((nextUnsubscribe) => {
      if (isDisposed) {
        nextUnsubscribe();
        return;
      }

      unsubscribe = nextUnsubscribe;
    });

    return () => {
      isDisposed = true;
      unsubscribe();
    };
  }, [syncSnapshotToCloud]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const hasNewChanges = state.meta.changeToken > lastBackedTokenRef.current;
      if (!hasNewChanges) {
        return;
      }

      const elapsed = Date.now() - lastAutoBackupTickRef.current;
      if (elapsed < AUTO_BACKUP_INTERVAL_MINUTES * 60_000) {
        return;
      }

      lastAutoBackupTickRef.current = Date.now();
      void persistSnapshot('auto')
        .then(() => {
          lastBackedTokenRef.current = state.meta.changeToken;
        })
        .catch(() => {
          // Error state is already handled in reducer.
        });
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [persistSnapshot, state.meta.changeToken]);

  useEffect(() => {
    if (!cloudUserRef.current || cloudUserRef.current.isAnonymous || !hasLoadedCloudSnapshotRef.current) {
      return;
    }

    if (lastCloudSavedTokenRef.current === state.meta.changeToken) {
      return;
    }

    if (saveCloudTimeoutRef.current) {
      window.clearTimeout(saveCloudTimeoutRef.current);
    }

    saveCloudTimeoutRef.current = window.setTimeout(() => {
      void syncSnapshotToCloud(stateRef.current).catch((error) => {
        setCloudSync({
          status: 'error',
          error: error instanceof Error ? error.message : 'Falha ao sincronizar com a nuvem.',
        });
      });
    }, 1200);

    return () => {
      if (saveCloudTimeoutRef.current) {
        window.clearTimeout(saveCloudTimeoutRef.current);
        saveCloudTimeoutRef.current = null;
      }
    };
  }, [state.meta.changeToken, syncSnapshotToCloud]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      dayPlans: planRuntime.dayPlans,
      dayPlansByDate: planRuntime.dayPlansByDate,
      topics: TOPICS,
      leafTopics: LEAF_TOPICS,
      coverageMatrix: COVERAGE_MATRIX,
      monthlyTargets: planRuntime.monthlyTargets,
      setMobilePinnedNav: (paths) => dispatch({ type: 'set-mobile-pinned-nav', paths }),
      pinMobileNavItem: (path, targetIndex) => dispatch({ type: 'pin-mobile-nav-item', path, targetIndex }),
      removeMobileNavItem: (path) => dispatch({ type: 'remove-mobile-nav-item', path }),
      moveMobileNavItem: (path, targetIndex) => dispatch({ type: 'move-mobile-nav-item', path, targetIndex }),
      setSelectedDate: (date) => dispatch({ type: 'set-selected-date', date }),
      setPlanStartDate: (date) => dispatch({ type: 'set-plan-start-date', startDate: date }),
      updateChecklistItem: (date, itemId, done) =>
        dispatch({ type: 'update-checklist-item', date, itemId, done }),
      setDailyNote: (date, notes) => dispatch({ type: 'set-daily-note', date, notes }),
      setTopicStatus: (topicId, status) => dispatch({ type: 'set-topic-status', topicId, status }),
      setTopicEvidence: (topicId, evidenceNote) =>
        dispatch({ type: 'set-topic-evidence', topicId, evidenceNote }),
      addTopicSubmatter: (topicId, input) => {
        const timestamp = nowIso();
        dispatch({
          type: 'add-topic-submatter',
          topicId,
          submatter: {
            id: createId(),
            title: input.title,
            grade: input.grade,
            lastReviewedAt: input.lastReviewedAt,
            errorNote: input.errorNote,
            actionNote: input.actionNote,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
      },
      updateTopicSubmatter: (topicId, submatterId, patch) =>
        dispatch({
          type: 'update-topic-submatter',
          topicId,
          submatterId,
          patch,
        }),
      removeTopicSubmatter: (topicId, submatterId) =>
        dispatch({ type: 'remove-topic-submatter', topicId, submatterId }),
      markTopicSubmatterReviewedToday: (topicId, submatterId) =>
        dispatch({
          type: 'mark-topic-submatter-reviewed-today',
          topicId,
          submatterId,
          reviewedAt: getTodayIsoDate(),
        }),
      addTheoreticalContent: async (input) => {
        let nextOrder = getNextTheoreticalContentOrder(
          stateRef.current.theoreticalContents,
          input.ownerType,
          input.ownerId,
        );

        const files = [...(input.files ?? [])];
        if (input.pastedMarkdown && input.pastedMarkdown.trim().length > 0) {
          files.push(
            createPastedMarkdownFile({
              markdown: input.pastedMarkdown,
              fallbackLabel: input.pastedLabel ?? 'Aula colada',
            }),
          );
        }

        for (const file of files) {
          const kind = inferTheoreticalContentKind(file.name, file.type);
          if (!kind) {
            throw new Error('Apenas arquivos .md e .pdf sao aceitos no conteudo teorico.');
          }

          const itemId = createId();
          const timestamp = nowIso();
          const storageKey = `theoretical-content-${itemId}`;
          await saveTheoreticalContentBinary({ storageKey, file });
          const itemLabel =
            kind === 'markdown' && input.pastedMarkdown && files.length === 1
              ? getPastedMarkdownLabel(input.pastedMarkdown, input.pastedLabel ?? 'Aula colada')
              : file.name;
          dispatch({
            type: 'add-theoretical-content',
            item: {
              id: itemId,
              ownerType: input.ownerType,
              ownerId: input.ownerId,
              topicId: input.topicId,
              submatterId: input.submatterId,
              filename: file.name,
              label: itemLabel,
              kind,
              mimeType: file.type,
              storageKey,
              sizeBytes: file.size,
              order: nextOrder,
              completedAt: null,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          });
          nextOrder += 1;
        }
      },
      moveTheoreticalContent: (ownerType, ownerId, itemId, direction) =>
        dispatch({
          type: 'move-theoretical-content',
          ownerType,
          ownerId,
          itemId,
          direction,
        }),
      reorderTheoreticalContent: (ownerType, ownerId, itemId, targetItemId) =>
        dispatch({
          type: 'reorder-theoretical-content',
          ownerType,
          ownerId,
          itemId,
          targetItemId,
        }),
      setTheoreticalContentCompleted: (itemId, completed) =>
        dispatch({
          type: 'set-theoretical-content-completed',
          itemId,
          completedAt: completed ? getTodayIsoDate() : null,
        }),
      removeTheoreticalContent: async (itemId, storageKey) => {
        if (storageKey) {
          try {
            await removeTheoreticalContentBinary(storageKey);
          } catch (error) {
            console.error('Falha ao remover arquivo teorico', error);
          }
        }
        dispatch({ type: 'remove-theoretical-content', itemId });
      },
      addCorrectionLink: (input) =>
        dispatch({
          type: 'add-correction-link',
          link: {
            ...input,
            id: createId(),
            createdAt: nowIso(),
          },
        }),
      updateCorrectionLink: (id, patch) => dispatch({ type: 'update-correction-link', id, patch }),
      removeCorrectionLink: (id) => dispatch({ type: 'remove-correction-link', id }),
      createProject: (input) => {
        const timestamp = nowIso();
        const projectId = createId();

        dispatch({
          type: 'add-project',
          project: {
            id: projectId,
            name: input.name,
            description: input.description,
            status: input.status,
            technologyKeys: input.technologyKeys,
            tags: input.tags,
            requirements:
              input.requirements?.map((requirement) => ({
                ...requirement,
                id: createId(),
              })) ?? [],
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });

        return projectId;
      },
      updateProject: (id, patch) => dispatch({ type: 'update-project', id, patch }),
      removeProject: (id) => dispatch({ type: 'remove-project', id }),
      duplicateProject: (id) => {
        const source = state.projects.find((project) => project.id === id);
        if (!source) {
          return;
        }

        dispatch({
          type: 'duplicate-project',
          project: duplicateProjectWithNewIds(source, createId, nowIso()),
        });
      },
      addProjectRequirement: (projectId, requirement) =>
        dispatch({
          type: 'add-project-requirement',
          projectId,
          requirement: { ...requirement, id: createId() },
        }),
      updateProjectRequirement: (projectId, requirementId, patch) =>
        dispatch({
          type: 'update-project-requirement',
          projectId,
          requirementId,
          patch,
        }),
      removeProjectRequirement: (projectId, requirementId) =>
        dispatch({
          type: 'remove-project-requirement',
          projectId,
          requirementId,
        }),
      setAnkiConfig: (patch) => dispatch({ type: 'set-anki-config', patch }),
      setAnkiStats: (patch) => dispatch({ type: 'set-anki-stats', patch }),
      upsertAnkiDailyLog: (input) =>
        dispatch({
          type: 'upsert-anki-daily-log',
          log: {
            date: input.date,
            newCards: Math.max(0, Math.round(input.newCards)),
            reviews: Math.max(0, Math.round(input.reviews)),
          },
        }),
      runManualBackup: async () => {
        await persistSnapshot('manual');
        lastBackedTokenRef.current = state.meta.changeToken;
        lastAutoBackupTickRef.current = Date.now();
      },
      connectBackupFile: async () => {
        const handle = await pickBackupFileHandle();
        backupHandleRef.current = handle;
      },
      importSnapshot: (snapshot) => {
        const normalized = normalizeStateForCurrentPlan(snapshot.appState);
        dispatch({ type: 'import-state', state: normalized });
        lastBackedTokenRef.current = normalized.meta.changeToken;
        lastAutoBackupTickRef.current = Date.now();
      },
      exportSnapshot: () => {
        const snapshot = buildSnapshot(state);
        downloadSnapshot(snapshot, `concurso-export-${snapshot.exportedAt.slice(0, 10)}.json`);
      },
      cloudSync,
      connectGoogleCloud: async () => {
        setCloudSync({
          status: 'checking',
          error: null,
        });
        try {
          await loginWithGoogleCloud();
        } catch (error) {
          setCloudSync({
            status: 'error',
            error: error instanceof Error ? error.message : 'Falha ao conectar conta Google.',
          });
          throw error;
        }
      },
      syncToCloudNow: async () => {
        try {
          await syncSnapshotToCloud(stateRef.current);
        } catch (error) {
          setCloudSync({
            status: 'error',
            error: error instanceof Error ? error.message : 'Falha ao sincronizar com a nuvem.',
          });
          throw error;
        }
      },
    }),
    [cloudSync, persistSnapshot, planRuntime, state, syncSnapshotToCloud],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext precisa ser usado dentro de AppProvider.');
  }

  return context;
};

