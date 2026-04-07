import JSZip from 'jszip';
import { loadTheoreticalContentBinary } from './contentTheoreticalFileStore';
import {
  collectTheoreticalContentsForTopic,
  listAllTheoreticalContents,
  listTheoreticalContentsForOwner,
} from './contentTheoreticalFiles';
import type { AppState, TopicNode, TopicSubmatter } from './types';

type DownloadScope =
  | { kind: 'global' }
  | { kind: 'topic'; topicId: string }
  | { kind: 'submatter'; topicId: string; submatterId: string };

interface TheoreticalBinaryRecord {
  storageKey: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}

export interface TheoreticalContentDownloadEntry {
  path: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}

interface BuildTheoreticalContentDownloadEntriesInput {
  scope: DownloadScope;
  items: AppState['theoreticalContents'];
  topics: TopicNode[];
  topicSubmattersByTopic: AppState['topicSubmattersByTopic'];
  loadBinary?: (storageKey: string) => Promise<TheoreticalBinaryRecord | null>;
}

type DownloadTheoreticalContentsBundleInput = Omit<
  BuildTheoreticalContentDownloadEntriesInput,
  'loadBinary'
>;

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const padOrder = (order: number): string => String(Math.max(1, order)).padStart(2, '0');

const todayStamp = (): string => new Date().toISOString().slice(0, 10);

const ensureTopic = (topics: TopicNode[], topicId: string): TopicNode => {
  const topic = topics.find((item) => item.id === topicId);
  if (!topic) {
    throw new Error(`Matéria não encontrada para download: ${topicId}`);
  }

  return topic;
};

const findSubmatter = (
  topicSubmattersByTopic: AppState['topicSubmattersByTopic'],
  topicId: string,
  submatterId: string,
): TopicSubmatter => {
  const submatter = (topicSubmattersByTopic[topicId] ?? []).find((item) => item.id === submatterId);
  if (!submatter) {
    throw new Error(`Submatéria não encontrada para download: ${submatterId}`);
  }

  return submatter;
};

const itemsForScope = (
  scope: DownloadScope,
  items: AppState['theoreticalContents'],
): AppState['theoreticalContents'] => {
  if (scope.kind === 'global') {
    return listAllTheoreticalContents(items);
  }

  if (scope.kind === 'topic') {
    const topicItems = listTheoreticalContentsForOwner(items, 'topic', scope.topicId);
    const submatterItems = collectTheoreticalContentsForTopic(items, scope.topicId).filter(
      (item) => item.ownerType === 'submatter',
    );
    return [...topicItems, ...submatterItems];
  }

  return listTheoreticalContentsForOwner(items, 'submatter', scope.submatterId).filter(
    (item) => item.topicId === scope.topicId,
  );
};

const entryPath = (
  item: AppState['theoreticalContents'][number],
  topics: TopicNode[],
  topicSubmattersByTopic: AppState['topicSubmattersByTopic'],
): string => {
  const topic = ensureTopic(topics, item.topicId);
  const topicFolder = slugify(topic.title || topic.id);
  const filename = `${padOrder(item.order)}-${item.filename}`;

  if (item.ownerType === 'topic') {
    return `${topicFolder}/${filename}`;
  }

  const submatter = findSubmatter(topicSubmattersByTopic, item.topicId, item.ownerId);
  const submatterFolder = slugify(submatter.title || submatter.id);
  return `${topicFolder}/submaterias/${submatterFolder}/${filename}`;
};

const bundleFilename = (
  scope: DownloadScope,
  topics: TopicNode[],
  topicSubmattersByTopic: AppState['topicSubmattersByTopic'],
): string => {
  const stamp = todayStamp();
  if (scope.kind === 'global') {
    return `conteudo-pragmatico-${stamp}.zip`;
  }

  const topic = ensureTopic(topics, scope.topicId);
  const topicSlug = slugify(topic.title || topic.id);

  if (scope.kind === 'topic') {
    return `${topicSlug}-${stamp}.zip`;
  }

  const submatter = findSubmatter(topicSubmattersByTopic, scope.topicId, scope.submatterId);
  return `${topicSlug}-${slugify(submatter.title || submatter.id)}-${stamp}.zip`;
};

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const buildTheoreticalContentDownloadEntries = async ({
  scope,
  items,
  topics,
  topicSubmattersByTopic,
  loadBinary = loadTheoreticalContentBinary,
}: BuildTheoreticalContentDownloadEntriesInput): Promise<TheoreticalContentDownloadEntry[]> => {
  const selectedItems = itemsForScope(scope, items);

  return Promise.all(
    selectedItems.map(async (item) => {
      const binary = await loadBinary(item.storageKey);
      if (!binary) {
        throw new Error(`Arquivo teórico indisponível para download: ${item.filename}`);
      }

      return {
        path: entryPath(item, topics, topicSubmattersByTopic),
        filename: item.filename,
        mimeType: binary.mimeType || item.mimeType,
        bytes: binary.bytes,
      };
    }),
  );
};

export const downloadTheoreticalContentsBundle = async ({
  scope,
  items,
  topics,
  topicSubmattersByTopic,
}: DownloadTheoreticalContentsBundleInput): Promise<void> => {
  const entries = await buildTheoreticalContentDownloadEntries({
    scope,
    items,
    topics,
    topicSubmattersByTopic,
  });

  if (entries.length === 0) {
    throw new Error('Nenhum conteúdo teórico disponível para download neste contexto.');
  }

  const zip = new JSZip();
  entries.forEach((entry) => {
    zip.file(entry.path, entry.bytes);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(blob, bundleFilename(scope, topics, topicSubmattersByTopic));
};
