import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceApp from '../WorkspaceApp';
import { ViewState, type User } from '../types';
import { useUIStore, useConfigStore, useWorkStore, useHabitsStore } from '../stores';
import { useTabStore } from '../stores/tabStore';
import { calculateCurrentDay, getDaysUntilStart } from '../services/weeklySnapshot';
import { useDashboardStats } from '../hooks/useDashboardStats';


// ---------------------------------------------------------------------------
// Mock: New orchestration hooks (side-effect free in these tests)
// ---------------------------------------------------------------------------
vi.mock('../hooks/useHydrationOrchestrator', () => ({
    useHydrationOrchestrator: vi.fn(() => true),
}));
vi.mock('../hooks/useAppBootstrap', () => ({
    useAppBootstrap: vi.fn(),
}));
vi.mock('../hooks/useDashboardStats', () => ({
    useDashboardStats: vi.fn(() => ({
        readingStats: { readingCount: 1, completedCount: 2, totalCount: 5, progressPercent: 40 },
        aulasStats: { totalBooks: 3, totalChapters: 10, readChapters: 6, progressPercent: 60 },
    })),
}));

// ---------------------------------------------------------------------------
// Mock: Competition tracker (no-op)
// ---------------------------------------------------------------------------
vi.mock('../hooks/useCompetitionTracker', () => ({ useCompetitionTracker: vi.fn() }));

// ---------------------------------------------------------------------------
// Mock: Navigation history
// ---------------------------------------------------------------------------
const mockPushNavigation = vi.fn();
const mockReplaceNavigation = vi.fn();
vi.mock('../hooks/useNavigationHistory', () => ({
    useNavigationHistory: vi.fn(() => ({
        pushNavigation: mockPushNavigation,
        replaceNavigation: mockReplaceNavigation,
    })),
}));

// ---------------------------------------------------------------------------
// Mock: Concurso prefetch
// ---------------------------------------------------------------------------
const mockWarmConcurso = vi.fn(async () => undefined);
vi.mock('../utils/concursoPrefetch', () => ({ warmConcursoEntryPoint: () => mockWarmConcurso() }));

// ---------------------------------------------------------------------------
// Hoisted store initialization to prevent hoisting issues in vi.mock
// ---------------------------------------------------------------------------
const {
    uiState,
    tabState,
    configStore,
    workStore,
    habitsStore,
    streakStore,
    readingStore,
    aulasStore,
    resetUIState,
    resetTabState,
    configState,
    workState,
    habitsState,
} = vi.hoisted(() => {
    const mockFn = vi.fn;
    const createStoreMock = (state: any) =>
        Object.assign(
            mockFn((selector: any) => (typeof selector === 'function' ? selector(state) : state)),
            { getState: () => state }
        );

    const ui = {
        activeView: 'DASHBOARD' as any,
        isMenuOpen: false,
        setActiveView: vi.fn((v: any) => { ui.activeView = v; }),
        setMenuOpen: vi.fn((v: boolean) => { ui.isMenuOpen = v; }),
    };

    const tab = {
        tabs: [] as any[],
        activeTabId: null as string | null,
        addTab: vi.fn((view: any, label: string) => {
            const newTab = { id: `tab-${Date.now()}`, view, label, state: {}, createdAt: Date.now() };
            tab.tabs.push(newTab);
            tab.activeTabId = newTab.id;
            return newTab.id;
        }),
        setActiveTab: vi.fn((id: string) => { tab.activeTabId = id; }),
        updateTabState: vi.fn((id: string, state: any) => {
            const t = tab.tabs.find(x => x.id === id);
            if (t) Object.assign(t.state, state);
        }),
        closeTab: vi.fn(),
        getTab: vi.fn((id: string) => tab.tabs.find(x => x.id === id)),
    };

    const config = { config: { startDate: new Date().toISOString(), userName: 'Test User', theme: 'default' }, setConfig: vi.fn() };
    const work = { currentCount: 42, goal: 100, history: [], tasks: [], availableGoals: [], getCurrentWeekGoal: () => 100 };
    const habits = { tasks: [
        { isCompleted: false, isArchived: false, dueDate: '2099-12-31', reminderDate: null },
        { isCompleted: true, isArchived: false, dueDate: '2020-01-01', reminderDate: null },
        { isCompleted: false, isArchived: true, dueDate: '2020-01-01', reminderDate: null }
    ] };

    return {
        uiState: ui,
        tabState: tab,
        configStore: createStoreMock(config),
        workStore: createStoreMock(work),
        habitsStore: createStoreMock(habits),
        streakStore: createStoreMock({}),
        readingStore: createStoreMock({ books: [] }),
        aulasStore: createStoreMock({ books: [] }),
        resetUIState: () => {
            ui.activeView = 'DASHBOARD';
            ui.isMenuOpen = false;
        },
        resetTabState: () => {
            tab.tabs.length = 0;
            tab.activeTabId = null;
        },
        configState: config,
        workState: work,
        habitsState: habits,
    };
});

