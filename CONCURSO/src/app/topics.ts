import { SUBJECT_ORDER } from './constants';
import type { TopicNode, TopicPriority, TopicSeedSection, CoverageMatrixRow, SubjectKey } from './types';

const normalizeForId = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const inferPriority = (subject: SubjectKey, item: string): TopicPriority => {
  if (subject === 'legislacao') {
    return 'alta';
  }

  if (subject === 'portugues') {
    return item.includes('coer') || item.includes('regência') ? 'alta' : 'media';
  }

  if (item.includes('segurança') || item.includes('LGPD') || item.includes('arquitetura')) {
    return 'alta';
  }

  return 'media';
};

export const buildTopicsFromSeeds = (sections: TopicSeedSection[]): TopicNode[] => {
  const topics: TopicNode[] = [];

  for (const section of sections) {
    const sectionId = `sec-${section.id}`;
    topics.push({
      id: sectionId,
      subject: section.subject,
      title: section.title,
      sourceRef: section.sourceRef,
      parentId: null,
      isLeaf: false,
      priority: 'alta',
    });

    section.items.forEach((item, index) => {
      topics.push({
        id: `item-${section.id}-${index + 1}-${normalizeForId(item).slice(0, 40)}`,
        subject: section.subject,
        title: item,
        sourceRef: section.sourceRef,
        parentId: sectionId,
        isLeaf: true,
        priority: inferPriority(section.subject, item),
      });
    });
  }

  return topics;
};

export const buildCoverageMatrix = (
  topics: TopicNode[],
  expectedBySubject: Record<SubjectKey, number>,
): CoverageMatrixRow[] => {
  const leafTopics = topics.filter((topic) => topic.isLeaf);

  return SUBJECT_ORDER.map((subject) => {
    const registeredLines = leafTopics.filter((topic) => topic.subject === subject).length;
    const sourceLines = expectedBySubject[subject] ?? 0;
    const coveragePercent = sourceLines === 0 ? 0 : Math.round((registeredLines / sourceLines) * 100);

    return {
      subject,
      sourceLines,
      registeredLines,
      coveragePercent,
    };
  });
};

export const mapExpectedCoverage = (
  sections: TopicSeedSection[],
): Record<SubjectKey, number> => {
  const base: Record<SubjectKey, number> = {
    portugues: 0,
    rlm: 0,
    legislacao: 0,
    especificos: 0,
  };

  for (const section of sections) {
    base[section.subject] += section.items.length;
  }

  return base;
};

