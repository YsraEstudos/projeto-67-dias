import { describe, it, expect, vi } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import '../../services/firebase'; // Import to trigger side effects

describe('Firebase Service', () => {
    it('initializes Firebase app', () => {
        expect(initializeApp).toHaveBeenCalled();
    });

    it('initializes Auth', () => {
        expect(getAuth).toHaveBeenCalled();
    });

    it('initializes Firestore', () => {
        expect(getFirestore).toHaveBeenCalled();
    });

    it('enables offline persistence', () => {
        expect(enableMultiTabIndexedDbPersistence).toHaveBeenCalled();
    });
});
