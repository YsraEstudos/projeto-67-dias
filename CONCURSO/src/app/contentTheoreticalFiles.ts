import type {
  TheoreticalContentItem,
  TheoreticalContentKind,
  TheoreticalContentOwnerType,
} from './types';

interface MoveTheoreticalContentInput {
  ownerType: TheoreticalContentOwnerType;
  ownerId: string;
  itemId: string;
  direction: 'up' | 'down';
}

interface ReorderTheoreticalContentInput {
  ownerType: TheoreticalContentOwnerType;
  ownerId: string;
  itemId: string;
  targetItemId: string;
}

interface CreatePastedMarkdownFileInput {
  markdown: string;
  fallbackLabel: string;
}

interface ToggleTheoreticalContentCompletedInput {
  itemId: string;
  completedAt: string | null;
}

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const normalizeMarkdownText = (markdown: string): string => markdown.replace(/\r\n?/g, '\n').trim();

const extractPastedMarkdownLabel = (markdown: string, fallbackLabel: string): string => {
  const normalized = normalizeMarkdownText(markdown);
  const headingLine = normalized
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^#{1,6}\s+/.test(line));

  if (headingLine) {
    return headingLine.replace(/^#{1,6}\s+/, '').trim();
  }

  const firstLine = normalized
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (firstLine) {
    return firstLine;
  }

  return fallbackLabel.trim() || 'Aula colada';
};

const reorderOwnerItems = (
  ownerItems: TheoreticalContentItem[],
  itemId: string,
  targetIndex: number,
): TheoreticalContentItem[] => {
  const currentIndex = ownerItems.findIndex((item) => item.id === itemId);
  if (currentIndex === -1) {
    return ownerItems;
  }

  if (targetIndex < 0 || targetIndex >= ownerItems.length || targetIndex === currentIndex) {
    return ownerItems;
  }

  const reordered = [...ownerItems];
  const [currentItem] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, currentItem);
  return reordered;
};

const applyReorderedOwnerItems = (
  items: TheoreticalContentItem[],
  ownerType: TheoreticalContentOwnerType,
  ownerId: string,
  reordered: TheoreticalContentItem[],
): TheoreticalContentItem[] => {
  const orderById = reordered.reduce<Record<string, number>>((accumulator, item, index) => {
    accumulator[item.id] = index + 1;
    return accumulator;
  }, {});

  return items.map((item) => {
    if (item.ownerType !== ownerType || item.ownerId !== ownerId) {
      return item;
    }

    return {
      ...item,
      order: orderById[item.id] ?? item.order,
    };
  });
};

const compareTheoreticalContent = (
  left: TheoreticalContentItem,
  right: TheoreticalContentItem,
): number => {
  if (left.order !== right.order) {
    return left.order - right.order;
  }

  if (left.createdAt !== right.createdAt) {
    return left.createdAt.localeCompare(right.createdAt);
  }

  return left.label.localeCompare(right.label, 'pt-BR');
};

export const inferTheoreticalContentKind = (
  filename: string,
  mimeType: string,
): TheoreticalContentKind | null => {
  const normalizedName = filename.trim().toLowerCase();
  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (normalizedName.endsWith('.md') || normalizedMimeType === 'text/markdown') {
    return 'markdown';
  }

  if (normalizedName.endsWith('.pdf') || normalizedMimeType === 'application/pdf') {
    return 'pdf';
  }

  return null;
};

export const normalizeTheoreticalContentItem = (
  item: TheoreticalContentItem,
): TheoreticalContentItem => ({
  ...item,
  label: item.label ?? item.filename,
  mimeType: item.mimeType ?? '',
  inlineContent:
    item.kind === 'markdown' && typeof item.inlineContent === 'string'
      ? normalizeMarkdownText(item.inlineContent)
      : null,
  sizeBytes: Number.isFinite(item.sizeBytes) ? Math.max(0, item.sizeBytes) : 0,
  order: Number.isFinite(item.order) ? Math.max(1, Math.round(item.order)) : 1,
  completedAt: typeof item.completedAt === 'string' && item.completedAt.trim().length > 0 ? item.completedAt : null,
  submatterId: item.ownerType === 'submatter' ? item.submatterId ?? item.ownerId : null,
});

