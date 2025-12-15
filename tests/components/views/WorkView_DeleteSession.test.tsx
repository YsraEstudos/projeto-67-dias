import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkView from '../../../components/views/WorkView';

// Mock useStorage
vi.mock('../../../hooks/useStorage', () => ({
    useStorage: (key: string, initialValue: any) => {
        const [val, setVal] = React.useState(initialValue);
        return [val, setVal];
    },
    readNamespacedStorage: vi.fn(() => null),
    writeNamespacedStorage: vi.fn(),
    removeNamespacedStorage: vi.fn(),
}));

// Mock Firebase
vi.mock('../../../services/firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'test-uid' } }
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    onSnapshot: vi.fn((_ref, onNext) => {
        if (typeof onNext === 'function') {
            onNext({ exists: () => false, data: () => ({}) });
        }
        return vi.fn();
    })
}));

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback({ uid: 'test-uid' });
        return () => { };
    })
}));

describe('WorkView - Delete Session Feature', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('allows deleting a session from history', async () => {
        render(<WorkView />);

        // 1. Open Modal
        fireEvent.click(screen.getByText('Metas Extras'));

        // 2. Add some points
        // Find Anki Up button
        const ankiHeader = screen.getByText(/Anki \(Meta: 15\)/i);
        const ankiContainer = ankiHeader.parentElement!;
        const ankiUp = within(ankiContainer).getAllByRole('button')[1];
        fireEvent.click(ankiUp); // 1 point

        // 3. Save Session
        fireEvent.click(screen.getByText('Salvar Sessão Extra'));

        // 4. Verify it appears in history
        expect(screen.getByText(/Anki: 1 \| NCM: 0/)).toBeInTheDocument();
        const ptsElement = screen.getByText('+1 pts');
        expect(ptsElement).toBeInTheDocument();

        // 5. Find and Click Delete Button
        // The delete button is in the same container as the points badge
        const sessionItem = ptsElement.closest('.bg-slate-800');
        const deleteBtn = within(sessionItem as HTMLElement).getByTitle('Excluir sessão');

        // First click: triggers confirmation
        fireEvent.click(deleteBtn);

        // Verify confirmation state appears
        const confirmBtn = within(sessionItem as HTMLElement).getByTitle('Confirmar exclusão');
        expect(confirmBtn).toBeInTheDocument();
        expect(within(confirmBtn).getByText('Confirmar?')).toBeInTheDocument();

        // Second click: actually deletes
        fireEvent.click(confirmBtn);

        // 6. Verify it is removed
        expect(screen.queryByText(/Anki: 1 \| NCM: 0/)).not.toBeInTheDocument();

        // 7. Verify progress is updated (should be 0)
        // Since we removed the only session, progress should be "0 / 250 pts" (or whatever the goal is)
        // Just checking that 1 is gone is enough, but checking text is better.
        // The progress bar text might be "0 / 250 pts"
        expect(screen.getByText(/0 \/ .* pts/)).toBeInTheDocument();
    });
});
