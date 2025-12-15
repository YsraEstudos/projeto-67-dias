import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => {
    const mockAuth = {};
    const onAuthStateChanged = vi.fn((_auth, callback) => {
        callback(null);
        return vi.fn();
    });

    class MockGoogleAuthProvider { }

    return {
        getAuth: vi.fn(() => mockAuth),
        signInWithEmailAndPassword: vi.fn(),
        createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
        signOut: vi.fn(),
        sendPasswordResetEmail: vi.fn(),
        updateProfile: vi.fn(),
        GoogleAuthProvider: MockGoogleAuthProvider,
        signInWithPopup: vi.fn(),
        signInAnonymously: vi.fn(() => Promise.resolve({ user: { isAnonymous: true } })),
        onAuthStateChanged,
    };
});

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(),
    setDoc: vi.fn(() => Promise.resolve()),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    onSnapshot: vi.fn((_ref, onNext) => {
        if (typeof onNext === 'function') {
            onNext({ exists: () => false, data: () => ({}) });
        }
        return vi.fn();
    })
}));

// Mock LocalStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: function (key: string) {
            return store[key] || null;
        },
        setItem: function (key: string, value: string) {
            store[key] = value.toString();
        },
        clear: function () {
            store = {};
        },
        removeItem: function (key: string) {
            delete store[key];
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});
