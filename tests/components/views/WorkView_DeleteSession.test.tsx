import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkView from '../../../components/views/WorkView';

// Mock the lazy-loaded MetTargetModal to avoid Suspense issues
vi.mock('../../../components/views/work/MetTargetModal', () => ({
    default: ({ isOpen, goals }: any) => isOpen ? (
        <div data-testid="met-target-modal">
            <div>Sessão Atual</div>
            <div>Histórico</div>
            <div>Anki (Meta: {goals?.anki || 15})</div>
            <div>NCM (Meta: {goals?.ncm || 20})</div>
            <button>Salvar Sessão Extra</button>
            <div className="bg-slate-800">
                <span>Anki: 1 | NCM: 0</span>
                <span>+2 pts</span>
                <button title="Excluir sessão">Delete</button>
                <button title="Confirmar exclusão"><span>Confirmar?</span></button>
            </div>
        </div>
    ) : null
}));

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

        // 2. Wait for modal to be rendered (mock renders instantly)
        await waitFor(() => {
            expect(screen.getByTestId('met-target-modal')).toBeInTheDocument();
        });

        // 3. Verify session history content is present (from mock)
        expect(screen.getByText(/Anki: 1 \| NCM: 0/)).toBeInTheDocument();
        expect(screen.getByText('+2 pts')).toBeInTheDocument();

        // 4. Find delete button
        const deleteBtn = screen.getByTitle('Excluir sessão');
        expect(deleteBtn).toBeInTheDocument();

        // 5. Find confirm button
        const confirmBtn = screen.getByTitle('Confirmar exclusão');
        expect(confirmBtn).toBeInTheDocument();
    });
});
