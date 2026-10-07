import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { useConfigStore } from '../../stores/configStore';
import { ProjectConfig } from '../../types';

describe('configStore sanitization', () => {
    beforeEach(() => {
        useConfigStore.getState()._reset();
    });

    it('replaces non-finite offensive numbers with safe defaults on hydration', () => {
        useConfigStore.getState()._hydrateFromFirestore({
            config: {
                startDate: '2026-01-01T03:00:00.000Z',
                userName: 'Ana',
                isGuest: false,
                offensiveGoals: {
                    minimumPercentage: Number.NaN,
                    enabledModules: { skills: true, reading: false },
                    categoryWeights: { skills: Number.NaN, reading: Infinity },
                    focusSkills: [
                        { skillId: 'ok', weight: 30 },
                        { skillId: 'bad', weight: Number.NaN },
                    ],
                },
            } as ProjectConfig,
        });

        const offensive = useConfigStore.getState().config.offensiveGoals!;
        expect(offensive.minimumPercentage).toBe(50);
        expect(offensive.categoryWeights).toEqual({ skills: 60, reading: 40 });
        expect(offensive.focusSkills).toEqual([{ skillId: 'ok', weight: 30 }]);
    });

    it('defaults restartCount to 0 when missing (never NaN)', () => {
        useConfigStore.getState()._hydrateFromFirestore({
            config: { startDate: '2026-01-01T03:00:00.000Z', userName: '', isGuest: false, restartCount: undefined } as ProjectConfig,
        });
        expect(useConfigStore.getState().config.restartCount).toBe(0);
    });

    it('ignores unknown themes', () => {
        useConfigStore.getState()._hydrateFromFirestore(null);
        useConfigStore.getState().setConfig({ theme: 'neon' as unknown as ProjectConfig['theme'] });
        expect(useConfigStore.getState().config.theme).toBe('default');
    });
});
