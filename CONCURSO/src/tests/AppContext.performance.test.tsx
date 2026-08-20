import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppProvider,
  LOCAL_SNAPSHOT_DEBOUNCE_MS,
  useAppActionsContext,
  useAppContext,
} from '../app/AppContext';
import * as storage from '../app/storage';

const dateState = vi.hoisted(() => ({
  currentLocalToday: '2026-09-15',
}));

vi.mock('../app/dateUtils', async () => {
  const actual = await vi.importActual<typeof import('../app/dateUtils')>('../app/dateUtils');

  return {
    ...actual,
    getLocalTodayIsoDate: vi.fn(() => dateState.currentLocalToday),
  };
});

vi.mock('../app/storage', async () => {
  const actual = await vi.importActual<typeof import('../app/storage')>('../app/storage');
  return {
    ...actual,
    loadStateSnapshot: vi.fn(() => null),
    saveStateSnapshot: vi.fn(),
  };
});

const RerenderProbe = () => {
  const { state, setSelectedDate } = useAppContext();

  return (
    <>
      <button type="button" onClick={() => setSelectedDate('2026-08-21')}>
        atualizar data
      </button>
      <p data-testid="selected-date">{state.selectedDate}</p>
    </>
  );
};

const BatchProbe = () => {
  const { state, setSelectedDate } = useAppContext();

  return (
    <>
      <button type="button" onClick={() => setSelectedDate('2026-08-21')}>
        primeira mudanca
      </button>
      <button type="button" onClick={() => setSelectedDate('2026-08-22')}>
        segunda mudanca
      </button>
      <p data-testid="batch-date">{state.selectedDate}</p>
    </>
  );
};

const ActionsOnlyProbe = () => {
  const renders = useRef(0);
  const { setDailyNote } = useAppActionsContext();
  // eslint-disable-next-line react-hooks/refs
  renders.current += 1;

  return (
    <>
      <button type="button" onClick={() => setDailyNote('2026-08-21', 'nota rapida')}>
        salvar nota
      </button>
      {/* eslint-disable-next-line react-hooks/refs */}
      <p data-testid="actions-only-renders">{renders.current}</p>
    </>
  );
};

describe('AppContext performance safeguards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    dateState.currentLocalToday = '2026-09-15';
    vi.useRealTimers();
  });

  it('nao rele o snapshot local a cada rerender do provider', async () => {
    render(
      <AppProvider>
        <RerenderProbe />
      </AppProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'atualizar data' }));

    await waitFor(() => {
      expect(screen.getByTestId('selected-date')).toHaveTextContent('2026-08-21');
    });

    expect(storage.loadStateSnapshot).toHaveBeenCalledTimes(1);
  });

  it('agrupa persistencias locais em mudancas rapidas de estado', () => {
    vi.useFakeTimers();

    render(
      <AppProvider>
        <BatchProbe />
      </AppProvider>,
    );

    act(() => {
      vi.advanceTimersByTime(LOCAL_SNAPSHOT_DEBOUNCE_MS + 5);
    });

    vi.mocked(storage.saveStateSnapshot).mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'primeira mudanca' }));
    fireEvent.click(screen.getByRole('button', { name: 'segunda mudanca' }));

    expect(storage.saveStateSnapshot).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(LOCAL_SNAPSHOT_DEBOUNCE_MS - 1);
    });

    expect(storage.saveStateSnapshot).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(storage.saveStateSnapshot).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('batch-date')).toHaveTextContent('2026-08-22');
  });

  it('mantem consumidores apenas de acoes fora de rerenders de estado', async () => {
    render(
      <AppProvider>
        <ActionsOnlyProbe />
      </AppProvider>,
    );

    expect(screen.getByTestId('actions-only-renders')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'salvar nota' }));

    await waitFor(() => {
      expect(storage.saveStateSnapshot).toHaveBeenCalled();
    });

    expect(screen.getByTestId('actions-only-renders')).toHaveTextContent('1');
  });

  it('sincroniza a data ativa ao cruzar a meia-noite e persiste a troca', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'));

    const MidnightProbe = () => {
      const { state } = useAppContext();

      return <p data-testid="midnight-date">{state.selectedDate}</p>;
    };

    render(
      <AppProvider>
        <MidnightProbe />
      </AppProvider>,
    );

    expect(screen.getByTestId('midnight-date')).toHaveTextContent('2026-09-15');

    act(() => {
      vi.advanceTimersByTime(LOCAL_SNAPSHOT_DEBOUNCE_MS + 1);
    });

    vi.mocked(storage.saveStateSnapshot).mockClear();
    dateState.currentLocalToday = '2026-09-16';

    act(() => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      vi.advanceTimersByTime(nextMidnight.getTime() - now.getTime() + 1);
    });

    expect(screen.getByTestId('midnight-date')).toHaveTextContent('2026-09-16');

    act(() => {
      vi.advanceTimersByTime(LOCAL_SNAPSHOT_DEBOUNCE_MS + 1);
    });

    expect(storage.saveStateSnapshot).toHaveBeenCalled();
    const lastSavedState = vi.mocked(storage.saveStateSnapshot).mock.calls.at(-1)?.[0];
    expect(lastSavedState?.selectedDate).toBe('2026-09-16');
  });
});