vi.mock('../stores/tabStore', () => ({
    useTabStore: vi.fn((selector?: any) => typeof selector === 'function' ? selector(tabState) : tabState),
}));

vi.mock('../stores', () => ({
    useUIStore: vi.fn((selector: any) => (typeof selector === 'function' ? selector(uiState) : uiState)),
    useConfigStore: configStore,
    useWorkStore: workStore,
    useHabitsStore: habitsStore,
    useStreakStore: streakStore,
    useReadingStore: readingStore,
    useAulasStore: aulasStore,
}));

// ---------------------------------------------------------------------------
// Mock: Shared components
// ---------------------------------------------------------------------------
vi.mock('../components/shared/StreakBadge', () => ({
    StreakBadge: () => <div data-testid="streak-badge" />,
}));
vi.mock('../components/shared/SyncStatusIndicator', () => ({
    SyncStatusIndicator: () => <div data-testid="sync-status" />,
}));
vi.mock('../components/shared/TabBar', () => ({
    TabBar: () => <div data-testid="tab-bar" />,
}));
vi.mock('../components/modals/ConflictModal', () => ({
    ConflictModal: () => <div data-testid="conflict-modal" />,
}));
vi.mock('../components/shared/Loading', () => ({
    LoadingSimple: () => <div data-testid="loading" />,
}));
vi.mock('../components/shared/DropdownMenu', () => ({
    DropdownMenu: ({ isOpen, items, onClose }: any) =>
        isOpen ? (
            <div data-testid="dropdown-menu">
                <button data-testid="dropdown-close" onClick={onClose}>Fechar</button>
                {(items as any[]).map((item: any, i: number) => (
                    <button key={i} onClick={item.onClick} data-testid={`menu-item-${i}`}>
                        {item.label}
                    </button>
                ))}
            </div>
        ) : null,
}));
vi.mock('../components/shared/ConfirmModal', () => ({
    ConfirmModal: ({ isOpen, title, onConfirm, onCancel }: any) =>
        isOpen ? (
            <div data-testid="confirm-modal">
                <p data-testid="modal-title">{title}</p>
                <button data-testid="confirm-btn" onClick={onConfirm}>Confirmar</button>
                <button data-testid="cancel-btn" onClick={onCancel}>Cancelar</button>
            </div>
        ) : null,
}));

// ---------------------------------------------------------------------------
// Mock: Card component
// ---------------------------------------------------------------------------
vi.mock('../components/Card', () => ({
    Card: ({ id, title, subtitle, onClick, onAuxClick, onWarm, stats, statsAlert }: any) => (
        <div
            data-testid={`dashboard-card-${id}`}
            data-stats={stats}
            data-stats-alert={statsAlert}
            onClick={() => onClick?.(id)}
            onAuxClick={(e: any) => { e.preventDefault(); onAuxClick?.(id); }}
            onMouseEnter={() => onWarm?.()}
        >
            <span data-testid={`card-title-${id}`}>{title}</span>
            <span>{subtitle}</span>
            <button data-testid={`card-click-unknown-${id}`} onClick={(e) => { e.stopPropagation(); onClick?.('UNKNOWN_VIEW' as any); }}>Click Unknown</button>
        </div>
    ),
}));

