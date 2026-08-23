import { useState, useEffect, useCallback, useRef } from 'react';
import { DuoUserData } from '../types';
import { db } from '../../../../services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'p67_duo_aprendizado_progress';

const DEFAULT_USER_DATA: DuoUserData = {
  xp: 0,
  gems: 10,
  streak: 1,
  hearts: 5,
  maxHearts: 5,
  lastDate: null,
  completedNodes: [],
  mastery: {},
  unlockedChests: [],
  unlockedTheories: [],
};

function getLocalData(): DuoUserData {
  if (typeof window === 'undefined') return DEFAULT_USER_DATA;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_USER_DATA, ...JSON.parse(saved) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_USER_DATA;
}

function saveLocalData(data: DuoUserData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function useDuoProgress(userId?: string) {
  const [userData, setUserData] = useState<DuoUserData>(getLocalData);
  const [isLoaded, setIsLoaded] = useState(false);
  const isSyncingRef = useRef(false);

  // Firestore sync listener
  useEffect(() => {
    if (!userId || !db) {
      setIsLoaded(true);
      return;
    }

    try {
      const userRef = doc(db, 'users', userId, 'duoaprendizado', 'progress');
      const unsubscribe = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.data() as Partial<DuoUserData>;
            setUserData((prev) => {
              const merged: DuoUserData = {
                ...DEFAULT_USER_DATA,
                ...prev,
                ...remoteData,
                mastery: { ...(prev.mastery || {}), ...(remoteData.mastery || {}) },
              };
              saveLocalData(merged);
              return merged;
            });
          }
          setIsLoaded(true);
        },
        (err) => {
          console.warn('[DuoAprendizado] Erro ao sincronizar com Firestore, usando cache local:', err);
          setIsLoaded(true);
        }
      );

      return () => unsubscribe();
    } catch {
      setIsLoaded(true);
    }
  }, [userId]);

  // Persist helper
  const persist = useCallback(
    async (updater: (prev: DuoUserData) => DuoUserData) => {
      setUserData((prev) => {
        const next = updater(prev);
        saveLocalData(next);

        // Firestore async write
        if (userId && db && !isSyncingRef.current) {
          isSyncingRef.current = true;
          const userRef = doc(db, 'users', userId, 'duoaprendizado', 'progress');
          void setDoc(userRef, next, { merge: true }).finally(() => {
            isSyncingRef.current = false;
          });
        }
        return next;
      });
    },
    [userId]
  );

  // Streak verification
  const checkStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    persist((prev) => {
      if (!prev.lastDate) {
        return { ...prev, lastDate: today };
      }
      if (prev.lastDate !== today) {
        const last = new Date(prev.lastDate);
        const curr = new Date(today);
        const diffTime = Math.abs(curr.getTime() - last.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let newStreak = prev.streak;
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }

        return { ...prev, streak: newStreak, lastDate: today };
      }
      return prev;
    });
  }, [persist]);

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  // Actions
  const completeNode = useCallback(
    (nodeId: string, conceptId: string, xpGain: number = 20, gemsGain: number = 5) => {
      persist((prev) => {
        const completedNodes = prev.completedNodes.includes(nodeId)
          ? prev.completedNodes
          : [...prev.completedNodes, nodeId];

        const currentMastery = prev.mastery[conceptId] || 0;
        const newMastery = Math.min(100, currentMastery + 25);

        return {
          ...prev,
          completedNodes,
          xp: prev.xp + xpGain,
          gems: prev.gems + gemsGain,
          mastery: { ...prev.mastery, [conceptId]: newMastery },
        };
      });
    },
    [persist]
  );

  const recordAnswerResult = useCallback(
    (conceptId: string, isCorrect: boolean) => {
      persist((prev) => {
        if (isCorrect) {
          const current = prev.mastery[conceptId] || 0;
          return {
            ...prev,
            xp: prev.xp + 15,
            mastery: { ...prev.mastery, [conceptId]: Math.min(100, current + 20) },
          };
        } else {
          const current = prev.mastery[conceptId] || 0;
          return {
            ...prev,
            hearts: Math.max(0, prev.hearts - 1),
            mastery: { ...prev.mastery, [conceptId]: Math.max(0, current - 10) },
          };
        }
      });
    },
    [persist]
  );

  const recoverHearts = useCallback(
    (count: number = 2) => {
      persist((prev) => ({
        ...prev,
        hearts: Math.min(prev.maxHearts, prev.hearts + count),
      }));
    },
    [persist]
  );

  const refillAllHeartsWithGems = useCallback(() => {
    const COST = 10;
    let success = false;
    persist((prev) => {
      if (prev.gems >= COST && prev.hearts < prev.maxHearts) {
        success = true;
        return {
          ...prev,
          gems: prev.gems - COST,
          hearts: prev.maxHearts,
        };
      }
      return prev;
    });
    return success;
  }, [persist]);

  const unlockChest = useCallback(
    (unitId: number, xpReward: number = 50, gemsReward: number = 20) => {
      persist((prev) => {
        if (prev.unlockedChests.includes(unitId)) return prev;
        return {
          ...prev,
          unlockedChests: [...prev.unlockedChests, unitId],
          xp: prev.xp + xpReward,
          gems: prev.gems + gemsReward,
        };
      });
    },
    [persist]
  );

  const unlockTheory = useCallback(
    (theoryId: string) => {
      persist((prev) => {
        if (prev.unlockedTheories.includes(theoryId)) return prev;
        return {
          ...prev,
          unlockedTheories: [...prev.unlockedTheories, theoryId],
          xp: prev.xp + 5,
        };
      });
    },
    [persist]
  );

  const resetAllProgress = useCallback(() => {
    persist(() => DEFAULT_USER_DATA);
  }, [persist]);

  return {
    userData,
    isLoaded,
    completeNode,
    recordAnswerResult,
    recoverHearts,
    refillAllHeartsWithGems,
    unlockChest,
    unlockTheory,
    resetAllProgress,
  };
}
