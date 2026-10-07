import { SubHabit } from '../../types';

/**
 * Rebuilds sub-habits from the edited titles, reusing the IDs of existing
 * sub-habits with the same title. Regenerating every ID on save would orphan
 * the `subHabitsCompleted` entries stored in the habit history.
 */
export const buildSubHabits = (titles: string[], existing: SubHabit[] = []): SubHabit[] => {
    const available = [...existing];
    const stamp = Date.now();
    return titles.map((title, i) => {
        const idx = available.findIndex(s => s.title === title);
        if (idx !== -1) {
            const [match] = available.splice(idx, 1);
            return { id: match.id, title };
        }
        return { id: `sh_${stamp}_${i}`, title };
    });
};