export const createPastedMarkdownFile = ({
  markdown,
  fallbackLabel,
}: CreatePastedMarkdownFileInput): File => {
  const normalized = normalizeMarkdownText(markdown);
  if (!normalized) {
    throw new Error('Cole algum markdown antes de salvar a aula.');
  }

  const label = extractPastedMarkdownLabel(normalized, fallbackLabel);
  const filename = `${slugify(label) || 'aula-colada'}.md`;
  const file = new File([normalized], filename, { type: 'text/markdown' });

  if (typeof file.text !== 'function') {
    Object.defineProperty(file, 'text', {
      configurable: true,
      enumerable: false,
      value: async () => normalized,
      writable: false,
    });
  }

  return file;
};

export const getPastedMarkdownLabel = (markdown: string, fallbackLabel: string): string =>
  extractPastedMarkdownLabel(markdown, fallbackLabel);

export const listTheoreticalContentsForOwner = (
  items: TheoreticalContentItem[],
  ownerType: TheoreticalContentOwnerType,
  ownerId: string,
): TheoreticalContentItem[] => {
  return items
    .filter((item) => item.ownerType === ownerType && item.ownerId === ownerId)
    .sort(compareTheoreticalContent);
};

export const collectTheoreticalContentsForTopic = (
  items: TheoreticalContentItem[],
  topicId: string,
): TheoreticalContentItem[] => {
  return items.filter((item) => item.topicId === topicId).sort(compareTheoreticalContent);
};

export const listAllTheoreticalContents = (
  items: TheoreticalContentItem[],
): TheoreticalContentItem[] => {
  return [...items].sort((left, right) => {
    if (left.topicId !== right.topicId) {
      return left.topicId.localeCompare(right.topicId);
    }

    if (left.ownerType !== right.ownerType) {
      return left.ownerType.localeCompare(right.ownerType);
    }

    if (left.ownerId !== right.ownerId) {
      return left.ownerId.localeCompare(right.ownerId);
    }

    return compareTheoreticalContent(left, right);
  });
};

export const getNextTheoreticalContentOrder = (
  items: TheoreticalContentItem[],
  ownerType: TheoreticalContentOwnerType,
  ownerId: string,
): number => {
  const ownerItems = listTheoreticalContentsForOwner(items, ownerType, ownerId);
  if (ownerItems.length === 0) {
    return 1;
  }

  return ownerItems[ownerItems.length - 1].order + 1;
};

export const moveTheoreticalContent = (
  items: TheoreticalContentItem[],
  input: MoveTheoreticalContentInput,
): TheoreticalContentItem[] => {
  const ownerItems = listTheoreticalContentsForOwner(items, input.ownerType, input.ownerId);
  const currentIndex = ownerItems.findIndex((item) => item.id === input.itemId);
  if (currentIndex === -1) {
    return items;
  }

  const targetIndex = input.direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= ownerItems.length) {
    return items;
  }

  const reordered = reorderOwnerItems(ownerItems, input.itemId, targetIndex);
  return applyReorderedOwnerItems(items, input.ownerType, input.ownerId, reordered);
};

export const reorderTheoreticalContent = (
  items: TheoreticalContentItem[],
  input: ReorderTheoreticalContentInput,
): TheoreticalContentItem[] => {
  if (input.itemId === input.targetItemId) {
    return items;
  }

  const ownerItems = listTheoreticalContentsForOwner(items, input.ownerType, input.ownerId);
  const targetIndex = ownerItems.findIndex((item) => item.id === input.targetItemId);
  if (targetIndex === -1) {
    return items;
  }

  const reordered = reorderOwnerItems(ownerItems, input.itemId, targetIndex);
  return applyReorderedOwnerItems(items, input.ownerType, input.ownerId, reordered);
};

export const toggleTheoreticalContentCompleted = (
  items: TheoreticalContentItem[],
  input: ToggleTheoreticalContentCompletedInput,
): TheoreticalContentItem[] =>
  items.map((item) =>
    item.id === input.itemId
      ? {
          ...item,
          completedAt: input.completedAt,
        }
      : item,
  );

export const buildTheoreticalContentProgress = (
  items: TheoreticalContentItem[],
  topicId: string,
): {
  reviewedCount: number;
  pendingCount: number;
  totalCount: number;
} => {
  const selectedItems = collectTheoreticalContentsForTopic(items, topicId);
  const reviewedCount = selectedItems.filter((item) => item.completedAt !== null).length;

  return {
    reviewedCount,
    pendingCount: selectedItems.length - reviewedCount,
    totalCount: selectedItems.length,
  };
};
