import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ChevronLeft,
  Circle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import {
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';

import remarkGfm from 'remark-gfm';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../app/AppContext';
import {
  THEORETICAL_CONTENT_ACCEPT,
  TOPIC_GRADE_OPTIONS,
  TOPIC_STATUS_OPTIONS,
  TOPIC_STALE_BUCKETS_DAYS,
} from '../app/constants';
import {
  buildGradesSummary,
  buildStaleSummary,
  getSubmatterReviewAgeDays,
  getSubmatterStaleBucket,
  getTopicCurrentGrade,
  shouldReviewSubmatterNow,
} from '../app/contentSubmatters';
import { downloadTheoreticalContentsBundle } from '../app/contentTheoreticalDownloads';
import {
  collectTheoreticalContentsForTopic,
  listTheoreticalContentsForOwner,
} from '../app/contentTheoreticalFiles';
import { loadTheoreticalContentBinary } from '../app/contentTheoreticalFileStore';
import { topicGradeLabel, topicStatusHint, topicStatusLabel } from '../app/formatters';
import { getTopicDisplayTitle } from '../app/topics';
import type { TheoreticalContentItem, TopicGrade, TopicSubmatter } from '../app/types';
import { ActionButton } from '../components/ActionButton';
import { EmptyState } from '../components/EmptyState';
import { PageIntro } from '../components/PageIntro';
import { SectionCard } from '../components/SectionCard';

interface NewSubmatterForm {
  title: string;
  grade: TopicGrade;
  lastReviewedAt: string;
  errorNote: string;
  actionNote: string;
}

type TopicViewMode = 'cards' | 'table';
type TopicSortMode = 'priority' | 'oldest' | 'newest' | 'alphabetical';
type FilesLayer = 'topic-main' | 'files-hub' | 'files-topic' | 'files-submatter';
type ViewerReturnLayer = Exclude<FilesLayer, 'topic-main'>;

interface LessonViewerState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  itemId: string | null;
  kind: TheoreticalContentItem['kind'] | null;
  content: string;
  objectUrl: string | null;
  error: string;
}

interface ViewerReturnContext {
  layer: ViewerReturnLayer;
  submatterId: string | null;
}

const initialForm: NewSubmatterForm = {
  title: '',
  grade: 'C',
  lastReviewedAt: '',
  errorNote: '',
  actionNote: '',
};

const initialViewerState: LessonViewerState = {
  status: 'idle',
  itemId: null,
  kind: null,
  content: '',
  objectUrl: null,
  error: '',
};

const gradeSeverity: Record<TopicGrade, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
};

const compareSubmatters = (
  sortMode: TopicSortMode,
  left: TopicSubmatter,
  right: TopicSubmatter,
): number => {
  if (sortMode === 'alphabetical') {
    return left.title.localeCompare(right.title, 'pt-BR');
  }

  const leftAge = getSubmatterReviewAgeDays(left) ?? Number.POSITIVE_INFINITY;
  const rightAge = getSubmatterReviewAgeDays(right) ?? Number.POSITIVE_INFINITY;

  if (sortMode === 'oldest') {
    if (rightAge !== leftAge) {
      return rightAge - leftAge;
    }
    return gradeSeverity[right.grade] - gradeSeverity[left.grade];
  }

  if (sortMode === 'newest') {
    if (leftAge !== rightAge) {
      return leftAge - rightAge;
    }
    return left.title.localeCompare(right.title, 'pt-BR');
  }

  const severityDiff = gradeSeverity[right.grade] - gradeSeverity[left.grade];
  if (severityDiff !== 0) {
    return severityDiff;
  }

  if (rightAge !== leftAge) {
    return rightAge - leftAge;
  }

  return left.title.localeCompare(right.title, 'pt-BR');
};

const reviewStatusLabel = (submatter: TopicSubmatter): string => {
  const daysSinceReview = getSubmatterReviewAgeDays(submatter);
  if (daysSinceReview === null) {
    return 'Sem revisão registrada';
  }

  if (daysSinceReview === 0) {
    return 'Revisado hoje';
  }

  return `${daysSinceReview} dia(s) sem revisar`;
};

const theoreticalContentTypeLabel = (filename: string): string =>
  filename.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Markdown';

const ownerDraftKey = (ownerType: 'topic' | 'submatter', ownerId: string): string =>
  `${ownerType}:${ownerId}`;

const isExternalHref = (href: string | undefined): boolean =>
  typeof href === 'string' && /^https?:\/\//i.test(href);

const READER_EVENT_NAME = 'concurso-reader-mode';

const resetViewerState = (current: LessonViewerState): LessonViewerState => {
  if (current.objectUrl) {
    URL.revokeObjectURL(current.objectUrl);
  }

  return { ...initialViewerState };
};