// ---------------------------------------------------------------------------
// Mock: Lazy-loaded views
// ---------------------------------------------------------------------------
vi.mock('../components/views/WorkView', () => ({ default: () => <div data-testid="work-view" /> }));
vi.mock('../components/views/RestView', () => ({ default: () => <div data-testid="rest-view" /> }));
vi.mock('../components/views/ToolsView', () => ({ default: () => <div data-testid="tools-view" /> }));
vi.mock('../components/views/ReadingView', () => ({ default: () => <div data-testid="reading-view" /> }));
vi.mock('../components/views/ProgressView', () => ({ default: () => <div data-testid="progress-view" /> }));
vi.mock('../components/views/HabitsView', () => ({ default: () => <div data-testid="habits-view" /> }));
vi.mock('../components/views/JournalView', () => ({ default: () => <div data-testid="journal-view" /> }));
vi.mock('../components/views/SkillsView', () => ({ default: () => <div data-testid="skills-view" /> }));
vi.mock('../components/views/SettingsView', () => ({ default: () => <div data-testid="settings-view" /> }));
vi.mock('../components/views/LinksView', () => ({ default: () => <div data-testid="links-view" /> }));
vi.mock('../components/views/SundayView', () => ({ default: () => <div data-testid="sunday-view" /> }));
vi.mock('../components/views/GamesView', () => ({ default: () => <div data-testid="games-view" /> }));
vi.mock('../components/views/PomodoroView', () => ({ default: () => <div data-testid="pomodoro-view" /> }));
vi.mock('../components/views/AulasView', () => ({ default: () => <div data-testid="aulas-view" /> }));

// ---------------------------------------------------------------------------
// Mock: Floating widgets
// ---------------------------------------------------------------------------
vi.mock('../components/TimerWidget', () => ({
    TimerWidget: ({ onClick }: any) => (
        <button data-testid="timer-widget" onClick={onClick}>Timer</button>
    ),
}));
vi.mock('../components/SundayTimerWidget', () => ({
    SundayTimerWidget: ({ onClick }: any) => (
        <button data-testid="sunday-timer-widget" onClick={onClick}>Sunday Timer</button>
    ),
}));
vi.mock('../components/TaskNotificationWidget', () => ({
    TaskNotificationWidget: () => <div data-testid="task-notification-widget" />,
}));

