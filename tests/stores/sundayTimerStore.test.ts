/**
 * Sunday Timer Store - Synchronization Tests
 * 
 * Tests verify that timer state syncs properly across devices with reduced debounce
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSundayTimerStore } from '../../stores/sundayTimerStore';
import { writeToFirestore, REALTIME_DEBOUNCE_MS } from '../../stores/firestoreSync';

// Mock the firestoreSync module
vi.mock('../../stores/firestoreSync', async () => {
    const actual = await vi.importActual('../../stores/firestoreSync');
    return {
        ...actual,
        writeToFirestore: vi.fn(),
        REALTIME_DEBOUNCE_MS: 200
    };
});

describe('SundayTimerStore - Cross-Device Sync', () => {
    beforeEach(() => {
        // Reset store state
        useSundayTimerStore.getState()._reset();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should use realtime debounce (200ms) when syncing timer state', () => {
        // Hydrate to set _initialized flag
        useSundayTimerStore.getState()._hydrateFromFirestore({
            timer: {
                status: 'IDLE',
                startTime: null,
                pausedAt: null,
                accumulated: 0,
                totalDuration: 150 * 60 * 1000,
                widgetPosition: 'bottom-right'
            }
        });

        // Start the timer
        useSundayTimerStore.getState().start();

        // Verify writeToFirestore was called with REALTIME_DEBOUNCE_MS
        expect(writeToFirestore).toHaveBeenCalledWith(
            'p67_sunday_timer',
            expect.objectContaining({
                timer: expect.objectContaining({
                    status: 'RUNNING'
                })
            }),
            200  // REALTIME_DEBOUNCE_MS
        );
    });

    it('should sync all timer state changes with realtime debounce', () => {
        // Hydrate store
        useSundayTimerStore.getState()._hydrateFromFirestore({
            timer: {
                status: 'IDLE',
                startTime: null,
                pausedAt: null,
                accumulated: 0,
                totalDuration: 150 * 60 * 1000,
                widgetPosition: 'bottom-right'
            }
        });

        const store = useSundayTimerStore.getState();

        // Test start
        store.start();
        expect(writeToFirestore).toHaveBeenLastCalledWith(
            expect.any(String),
            expect.any(Object),
            200
        );

        // Test pause
        vi.clearAllMocks();
        store.pause();
        expect(writeToFirestore).toHaveBeenLastCalledWith(
            expect.any(String),
            expect.any(Object),
            200
        );

        // Test resume
        vi.clearAllMocks();
        store.resume();
        expect(writeToFirestore).toHaveBeenLastCalledWith(
            expect.any(String),
            expect.any(Object),
            200
        );

        // Test stop
        vi.clearAllMocks();
        store.stop();
        expect(writeToFirestore).toHaveBeenLastCalledWith(
            expect.any(String),
            expect.any(Object),
            200
        );

        // Test reset
        vi.clearAllMocks();
        store.reset();
        expect(writeToFirestore).toHaveBeenLastCalledWith(
            expect.any(String),
            expect.any(Object),
            200
        );
    });

    it('should hydrate from remote device update without triggering sync loop', () => {
        const mockTimerState = {
            status: 'RUNNING' as const,
            startTime: Date.now(),
            pausedAt: null,
            accumulated: 0,
            totalDuration: 150 * 60 * 1000,
            widgetPosition: 'bottom-right' as const
        };

        // Simulate receiving data from another device
        useSundayTimerStore.getState()._hydrateFromFirestore({
            timer: mockTimerState
        });

        // Verify state was updated
        const store = useSundayTimerStore.getState();
        expect(store.timer.status).toBe('RUNNING');
        expect(store._initialized).toBe(true);
        expect(store.isLoading).toBe(false);

        // Verify hydration did NOT trigger a sync (prevents infinite loop)
        expect(writeToFirestore).not.toHaveBeenCalled();
    });

    it('should sync widget position changes with realtime debounce', () => {
        // Hydrate store
        useSundayTimerStore.getState()._hydrateFromFirestore({
            timer: {
                status: 'RUNNING',
                startTime: Date.now(),
                pausedAt: null,
                accumulated: 0,
                totalDuration: 150 * 60 * 1000,
                widgetPosition: 'bottom-right'
            }
        });

        vi.clearAllMocks();

        // Change widget position
        useSundayTimerStore.getState().setPosition('top-left');

        // Verify sync with realtime debounce
        expect(writeToFirestore).toHaveBeenCalledWith(
            'p67_sunday_timer',
            expect.objectContaining({
                timer: expect.objectContaining({
                    widgetPosition: 'top-left'
                })
            }),
            200
        );
    });

    it('should not sync before initialization', () => {
        // Don't hydrate - store is not initialized
        const store = useSundayTimerStore.getState();

        // Try to start timer before hydration
        store.start();

        // Verify sync was blocked by _initialized check
        expect(writeToFirestore).not.toHaveBeenCalled();
    });
});
