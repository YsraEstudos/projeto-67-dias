import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth } from '../../services/firebase';

const { getLocalAuthSessionUserMock } = vi.hoisted(() => ({
    getLocalAuthSessionUserMock: vi.fn(() => null),
}));

const TEST_DEBOUNCE_MS = 300;

// Mock firestoreSync module internals for testing - APENAS DEPENDÊNCIAS, não o próprio módulo
vi.mock('../../services/firebase', () => ({
    auth: {
        currentUser: null
    },
    getLocalAuthSessionUser: getLocalAuthSessionUserMock,
    // db is already mocked globally or we can mock it here if specific instance needed
    db: {}
}));

// NOTE: firebase/firestore mocks are provided by tests/setup.ts globally

// Import after mocks are set up
import {
    writeToFirestore,
    subscribeToDocument,
    flushPendingWrites,
    getPendingWriteCount,
    isFullySynced,
    subscribeToPendingWrites,
    getCurrentUserId,
    __resetForTesting
} from '../../stores/firestoreSync';

describe('firestoreSync', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        getLocalAuthSessionUserMock.mockReturnValue(null);
        // Reset localStorage mock
        window.localStorage.clear();
        // Reset internal module state
        __resetForTesting();
    });

    afterEach(() => {
        vi.useRealTimers();
        // Also reset internal state after to be safe
        __resetForTesting();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // getCurrentUserId
    // ─────────────────────────────────────────────────────────────────────────

    describe('getCurrentUserId', () => {
        it('should return null when no user is authenticated', () => {
            (auth as any).currentUser = null;
            window.localStorage.removeItem('p67_last_uid');

            const userId = getCurrentUserId();
            expect(userId).toBeNull();
        });

        it('should return UID from Firebase auth when user is authenticated', () => {
            (auth as any).currentUser = { uid: 'firebase-user-123' };

            const userId = getCurrentUserId();
            expect(userId).toBe('firebase-user-123');
        });

        it('should fallback to localStorage when auth.currentUser is null', () => {
            (auth as any).currentUser = null;
            window.localStorage.setItem('p67_last_uid', 'cached-user-456');

            const userId = getCurrentUserId();
            expect(userId).toBe('cached-user-456');
        });

        it('should prefer live auth over cached localStorage', () => {
            (auth as any).currentUser = { uid: 'live-user' };
            window.localStorage.setItem('p67_last_uid', 'cached-user');

            const userId = getCurrentUserId();
            expect(userId).toBe('live-user');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // writeToFirestore
    // ─────────────────────────────────────────────────────────────────────────

    describe('writeToFirestore', () => {
        beforeEach(() => {
            (auth as any).currentUser = { uid: 'test-user-id' };
        });

        it('should not write without authenticated user', () => {
            (auth as any).currentUser = null;
            window.localStorage.removeItem('p67_last_uid');

            writeToFirestore('test_collection', { foo: 'bar' }, TEST_DEBOUNCE_MS);
            vi.advanceTimersByTime(500);

            expect(setDoc).not.toHaveBeenCalled();
        });

        it('should debounce writes and call setDoc after delay', async () => {
            writeToFirestore('test_collection', { foo: 'bar' }, TEST_DEBOUNCE_MS);

            // Before debounce expires
            expect(setDoc).not.toHaveBeenCalled();

            // Advance past debounce time (300ms)
            vi.advanceTimersByTime(350);

            // Wait for the async operation
            await vi.runAllTimersAsync();

            expect(setDoc).toHaveBeenCalledTimes(1);
            expect(doc).toHaveBeenCalledWith(
                expect.anything(),
                'users',
                'test-user-id',
                'data',
                'test_collection'
            );
        });

        it('should cancel previous write when new write arrives within debounce', async () => {
            writeToFirestore('test_collection', { version: 1 }, TEST_DEBOUNCE_MS);

            // Wait 100ms (within debounce window)
            vi.advanceTimersByTime(100);

            writeToFirestore('test_collection', { version: 2 }, TEST_DEBOUNCE_MS);

            // Wait for full debounce
            vi.advanceTimersByTime(350);
            await vi.runAllTimersAsync();

            // Only the second write should have been executed
            expect(setDoc).toHaveBeenCalledTimes(1);
            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    value: { version: 2 }
                })
            );
        });

        it('should remove undefined values from data before writing', async () => {
            writeToFirestore('test_collection', {
                valid: 'data',
                invalid: undefined,
                nested: {
                    also: undefined,
                    keep: 'this'
                }
            }, TEST_DEBOUNCE_MS);

            vi.advanceTimersByTime(350);
            await vi.runAllTimersAsync();

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    value: {
                        valid: 'data',
                        nested: {
                            keep: 'this'
                        }
                    }
                })
            );
        });

        it('should handle concurrent writes to different collections', async () => {
            writeToFirestore('collection_a', { a: 1 }, TEST_DEBOUNCE_MS);
            writeToFirestore('collection_b', { b: 2 }, TEST_DEBOUNCE_MS);

            vi.advanceTimersByTime(350);
            await vi.runAllTimersAsync();

            expect(setDoc).toHaveBeenCalledTimes(2);
        });

        // 🆕 NEW TEST: Error handling
        it('should decrement pendingWriteCount even when setDoc fails', async () => {
            // Mock setDoc to fail once
            vi.mocked(setDoc).mockRejectedValueOnce(new Error('Network error'));
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            writeToFirestore('test_fail', { data: 1 }, TEST_DEBOUNCE_MS);

            vi.advanceTimersByTime(350);
            await vi.runAllTimersAsync();

            expect(setDoc).toHaveBeenCalled();
            expect(getPendingWriteCount()).toBe(0); // Should be decremented back to 0
            expect(consoleSpy).toHaveBeenCalled(); // Should warn about retry (simulated)
        });

        // 🆕 NEW TEST: Circular objects
        it('should handle circular objects gracefully', async () => {
            const circular: any = { a: 1 };
            circular.self = circular; // Circular reference

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            writeToFirestore('test_circular', circular, TEST_DEBOUNCE_MS);

            vi.advanceTimersByTime(350);
            await vi.runAllTimersAsync();

            // Should call setDoc with the original object (fallback) instead of crashing
            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    value: circular
                })
            );
            expect(consoleSpy).toHaveBeenCalled(); // Should log error about cleaning
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // subscribeToDocument
    // ─────────────────────────────────────────────────────────────────────────

    describe('subscribeToDocument', () => {
        beforeEach(() => {
            (auth as any).currentUser = { uid: 'test-user-id' };
        });

        it('should return noop unsubscribe without authenticated user', () => {
            (auth as any).currentUser = null;
            window.localStorage.removeItem('p67_last_uid');

            const onData = vi.fn();
            const unsubscribe = subscribeToDocument('test_doc', onData);

            expect(onSnapshot).not.toHaveBeenCalled();
            expect(typeof unsubscribe).toBe('function');
        });

        it('should call onSnapshot with correct document reference', () => {
            const onData = vi.fn();
            subscribeToDocument('my_document', onData);

            expect(doc).toHaveBeenCalledWith(
                expect.anything(),
                'users',
                'test-user-id',
                'data',
                'my_document'
            );
            expect(onSnapshot).toHaveBeenCalled();
        });

        it('should call onData with document value when exists', () => {
            // Setup mock to return existing document
            vi.mocked(onSnapshot).mockImplementationOnce((_ref, onNext: any) => {
                onNext({
                    exists: () => true,
                    data: () => ({ value: { name: 'Test Data' }, updatedAt: 123456 })
                });
                return vi.fn();
            });

            const onData = vi.fn();
            subscribeToDocument('my_document', onData);

            expect(onData).toHaveBeenCalledWith({ name: 'Test Data' });
        });

        it('should call onData with null when document does not exist', () => {
            vi.mocked(onSnapshot).mockImplementationOnce((_ref, onNext: any) => {
                onNext({
                    exists: () => false,
                    data: () => null
                });
                return vi.fn();
            });

            const onData = vi.fn();
            subscribeToDocument('my_document', onData);

            expect(onData).toHaveBeenCalledWith(null);
        });

        it('should call onError when subscription fails', () => {
            const testError = new Error('Firestore error');

            vi.mocked(onSnapshot).mockImplementationOnce((_ref, _onNext, onError: any) => {
                onError(testError);
                return vi.fn();
            });

            const onData = vi.fn();
            const onError = vi.fn();
            subscribeToDocument('my_document', onData, onError);

            expect(onError).toHaveBeenCalledWith(testError);
        });

        it('should return unsubscribe function', () => {
            const mockUnsubscribe = vi.fn();
            vi.mocked(onSnapshot).mockReturnValueOnce(mockUnsubscribe);

            const unsubscribe = subscribeToDocument('my_document', vi.fn());
            unsubscribe();

            expect(mockUnsubscribe).toHaveBeenCalled();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // flushPendingWrites
    // ─────────────────────────────────────────────────────────────────────────

    describe('flushPendingWrites', () => {
        beforeEach(() => {
            (auth as any).currentUser = { uid: 'test-user-id' };
        });

        it('should execute all pending writes immediately', async () => {
            writeToFirestore('collection_1', { a: 1 }, TEST_DEBOUNCE_MS);
            writeToFirestore('collection_2', { b: 2 }, TEST_DEBOUNCE_MS);

            // Flush before debounce expires
            flushPendingWrites();
            await vi.runAllTimersAsync();

            expect(setDoc).toHaveBeenCalledTimes(2);
        });

        it('should not duplicate writes after flush', async () => {
            writeToFirestore('test_collection', { data: 'test' }, TEST_DEBOUNCE_MS);

            flushPendingWrites();
            await vi.runAllTimersAsync();

            // Advance past original debounce time
            vi.advanceTimersByTime(500);
            await vi.runAllTimersAsync();

            // Should still only have been called once
            expect(setDoc).toHaveBeenCalledTimes(1);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Pending Write Tracking
    // ─────────────────────────────────────────────────────────────────────────

    describe('pending write tracking', () => {
        beforeEach(() => {
            (auth as any).currentUser = { uid: 'test-user-id' };
        });

        it('getPendingWriteCount should return 0 initially', () => {
            expect(getPendingWriteCount()).toBe(0);
        });

        it('isFullySynced should return true when no pending writes', () => {
            expect(isFullySynced()).toBe(true);
        });

        it('isFullySynced should return false during debounce', () => {
            writeToFirestore('test', { data: 1 }, TEST_DEBOUNCE_MS);
            // During debounce window, there's a pending timeout
            expect(isFullySynced()).toBe(false);
        });

        it('subscribeToPendingWrites should notify listeners on changes', async () => {
            const listener = vi.fn();
            const unsubscribe = subscribeToPendingWrites(listener);

            writeToFirestore('test', { data: 1 }, TEST_DEBOUNCE_MS);
            vi.advanceTimersByTime(350);
            await vi.runAllTimersAsync();

            // Listener should have been called (increment and decrement)
            expect(listener).toHaveBeenCalled();

            unsubscribe();
        });

        it('subscribeToPendingWrites should stop notifying after unsubscribe', async () => {
            const listener = vi.fn();
            const unsubscribe = subscribeToPendingWrites(listener);
            unsubscribe();

            listener.mockClear();

            writeToFirestore('test', { data: 1 }, TEST_DEBOUNCE_MS);
            vi.advanceTimersByTime(350);
            await vi.runAllTimersAsync();

            // Listener should not be called after unsubscribe
            expect(listener).not.toHaveBeenCalled();
        });

        // 🆕 NEW: Tests for immediate pendingWriteCount increment
        it('pendingWriteCount should increment immediately when write is scheduled', () => {
            expect(getPendingWriteCount()).toBe(0);

            writeToFirestore('test', { data: 1 });

            // Count should increment immediately, not after debounce
            expect(getPendingWriteCount()).toBe(1);
            expect(isFullySynced()).toBe(false);
        });

        it('pendingWriteCount should NOT double-increment for replaced writes', () => {
            writeToFirestore('same_collection', { version: 1 }, TEST_DEBOUNCE_MS);
            expect(getPendingWriteCount()).toBe(1);

            // Replace with new write (within debounce window)
            writeToFirestore('same_collection', { version: 2 }, TEST_DEBOUNCE_MS);

            // Should still be 1, not 2
            expect(getPendingWriteCount()).toBe(1);
        });

        it('pendingWriteCount should track multiple different collections separately', () => {
            writeToFirestore('collection_a', { a: 1 }, TEST_DEBOUNCE_MS);
            writeToFirestore('collection_b', { b: 2 }, TEST_DEBOUNCE_MS);
            writeToFirestore('collection_c', { c: 3 }, TEST_DEBOUNCE_MS);

            expect(getPendingWriteCount()).toBe(3);
        });

        it('isFullySynced should return true after all writes complete', async () => {
            writeToFirestore('test_a', { a: 1 }, TEST_DEBOUNCE_MS);
            writeToFirestore('test_b', { b: 2 }, TEST_DEBOUNCE_MS);

            expect(isFullySynced()).toBe(false);

            vi.advanceTimersByTime(350);
            await vi.runAllTimersAsync();

            expect(isFullySynced()).toBe(true);
            expect(getPendingWriteCount()).toBe(0);
        });

        it('listener should be notified immediately on write schedule', () => {
            const listener = vi.fn();
            subscribeToPendingWrites(listener);

            writeToFirestore('test', { data: 1 }, TEST_DEBOUNCE_MS);

            // Listener should be called immediately (not after debounce)
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });
});
