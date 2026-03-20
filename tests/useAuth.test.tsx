import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLoginAsGuest, mockSubscribeToAuthChanges } = vi.hoisted(() => ({
    mockLoginAsGuest: vi.fn(),
    mockSubscribeToAuthChanges: vi.fn(),
}));

vi.mock('../services/firebase', () => ({
    loginWithEmail: vi.fn(),
    registerWithEmail: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginAsGuest: mockLoginAsGuest,
    logout: vi.fn(),
    resetPassword: vi.fn(),
    subscribeToAuthChanges: mockSubscribeToAuthChanges,
}));

vi.mock('../stores/firestoreSync', () => ({
    flushPendingWrites: vi.fn(),
}));

import { useAuth } from '../hooks/useAuth';

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        mockSubscribeToAuthChanges.mockImplementation((callback: (user: null) => void) => {
            callback(null);
            return vi.fn();
        });
    });

    it('hydrates the app user immediately after local guest login succeeds', async () => {
        mockLoginAsGuest.mockResolvedValue({
            user: {
                uid: 'local-guest-123',
                displayName: 'Convidado local',
                email: null,
                photoURL: null,
                isAnonymous: true,
            },
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.user).toBeNull();
        });

        await act(async () => {
            await result.current.loginGuest();
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.user).toEqual({
                id: 'local-guest-123',
                name: 'Convidado local',
                email: '',
                avatarUrl: undefined,
                isGuest: true,
            });
        });

        expect(window.localStorage.getItem('p67_last_uid')).toBe('local-guest-123');
    });
});