// ---------------------------------------------------------------------------
// Mock: Services
// ---------------------------------------------------------------------------
vi.mock('../services/weeklySnapshot', () => ({
    calculateCurrentDay: vi.fn(() => 10),
    getDaysUntilStart: vi.fn(() => 0),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockUser: User = { id: 'user-123', name: 'Test User', email: 'test@example.com', isGuest: false };
const onLogout = vi.fn().mockResolvedValue(undefined);

// Helper to set activeView on the mock and re-render
const setActiveView = (view: ViewState) => {
    uiState.activeView = view;
    vi.mocked(useUIStore).mockImplementation(
        (selector: any) => (typeof selector === 'function' ? selector(uiState) : uiState)
    );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('WorkspaceApp', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetUIState();
        resetTabState();
        onLogout.mockResolvedValue(undefined);

        // Keep stores mocked consistently after clearAllMocks
        vi.mocked(useUIStore).mockImplementation(
            (selector: any) => (typeof selector === 'function' ? selector(uiState) : uiState)
        );
        vi.mocked(useConfigStore).mockImplementation(
            (selector: any) => (typeof selector === 'function' ? selector(configState) : configState)
        );
        vi.mocked(useWorkStore).mockImplementation(
            (selector: any) => (typeof selector === 'function' ? selector(workState) : workState)
        );
        vi.mocked(useHabitsStore).mockImplementation(
            (selector: any) => (typeof selector === 'function' ? selector(habitsState) : habitsState)
        );
        vi.mocked(useTabStore).mockImplementation(
            (selector?: any) => typeof selector === 'function' ? selector(tabState) : tabState
        );
    });

    // -----------------------------------------------------------------------
    // Dashboard rendering
    // -----------------------------------------------------------------------
    it('renders the dashboard with header title "Projeto 67 Dias"', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText('Projeto 67 Dias')).toBeInTheDocument();
        });
    });

    it('renders all expected dashboard cards', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByTestId(`dashboard-card-${ViewState.WORK}`)).toBeInTheDocument();
            expect(screen.getByTestId(`dashboard-card-${ViewState.READING}`)).toBeInTheDocument();
            expect(screen.getByTestId(`dashboard-card-${ViewState.SKILLS}`)).toBeInTheDocument();
            expect(screen.getByTestId(`dashboard-card-${ViewState.HABITS}`)).toBeInTheDocument();
            expect(screen.getByTestId(`dashboard-card-${ViewState.CONCURSO}`)).toBeInTheDocument();
            expect(screen.getByTestId(`dashboard-card-${ViewState.AULAS}`)).toBeInTheDocument();
        });
    });

    it('shows StreakBadge and day counter on the dashboard', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByTestId('streak-badge')).toBeInTheDocument();
            expect(screen.getByText(/Dia 10 de 67/)).toBeInTheDocument();
        });
    });

    it('shows user name and logout button on the dashboard', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText('Test User')).toBeInTheDocument();
            expect(screen.getByTitle('Sair')).toBeInTheDocument();
        });
    });

    it('renders floating widgets only on the dashboard', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByTestId('timer-widget')).toBeInTheDocument();
            expect(screen.getByTestId('task-notification-widget')).toBeInTheDocument();
            expect(screen.getByTestId('sunday-timer-widget')).toBeInTheDocument();
        });
    });

    it('renders ConflictModal and TabBar always', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByTestId('conflict-modal')).toBeInTheDocument();
            expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
        });
    });

    it('renders footer with version number', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText(/versão \d+\.\d+\.\d+/)).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // "hasStarted = false" branch — daysUntilStart > 0
    // -----------------------------------------------------------------------
    it('shows daysUntilStart when project has not started yet (currentDay = 0)', async () => {
        vi.mocked(calculateCurrentDay).mockReturnValue(0);
        vi.mocked(getDaysUntilStart).mockReturnValue(5);

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText(/Faltam 5 dias/)).toBeInTheDocument();
        });

        // Restore
        vi.mocked(calculateCurrentDay).mockReturnValue(10);
        vi.mocked(getDaysUntilStart).mockReturnValue(0);
    });

    it('shows "Começa hoje!" when daysUntilStart is 0 and not started', async () => {
        vi.mocked(calculateCurrentDay).mockReturnValue(0);
        vi.mocked(getDaysUntilStart).mockReturnValue(0);

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText('Começa hoje!')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Navigation — Back button
    // -----------------------------------------------------------------------
    it('shows back button (not menu) when NOT on the dashboard', async () => {
        setActiveView(ViewState.WORK);
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
        });
    });

    it('shows menu button (not back) when on the dashboard', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Voltar' })).not.toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Navigation — handleBack branches
    // -----------------------------------------------------------------------
    it('handleBack with no active tab and non-dashboard view sets view to DASHBOARD', async () => {
        setActiveView(ViewState.WORK);
        tabState.activeTabId = null;

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
        expect(uiState.setActiveView).toHaveBeenCalledWith(ViewState.DASHBOARD);
    });

    it('handleBack on dashboard does not navigate further (prevents PWA close)', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        // No back button on dashboard — clicking the Sunday timer navigates to SUNDAY
        // then clicking back should go to DASHBOARD (already covered above)
        // We verify setActiveView is NOT called with anything from dashboard
        expect(uiState.setActiveView).not.toHaveBeenCalled();
    });

    it('handleBack with active tab having internal state clears state and calls history.back', async () => {
        const tab = { id: 'tab-1', view: ViewState.JOURNAL, label: 'Diário', state: { activeNoteId: 'note-1' }, createdAt: Date.now() };
        tabState.tabs = [tab];
        tabState.activeTabId = 'tab-1';
        setActiveView(ViewState.JOURNAL);

        // Ensure history.length > 1
        history.pushState({}, '');

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument());

        const backSpy = vi.spyOn(window.history, 'back').mockImplementation(vi.fn());
        fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

        expect(tabState.updateTabState).toHaveBeenCalledWith('tab-1', expect.objectContaining({
            activeNoteId: null,
            isCreating: false,
        }));
        expect(backSpy).toHaveBeenCalled();
        backSpy.mockRestore();
    });

    it('handleBack with active tab having no internal state goes to DASHBOARD', async () => {
        const tab = { id: 'tab-1', view: ViewState.SKILLS, label: 'Habilidades', state: {}, createdAt: Date.now() };
        tabState.tabs = [tab];
        tabState.activeTabId = 'tab-1';
        setActiveView(ViewState.SKILLS);

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

        expect(uiState.setActiveView).toHaveBeenCalledWith(ViewState.DASHBOARD);
        expect(tabState.setActiveTab).toHaveBeenCalledWith('');
    });

    // -----------------------------------------------------------------------
    // Navigation — Card click handlers
    // -----------------------------------------------------------------------
    it('handleCardClick with CONCURSO sets window.location.href', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId(`dashboard-card-${ViewState.CONCURSO}`)).toBeInTheDocument());

        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: '', origin: 'http://localhost' },
        });

        fireEvent.click(screen.getByTestId(`dashboard-card-${ViewState.CONCURSO}`));
        expect(window.location.href).toBe('http://localhost/concurso/#/');

        Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    });

    it('handleCardClick with no tabs navigates directly to view', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId(`dashboard-card-${ViewState.WORK}`)).toBeInTheDocument());

        fireEvent.click(screen.getByTestId(`dashboard-card-${ViewState.WORK}`));

        expect(uiState.setActiveView).toHaveBeenCalledWith(ViewState.WORK);
        expect(mockPushNavigation).toHaveBeenCalledWith(expect.objectContaining({ view: ViewState.WORK }));
    });

    it('handleCardClick with existing tab switches to that tab', async () => {
        const existingTab = { id: 'existing-tab', view: ViewState.READING, label: 'Leitura', state: {}, createdAt: Date.now() };
        tabState.tabs = [existingTab];

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId(`dashboard-card-${ViewState.READING}`)).toBeInTheDocument());

        fireEvent.click(screen.getByTestId(`dashboard-card-${ViewState.READING}`));

        expect(tabState.setActiveTab).toHaveBeenCalledWith('existing-tab');
        expect(uiState.setActiveView).toHaveBeenCalledWith(ViewState.READING);
    });

    it('handleCardClick with tabs but no matching tab adds a new tab', async () => {
        const existingTab = { id: 'existing-tab', view: ViewState.WORK, label: 'Trabalho', state: {}, createdAt: Date.now() };
        tabState.tabs = [existingTab];

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId(`dashboard-card-${ViewState.READING}`)).toBeInTheDocument());

        fireEvent.click(screen.getByTestId(`dashboard-card-${ViewState.READING}`));

        expect(tabState.addTab).toHaveBeenCalledWith(ViewState.READING, expect.any(String));
    });

    // -----------------------------------------------------------------------
    // Middle-click (aux click)
    // -----------------------------------------------------------------------
    it('handleCardMiddleClick with CONCURSO opens a new browser tab', async () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn() as any);

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId(`dashboard-card-${ViewState.CONCURSO}`)).toBeInTheDocument());

        const card = screen.getByTestId(`dashboard-card-${ViewState.CONCURSO}`);
        card.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 }));

        expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('/concurso/'), '_blank');
        openSpy.mockRestore();
    });

    it('handleCardMiddleClick with non-CONCURSO adds a tab', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId(`dashboard-card-${ViewState.SKILLS}`)).toBeInTheDocument());

        const card = screen.getByTestId(`dashboard-card-${ViewState.SKILLS}`);
        card.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 }));

        expect(tabState.addTab).toHaveBeenCalledWith(ViewState.SKILLS, expect.any(String));
    });

    // -----------------------------------------------------------------------
    // Menu (dropdown)
    // -----------------------------------------------------------------------
    it('opens and closes the dropdown menu', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
        expect(uiState.setMenuOpen).toHaveBeenCalledWith(true);

        // Simulate menu open for re-render
        uiState.isMenuOpen = true;
        vi.mocked(useUIStore).mockImplementation(
            (selector: any) => (typeof selector === 'function' ? selector(uiState) : uiState)
        );
        const { rerender } = render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument());
    });

    it('clicking close in the dropdown menu calls onClose', async () => {
        uiState.isMenuOpen = true;
        vi.mocked(useUIStore).mockImplementation(
            (selector: any) => (typeof selector === 'function' ? selector(uiState) : uiState)
        );

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId('dropdown-close')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('dropdown-close'));
        expect(uiState.setMenuOpen).toHaveBeenCalledWith(false);
    });

    it('menu "Configurações" item navigates to SETTINGS', async () => {
        uiState.isMenuOpen = true;
        vi.mocked(useUIStore).mockImplementation(
            (selector: any) => (typeof selector === 'function' ? selector(uiState) : uiState)
        );

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('menu-item-0'));

        expect(uiState.setActiveView).toHaveBeenCalledWith(ViewState.SETTINGS);
        expect(uiState.setMenuOpen).toHaveBeenCalledWith(false);
    });

    // -----------------------------------------------------------------------
    // Logout flow
    // -----------------------------------------------------------------------
    it('clicking logout button opens confirm modal', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTitle('Sair')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Sair'));
        await waitFor(() => {
            expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
            expect(screen.getByTestId('modal-title')).toHaveTextContent('Sair da conta');
        });
    });

    it('clicking cancel in the logout modal closes it without calling onLogout', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTitle('Sair')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Sair'));
        await waitFor(() => expect(screen.getByTestId('cancel-btn')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('cancel-btn'));
        expect(onLogout).not.toHaveBeenCalled();
        expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    });

    it('clicking confirm in the logout modal calls onLogout', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTitle('Sair')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Sair'));
        await waitFor(() => expect(screen.getByTestId('confirm-btn')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('confirm-btn'));
        await waitFor(() => expect(onLogout).toHaveBeenCalledOnce());
    });

    it('double-clicking confirm does not call onLogout twice (isLoggingOut guard)', async () => {
        let resolveLogout!: () => void;
        onLogout.mockReturnValueOnce(new Promise<void>((res) => { resolveLogout = res; }));

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTitle('Sair')).toBeInTheDocument());
        fireEvent.click(screen.getByTitle('Sair'));
        await waitFor(() => expect(screen.getByTestId('confirm-btn')).toBeInTheDocument());

        // Click twice quickly
        fireEvent.click(screen.getByTestId('confirm-btn'));
        fireEvent.click(screen.getByTestId('confirm-btn'));

        resolveLogout();
        await waitFor(() => expect(onLogout).toHaveBeenCalledOnce());
    });

    // -----------------------------------------------------------------------
    // notificationCount — error/catch path
    // -----------------------------------------------------------------------
    it('returns 0 for notificationCount when habitsStore.tasks is null (catch branch)', async () => {
        vi.mocked(useHabitsStore).mockImplementation((selector: any) => {
            return selector({ tasks: null }); // null.filter() throws → catch returns 0
        });

        // Should render without crashing
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText('Projeto 67 Dias')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // notificationCount > 0 in dashboardCards
    // -----------------------------------------------------------------------
    it('shows notification alert on Habits card when notificationCount > 0', async () => {
        vi.mocked(useHabitsStore).mockImplementation((selector: any) => {
            return selector({
                tasks: [
                    { isCompleted: false, isArchived: false, dueDate: '2020-01-01', reminderDate: null },
                    { isCompleted: false, isArchived: false, dueDate: null, reminderDate: '2020-01-01' },
                    { isCompleted: false, isArchived: false, dueDate: null, reminderDate: '2099-12-31' },
                ],
            });
        });

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            const habitsCard = screen.getByTestId(`dashboard-card-${ViewState.HABITS}`);
            expect(habitsCard.getAttribute('data-stats-alert')).toBe('true');
        });
    });

    // -----------------------------------------------------------------------
    // Sunday isSunday branch in dashboardCards
    // -----------------------------------------------------------------------
    it('shows "HOJE" stats on Sunday card when today is Sunday', async () => {
        const getDaySpy = vi.spyOn(global.Date.prototype, 'getDay').mockReturnValue(0); // 0 is Sunday

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            const sundayCard = screen.getByTestId(`dashboard-card-${ViewState.SUNDAY}`);
            expect(sundayCard.getAttribute('data-stats')).toBe('HOJE');
        });

        getDaySpy.mockRestore();
    });

    // -----------------------------------------------------------------------
    // Render each non-dashboard view
    // -----------------------------------------------------------------------
    const viewTestCases = [
        { view: ViewState.WORK, testId: 'work-view' },
        { view: ViewState.REST, testId: 'rest-view' },
        { view: ViewState.TOOLS, testId: 'tools-view' },
        { view: ViewState.READING, testId: 'reading-view' },
        { view: ViewState.PROGRESS, testId: 'progress-view' },
        { view: ViewState.HABITS, testId: 'habits-view' },
        { view: ViewState.JOURNAL, testId: 'journal-view' },
        { view: ViewState.SETTINGS, testId: 'settings-view' },
        { view: ViewState.SKILLS, testId: 'skills-view' },
        { view: ViewState.LINKS, testId: 'links-view' },
        { view: ViewState.SUNDAY, testId: 'sunday-view' },
        { view: ViewState.GAMES, testId: 'games-view' },
        { view: ViewState.POMODORO, testId: 'pomodoro-view' },
        { view: ViewState.AULAS, testId: 'aulas-view' },
    ] as const;

    it.each(viewTestCases)('renders $testId when activeView is $view', async ({ view, testId }) => {
        setActiveView(view);
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByTestId(testId)).toBeInTheDocument();
        });
        // Floating widgets are hidden on non-dashboard views
        expect(screen.queryByTestId('timer-widget')).not.toBeInTheDocument();
        expect(screen.queryByTestId('task-notification-widget')).not.toBeInTheDocument();
    });

    it('renders "View not found" for an unknown ViewState value (default branch)', async () => {
        uiState.activeView = 'UNKNOWN_VIEW' as ViewState;
        vi.mocked(useUIStore).mockImplementation(
            (selector: any) => (typeof selector === 'function' ? selector(uiState) : uiState)
        );

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText('View not found')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // SundayTimerWidget — navigates to SUNDAY on click
    // -----------------------------------------------------------------------
    it('clicking SundayTimerWidget navigates to SUNDAY view', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId('sunday-timer-widget')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('sunday-timer-widget'));
        expect(uiState.setActiveView).toHaveBeenCalledWith(ViewState.SUNDAY);
    });

    // -----------------------------------------------------------------------
    // TimerWidget — navigates to TOOLS on click
    // -----------------------------------------------------------------------
    it('clicking TimerWidget navigates to TOOLS view', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId('timer-widget')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('timer-widget'));
        expect(uiState.setActiveView).toHaveBeenCalledWith(ViewState.TOOLS);
    });

    // -----------------------------------------------------------------------
    // CONCURSO warm on hover
    // -----------------------------------------------------------------------
    it('hovering the Concurso card triggers warmConcursoEntryPoint', async () => {
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId(`dashboard-card-${ViewState.CONCURSO}`)).toBeInTheDocument());

        fireEvent.mouseEnter(screen.getByTestId(`dashboard-card-${ViewState.CONCURSO}`));
        expect(mockWarmConcurso).toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // headerTitle on non-dashboard views
    // -----------------------------------------------------------------------
    it('header shows the card title when on a non-dashboard view', async () => {
        setActiveView(ViewState.READING);
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Leitura');
        });
    });

    it('header falls back to "Configurações" text for SETTINGS view', async () => {
        setActiveView(ViewState.SETTINGS);
        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Configurações');
        });
    });

    // -----------------------------------------------------------------------
    // handleBack — history.length === 1 (no history.back call)
    // -----------------------------------------------------------------------
    it('handleBack with internal state does not call history.back when history.length is 1', async () => {
        const tab = { id: 'tab-1', view: ViewState.JOURNAL, label: 'Diário', state: { activeNoteId: 'note-1' }, createdAt: Date.now() };
        tabState.tabs = [tab];
        tabState.activeTabId = 'tab-1';
        setActiveView(ViewState.JOURNAL);

        // Ensure history.length === 1 by overriding the getter
        Object.defineProperty(window.history, 'length', {
            configurable: true,
            get: () => 1,
        });

        const backSpy = vi.spyOn(window.history, 'back').mockImplementation(vi.fn());

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

        expect(tabState.updateTabState).toHaveBeenCalled();
        expect(backSpy).not.toHaveBeenCalled();

        // Restore
        Object.defineProperty(window.history, 'length', { configurable: true, get: () => window.history.length });
        backSpy.mockRestore();
    });

    // -----------------------------------------------------------------------
    // Additional branch coverage tests
    // -----------------------------------------------------------------------
    it('covers aulasStats formatting for 1 course and 0% progress', async () => {
        vi.mocked(useDashboardStats).mockReturnValueOnce({
            readingStats: { readingCount: 0, completedCount: 0, totalCount: 0, progressPercent: 0 },
            aulasStats: { totalBooks: 1, totalChapters: 10, readChapters: 0, progressPercent: 0 },
        });

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText('1 curso • 0/10 aulas')).toBeInTheDocument();
            const aulasCard = screen.getByTestId(`dashboard-card-${ViewState.AULAS}`);
            expect(aulasCard.getAttribute('data-stats')).toBeNull();
        });
    });

    it('shows "Faltam 1 dia" when daysUntilStart is 1', async () => {
        vi.mocked(calculateCurrentDay).mockReturnValue(0);
        vi.mocked(getDaysUntilStart).mockReturnValue(1);

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText('Faltam 1 dia para começar')).toBeInTheDocument();
        });

        // Restore
        vi.mocked(calculateCurrentDay).mockReturnValue(10);
        vi.mocked(getDaysUntilStart).mockReturnValue(0);
    });

    it('shows "Visitante" label when user is a guest', async () => {
        const guest: User = { id: 'guest-123', name: 'Guest User', email: 'guest@example.com', isGuest: true };
        render(<WorkspaceApp user={guest} onLogout={onLogout} />);
        await waitFor(() => {
            expect(screen.getByText('Visitante')).toBeInTheDocument();
        });
    });

    it('covers getViewLabel fallback to view string for unknown view', async () => {
        tabState.tabs = [{ id: 'tab-1', view: ViewState.WORK, label: 'Trabalho', state: {} }];

        render(<WorkspaceApp user={mockUser} onLogout={onLogout} />);
        await waitFor(() => expect(screen.getByTestId('card-click-unknown-WORK')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('card-click-unknown-WORK'));
        expect(tabState.addTab).toHaveBeenCalledWith('UNKNOWN_VIEW', 'UNKNOWN_VIEW');
    });
});
