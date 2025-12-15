import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFirebaseStorage } from './persistMiddleware';

export interface WaterLog {
    amount: number; // in ml
    goal: number;   // in ml
}

export interface BottleType {
    id: string;
    label: string;
    amount: number; // in ml
    icon?: string; // optional emoji or icon name
    color?: string; // optional custom color
}

// Validation constants for bottle amounts
const MIN_BOTTLE_AMOUNT = 50;   // minimum 50ml
const MAX_BOTTLE_AMOUNT = 5000; // maximum 5L
const MAX_BOTTLES = 12;         // maximum number of bottles

// Default bottle types
const DEFAULT_BOTTLES: BottleType[] = [
    { id: 'copo', label: 'Copo', amount: 200, icon: '🥛', color: '#60a5fa' },
    { id: 'garrafa-pequena', label: 'Garrafa Pequena', amount: 300, icon: '🧴', color: '#34d399' },
    { id: 'garrafa-media', label: 'Garrafa Média', amount: 500, icon: '🍶', color: '#a78bfa' },
    { id: 'garrafa-grande', label: 'Garrafa Grande', amount: 600, icon: '🫗', color: '#22d3ee' },
    { id: 'garrafa-1l', label: 'Garrafa 1L', amount: 1000, icon: '💧', color: '#2dd4bf' },
    { id: 'mega-garrafa', label: 'Mega Garrafa', amount: 1700, icon: '🏋️', color: '#f97316' },
];

interface WaterState {
    today: string; // YYYY-MM-DD
    currentAmount: number;
    dailyGoal: number;
    history: Record<string, WaterLog>; // date -> log
    bottles: BottleType[]; // Custom bottle types

    // Actions
    addWater: (amount: number, date: string) => void;
    removeWater: (amount: number, date: string) => void;
    setGoal: (amount: number) => void;
    checkDate: (date: string) => void;

    // Bottle management
    addBottle: (bottle: Omit<BottleType, 'id'>) => void;
    updateBottle: (id: string, updates: Partial<Omit<BottleType, 'id'>>) => void;
    removeBottle: (id: string) => void;
    resetBottlesToDefault: () => void;
}

export const useWaterStore = create<WaterState>()(
    persist(
        (set, get) => ({
            today: new Date().toISOString().split('T')[0],
            currentAmount: 0,
            dailyGoal: 2500,
            history: {},
            bottles: DEFAULT_BOTTLES,

            addWater: (amount, date) => set((state) => {
                const currentLog = state.history[date] || { amount: 0, goal: state.dailyGoal };
                const newAmount = currentLog.amount + amount;

                return {
                    currentAmount: date === state.today ? newAmount : state.currentAmount,
                    history: {
                        ...state.history,
                        [date]: { ...currentLog, amount: newAmount }
                    }
                };
            }),

            removeWater: (amount, date) => set((state) => {
                const currentLog = state.history[date] || { amount: 0, goal: state.dailyGoal };
                const newAmount = Math.max(0, currentLog.amount - amount);

                return {
                    currentAmount: date === state.today ? newAmount : state.currentAmount,
                    history: {
                        ...state.history,
                        [date]: { ...currentLog, amount: newAmount }
                    }
                };
            }),

            setGoal: (goal) => set((state) => ({
                dailyGoal: goal,
                // Update today's goal if exists
                history: {
                    ...state.history,
                    [state.today]: {
                        ...(state.history[state.today] || { amount: 0 }),
                        goal: goal
                    }
                }
            })),

            checkDate: (date) => set((state) => {
                // If the provided date (usually today) is different from stored today, update reference
                // This ensures we are always tracking the correct "currentAmount" for display
                if (date !== state.today) {
                    return { today: date };
                }
                return {};
            }),

            // Bottle management actions
            addBottle: (bottle) => set((state) => {
                // Security validations
                if (state.bottles.length >= MAX_BOTTLES) return {}; // Limit max bottles

                const sanitizedAmount = Math.min(MAX_BOTTLE_AMOUNT, Math.max(MIN_BOTTLE_AMOUNT, bottle.amount));
                const sanitizedLabel = bottle.label.slice(0, 30).trim(); // Max 30 chars

                if (!sanitizedLabel) return {}; // Require label

                return {
                    bottles: [
                        ...state.bottles,
                        {
                            label: sanitizedLabel,
                            amount: sanitizedAmount,
                            icon: bottle.icon?.slice(0, 4) || '💧', // Limit emoji length
                            color: bottle.color || '#22d3ee',
                            id: `bottle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        }
                    ]
                };
            }),

            updateBottle: (id, updates) => set((state) => ({
                bottles: state.bottles.map((bottle) => {
                    if (bottle.id !== id) return bottle;

                    // Apply validations to updates
                    const sanitizedUpdates: Partial<BottleType> = {};

                    if (updates.label !== undefined) {
                        sanitizedUpdates.label = updates.label.slice(0, 30).trim() || bottle.label;
                    }
                    if (updates.amount !== undefined) {
                        sanitizedUpdates.amount = Math.min(MAX_BOTTLE_AMOUNT, Math.max(MIN_BOTTLE_AMOUNT, updates.amount));
                    }
                    if (updates.icon !== undefined) {
                        sanitizedUpdates.icon = updates.icon.slice(0, 4);
                    }
                    if (updates.color !== undefined) {
                        sanitizedUpdates.color = updates.color;
                    }

                    return { ...bottle, ...sanitizedUpdates };
                })
            })),

            removeBottle: (id) => set((state) => ({
                bottles: state.bottles.filter((bottle) => bottle.id !== id)
            })),

            resetBottlesToDefault: () => set({ bottles: DEFAULT_BOTTLES })
        }),
        {
            name: 'p67_water_store',
            storage: createFirebaseStorage('p67_water_store'),
            partialize: (state) => ({
                dailyGoal: state.dailyGoal,
                history: state.history,
                today: state.today,
                bottles: state.bottles
            }),
        }
    )
);
