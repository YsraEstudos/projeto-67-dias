import JSZip from 'jszip';
import { loadTheoreticalContentBinary } from './contentTheoreticalFileStore';
import {
  collectTheoreticalContentsForTopic,
  listAllTheoreticalContents,
  listTheoreticalContentsForOwner,
} from './contentTheoreticalFiles';
import { getTopicDisplayTitle } from './topics';
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
  return buildDownloadFilename(scope, topics, topicSubmattersByTopic, 'zip');
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

const markdownDecoder = new TextDecoder('utf-8');

const normalizeMarkdownText = (markdown: string): string => markdown.replace(/\r\n?/g, '\n').trim();

const getInlineMarkdownText = (
  item: AppState['theoreticalContents'][number],
): string | null => {
  if (item.kind !== 'markdown' || typeof item.inlineContent !== 'string') {
    return null;
  }

  const normalized = normalizeMarkdownText(item.inlineContent);
  if (!normalized) {
    return null;
  }

  return normalized;
};

const buildDownloadFilename = (
  scope: DownloadScope,
  topics: TopicNode[],
  topicSubmattersByTopic: AppState['topicSubmattersByTopic'],
  extension: 'zip' | 'md',
): string => {
  const stamp = todayStamp();
  if (scope.kind === 'global') {
    return `conteudo-pragmatico-${stamp}.${extension}`;
  }

  const topic = ensureTopic(topics, scope.topicId);
  const topicSlug = slugify(topic.title || topic.id);

  if (scope.kind === 'topic') {
    return `${topicSlug}-${stamp}.${extension}`;
  }

  const submatter = findSubmatter(topicSubmattersByTopic, scope.topicId, scope.submatterId);
  return `${topicSlug}-${slugify(submatter.title || submatter.id)}-${stamp}.${extension}`;
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

const markdownFence = (content: string): string => {
  const runs = content.match(/`+/g);
  const longestRun = runs ? Math.max(...runs.map((run) => run.length)) : 0;
  return '`'.repeat(Math.max(3, longestRun + 1));
};

const resolveMarkdownItemText = async (
  item: AppState['theoreticalContents'][number],
  loadBinary: (storageKey: string) => Promise<TheoreticalBinaryRecord | null>,
): Promise<{ kind: 'markdown' | 'pdf'; text: string; isFallback: boolean }> => {
  if (item.kind === 'markdown') {
    const inlineText = getInlineMarkdownText(item);
    if (inlineText) {
      return { kind: 'markdown', text: inlineText, isFallback: false };
    }

    try {
      const binary = await loadBinary(item.storageKey);
      if (binary) {
        const decoded = normalizeMarkdownText(markdownDecoder.decode(binary.bytes));
        if (decoded) {
          return { kind: 'markdown', text: decoded, isFallback: false };
        }
      }
    } catch {
      // Se o binario local falhar, ainda assim geramos o consolidado.
    }

    return {
      kind: 'markdown',
      text: `Conteúdo markdown indisponível localmente para ${item.filename}.`,
      isFallback: true,
    };
  }

  return {
    kind: 'pdf',
    text: `Arquivo PDF original preservado no app: ${item.filename}.`,
    isFallback: false,
  };
};

const renderMarkdownItemSection = async (
  item: AppState['theoreticalContents'][number],
  loadBinary: (storageKey: string) => Promise<TheoreticalBinaryRecord | null>,
): Promise<string[]> => {
  const resolved = await resolveMarkdownItemText(item, loadBinary);
  const lines = [`#### ${padOrder(item.order)}. ${item.label}`, `- Tipo: ${item.kind === 'markdown' ? 'Markdown' : 'PDF'}`];

  if (resolved.kind === 'markdown' && !resolved.isFallback) {
    const fence = markdownFence(resolved.text);
    lines.push('');
    lines.push(`${fence}markdown`);
    lines.push(resolved.text);
    lines.push(fence);
  } else {
    lines.push(`- ${resolved.text}`);
  }

  lines.push('');
  return lines;
};

const renderMarkdownItemSections = async (
  items: AppState['theoreticalContents'],
  loadBinary: (storageKey: string) => Promise<TheoreticalBinaryRecord | null>,
): Promise<string[]> => {
  const sections = await Promise.all(items.map((item) => renderMarkdownItemSection(item, loadBinary)));
  return sections.flat();
};

interface BuildTheoreticalContentMarkdownDocumentResult {
  markdown: string;
  requestedCount: number;
  topicCount: number;
}

const buildTheoreticalContentMarkdownDocument = async ({
  scope,
  items,
  topics,
  topicSubmattersByTopic,
  loadBinary = loadTheoreticalContentBinary,
}: BuildTheoreticalContentDownloadEntriesInput): Promise<BuildTheoreticalContentMarkdownDocumentResult> => {
  const selectedItems = itemsForScope(scope, items);
  const selectedTopicIds = new Set(selectedItems.map((item) => item.topicId));
  const orderedTopics = topics.filter((topic) => topic.isLeaf && selectedTopicIds.has(topic.id));

  if (selectedItems.length === 0 || orderedTopics.length === 0) {
    throw new Error('Nenhum conteúdo teórico disponível para download neste contexto.');
  }

  const lines: string[] = [
    '# Conteúdo Teórico Consolidado',
    '',
    `Gerado em: ${new Date().toISOString()}`,
    `Matérias incluídas: ${orderedTopics.length}`,
    `Itens incluídos: ${selectedItems.length}`,
    '',
  ];

  for (const topic of orderedTopics) {
    const topicItems = collectTheoreticalContentsForTopic(selectedItems, topic.id);
    if (topicItems.length === 0) {
      continue;
    }

    lines.push(`## ${getTopicDisplayTitle(topic)}`);
    lines.push(`- Referência: ${topic.sourceRef}`);
    lines.push('');

    const topicLevelItems = listTheoreticalContentsForOwner(selectedItems, 'topic', topic.id);
    if (topicLevelItems.length > 0) {
      lines.push('### Conteúdo da matéria');
      lines.push('');
      lines.push(...(await renderMarkdownItemSections(topicLevelItems, loadBinary)));
    }

    const renderedSubmatterIds = new Set<string>();
    const submatters = topicSubmattersByTopic[topic.id] ?? [];
    for (const submatter of submatters) {
      const submatterItems = listTheoreticalContentsForOwner(selectedItems, 'submatter', submatter.id);
      if (submatterItems.length === 0) {
        continue;
      }

      renderedSubmatterIds.add(submatter.id);
      lines.push(`### ${submatter.title}`);
      lines.push('');
      lines.push(...(await renderMarkdownItemSections(submatterItems, loadBinary)));
    }

    const orphanSubmatterIds = [...new Set(
      topicItems
        .filter((item) => item.ownerType === 'submatter' && !renderedSubmatterIds.has(item.ownerId))
        .map((item) => item.ownerId),
    )];

    for (const submatterId of orphanSubmatterIds) {
      const submatterItems = listTheoreticalContentsForOwner(selectedItems, 'submatter', submatterId);
      if (submatterItems.length === 0) {
        continue;
      }

      lines.push(`### Submatéria ${submatterId}`);
      lines.push('');
      lines.push(...(await renderMarkdownItemSections(submatterItems, loadBinary)));
    }
  }

  return {
    markdown: `${lines.join('\n').trimEnd()}\n`,
    requestedCount: selectedItems.length,
    topicCount: orderedTopics.length,
  };
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

export interface TheoreticalContentMarkdownDownloadSummary {
  requestedCount: number;
  topicCount: number;
  bundleFilename: string;
}

export const downloadTheoreticalContentsMarkdown = async ({
  scope,
  items,
  topics,
  topicSubmattersByTopic,
  loadBinary = loadTheoreticalContentBinary,
  saveBlob = triggerBlobDownload,
}: DownloadTheoreticalContentsBundleInput): Promise<TheoreticalContentMarkdownDownloadSummary> => {
  const plan = await buildTheoreticalContentMarkdownDocument({
    scope,
    items,
    topics,
    topicSubmattersByTopic,
    loadBinary,
  });

  const resolvedBundleFilename = buildDownloadFilename(scope, topics, topicSubmattersByTopic, 'md');
  saveBlob(new Blob([plan.markdown], { type: 'text/markdown;charset=utf-8' }), resolvedBundleFilename);

  return {
    requestedCount: plan.requestedCount,
    topicCount: plan.topicCount,
    bundleFilename: resolvedBundleFilename,
  };
};
