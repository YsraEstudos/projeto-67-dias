import { describe, expect, it } from 'vitest';
import { mergeSnapshots, resolveSnapshotConflict } from '../app/snapshotMerge';
import { buildSnapshot } from '../app/storage';
import { createInitialState } from '../app/seed';
import type { AppSnapshot } from '../app/types';

describe('snapshotMerge 3-way merge', () => {
  const createBaseSnapshot = (): AppSnapshot => buildSnapshot(createInitialState());
  const cloneSnapshot = (snap: AppSnapshot, modifier?: (s: AppSnapshot) => void): AppSnapshot => {
    const copy: AppSnapshot = JSON.parse(JSON.stringify(snap));
    if (modifier) modifier(copy);
    return copy;
  };

  it('preserves independent map key additions from local and remote', () => {
    const base = createBaseSnapshot();
    const local = cloneSnapshot(base, (s) => {
      s.appState.dailyRecords['2026-07-01'] = {
        date: '2026-07-01',
        notes: 'Local note',
        checklist: [],
      };
    });
    const remote = cloneSnapshot(base, (s) => {
      s.appState.dailyRecords['2026-07-02'] = {
        date: '2026-07-02',
        notes: 'Remote note',
        checklist: [],
      };
    });

    const { merged, conflicts } = mergeSnapshots(base, local, remote);

    expect(conflicts).toHaveLength(0);
    expect(merged.appState.dailyRecords['2026-07-01']?.notes).toBe('Local note');
    expect(merged.appState.dailyRecords['2026-07-02']?.notes).toBe('Remote note');
  });

  it('preserves independent array entity additions', () => {
    const base = createBaseSnapshot();
    const local = cloneSnapshot(base, (s) => {
      s.appState.projects.push({
        id: 'proj-local',
        name: 'Local Project',
        status: 'em_andamento',
        technologyKeys: ['react' as any],
        tags: [],
        requirements: [],
        createdAt: '2026-07-01T10:00:00Z',
        updatedAt: '2026-07-01T10:00:00Z',
      });
    });
    const remote = cloneSnapshot(base, (s) => {
      s.appState.projects.push({
        id: 'proj-remote',
        name: 'Remote Project',
        status: 'nao_iniciado',
        technologyKeys: ['docker'],
        tags: [],
        requirements: [],
        createdAt: '2026-07-02T10:00:00Z',
        updatedAt: '2026-07-02T10:00:00Z',
      });
    });

    const { merged, conflicts } = mergeSnapshots(base, local, remote);

    expect(conflicts).toHaveLength(0);
    expect(merged.appState.projects.map((p) => p.id)).toContain('proj-local');
    expect(merged.appState.projects.map((p) => p.id)).toContain('proj-remote');
  });

  it('handles identical edits without producing conflicts', () => {
    const base = createBaseSnapshot();
    const local = cloneSnapshot(base, (s) => {
      s.appState.selectedDate = '2026-07-27';
    });
    const remote = cloneSnapshot(base, (s) => {
      s.appState.selectedDate = '2026-07-27';
    });

    const { merged, conflicts } = mergeSnapshots(base, local, remote);

    expect(conflicts).toHaveLength(0);
    expect(merged.appState.selectedDate).toBe('2026-07-27');
  });

  it('detects same-field divergence and creates a resolvable SnapshotConflict', () => {
    const base = cloneSnapshot(createBaseSnapshot(), (s) => {
      s.appState.dailyRecords['2026-07-10'] = {
        date: '2026-07-10',
        notes: 'Original note',
        checklist: [],
      };
    });
    const local = cloneSnapshot(base, (s) => {
      s.appState.dailyRecords['2026-07-10'] = {
        date: '2026-07-10',
        notes: 'Local edit note',
        checklist: [],
      };
    });
    const remote = cloneSnapshot(base, (s) => {
      s.appState.dailyRecords['2026-07-10'] = {
        date: '2026-07-10',
        notes: 'Remote edit note',
        checklist: [],
      };
    });

    const { merged, conflicts } = mergeSnapshots(base, local, remote);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].path).toBe('appState.dailyRecords.2026-07-10');

    // Resolving conflict with 'remote'
    const resolved = resolveSnapshotConflict(merged, conflicts[0].id, 'remote');
    expect(resolved.appState.conflicts).toHaveLength(0);
    expect(resolved.appState.dailyRecords['2026-07-10'].notes).toBe('Remote edit note');
  });
});
