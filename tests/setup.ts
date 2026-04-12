import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-api-key');

// Mock Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
}));

vi.mock('firebase/app-check', () => ({
    initializeAppCheck: vi.fn(),
    ReCaptchaV3Provider: vi.fn().mockImplementation((siteKey: string) => ({ siteKey })),
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

vi.mock('firebase/firestore', () => {
    const mockDb = { type: 'firestore', toJSON: () => ({}) };
    return {
        getFirestore: vi.fn(() => mockDb),
        initializeFirestore: vi.fn(() => mockDb),
        persistentLocalCache: vi.fn(() => ({ kind: 'persistent' })),
        persistentMultipleTabManager: vi.fn(() => ({ kind: 'multi-tab' })),
        enableMultiTabIndexedDbPersistence: vi.fn(() => Promise.resolve()),
        doc: vi.fn(() => ({ id: 'mock-doc-ref' })),
        setDoc: vi.fn(() => Promise.resolve()),
        getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
        onSnapshot: vi.fn((_ref, onNext) => {
            if (typeof onNext === 'function') {
                onNext({ exists: () => false, data: () => ({}) });
            }
            return vi.fn();
        }),
        collection: vi.fn(() => ({})),
        query: vi.fn(() => ({})),
        where: vi.fn(() => ({})),
        orderBy: vi.fn(() => ({})),
        limit: vi.fn(() => ({})),
        getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
        addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
        updateDoc: vi.fn(() => Promise.resolve()),
        deleteDoc: vi.fn(() => Promise.resolve()),
    };
});

vi.mock('firebase/storage', () => {
    const storageRef = { fullPath: 'mock/storage/path' };
    return {
        getStorage: vi.fn(() => ({ type: 'storage' })),
        ref: vi.fn(() => storageRef),
        uploadBytes: vi.fn(() => Promise.resolve({ ref: storageRef })),
        getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/mock-story.jpg')),
        deleteObject: vi.fn(() => Promise.resolve()),
    };
});

vi.mock('@google/genai', () => {
    const generateContent = vi.fn(() => Promise.resolve({
        text: JSON.stringify({
            assistantMessage: 'Plano gerado.',
            timeSummary: {
                currentTime: '19:00',
                sleepTime: '22:00',
                windDownStart: '21:50',
                availableMinutes: 170,
                reservedMinutes: 45,
                scheduledMinutes: 110,
                freeBufferMinutes: 15,
            },
            scheduledBlocks: [],
            deferredItems: [],
            encouragement: 'Voce ainda pode fechar bem o dia.',
        }),
        candidates: [
            {
                content: {
                    parts: [
                        {
                            text: JSON.stringify({
                                assistantMessage: 'Plano gerado.',
                                timeSummary: {
                                    currentTime: '19:00',
                                    sleepTime: '22:00',
                                    windDownStart: '21:50',
                                    availableMinutes: 170,
                                    reservedMinutes: 45,
                                    scheduledMinutes: 110,
                                    freeBufferMinutes: 15,
                                },
                                scheduledBlocks: [],
                                deferredItems: [],
                                encouragement: 'Voce ainda pode fechar bem o dia.',
                            }),
                        },
                    ],
                },
            },
        ],
    }));

    const mockClient = {
        models: {
            generateContent,
        },
    };

    const GoogleGenAI = vi.fn(function GoogleGenAI() {
        return mockClient;
    });

    return {
        GoogleGenAI,
        ThinkingLevel: {
            MINIMAL: 'minimal',
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
        },
    };
});

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

Object.defineProperty(window.URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'blob:mock-url'),
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
});
