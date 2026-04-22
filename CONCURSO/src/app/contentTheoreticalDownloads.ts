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

interface MissingTheoreticalContentEntry {
  filename: string;
  path: string;
}

interface TheoreticalContentDownloadPlan {
  requestedCount: number;
  entries: TheoreticalContentDownloadEntry[];
  missingEntries: MissingTheoreticalContentEntry[];
}

export interface TheoreticalContentDownloadEntry {
  path: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array | string;
}

export interface TheoreticalContentBundleDownloadSummary {
  requestedCount: number;
  downloadedCount: number;
  missingCount: number;
  isPartial: boolean;
  manifestIncluded: boolean;
  bundleFilename: string;
}

interface BuildTheoreticalContentDownloadEntriesInput {
  scope: DownloadScope;
  items: AppState['theoreticalContents'];
  topics: TopicNode[];
  topicSubmattersByTopic: AppState['topicSubmattersByTopic'];
  loadBinary?: (storageKey: string) => Promise<TheoreticalBinaryRecord | null>;
}

interface DownloadTheoreticalContentsBundleInput extends BuildTheoreticalContentDownloadEntriesInput {
  saveBlob?: (blob: Blob, filename: string) => void;
}

const MISSING_CONTENT_MANIFEST_FILENAME = 'arquivos-ausentes.txt';

const slugify = (value: string): string => {
  let slug = '';
  let previousDash = false;

  for (const character of value.normalize('NFD')) {
    if (/\p{M}/u.test(character)) {
      continue;
    }

    const lower = character.toLowerCase();
    if (/[a-z0-9]/.test(lower)) {
      slug += lower;
      previousDash = false;
      continue;
    }

    if (!previousDash && slug.length > 0) {
      slug += '-';
      previousDash = true;
    }
  }

  let startIndex = 0;
  let endIndex = slug.length;

  while (startIndex < endIndex && slug[startIndex] === '-') {
    startIndex += 1;
  }

  while (endIndex > startIndex && slug[endIndex - 1] === '-') {
    endIndex -= 1;
  }

  return slug.slice(startIndex, endIndex);
};

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

const getInlineMarkdownText = (
  item: AppState['theoreticalContents'][number],
): string | null => {
  if (item.kind !== 'markdown' || typeof item.inlineContent !== 'string') {
    return null;
  }

  const normalized = item.inlineContent.split(/\r\n?/).join('\n').trim();
  if (!normalized) {
    return null;
  }

  return normalized;
};

const buildMissingManifestText = (missingEntries: MissingTheoreticalContentEntry[]): string => {
  const lines = [
    'Relatorio de arquivos ausentes no dispositivo atual.',
    `Gerado em: ${new Date().toISOString()}`,
    `Total ausente(s): ${missingEntries.length}`,
    '',
    ...missingEntries.map((entry, index) => `${index + 1}. ${entry.path}`),
  ];

  return lines.join('\n');
};

const buildTheoreticalContentDownloadPlan = async ({
  scope,
  items,
  topics,
  topicSubmattersByTopic,
  loadBinary = loadTheoreticalContentBinary,
  allowMissingBinary,
}: BuildTheoreticalContentDownloadEntriesInput & {
  allowMissingBinary: boolean;
}): Promise<TheoreticalContentDownloadPlan> => {
  const selectedItems = itemsForScope(scope, items);
  const entries: TheoreticalContentDownloadEntry[] = [];
  const missingEntries: MissingTheoreticalContentEntry[] = [];

  for (const item of selectedItems) {
    const path = entryPath(item, topics, topicSubmattersByTopic);

    let binary: TheoreticalBinaryRecord | null = null;
    try {
      binary = await loadBinary(item.storageKey);
    } catch {
      binary = null;
    }

    if (binary) {
      entries.push({
        path,
        filename: item.filename,
        mimeType: binary.mimeType || item.mimeType,
        bytes: binary.bytes,
      });
      continue;
    }

    const inlineText = getInlineMarkdownText(item);
    if (inlineText) {
      entries.push({
        path,
        filename: item.filename,
        mimeType: item.mimeType || 'text/markdown',
        bytes: inlineText,
      });
      continue;
    }

    if (!allowMissingBinary) {
      throw new Error(`Arquivo teórico indisponível para download: ${item.filename}`);
    }

    missingEntries.push({
      filename: item.filename,
      path,
    });
  }

  return {
    requestedCount: selectedItems.length,
    entries,
    missingEntries,
  };
};

export const buildTheoreticalContentDownloadEntries = async ({
  scope,
  items,
  topics,
  topicSubmattersByTopic,
  loadBinary = loadTheoreticalContentBinary,
}: BuildTheoreticalContentDownloadEntriesInput): Promise<TheoreticalContentDownloadEntry[]> => {
  const plan = await buildTheoreticalContentDownloadPlan({
    scope,
    items,
    topics,
    topicSubmattersByTopic,
    loadBinary,
    allowMissingBinary: false,
  });

  return plan.entries;
};

export const downloadTheoreticalContentsBundle = async ({
  scope,
  items,
  topics,
  topicSubmattersByTopic,
  loadBinary = loadTheoreticalContentBinary,
  saveBlob = triggerBlobDownload,
}: DownloadTheoreticalContentsBundleInput): Promise<TheoreticalContentBundleDownloadSummary> => {
  const allowMissingBinary = scope.kind === 'global';
  const plan = await buildTheoreticalContentDownloadPlan({
    scope,
    items,
    topics,
    topicSubmattersByTopic,
    loadBinary,
    allowMissingBinary,
  });

  const entries = [...plan.entries];
  const missingCount = plan.missingEntries.length;
  let manifestIncluded = false;

  if (entries.length === 0 && missingCount === 0) {
    throw new Error('Nenhum conteúdo teórico disponível para download neste contexto.');
  }

  if (missingCount > 0) {
    manifestIncluded = true;
  }

  const zip = new JSZip();
  entries.forEach((entry) => {
    zip.file(entry.path, entry.bytes);
  });

  if (manifestIncluded) {
    zip.file(MISSING_CONTENT_MANIFEST_FILENAME, buildMissingManifestText(plan.missingEntries));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const resolvedBundleFilename = bundleFilename(scope, topics, topicSubmattersByTopic);
  saveBlob(blob, resolvedBundleFilename);

  return {
    requestedCount: plan.requestedCount,
    downloadedCount: entries.length,
    missingCount,
    isPartial: missingCount > 0,
    manifestIncluded,
    bundleFilename: resolvedBundleFilename,
  };
};
