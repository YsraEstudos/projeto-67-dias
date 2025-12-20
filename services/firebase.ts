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
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "firebase/firestore";

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
// const analytics = getAnalytics(app);

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
