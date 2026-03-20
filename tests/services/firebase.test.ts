import { describe, it, expect, vi } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { subscribeToAuthChanges } from '../../services/firebase';

describe('Firebase Service', () => {
    it('does not emit a logged-out state immediately when a cached uid is still being hydrated', () => {
        window.localStorage.setItem('p67_last_uid', 'firebase-user-123');
        vi.mocked(onAuthStateChanged).mockImplementation(() => vi.fn());

        const callback = vi.fn();
        const unsubscribe = subscribeToAuthChanges(callback);

        expect(callback).not.toHaveBeenCalled();
        expect(onAuthStateChanged).toHaveBeenCalled();

        unsubscribe();
    });

    it('initializes Firebase app', () => {
        expect(initializeApp).toHaveBeenCalled();
    });

    it('initializes Auth', () => {
        expect(getAuth).toHaveBeenCalled();
    });

    it('initializes Firestore with persistent cache', () => {
        expect(initializeFirestore).toHaveBeenCalled();
    });

    it('configures persistent local cache with multi-tab support', () => {
        expect(persistentLocalCache).toHaveBeenCalled();
        expect(persistentMultipleTabManager).toHaveBeenCalled();
    });
});
