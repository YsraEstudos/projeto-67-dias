import { describe, expect, it } from 'vitest';
import { formatIsoDateCompactPtBr } from '../app/formatters';

describe('formatIsoDateCompactPtBr', () => {
  it('mantem o dia local do ISO sem aplicar deslocamento de fuso', () => {
    expect(formatIsoDateCompactPtBr('2026-04-23')).toBe('23/04');
  });
});
