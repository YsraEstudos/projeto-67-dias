import { subjectLabel } from './formatters';
import type { ManualBlock, SubjectKey } from './types';

const SUBJECT_PATTERNS: Array<{ subject: SubjectKey; patterns: RegExp[] }> = [
  { subject: 'portugues', patterns: [/^PT\b/i, /portugu[eê]s/i, /reda[cç][aã]o/i] },
  { subject: 'rlm', patterns: [/^RLM\b/i, /racioc[ií]nio/i, /matem[aá]tica/i] },
  { subject: 'legislacao', patterns: [/^Legis\b/i, /lei\s/i, /regimento/i, /legisla/i] },
  { subject: 'especificos', patterns: [/^TI\b/i, /java/i, /web/i, /banco/i, /redes/i, /seguran[cç]a/i] },
];

export const inferManualBlockSubject = (block: ManualBlock): SubjectKey | null => {
  const haystack = `${block.area} ${block.title} ${block.detail}`;
  const match = SUBJECT_PATTERNS.find(({ patterns }) => patterns.some((pattern) => pattern.test(haystack)));
  return match?.subject ?? null;
};

export const getManualBlockSubjectLabel = (block: ManualBlock): string => {
  const subject = inferManualBlockSubject(block);
  return subject ? subjectLabel(subject) : block.area;
};
