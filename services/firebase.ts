// src/services/firebase.ts
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
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
    onAuthStateChanged,
    User as FirebaseUser
} from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
// const analytics = getAnalytics(app);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence with multi-tab support
// This uses IndexedDB internally, replacing the need for manual LocalStorage cache
enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        // Other tabs will still work but use network-only.
        console.warn('[Firebase] Persistence limited: Multiple tabs open. Only one tab will have full offline support.');
    } else if (err.code === 'unimplemented') {
        // The current browser doesn't support IndexedDB persistence
        console.warn('[Firebase] Persistence not available in this browser. Offline mode will be limited.');
    } else {
        console.error('[Firebase] Persistence setup failed:', err);
    }
});

// Google Provider
const googleProvider = new GoogleAuthProvider();

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
    return signInAnonymously(auth);
};

export const logout = async () => {
    return signOut(auth);
};

export const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export type { FirebaseUser };
