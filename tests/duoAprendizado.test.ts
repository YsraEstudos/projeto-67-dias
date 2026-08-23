import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DUO_UNITS } from '../components/views/DuoAprendizado/data/unitsData';
import { DUO_QUESTION_BANK } from '../components/views/DuoAprendizado/data/questionBank';
import { DUO_THEORY_DATABASE } from '../components/views/DuoAprendizado/data/theoryDatabase';
import { renderHook, act } from '@testing-library/react';
import { useDuoProgress } from '../components/views/DuoAprendizado/hooks/useDuoProgress';

// Mock Firebase db
vi.mock('../services/firebase', () => ({
  db: null,
  auth: { currentUser: null },
}));

describe('DuoAprendizado Module Data & Logic', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Units & Curriculum Structure', () => {
    it('contains 11 comprehensive progressive units (including Exploring JavaScript)', () => {
      expect(DUO_UNITS).toHaveLength(11);
      DUO_UNITS.forEach((unit, idx) => {
        expect(unit.id).toBe(idx + 1);
        expect(unit.title).toBeTruthy();
        expect(unit.desc).toBeTruthy();
        expect(unit.nodes.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('ensures each node has unique id and conceptId', () => {
      const nodeIds = new Set<string>();
      DUO_UNITS.forEach((unit) => {
        unit.nodes.forEach((node) => {
          expect(nodeIds.has(node.id)).toBe(false);
          nodeIds.add(node.id);
          expect(node.unitId).toBe(unit.id);
          expect(node.conceptId).toBeTruthy();
        });
      });
    });
  });

  describe('Question Bank', () => {
    it('contains valid questions covering concepts with explanation and answers', () => {
      expect(DUO_QUESTION_BANK.length).toBeGreaterThan(40);

      DUO_QUESTION_BANK.forEach((q) => {
        expect(q.id).toBeTruthy();
        expect(q.title).toBeTruthy();
        expect(q.explanation).toBeTruthy();
        expect(['choice', 'output', 'fill', 'blocks', 'code_fix', 'boolean']).toContain(q.type);

        if (q.type === 'choice' || q.type === 'output') {
          expect(q.options).toBeDefined();
          expect(q.options?.length).toBeGreaterThan(1);
          expect(typeof q.correctIndex).toBe('number');
        } else if (q.type === 'fill') {
          expect(q.correctAnswer).toBeDefined();
        } else if (q.type === 'blocks') {
          expect(q.promptBlocks).toBeDefined();
          expect(q.correctOrder).toBeDefined();
        }
      });
    });

    it('covers all Exploring JavaScript Chapter 1 concepts in question bank', () => {
      const concepts = DUO_QUESTION_BANK.map((q) => q.conceptId);
      expect(concepts).toContain('exploring_devtools_repl');
      expect(concepts).toContain('exploring_objects_optional_chaining');
      expect(concepts).toContain('exploring_operators_expressions');
      expect(concepts).toContain('exploring_functions_arrow');
      expect(concepts).toContain('exploring_methods_classes');
    });
  });

  describe('Theory Wiki Database (including var research & David Flanagan Guide)', () => {
    it('contains thorough explanation of var, let and const with comparison table', () => {
      const varTheory = DUO_THEORY_DATABASE.find((t) => t.conceptId === 'variables_var_let_const');
      expect(varTheory).toBeDefined();
      expect(varTheory?.title).toContain('var');
      expect(varTheory?.whatIsIt).toContain('var');
      expect(varTheory?.comparison).toBeDefined();
      expect(varTheory?.comparison?.headers).toContain('var');
      expect(varTheory?.comparison?.headers).toContain('let');
      expect(varTheory?.comparison?.headers).toContain('const');
      expect(varTheory?.codeExamples.length).toBeGreaterThan(0);
      expect(varTheory?.pitfalls.length).toBeGreaterThan(0);
    });

    it('covers exploring devtools, closures, promises, event loop and array methods', () => {
      const concepts = DUO_THEORY_DATABASE.map((t) => t.conceptId);
      expect(concepts).toContain('exploring_devtools_repl');
      expect(concepts).toContain('exploring_objects_optional_chaining');
      expect(concepts).toContain('closures');
      expect(concepts).toContain('promises_basics');
      expect(concepts).toContain('event_loop_microtasks');
      expect(concepts).toContain('array_map');
      expect(concepts).toContain('debounce_throttle');
    });
  });

  describe('useDuoProgress Hook', () => {
    it('initializes with default gamification values', () => {
      const { result } = renderHook(() => useDuoProgress());
      expect(result.current.userData.xp).toBe(0);
      expect(result.current.userData.hearts).toBe(5);
      expect(result.current.userData.maxHearts).toBe(5);
      expect(result.current.userData.gems).toBe(10);
      expect(result.current.userData.completedNodes).toEqual([]);
    });

    it('completes a node and updates XP, gems, and mastery', () => {
      const { result } = renderHook(() => useDuoProgress());

      act(() => {
        result.current.completeNode('u1_n1', 'variables_var_let_const', 25, 5);
      });

      expect(result.current.userData.completedNodes).toContain('u1_n1');
      expect(result.current.userData.xp).toBe(25);
      expect(result.current.userData.gems).toBe(15);
      expect(result.current.userData.mastery['variables_var_let_const']).toBe(25);
    });

    it('handles incorrect answers by deducting a heart and decreasing mastery', () => {
      const { result } = renderHook(() => useDuoProgress());

      act(() => {
        result.current.recordAnswerResult('variables_var_let_const', false);
      });

      expect(result.current.userData.hearts).toBe(4);
    });

    it('recovers hearts through practice', () => {
      const { result } = renderHook(() => useDuoProgress());

      act(() => {
        result.current.recordAnswerResult('variables_var_let_const', false);
        result.current.recordAnswerResult('variables_var_let_const', false);
      });
      expect(result.current.userData.hearts).toBe(3);

      act(() => {
        result.current.recoverHearts(2);
      });
      expect(result.current.userData.hearts).toBe(5);
    });

    it('unlocks unit chests and awards bonus gems and XP', () => {
      const { result } = renderHook(() => useDuoProgress());

      act(() => {
        result.current.unlockChest(1, 50, 20);
      });

      expect(result.current.userData.unlockedChests).toContain(1);
      expect(result.current.userData.xp).toBe(50);
      expect(result.current.userData.gems).toBe(30);
    });
  });
});
