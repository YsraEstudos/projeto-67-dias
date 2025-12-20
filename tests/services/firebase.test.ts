import { describe, it, expect, vi } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import '../../services/firebase'; // Import to trigger side effects

describe('Firebase Service', () => {
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
