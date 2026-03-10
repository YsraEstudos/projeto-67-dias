import type { AppSnapshot } from './types';

const CONCURSO_PLAN_COLLECTION = 'concursoPlans';

type FirestoreModule = typeof import('firebase/firestore');
type FirebaseServicesModule = typeof import('../../../services/firebase');

type FirebaseBridge = {
  db: FirebaseServicesModule['db'];
  loginWithGoogle: FirebaseServicesModule['loginWithGoogle'];
  subscribeToAuthChanges: FirebaseServicesModule['subscribeToAuthChanges'];
  doc: FirestoreModule['doc'];
  getDoc: FirestoreModule['getDoc'];
  serverTimestamp: FirestoreModule['serverTimestamp'];
  setDoc: FirestoreModule['setDoc'];
};

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

export type CloudUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
};

let firebaseBridgePromise: Promise<FirebaseBridge | null> | null = null;
let firebaseBridgeError: string | null = null;

const getCloudErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const mapCloudUser = (user: Awaited<ReturnType<FirebaseServicesModule['loginWithGoogle']>>['user']): CloudUser => ({
  uid: user.uid,
  email: user.email ?? null,
  displayName: user.displayName ?? null,
  isAnonymous: user.isAnonymous,
});

const loadFirebaseBridge = async (): Promise<FirebaseBridge | null> => {
  if (!firebaseBridgePromise) {
    firebaseBridgePromise = Promise.all([
      import('firebase/firestore'),
      import('../../../services/firebase'),
    ])
      .then(([firestore, firebaseServices]) => ({
        db: firebaseServices.db,
        loginWithGoogle: firebaseServices.loginWithGoogle,
        subscribeToAuthChanges: firebaseServices.subscribeToAuthChanges,
        doc: firestore.doc,
        getDoc: firestore.getDoc,
        serverTimestamp: firestore.serverTimestamp,
        setDoc: firestore.setDoc,
      }))
      .catch((error) => {
        firebaseBridgeError = getCloudErrorMessage(
          error,
          'Sincronizacao com Google indisponivel neste ambiente.',
        );
        console.warn('[Plano TRT] Sincronizacao em nuvem desativada:', error);
        return null;
      });
  }

  return firebaseBridgePromise;
};

const requireFirebaseBridge = async (): Promise<FirebaseBridge> => {
  const bridge = await loadFirebaseBridge();
  if (!bridge) {
    throw new Error(firebaseBridgeError ?? 'Sincronizacao com Google indisponivel neste ambiente.');
  }

  return bridge;
};

export const subscribeCloudAuthChanges = async (
  callback: (user: CloudUser | null) => void,
): Promise<() => void> => {
  const bridge = await loadFirebaseBridge();
  if (!bridge) {
    callback(null);
    return () => undefined;
  }

  return bridge.subscribeToAuthChanges((user) => {
    callback(user ? mapCloudUser(user) : null);
  });
};

export const loginWithGoogleCloud = async (): Promise<CloudUser> => {
  const bridge = await requireFirebaseBridge();
  const result = await bridge.loginWithGoogle();
  return mapCloudUser(result.user);
};

export const loadCloudSnapshot = async (uid: string): Promise<CloudSnapshotResult> => {
  const bridge = await requireFirebaseBridge();
  const record = await bridge.getDoc(bridge.doc(bridge.db, CONCURSO_PLAN_COLLECTION, uid));
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

export const saveCloudSnapshot = async (user: CloudUser, snapshot: AppSnapshot): Promise<void> => {
  const bridge = await requireFirebaseBridge();
  await bridge.setDoc(
    bridge.doc(bridge.db, CONCURSO_PLAN_COLLECTION, user.uid),
    {
      snapshot,
      schemaVersion: snapshot.schemaVersion,
      exportedAt: snapshot.exportedAt,
      updatedAt: bridge.serverTimestamp(),
      lastChangedAt: snapshot.appState.meta.lastChangedAt ?? snapshot.exportedAt,
      userEmail: user.email ?? null,
      userName: user.displayName ?? null,
    },
    { merge: true },
  );
};
