// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously,
    onAuthStateChanged
} from "firebase/auth";
import type { User as FirebaseSdkUser } from "firebase/auth";
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "firebase/firestore";

export interface FirebaseUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    isAnonymous: boolean;
}

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const REQUIRED_ENV_MAP: Array<{ configKey: keyof typeof firebaseConfig; envKey: string }> = [
    { configKey: 'apiKey', envKey: 'VITE_FIREBASE_API_KEY' },
    { configKey: 'authDomain', envKey: 'VITE_FIREBASE_AUTH_DOMAIN' },
    { configKey: 'projectId', envKey: 'VITE_FIREBASE_PROJECT_ID' },
    { configKey: 'storageBucket', envKey: 'VITE_FIREBASE_STORAGE_BUCKET' },
    { configKey: 'messagingSenderId', envKey: 'VITE_FIREBASE_MESSAGING_SENDER_ID' },
    { configKey: 'appId', envKey: 'VITE_FIREBASE_APP_ID' }
];

const missingConfigKeys = REQUIRED_ENV_MAP
    .filter(({ configKey }) => !firebaseConfig[configKey])
    .map(({ envKey }) => envKey);

if (missingConfigKeys.length) {
    const message = [
        '[Firebase] Configuração incompleta.',
        `Defina as variáveis: ${missingConfigKeys.join(', ')}`,
        'no seu arquivo .env.local (com prefixo VITE_) ou nas variáveis de ambiente do build.'
    ].join(' ');
    console.error(message);
    throw new Error(message);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);

// FIRESTORE: Configuração de cache persistente (substitui enableMultiTabIndexedDbPersistence deprecado)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

// Google Provider
const googleProvider = new GoogleAuthProvider();
const LOCAL_AUTH_STORAGE_KEY = 'p67_local_auth_user';
const LOCAL_AUTH_EVENT = 'p67-local-auth-changed';
const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

const isBrowser = typeof window !== 'undefined';

const normalizeAuthUser = (user: FirebaseSdkUser | FirebaseUser): FirebaseUser => ({
    uid: user.uid,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
    isAnonymous: Boolean(user.isAnonymous)
});

const readLocalAuthUser = (): FirebaseUser | null => {
    if (!isBrowser) return null;

    try {
        const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (typeof parsed?.uid !== 'string' || !parsed.uid.trim()) {
            return null;
        }

        return normalizeAuthUser({
            uid: parsed.uid,
            displayName: typeof parsed.displayName === 'string' ? parsed.displayName : null,
            email: typeof parsed.email === 'string' ? parsed.email : null,
            photoURL: typeof parsed.photoURL === 'string' ? parsed.photoURL : null,
            isAnonymous: true,
        });
    } catch {
        return null;
    }
};

let localAuthUser: FirebaseUser | null = readLocalAuthUser();

const emitLocalAuthChange = () => {
    if (!isBrowser) return;
    window.dispatchEvent(new CustomEvent(LOCAL_AUTH_EVENT));
};

const persistLocalAuthUser = (user: FirebaseUser | null) => {
    localAuthUser = user;

    if (!isBrowser) return;

    if (user) {
        window.localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
        window.localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
    }

    emitLocalAuthChange();
};

const getErrorCode = (error: unknown): string =>
    String((error as { code?: unknown })?.code ?? '').toLowerCase();

const isLocalDevEnvironment = (): boolean =>
    import.meta.env.DEV &&
    isBrowser &&
    LOCAL_DEV_HOSTS.has(window.location.hostname);

const shouldUseLocalGuestFallback = (error: unknown): boolean => {
    if (!isLocalDevEnvironment()) return false;

    const errorCode = getErrorCode(error);
    return [
        'auth/invalid-api-key',
        'auth/api-key-not-valid.-please-pass-a-valid-api-key.',
        'auth/invalid-config',
        'auth/app-not-authorized',
        'auth/project-not-found',
        'auth/invalid-app-id',
        'auth/operation-not-allowed'
    ].includes(errorCode);
};

const createLocalGuestSession = (): FirebaseUser => {
    const existingSession = readLocalAuthUser();
    if (existingSession) {
        localAuthUser = existingSession;
        return existingSession;
    }

    const sessionId = isBrowser && typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const guestUser: FirebaseUser = {
        uid: `local-guest-${sessionId}`,
        displayName: 'Convidado local',
        email: null,
        photoURL: null,
        isAnonymous: true
    };

    persistLocalAuthUser(guestUser);
    return guestUser;
};

export const getLocalAuthSessionUser = (): FirebaseUser | null => {
    localAuthUser = readLocalAuthUser();
    return localAuthUser;
};

// --- AUTH FUNCTIONS ---

export const loginWithEmail = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Update display name
    if (result.user) {
        await updateProfile(result.user, { displayName: name });
    }
    return result;
};

export const loginWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider);
};

export const loginAsGuest = async () => {
    try {
        return await signInAnonymously(auth);
    } catch (error) {
        if (shouldUseLocalGuestFallback(error)) {
            console.warn('[Firebase] Anonymous auth unavailable locally. Falling back to local guest session.');
            return { user: createLocalGuestSession() };
        }

        throw error;
    }
};

export const logout = async () => {
    if (getLocalAuthSessionUser()) {
        persistLocalAuthUser(null);
        return;
    }

    return signOut(auth);
};

export const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
    let firebaseUser: FirebaseSdkUser | null = auth.currentUser;

    const emitResolvedUser = () => {
        const localUser = getLocalAuthSessionUser();
        if (localUser) {
            callback(localUser);
            return;
        }

        callback(firebaseUser ? normalizeAuthUser(firebaseUser) : null);
    };

    const handleLocalAuthUpdate = () => {
        localAuthUser = readLocalAuthUser();
        emitResolvedUser();
    };

    if (isBrowser) {
        window.addEventListener(LOCAL_AUTH_EVENT, handleLocalAuthUpdate as EventListener);
        window.addEventListener('storage', handleLocalAuthUpdate);
    }

    emitResolvedUser();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
        firebaseUser = user;
        emitResolvedUser();
    });

    return () => {
        unsubscribe();

        if (isBrowser) {
            window.removeEventListener(LOCAL_AUTH_EVENT, handleLocalAuthUpdate as EventListener);
            window.removeEventListener('storage', handleLocalAuthUpdate);
        }
    };
};
