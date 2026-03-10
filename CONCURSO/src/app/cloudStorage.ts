import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, type FirebaseUser } from '../../../services/firebase';
import type { AppSnapshot } from './types';

const CONCURSO_PLAN_COLLECTION = 'concursoPlans';

type CloudSnapshotRecord = {
  snapshot: AppSnapshot;
  userEmail: string | null;
  userName: string | null;
  updatedAt?: unknown;
  lastChangedAt: string | null;
};

export type CloudSnapshotResult = {
  snapshot: AppSnapshot | null;
  lastChangedAt: string | null;
};

const getDocRef = (uid: string) => doc(db, CONCURSO_PLAN_COLLECTION, uid);

export const loadCloudSnapshot = async (uid: string): Promise<CloudSnapshotResult> => {
  const record = await getDoc(getDocRef(uid));
  if (!record.exists()) {
    return { snapshot: null, lastChangedAt: null };
  }

  const data = record.data() as Partial<CloudSnapshotRecord>;
  return {
    snapshot: data.snapshot ?? null,
    lastChangedAt:
      data.lastChangedAt ??
      data.snapshot?.appState.meta.lastChangedAt ??
      data.snapshot?.exportedAt ??
      null,
  };
};

export const saveCloudSnapshot = async (user: FirebaseUser, snapshot: AppSnapshot): Promise<void> => {
  await setDoc(
    getDocRef(user.uid),
    {
      snapshot,
      schemaVersion: snapshot.schemaVersion,
      exportedAt: snapshot.exportedAt,
      updatedAt: serverTimestamp(),
      lastChangedAt: snapshot.appState.meta.lastChangedAt ?? snapshot.exportedAt,
      userEmail: user.email ?? null,
      userName: user.displayName ?? null,
    },
    { merge: true },
  );
};