export const ContentTopicPage = () => {
  const { topicId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const {
    topics,
    state,
    setTopicStatus,
    addTopicSubmatter,
    updateTopicSubmatter,
    removeTopicSubmatter,
    markTopicSubmatterReviewedToday,
    addTheoreticalContent,
    moveTheoreticalContent,
    reorderTheoreticalContent,
    setTheoreticalContentCompleted,
    removeTheoreticalContent,
  } = useAppContext();

  const [form, setForm] = useState<NewSubmatterForm>(initialForm);
  const [viewMode, setViewMode] = useState<TopicViewMode>('cards');
  const [sortMode, setSortMode] = useState<TopicSortMode>('priority');
  const [uploadError, setUploadError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [pasteDrafts, setPasteDrafts] = useState<Record<string, string>>({});
  const [viewerState, setViewerState] = useState<LessonViewerState>(initialViewerState);
  const [viewerReturnContext, setViewerReturnContext] = useState<ViewerReturnContext | null>(null);
  const [filesLayer, setFilesLayer] = useState<FilesLayer>('topic-main');
  const [activeFilesSubmatterId, setActiveFilesSubmatterId] = useState<string | null>(null);
  const [draggedLesson, setDraggedLesson] = useState<{
    ownerType: 'topic' | 'submatter';
    ownerId: string;
    itemId: string;
  } | null>(null);

  const topic = topics.find((item) => item.id === topicId && item.isLeaf);
  const focusedSubmatterId = searchParams.get('submatter');
  const topicDisplayTitle = topic ? getTopicDisplayTitle(topic) : 'matéria';

  const submatters = useMemo(
    () => state.topicSubmattersByTopic[topicId] ?? [],
    [state.topicSubmattersByTopic, topicId],
  );

  const sortedSubmatters = useMemo(
    () => [...submatters].sort((left, right) => compareSubmatters(sortMode, left, right)),
    [sortMode, submatters],
  );

  const topicTheoreticalContents = useMemo(
    () => listTheoreticalContentsForOwner(state.theoreticalContents, 'topic', topicId),
    [state.theoreticalContents, topicId],
  );

  const topicContextTheoreticalContents = useMemo(
    () => collectTheoreticalContentsForTopic(state.theoreticalContents, topicId),
    [state.theoreticalContents, topicId],
  );

  const submatterTheoreticalContentsMap = useMemo(
    () =>
      new Map(
        submatters.map((submatter) => [
          submatter.id,
          listTheoreticalContentsForOwner(state.theoreticalContents, 'submatter', submatter.id),
        ]),
      ),
    [state.theoreticalContents, submatters],
  );

  const topicSummary = useMemo(
    () => buildGradesSummary({ [topicId]: submatters }),
    [submatters, topicId],
  );

  const staleSummary = useMemo(
    () => buildStaleSummary({ [topicId]: submatters }),
    [submatters, topicId],
  );

  const reviewNowCount = useMemo(
    () => submatters.filter((submatter) => shouldReviewSubmatterNow(submatter)).length,
    [submatters],
  );

  const currentGrade = useMemo(() => getTopicCurrentGrade(submatters), [submatters]);
  const topicStatus = state.topicProgress[topicId]?.status ?? 'nao_iniciado';
  const isTopicPending = topicStatus === 'pendente';

  const openedTheoreticalContent = useMemo(
    () => topicContextTheoreticalContents.find((item) => item.id === viewerState.itemId) ?? null,
    [topicContextTheoreticalContents, viewerState.itemId],
  );

  const activeFilesSubmatter = useMemo(
    () => submatters.find((item) => item.id === activeFilesSubmatterId) ?? null,
    [activeFilesSubmatterId, submatters],
  );

  const activeFilesSubmatterContents = useMemo(
    () =>
      activeFilesSubmatter ? submatterTheoreticalContentsMap.get(activeFilesSubmatter.id) ?? [] : [],
    [activeFilesSubmatter, submatterTheoreticalContentsMap],
  );

  const completedLessonCount = useMemo(
    () => topicContextTheoreticalContents.filter((item) => item.completedAt !== null).length,
    [topicContextTheoreticalContents],
  );

  const pendingLessonCount = topicContextTheoreticalContents.length - completedLessonCount;

  const submattersWithFilesCount = useMemo(
    () =>
      submatters.filter((submatter) => (submatterTheoreticalContentsMap.get(submatter.id)?.length ?? 0) > 0)
        .length,
    [submatterTheoreticalContentsMap, submatters],
  );

  useEffect(() => {
    if (focusedSubmatterId && submatters.some((item) => item.id === focusedSubmatterId)) {
      const timer = window.setTimeout(() => {
        setActiveFilesSubmatterId(focusedSubmatterId);
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }

    return undefined;
  }, [focusedSubmatterId, submatters]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(READER_EVENT_NAME, { detail: { active: viewerState.status !== 'idle' } }));

    return () => {
      window.dispatchEvent(new CustomEvent(READER_EVENT_NAME, { detail: { active: false } }));
    };
  }, [viewerState.status]);

  useEffect(() => {
    let shouldIgnore = false;
    let createdObjectUrl: string | null = null;

    if (!openedTheoreticalContent) {
      const timer = window.setTimeout(() => {
        setViewerState((current) => {
          if (current.status === 'idle' && current.itemId === null) {
            return current;
          }
          return resetViewerState(current);
        });
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }

    void loadTheoreticalContentBinary(openedTheoreticalContent.storageKey)
      .then((binary) => {
        if (shouldIgnore) {
          return;
        }

        if (!binary) {
          if (openedTheoreticalContent.kind === 'markdown' && openedTheoreticalContent.inlineContent) {
            setViewerState({
              status: 'ready',
              itemId: openedTheoreticalContent.id,
              kind: openedTheoreticalContent.kind,
              content: openedTheoreticalContent.inlineContent,
              objectUrl: null,
              error: '',
            });
            return;
          }

          setViewerState({
            status: 'error',
            itemId: openedTheoreticalContent.id,
            kind: openedTheoreticalContent.kind,
            content: '',
            objectUrl: null,
            error: 'Nao foi possivel carregar esta aula.',
          });
          return;
        }

        if (openedTheoreticalContent.kind === 'pdf') {
          createdObjectUrl = URL.createObjectURL(
            new Blob([Uint8Array.from(binary.bytes)], {
              type: binary.mimeType || openedTheoreticalContent.mimeType,
            }),
          );

          setViewerState({
            status: 'ready',
            itemId: openedTheoreticalContent.id,
            kind: openedTheoreticalContent.kind,
            content: '',
            objectUrl: createdObjectUrl,
            error: '',
          });
          return;
        }

        setViewerState({
          status: 'ready',
          itemId: openedTheoreticalContent.id,
          kind: openedTheoreticalContent.kind,
          content: new TextDecoder().decode(binary.bytes),
          objectUrl: null,
          error: '',
        });
      })
      .catch((error) => {
        if (!shouldIgnore) {
          setViewerState({
            status: 'error',
            itemId: openedTheoreticalContent.id,
            kind: openedTheoreticalContent.kind,
            content: '',
            objectUrl: null,
            error: error instanceof Error ? error.message : 'Falha ao abrir a aula.',
          });
        }
      });

    return () => {
      shouldIgnore = true;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [openedTheoreticalContent]);

  const handleCreate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const title = form.title.trim();
    if (!topic || !title) {
      return;
    }

    addTopicSubmatter(topic.id, {
      title,
      grade: form.grade,
      lastReviewedAt: form.lastReviewedAt || null,
      errorNote: form.errorNote.trim(),
      actionNote: form.actionNote.trim(),
    });

    setForm(initialForm);
  };

  const handleOwnerUpload = async (
    ownerType: 'topic' | 'submatter',
    ownerId: string,
    submatterId: string | null,
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (!topic) {
      return;
    }

    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) {
      return;
    }

    try {
      await addTheoreticalContent({
        ownerType,
        ownerId,
        topicId: topic.id,
        submatterId,
        files,
      });
      setUploadError('');
      event.target.value = '';
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Falha ao adicionar arquivos teóricos.');
    }
  };

  const handlePasteDraftChange = (
    ownerType: 'topic' | 'submatter',
    ownerId: string,
    value: string,
  ): void => {
    setPasteDrafts((current) => ({
      ...current,
      [ownerDraftKey(ownerType, ownerId)]: value,
    }));
  };

  const handlePasteDraftSave = async (
    ownerType: 'topic' | 'submatter',
    ownerId: string,
    submatterId: string | null,
    fallbackLabel: string,
  ): Promise<void> => {
    if (!topic) {
      return;
    }

    const draftKey = ownerDraftKey(ownerType, ownerId);
    const pastedMarkdown = pasteDrafts[draftKey] ?? '';
    if (!pastedMarkdown.trim()) {
      setUploadError('Cole algum markdown antes de salvar a aula.');
      return;
    }

    try {
      await addTheoreticalContent({
        ownerType,
        ownerId,
        topicId: topic.id,
        submatterId,
        pastedMarkdown,
        pastedLabel: fallbackLabel,
      });
      setUploadError('');
      setPasteDrafts((current) => ({
        ...current,
        [draftKey]: '',
      }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Falha ao salvar a aula colada.');
    }
  };

  const handlePaste = (
    ownerType: 'topic' | 'submatter',
    ownerId: string,
    event: ClipboardEvent<HTMLTextAreaElement>,
  ): void => {
    const pastedText = event.clipboardData.getData('text/plain');
    if (!pastedText) {
      return;
    }

    event.preventDefault();
    handlePasteDraftChange(ownerType, ownerId, pastedText);
  };

  const handleDragStart = (
    ownerType: 'topic' | 'submatter',
    ownerId: string,
    itemId: string,
    event: DragEvent<HTMLElement>,
  ): void => {
    event.dataTransfer.effectAllowed = 'move';
    setDraggedLesson({ ownerType, ownerId, itemId });
  };

  const handleDropOnLesson = (
    ownerType: 'topic' | 'submatter',
    ownerId: string,
    itemId: string,
    event: DragEvent<HTMLElement>,
  ): void => {
    event.preventDefault();
    if (!draggedLesson) {
      return;
    }

    if (draggedLesson.ownerType !== ownerType || draggedLesson.ownerId !== ownerId) {
      setDraggedLesson(null);
      return;
    }

    reorderTheoreticalContent(ownerType, ownerId, draggedLesson.itemId, itemId);
    setDraggedLesson(null);
  };

  const handleOpenLesson = (item: TheoreticalContentItem, origin: ViewerReturnContext | null): void => {
    if (item.id === viewerState.itemId) {
      return;
    }

    setViewerReturnContext(origin);
    setViewerState((current) => ({
      ...resetViewerState(current),
      status: 'loading',
      itemId: item.id,
      kind: item.kind,
    }));
  };

  const handleCloseViewer = (): void => {
    const returnContext = viewerReturnContext;
    setViewerState((current) => resetViewerState(current));
    setViewerReturnContext(null);

    if (returnContext) {
      setFilesLayer(returnContext.layer);
      setActiveFilesSubmatterId(returnContext.submatterId);
    } else {
      setFilesLayer('topic-main');
    }
  };

  const handleDownload = async (
    scope:
      | { kind: 'topic'; topicId: string }
      | { kind: 'submatter'; topicId: string; submatterId: string },
  ): Promise<void> => {
    try {
      await downloadTheoreticalContentsBundle({
        scope,
        items: state.theoreticalContents,
        topics,
        topicSubmattersByTopic: state.topicSubmattersByTopic,
      });
      setDownloadError('');
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Falha ao baixar arquivos teóricos.');
    }
  };

  const handleOpenFilesHub = (): void => {
    setFilesLayer('files-hub');
  };

  const handleOpenTopicFiles = (): void => {
    setFilesLayer('files-topic');
  };

  const handleOpenSubmatterFiles = (submatterId: string): void => {
    setActiveFilesSubmatterId(submatterId);
    setFilesLayer('files-submatter');
  };

  const handleFilesBack = (): void => {
    if (filesLayer === 'files-hub') {
      setFilesLayer('topic-main');
      return;
    }

    setFilesLayer('files-hub');
  };

  const viewerBackLabel = useMemo(() => {
    if (!viewerReturnContext) {
      return 'Voltar para o tópico';
    }

    if (viewerReturnContext.layer === 'files-topic') {
      return 'Voltar para arquivos da matéria';
    }

    if (viewerReturnContext.layer === 'files-hub') {
      return 'Voltar para central de arquivos';
    }

    const returnSubmatter = submatters.find((item) => item.id === viewerReturnContext.submatterId);
    return returnSubmatter ? `Voltar para ${returnSubmatter.title}` : 'Voltar para arquivos da submatéria';
  }, [submatters, viewerReturnContext]);

  const viewerPlaylistLabel = viewerReturnContext?.layer === 'files-submatter'
    ? 'Playlist do contexto'
    : viewerReturnContext
      ? 'Central de arquivos'
      : 'Playlist do Tópico';

  const filesOverlayTitle = filesLayer === 'files-topic'
    ? 'Arquivos da matéria'
    : filesLayer === 'files-submatter'
      ? activeFilesSubmatter?.title ?? 'Arquivos da submatéria'
      : 'Central de arquivos';

  const filesOverlayDescription = filesLayer === 'files-topic'
    ? 'Tudo o que pertence à matéria fica aqui: upload, markdown colado, download e ordem de estudo.'
    : filesLayer === 'files-submatter'
      ? 'Gerencie os arquivos apenas deste contexto, sem misturar com o restante da matéria.'
      : 'Escolha primeiro o contexto e só depois entre na camada de gestão dos arquivos.';

  const renderFilesFeedback = () => (
    <>
      {uploadError ? <p className="review-empty-state">{uploadError}</p> : null}
      {downloadError ? <p className="review-empty-state">{downloadError}</p> : null}
    </>
  );

  const renderTopicFilesDetail = () => (
    <div className="topic-files-detail-stack">
      <SectionCard
        kicker="Biblioteca"
        title="Arquivos da matéria"
        aside={<span className="review-queue-counter">{topicTheoreticalContents.length} arquivo(s)</span>}
      >
        <div className="topic-upload-controls">
          <div className="button-row">
            <button
              className="button"
              type="button"
              disabled={topicContextTheoreticalContents.length === 0}
              onClick={() => {
                void handleDownload({ kind: 'topic', topicId });
              }}
            >
              Baixar arquivos da matéria
            </button>
          </div>

          <label className="field-label file-upload-wrapper">
            <span>Adicionar arquivos da matéria</span>
            <div className="file-upload-box">
              <input
                className="input-file"
                type="file"
                data-testid="topic-theoretical-content-upload"
                accept={THEORETICAL_CONTENT_ACCEPT}
                multiple
                onChange={(event) => {
                  void handleOwnerUpload('topic', topicId, null, event);
                }}
              />
            </div>
          </label>

          <label className="field-label markdown-paste-wrapper">
            <span>Colar markdown da aula</span>
            <textarea
              className="lesson-paste-input"
              data-testid="topic-theoretical-content-paste"
              placeholder="Clique aqui e use Ctrl+V para colar seu .md sem sair do site."
              value={pasteDrafts[ownerDraftKey('topic', topicId)] ?? ''}
              onChange={(event) => handlePasteDraftChange('topic', topicId, event.target.value)}
              onPaste={(event) => handlePaste('topic', topicId, event)}
              rows={8}
            />
          </label>

          <div className="button-row">
            <button
              className="btn-outline"
              type="button"
              onClick={() => {
                void handlePasteDraftSave('topic', topicId, null, `Aula ${topicDisplayTitle}`);
              }}
            >
              Salvar aula colada na matéria
            </button>
          </div>
        </div>

        {renderFilesFeedback()}

        <ul className="topic-rollup-list" data-testid="topic-theoretical-content-list">
          {topicTheoreticalContents.map((item, index) => (
            <li
              className={`topic-rollup-card lesson-card ${item.completedAt ? 'lesson-completed' : ''}`}
              data-testid={`theoretical-content-card-${item.id}`}
              draggable
              key={item.id}
              onDragStart={(event) => handleDragStart('topic', topicId, item.id, event)}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => handleDropOnLesson('topic', topicId, item.id, event)}
              onDragEnd={() => setDraggedLesson(null)}
            >
              <div className="lesson-card-content">
                <div className="lesson-info-compact">
                  <strong>{item.label}</strong>
                  <div className="lesson-info-compact-meta-row">
                    <span className={`grade-pill ${item.completedAt ? 'grade-pill-a' : 'grade-pill-e'}`}>
                      {item.completedAt ? 'Feita' : 'Pendente'}
                    </span>
                    <span className="projects-card-meta">
                      {theoreticalContentTypeLabel(item.filename)} · {Math.max(1, Math.round(item.sizeBytes / 1024))} KB
                    </span>
                  </div>
                </div>

                <div className="lesson-actions">
                  <button
                    className="action-icon-btn"
                    title="Abrir aula"
                    aria-label={`Abrir aula ${item.label}`}
                    type="button"
                    onClick={() =>
                      handleOpenLesson(item, {
                        layer: 'files-topic',
                        submatterId: null,
                      })
                    }
                  >
                    <ExternalLink size={18} />
                  </button>
                  <button
                    className={`action-icon-btn ${item.completedAt ? 'action-active' : ''}`}
                    title={item.completedAt === null ? 'Marcar como feita' : 'Marcar como pendente'}
                    aria-label={
                      item.completedAt === null
                        ? `Marcar ${item.label} como feita`
                        : `Marcar ${item.label} como pendente`
                    }
                    type="button"
                    onClick={() => setTheoreticalContentCompleted(item.id, item.completedAt === null)}
                  >
                    {item.completedAt ? <CheckCircle size={18} /> : <Circle size={18} />}
                  </button>
                  <div className="action-divider" />
                  <button
                    className="action-icon-btn"
                    title="Mover para cima"
                    aria-label={`Mover ${item.label} para cima`}
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveTheoreticalContent('topic', topicId, item.id, 'up')}
                  >
                    <ArrowUp size={18} />
                  </button>
                  <button
                    className="action-icon-btn"
                    title="Mover para baixo"
                    aria-label={`Mover ${item.label} para baixo`}
                    type="button"
                    disabled={index === topicTheoreticalContents.length - 1}
                    onClick={() => moveTheoreticalContent('topic', topicId, item.id, 'down')}
                  >
                    <ArrowDown size={18} />
                  </button>
                  <button
                    className="action-icon-btn"
                    title="Excluir aula"
                    aria-label={`Excluir aula ${item.label}`}
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja excluir a aula "${item.label}"?`)) {
                        void removeTheoreticalContent(item.id, item.storageKey);
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {topicTheoreticalContents.length === 0 ? (
          <EmptyState message="Nenhum conteúdo teórico cadastrado para esta matéria." />
        ) : null}
      </SectionCard>
    </div>
  );

  const renderSubmatterFilesDetail = () => {
    if (!activeFilesSubmatter) {
      return (
        <SectionCard kicker="Biblioteca" title="Arquivos da submatéria">
          <EmptyState message="Escolha uma submatéria para ver os arquivos deste contexto." />
        </SectionCard>
      );
    }

    return (
      <div className="topic-files-detail-stack">
        <SectionCard
          kicker="Biblioteca"
          title={activeFilesSubmatter.title}
          aside={<span className="review-queue-counter">{activeFilesSubmatterContents.length} arquivo(s)</span>}
        >
          <div className="topic-rollup-head topic-files-section-head">
            <div>
              <strong>Arquivos por submatéria</strong>
              <p className="projects-card-meta">
                Nota {activeFilesSubmatter.grade} · contexto isolado para não poluir a matéria toda
              </p>
            </div>

            <div className="button-row">
              <button
                className="button button-secondary"
                type="button"
                disabled={activeFilesSubmatterContents.length === 0}
                onClick={() => {
                  void handleDownload({
                    kind: 'submatter',
                    topicId,
                    submatterId: activeFilesSubmatter.id,
                  });
                }}
              >
                Baixar arquivos da submatéria {activeFilesSubmatter.title}
              </button>
            </div>
          </div>

          <label className="field-label">
            Adicionar arquivos da submatéria
            <input
              className="input"
              type="file"
              data-testid={`submatter-theoretical-content-upload-${activeFilesSubmatter.id}`}
              accept={THEORETICAL_CONTENT_ACCEPT}
              multiple
              onChange={(event) => {
                void handleOwnerUpload('submatter', activeFilesSubmatter.id, activeFilesSubmatter.id, event);
              }}
            />
          </label>

          <label className="field-label">
            Colar markdown da submatéria
            <textarea
              className="input lesson-paste-input"
              data-testid={`submatter-theoretical-content-paste-${activeFilesSubmatter.id}`}
              placeholder="Use Ctrl+V para transformar a aula em um item deste contexto."
              value={pasteDrafts[ownerDraftKey('submatter', activeFilesSubmatter.id)] ?? ''}
              onChange={(event) =>
                handlePasteDraftChange('submatter', activeFilesSubmatter.id, event.target.value)
              }
              onPaste={(event) => handlePaste('submatter', activeFilesSubmatter.id, event)}
              rows={6}
            />
          </label>

          <div className="button-row">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                void handlePasteDraftSave(
                  'submatter',
                  activeFilesSubmatter.id,
                  activeFilesSubmatter.id,
                  `Aula ${activeFilesSubmatter.title}`,
                );
              }}
            >
              Salvar aula colada na submatéria
            </button>
          </div>

          {renderFilesFeedback()}

          <ul
            className="topic-rollup-list"
            data-testid={`submatter-theoretical-content-list-${activeFilesSubmatter.id}`}
          >
            {activeFilesSubmatterContents.map((item, index) => (
              <li
                className="topic-rollup-card lesson-card"
                data-testid={`theoretical-content-card-${item.id}`}
                draggable
                key={item.id}
                onDragStart={(event) => handleDragStart('submatter', activeFilesSubmatter.id, item.id, event)}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => handleDropOnLesson('submatter', activeFilesSubmatter.id, item.id, event)}
                onDragEnd={() => setDraggedLesson(null)}
              >
                <div className="lesson-card-content">
                  <div className="lesson-info-compact">
                    <strong>{item.label}</strong>
                    <div className="lesson-info-compact-meta-row">
                      <span className={`grade-pill ${item.completedAt ? 'grade-pill-a' : 'grade-pill-e'}`}>
                        {item.completedAt ? 'Feita' : 'Pendente'}
                      </span>
                      <span className="projects-card-meta">
                        {theoreticalContentTypeLabel(item.filename)} · {Math.max(1, Math.round(item.sizeBytes / 1024))} KB
                      </span>
                    </div>
                  </div>

                  <div className="lesson-actions">
                    <button
                      className="action-icon-btn"
                      title="Abrir aula"
                      aria-label={`Abrir aula ${item.label}`}
                      type="button"
                      onClick={() =>
                        handleOpenLesson(item, {
                          layer: 'files-submatter',
                          submatterId: activeFilesSubmatter.id,
                        })
                      }
                    >
                      <ExternalLink size={18} />
                    </button>
                    <button
                      className={`action-icon-btn ${item.completedAt ? 'action-active' : ''}`}
                      title={item.completedAt === null ? 'Marcar como feita' : 'Marcar como pendente'}
                      aria-label={
                        item.completedAt === null
                          ? `Marcar ${item.label} como feita`
                          : `Marcar ${item.label} como pendente`
                      }
                      type="button"
                      onClick={() => setTheoreticalContentCompleted(item.id, item.completedAt === null)}
                    >
                      {item.completedAt ? <CheckCircle size={18} /> : <Circle size={18} />}
                    </button>
                    <div className="action-divider" />
                    <button
                      className="action-icon-btn"
                      title="Mover para cima"
                      aria-label={`Mover ${item.label} para cima`}
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        moveTheoreticalContent('submatter', activeFilesSubmatter.id, item.id, 'up')
                      }
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button
                      className="action-icon-btn"
                      title="Mover para baixo"
                      aria-label={`Mover ${item.label} para baixo`}
                      type="button"
                      disabled={index === activeFilesSubmatterContents.length - 1}
                      onClick={() =>
                        moveTheoreticalContent('submatter', activeFilesSubmatter.id, item.id, 'down')
                      }
                    >
                      <ArrowDown size={18} />
                    </button>
                    <button
                      className="action-icon-btn"
                      title="Excluir aula"
                      aria-label={`Excluir aula ${item.label}`}
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir a aula "${item.label}"?`)) {
                          void removeTheoreticalContent(item.id, item.storageKey);
                        }
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {activeFilesSubmatterContents.length === 0 ? (
            <EmptyState message="Nenhum conteúdo teórico cadastrado para esta submatéria." />
          ) : null}
        </SectionCard>
      </div>
    );
  };

  const renderFilesHub = () => (
    <div className="topic-files-hub-grid" data-testid="topic-files-hub">
      <SectionCard
        kicker="Biblioteca"
        title="Arquivos da matéria"
        className="topic-files-hub-card topic-files-hub-card-primary"
      >
        <div className="topic-files-hub-card-copy">
          <p className="projects-card-meta">
            {topicTheoreticalContents.length} arquivo(s) principais · {completedLessonCount} feita(s) no total
          </p>
          <p className="topic-files-hub-note">
            Entre aqui para subir material bruto, colar markdown, baixar o pacote e reorganizar a ordem.
          </p>
        </div>
        <div className="button-row">
          <button className="button" type="button" onClick={handleOpenTopicFiles}>
            Abrir arquivos da matéria
          </button>
        </div>
      </SectionCard>

      <SectionCard
        kicker="Contextos"
        title="Arquivos por submatéria"
        className="topic-files-hub-card"
        aside={<span className="review-queue-counter">{sortedSubmatters.length} submatéria(s)</span>}
      >
        <div className="topic-files-submatter-list">
          {sortedSubmatters.map((submatter) => {
            const submatterContents = submatterTheoreticalContentsMap.get(submatter.id) ?? [];
            const completedCount = submatterContents.filter((item) => item.completedAt !== null).length;

            return (
              <article
                key={`files-hub-${submatter.id}`}
                className={`topic-files-submatter-card ${
                  focusedSubmatterId === submatter.id ? 'topic-files-submatter-card-focused' : ''
                }`}
              >
                <div>
                  <strong>{submatter.title}</strong>
                  <p className="projects-card-meta">
                    Nota {submatter.grade} · {submatterContents.length} arquivo(s) · {completedCount} feito(s)
                  </p>
                </div>
                <div className="button-row">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => handleOpenSubmatterFiles(submatter.id)}
                  >
                    Abrir arquivos da submatéria {submatter.title}
                  </button>
                </div>
              </article>
            );
          })}

          {sortedSubmatters.length === 0 ? (
            <EmptyState message="Cadastre uma submatéria para organizar os arquivos por contexto." />
          ) : null}
        </div>
      </SectionCard>
    </div>
  );

  const renderFilesOverlayBody = () => {
    if (filesLayer === 'files-topic') {
      return renderTopicFilesDetail();
    }

    if (filesLayer === 'files-submatter') {
      return renderSubmatterFilesDetail();
    }

    return renderFilesHub();
  };

  if (!topic) {
    return (
      <section className="page">
        <PageIntro
          kicker="Conteúdo pragmático"
          title="Tópico não encontrado"
          description="Esse tópico não existe no conteúdo atual."
          actions={<ActionButton to="/conteudo">Voltar para Conteúdo</ActionButton>}
        />
      </section>
    );
  }

  if (openedTheoreticalContent) {
    return (
      <section className="focus-lesson-layout">
        <aside className="focus-sidebar">
          <div className="focus-sidebar-header">
            <button className="btn-outline btn-back" onClick={handleCloseViewer}>
              <ChevronLeft size={16} /> {viewerBackLabel}
            </button>
            <div className="focus-sidebar-info">
              <span className="kicker-label">{viewerPlaylistLabel}</span>
              <strong>{getTopicDisplayTitle(topic)}</strong>
            </div>
          </div>

          <div className="focus-playlist">
            {topicContextTheoreticalContents.map((item) => (
              <div
                key={item.id}
                className={`playlist-item ${item.id === openedTheoreticalContent?.id ? 'active' : ''}`}
                onClick={() => handleOpenLesson(item, viewerReturnContext)}
              >
                <button
                  type="button"
                  className="playlist-item-icon-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTheoreticalContentCompleted(item.id, item.completedAt === null);
                  }}
                  title={item.completedAt === null ? 'Marcar como feita' : 'Marcar como pendente'}
                >
                  {item.completedAt ? <CheckCircle size={16} className="action-active" /> : <Circle size={16} />}
                </button>
                <div className="playlist-item-info">
                  <span className="playlist-title">{item.label}</span>
                  <span className="playlist-meta">
                    {item.submatterId
                      ? `Submatéria · ${submatters.find((s) => s.id === item.submatterId)?.title ?? 'Contexto'}`
                      : 'Arquivo da matéria'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="focus-viewer-main" data-testid="theoretical-content-viewer">
          {viewerState.status === 'loading' ? (
            <div className="focus-state-overlay">
              <p>Carregando aula...</p>
            </div>
          ) : null}

          {viewerState.status === 'error' ? (
            <div className="focus-state-overlay error">
              <p>{viewerState.error}</p>
            </div>
          ) : null}

          {viewerState.status === 'ready' && viewerState.kind === 'markdown' ? (
            <article className="markdown-render focus-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children, ...props }) => (
                    <a
                      {...props}
                      href={href}
                      rel={isExternalHref(href) ? 'noreferrer' : undefined}
                      target={isExternalHref(href) ? '_blank' : undefined}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {viewerState.content}
              </ReactMarkdown>
            </article>
          ) : null}

          {viewerState.status === 'ready' && viewerState.kind === 'pdf' && viewerState.objectUrl ? (
            <iframe
              className="focus-pdf-frame"
              src={viewerState.objectUrl}
              title="Visualizador da aula em PDF"
            />
          ) : null}
        </main>
      </section>
    );
  }

  return (
    <section className="page topic-study-page">
      <PageIntro
        kicker="Leitura e revisão"
        title={getTopicDisplayTitle(topic)}
        description="Modo rápido para reavaliar, revisar hoje, registrar erro/ação e sinalizar quando a matéria ficou pendente."
        actions={
          <ActionButton to="/conteudo" tone="ghost">
            Voltar para Conteúdo
          </ActionButton>
        }
        meta={
          <div className="topic-hero-meta">
            <span className={`grade-pill grade-pill-${currentGrade.toLowerCase()}`}>Nota atual {currentGrade}</span>
            <span className={isTopicPending ? 'eyebrow-badge eyebrow-badge-pending' : 'eyebrow-badge'}>
              Status {topicStatusLabel(topicStatus)}
            </span>
            <span className="eyebrow-badge">{sortedSubmatters.length} submatéria(s)</span>
            <span className="eyebrow-badge">{topicContextTheoreticalContents.length} aula(s)</span>
          </div>
        }
      />

      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-card-title">
            <span>Visão Geral do Tópico</span>
          </div>
          <div className="totals-group">
            <div className="tot-box">
              <h4>{topicSummary.total}</h4>
              <span>Total submatérias</span>
            </div>
            <div className="tot-box highlight">
              <h4 data-testid="topic-review-now-count">{reviewNowCount}</h4>
              <span>Revisar Agora</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-title">
            <span>Painel de Notas (A-E)</span>
          </div>
          <div className="grades-container">
            {(['A', 'B', 'C', 'D', 'E'] as const).map((grade) => (
              <div key={grade} className={`grade-box g-${grade.toLowerCase()}`}>
                <span className="g-label">{grade}</span>
                <span className="g-val">{topicSummary.byGrade[grade]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-title">
            <span>Sem Revisão ({submatters.filter((item) => item.lastReviewedAt === null).length})</span>
            <span>Atrasos</span>
          </div>
          <div className="delay-list">
            <div className="delay-item">
              <span>Mais antigas</span>
              <span>{staleSummary.byDays[15]}</span>
            </div>
            {TOPIC_STALE_BUCKETS_DAYS.map((days) => (
              <div key={days} className="delay-item">
                <span>&gt; {days} dias</span>
                <span>{staleSummary.byDays[days]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-card metric-card-pending">
          <div className="metric-card-title">
            <span>Status da matéria</span>
            <span>{isTopicPending ? 'Pendente' : 'Fluxo'}</span>
          </div>
          <div className="metric-card-summary">
            <strong>{topicStatusLabel(topicStatus)}</strong>
            <p>{topicStatusHint(topicStatus)}</p>
          </div>
        </div>
      </div>

      <SectionCard
        kicker="Ritmo operacional"
        title="Marcação da matéria"
        tone={isTopicPending ? 'alert' : 'default'}
        className="topic-status-panel"
        aside={
          <span className={isTopicPending ? 'eyebrow-badge eyebrow-badge-pending' : 'eyebrow-badge'}>
            {isTopicPending ? 'Visível em Pendentes' : 'Sem pendência manual'}
          </span>
        }
      >
        <div className="topic-status-panel-head">
          <div className="topic-status-panel-copy">
            <strong>{topicStatusLabel(topicStatus)}</strong>
            <p className="projects-card-meta">{topicStatusHint(topicStatus)}</p>
          </div>
          <p className="topic-status-panel-note">
            Quando você marcar <strong>Pendente</strong>, esta matéria volta com destaque na página
            principal de conteúdo, no badge do card e no filtro <strong>Pendentes</strong>.
          </p>
        </div>

        <div className="topic-status-selector" role="group" aria-label="Status da matéria">
          {TOPIC_STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              className={`topic-status-chip ${topicStatus === status ? 'topic-status-chip-active' : ''} ${
                status === 'pendente' ? 'topic-status-chip-pending' : ''
              }`}
              aria-pressed={topicStatus === status}
              aria-label={
                status === 'pendente'
                  ? 'Marcar matéria como pendente'
                  : `Definir matéria como ${topicStatusLabel(status)}`
              }
              onClick={() => setTopicStatus(topic.id, status)}
            >
              <span>{topicStatusLabel(status)}</span>
              <small>{topicStatusHint(status)}</small>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        kicker="Biblioteca"
        title="Central de arquivos"
        className="topic-library-summary-card"
        aside={<span className="review-queue-counter">{topicContextTheoreticalContents.length} aula(s)</span>}
      >
        <div className="topic-library-summary-grid">
          <div className="topic-library-stat">
            <strong>{topicContextTheoreticalContents.length}</strong>
            <span>Total de arquivos</span>
          </div>
          <div className="topic-library-stat">
            <strong>{completedLessonCount}</strong>
            <span>Feitas</span>
          </div>
          <div className="topic-library-stat">
            <strong>{pendingLessonCount}</strong>
            <span>Pendentes</span>
          </div>
          <div className="topic-library-stat">
            <strong>{submattersWithFilesCount}</strong>
            <span>Submatérias com arquivos</span>
          </div>
        </div>

        <div className="topic-library-summary-actions">
          <p className="projects-card-meta">
            A tela principal fica livre para revisão. Os uploads, downloads e listas de aulas vivem numa
            camada separada.
          </p>
          <div className="button-row">
            <button className="button" type="button" onClick={handleOpenFilesHub}>
              Abrir central de arquivos
            </button>
          </div>
        </div>
      </SectionCard>

      <details className="study-drawer" open>
        <summary className="study-drawer-summary">Nova submatéria</summary>
        <SectionCard as="div" className="submatter-composer" kicker="Cadastro rápido" title="Nova submatéria">
          <form onSubmit={handleCreate}>
            <div className="submatter-composer-head">
              <span>Crie e já classifique sem sair da fila.</span>
            </div>

            <div className="submatter-composer-grid">
              <label className="field-label">
                Submatéria
                <input
                  className="input"
                  data-testid="submatter-create-title"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>

              <label className="field-label">
                Última revisão
                <input
                  className="input"
                  type="date"
                  value={form.lastReviewedAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, lastReviewedAt: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="grade-chip-row">
              {TOPIC_GRADE_OPTIONS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className={`grade-chip grade-chip-${grade.toLowerCase()} ${
                    form.grade === grade ? 'grade-chip-active' : ''
                  }`}
                  onClick={() => setForm((current) => ({ ...current, grade }))}
                >
                  {grade}
                </button>
              ))}
            </div>

            <div className="submatter-composer-grid submatter-composer-grid-wide">
              <label className="field-label">
                Erro
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Erro: confundi X com Y"
                  value={form.errorNote}
                  onChange={(event) => setForm((current) => ({ ...current, errorNote: event.target.value }))}
                />
              </label>
              <label className="field-label">
                Ação
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Ação: refazer 20 questões e criar 3 cards"
                  value={form.actionNote}
                  onChange={(event) => setForm((current) => ({ ...current, actionNote: event.target.value }))}
                />
              </label>
            </div>

            <div className="button-row">
              <button className="button" type="submit" data-testid="submatter-create-submit">
                Adicionar submatéria
              </button>
            </div>
          </form>
        </SectionCard>
      </details>

      <details className="study-drawer" open>
        <summary className="study-drawer-summary">Revisão das submatérias</summary>
        <SectionCard kicker="Ordenação" title="Lista de estudo">
          <div className="review-section-head">
            <select
              className="input topic-sort-select"
              aria-label="Escolher visualização"
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value as TopicViewMode)}
            >
              <option value="cards">Visual em cards</option>
              <option value="table">Visual em tabela</option>
            </select>
            <select
              className="input topic-sort-select"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as TopicSortMode)}
            >
              <option value="priority">Pior primeiro</option>
              <option value="oldest">Mais antigas</option>
              <option value="newest">Mais recentes</option>
              <option value="alphabetical">Alfabética</option>
            </select>
          </div>

          {viewMode === 'cards' ? (
            <div className="submatter-card-list" data-testid="submatter-card-list">
              {sortedSubmatters.map((submatter) => {
                const staleBucket = getSubmatterStaleBucket(submatter);
                const needsReview = shouldReviewSubmatterNow(submatter);

                return (
                  <article
                    key={submatter.id}
                    className={`submatter-card submatter-card-${submatter.grade.toLowerCase()} ${
                      needsReview ? 'submatter-card-priority' : ''
                    } ${focusedSubmatterId === submatter.id ? 'submatter-card-focused' : ''}`}
                    data-testid={`submatter-card-${submatter.id}`}
                  >
                    <div className="submatter-card-head">
                      <div className="submatter-card-title-wrap">
                        <input
                          className="input submatter-card-title"
                          value={submatter.title}
                          onChange={(event) =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              title: event.target.value,
                            })
                          }
                        />
                        <div className="submatter-card-statuses">
                          <span className={`grade-pill grade-pill-${submatter.grade.toLowerCase()}`}>
                            Nota {submatter.grade}
                          </span>
                          <span className={`review-badge review-badge-${staleBucket}`}>
                            {reviewStatusLabel(submatter)}
                          </span>
                        </div>
                      </div>

                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => removeTopicSubmatter(topic.id, submatter.id)}
                      >
                        Excluir
                      </button>
                    </div>

                    <div className="grade-chip-row" data-testid={`grade-chip-row-${submatter.id}`}>
                      {TOPIC_GRADE_OPTIONS.map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          className={`grade-chip grade-chip-${grade.toLowerCase()} ${
                            submatter.grade === grade ? 'grade-chip-active' : ''
                          }`}
                          aria-pressed={submatter.grade === grade}
                          onClick={() =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              grade,
                            })
                          }
                        >
                          {grade}
                        </button>
                      ))}
                    </div>

                    <div className="submatter-card-review-row">
                      <label className="field-label">
                        Última revisão
                        <input
                          className="input"
                          type="date"
                          value={submatter.lastReviewedAt ?? ''}
                          onChange={(event) =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              lastReviewedAt: event.target.value || null,
                            })
                          }
                        />
                      </label>
                      <button
                        className="button"
                        type="button"
                        onClick={() => markTopicSubmatterReviewedToday(topic.id, submatter.id)}
                      >
                        Hoje
                      </button>
                    </div>

                    <div className="submatter-card-notes">
                      <label className="field-label">
                        Erro
                        <textarea
                          className="textarea"
                          rows={3}
                          value={submatter.errorNote}
                          onChange={(event) =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              errorNote: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field-label">
                        Ação
                        <textarea
                          className="textarea"
                          rows={3}
                          value={submatter.actionNote}
                          onChange={(event) =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              actionNote: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  </article>
                );
              })}

              {sortedSubmatters.length === 0 ? <EmptyState message="Nenhuma submatéria cadastrada." /> : null}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table submatter-table">
                <thead>
                  <tr>
                    <th>Submatéria</th>
                    <th>Nota</th>
                    <th>Última revisão</th>
                    <th>Erro</th>
                    <th>Ação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody data-testid="submatter-table-body">
                  {sortedSubmatters.map((submatter) => (
                    <tr key={submatter.id}>
                      <td>
                        <input
                          className="input"
                          value={submatter.title}
                          onChange={(event) =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              title: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="input"
                          value={submatter.grade}
                          onChange={(event) =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              grade: event.target.value as TopicGrade,
                            })
                          }
                        >
                          {TOPIC_GRADE_OPTIONS.map((grade) => (
                            <option key={grade} value={grade}>
                              {topicGradeLabel(grade)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="submatter-review-cell">
                          <input
                            className="input"
                            type="date"
                            value={submatter.lastReviewedAt ?? ''}
                            onChange={(event) =>
                              updateTopicSubmatter(topic.id, submatter.id, {
                                lastReviewedAt: event.target.value || null,
                              })
                            }
                          />
                          <button
                            className="button"
                            type="button"
                            onClick={() => markTopicSubmatterReviewedToday(topic.id, submatter.id)}
                          >
                            Hoje
                          </button>
                        </div>
                      </td>
                      <td>
                        <textarea
                          className="textarea"
                          rows={2}
                          value={submatter.errorNote}
                          onChange={(event) =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              errorNote: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <textarea
                          className="textarea"
                          rows={2}
                          value={submatter.actionNote}
                          onChange={(event) =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              actionNote: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="button button-danger"
                          type="button"
                          onClick={() => removeTopicSubmatter(topic.id, submatter.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedSubmatters.length === 0 ? (
                    <tr>
                      <td colSpan={6}>Nenhuma submatéria cadastrada.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </details>

      {filesLayer !== 'topic-main'
        ? createPortal(
            <div className="topic-files-overlay" data-testid="topic-files-overlay">
              <button
                type="button"
                className="topic-files-overlay-backdrop"
                aria-label="Fechar central de arquivos"
                onClick={() => setFilesLayer('topic-main')}
              />
              <section className="topic-files-panel" role="dialog" aria-modal="true" aria-label={filesOverlayTitle}>
                <div className="topic-files-panel-header">
                  <div className="topic-files-panel-heading">
                    <button className="btn-outline btn-back" type="button" onClick={handleFilesBack}>
                      <ChevronLeft size={16} /> {filesLayer === 'files-hub' ? 'Voltar para o tópico' : 'Voltar para central'}
                    </button>
                    <div>
                      <span className="kicker-label">Camada de arquivos</span>
                      <h3>{filesOverlayTitle}</h3>
                      <p>{filesOverlayDescription}</p>
                    </div>
                  </div>
                  <div className="topic-files-panel-stats">
                    <div className="topic-files-panel-stat">
                      <strong>{topicContextTheoreticalContents.length}</strong>
                      <span>Total</span>
                    </div>
                    <div className="topic-files-panel-stat">
                      <strong>{completedLessonCount}</strong>
                      <span>Feitas</span>
                    </div>
                    <div className="topic-files-panel-stat">
                      <strong>{submattersWithFilesCount}</strong>
                      <span>Contextos ativos</span>
                    </div>
                  </div>
                </div>

                <div className="topic-files-panel-body">{renderFilesOverlayBody()}</div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
};
