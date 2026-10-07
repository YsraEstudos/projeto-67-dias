import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import ProgressView from '../../../components/views/ProgressView';
import { useConfigStore } from '../../../stores/configStore';
import { useReviewStore } from '../../../stores/reviewStore';

const addDays = (days: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d.toISOString();
};

describe('ProgressView weekly snapshots', () => {
    beforeEach(() => {
        useConfigStore.getState()._hydrateFromFirestore(null);
        useReviewStore.getState()._reset();
        useReviewStore.getState()._hydrateFromFirestore(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not auto-generate a week 1 snapshot before the journey starts', async () => {
        useConfigStore.getState().setConfig({ startDate: addDays(5) });
        render(<ProgressView />);
        await act(async () => { await Promise.resolve(); });

        expect(useReviewStore.getState().reviewData.snapshots).toHaveLength(0);
        expect(useReviewStore.getState().reviewData.lastSnapshotWeek).toBe(0);

        fireEvent.click(screen.getByRole('tab', { name: /Semanas/ }));
        expect(screen.queryByText(/Gerar Snapshot da Semana/)).not.toBeInTheDocument();
    });

    it('auto-confirms the week 1 snapshot once the journey has started', async () => {
        useConfigStore.getState().setConfig({ startDate: addDays(0) });
        render(<ProgressView />);
        await act(async () => { await Promise.resolve(); });

        expect(useReviewStore.getState().reviewData.snapshots).toHaveLength(1);
        expect(useReviewStore.getState().reviewData.lastSnapshotWeek).toBe(1);
        expect(screen.getByRole('tab', { name: /Visão Geral/ })).toHaveAttribute('aria-selected', 'true');
    });
});
