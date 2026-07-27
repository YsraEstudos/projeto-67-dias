import type { AppSnapshot, AppState, SnapshotConflict } from './types';

function isObject(val: unknown): val is Record<string, any> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => deepEqual(item, b[idx]));
  }
  return false;
}

export function mergeSnapshots(
  base: AppSnapshot | null,
  local: AppSnapshot,
  remote: AppSnapshot,
): { merged: AppSnapshot; conflicts: SnapshotConflict[] } {
  const conflicts: SnapshotConflict[] = [
    ...(local.appState.conflicts || []),
    ...(remote.appState.conflicts || []),
  ];

  const baseState = base?.appState;
  const localState = local.appState;
  const remoteState = remote.appState;

  const mergedState: AppState = { ...localState };

  // 1. Merge Map domains
  const mapDomains: (keyof AppState)[] = [
    'topicProgress',
    'topicSubmattersByTopic',
    'dailyRecords',
    'calendarEventProgress',
  ];

  for (const domain of mapDomains) {
    const baseMap = (baseState?.[domain] as Record<string, any>) || {};
    const localMap = (localState[domain] as Record<string, any>) || {};
    const remoteMap = (remoteState[domain] as Record<string, any>) || {};

    const allKeys = new Set([
      ...Object.keys(baseMap),
      ...Object.keys(localMap),
      ...Object.keys(remoteMap),
    ]);

    const mergedMap: Record<string, any> = {};

    for (const key of allKeys) {
      const bVal = baseMap[key];
      const lVal = localMap[key];
      const rVal = remoteMap[key];

      if (lVal !== undefined && rVal === undefined) {
        if (bVal !== undefined && deepEqual(lVal, bVal)) {
          // Deleted remotely, unchanged locally -> omit
        } else {
          mergedMap[key] = lVal;
        }
      } else if (lVal === undefined && rVal !== undefined) {
        if (bVal !== undefined && deepEqual(rVal, bVal)) {
          // Deleted locally, unchanged remotely -> omit
        } else {
          mergedMap[key] = rVal;
        }
      } else if (lVal !== undefined && rVal !== undefined) {
        if (deepEqual(lVal, rVal)) {
          mergedMap[key] = lVal;
        } else if (bVal !== undefined && deepEqual(lVal, bVal)) {
          mergedMap[key] = rVal;
        } else if (bVal !== undefined && deepEqual(rVal, bVal)) {
          mergedMap[key] = lVal;
        } else {
          // Divergence! Compare timestamps or deterministic fallback
          const lTime = lVal?.updatedAt ? Date.parse(lVal.updatedAt) : 0;
          const rTime = rVal?.updatedAt ? Date.parse(rVal.updatedAt) : 0;

          if (lTime > rTime) {
            mergedMap[key] = lVal;
          } else {
            mergedMap[key] = rVal;
          }

          conflicts.push({
            id: `conflict-${domain}-${key}`,
            path: `appState.${domain}.${key}`,
            baseValue: bVal,
            localValue: lVal,
            remoteValue: rVal,
            detectedAt: Date.now(),
          });
        }
      }
    }

    (mergedState as any)[domain] = mergedMap;
  }

  // 2. Merge Array domains
  const arrayDomains: (keyof AppState)[] = [
    'projects',
    'theoreticalContents',
    'correctionLinks',
    'manualBlockReschedules',
  ];

  for (const domain of arrayDomains) {
    const baseArr = (baseState?.[domain] as any[]) || [];
    const localArr = (localState[domain] as any[]) || [];
    const remoteArr = (remoteState[domain] as any[]) || [];

    const baseMap = new Map(baseArr.map((item) => [item.id, item]));
    const localMap = new Map(localArr.map((item) => [item.id, item]));
    const remoteMap = new Map(remoteArr.map((item) => [item.id, item]));

    const allIds = new Set([
      ...baseMap.keys(),
      ...localMap.keys(),
      ...remoteMap.keys(),
    ]);

    const mergedArray: any[] = [];

    for (const id of allIds) {
      const bItem = baseMap.get(id);
      const lItem = localMap.get(id);
      const rItem = remoteMap.get(id);

      if (lItem && !rItem) {
        if (!bItem || !deepEqual(lItem, bItem)) {
          mergedArray.push(lItem);
        }
      } else if (!lItem && rItem) {
        if (!bItem || !deepEqual(rItem, bItem)) {
          mergedArray.push(rItem);
        }
      } else if (lItem && rItem) {
        if (deepEqual(lItem, rItem)) {
          mergedArray.push(lItem);
        } else if (bItem && deepEqual(lItem, bItem)) {
          mergedArray.push(rItem);
        } else if (bItem && deepEqual(rItem, bItem)) {
          mergedArray.push(lItem);
        } else {
          const lTime = lItem.updatedAt ? Date.parse(lItem.updatedAt) : 0;
          const rTime = rItem.updatedAt ? Date.parse(rItem.updatedAt) : 0;

          if (lTime >= rTime) {
            mergedArray.push(lItem);
          } else {
            mergedArray.push(rItem);
          }

          conflicts.push({
            id: `conflict-${domain}-${id}`,
            path: `appState.${domain}.${id}`,
            baseValue: bItem,
            localValue: lItem,
            remoteValue: rItem,
            detectedAt: Date.now(),
          });
        }
      }
    }

    (mergedState as any)[domain] = mergedArray;
  }

  // 3. Scalar/Config domains
  const configDomains: (keyof AppState)[] = ['planSettings', 'ankiConfig', 'ankiStats', 'shellUi'];

  for (const domain of configDomains) {
    const bVal = baseState?.[domain];
    const lVal = localState[domain];
    const rVal = remoteState[domain];

    if (deepEqual(lVal, rVal)) {
      (mergedState as any)[domain] = lVal;
    } else if (bVal !== undefined && deepEqual(lVal, bVal)) {
      (mergedState as any)[domain] = rVal;
    } else if (bVal !== undefined && deepEqual(rVal, bVal)) {
      (mergedState as any)[domain] = lVal;
    } else {
      (mergedState as any)[domain] = lVal;
      conflicts.push({
        id: `conflict-${domain}`,
        path: `appState.${domain}`,
        baseValue: bVal,
        localValue: lVal,
        remoteValue: rVal,
        detectedAt: Date.now(),
      });
    }
  }

  // Deduplicate conflict records by path
  const uniqueConflictsMap = new Map<string, SnapshotConflict>();
  conflicts.forEach((c) => uniqueConflictsMap.set(c.path, c));
  const finalConflicts = Array.from(uniqueConflictsMap.values());

  mergedState.conflicts = finalConflicts;

  const exportedAt = new Date().toISOString();
  mergedState.meta = {
    ...mergedState.meta,
    changeToken: (mergedState.meta?.changeToken || 0) + 1,
    lastChangedAt: exportedAt,
  };

  const mergedSnapshot: AppSnapshot = {
    schemaVersion: Math.max(local.schemaVersion, remote.schemaVersion),
    exportedAt,
    appState: mergedState,
  };

  return { merged: mergedSnapshot, conflicts: finalConflicts };
}

export function resolveSnapshotConflict(
  snapshot: AppSnapshot,
  conflictId: string,
  resolution: 'local' | 'remote',
): AppSnapshot {
  const conflicts = snapshot.appState.conflicts || [];
  const targetConflict = conflicts.find((c) => c.id === conflictId);

  if (!targetConflict) return snapshot;

  const chosenValue = resolution === 'local' ? targetConflict.localValue : targetConflict.remoteValue;

  const pathParts = targetConflict.path.split('.');
  const nextAppState = { ...snapshot.appState };

  if (pathParts.length === 3) {
    const domain = pathParts[1] as keyof AppState;
    const key = pathParts[2];
    const currentDomainObj = (nextAppState[domain] as Record<string, any>) || {};
    (nextAppState as Record<string, any>)[domain] = {
      ...currentDomainObj,
      [key]: chosenValue,
    };
  } else if (pathParts.length === 2) {
    const domain = pathParts[1] as keyof AppState;
    (nextAppState as Record<string, any>)[domain] = chosenValue;
  }

  nextAppState.conflicts = conflicts.filter((c) => c.id !== conflictId);

  return {
    ...snapshot,
    exportedAt: new Date().toISOString(),
    appState: nextAppState,
  };
}
