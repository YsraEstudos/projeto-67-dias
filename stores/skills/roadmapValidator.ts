// Shared roadmap validation and normalization helpers
import { SkillRoadmapItem } from '../../types';

export const MAX_ROADMAP_BYTES = 200 * 1024; // 200KB client-side guard
export const MAX_ROADMAP_ITEMS = 500; // prevent oversized imports/updates
const MAX_DEPTH = 6; // avoid deeply nested structures that could hang the UI

const isPlainObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === 'object' && val !== null && Object.getPrototypeOf(val) === Object.prototype;

const isPoisonKey = (key: string) => key === '__proto__' || key === 'constructor' || key === 'prototype';

const clampTitle = (title: string) => title.slice(0, 200);

const sanitizeItem = (item: unknown, depth: number): SkillRoadmapItem | null => {
    if (depth > MAX_DEPTH) return null;
    if (!isPlainObject(item)) return null;

    const { id, title, isCompleted, type, subTasks } = item as Record<string, unknown>;
    if (typeof id !== 'string' || isPoisonKey(id)) return null;
    if (typeof title !== 'string') return null;

    const cleaned: SkillRoadmapItem = {
        id,
        title: clampTitle(title),
        isCompleted: Boolean(isCompleted),
        type: type === 'SECTION' ? 'SECTION' : 'TASK'
    };

    if (Array.isArray(subTasks)) {
        const cleanedSubs = subTasks
            .map((sub) => sanitizeItem(sub, depth + 1))
            .filter(Boolean) as SkillRoadmapItem[];
        if (cleanedSubs.length) cleaned.subTasks = cleanedSubs;
    }

    return cleaned;
};

const countItems = (items: SkillRoadmapItem[]): number =>
    items.reduce((acc, item) => acc + 1 + (item.subTasks ? countItems(item.subTasks) : 0), 0);

export const normalizeRoadmap = (input: unknown): SkillRoadmapItem[] | null => {
    const raw = Array.isArray(input)
        ? input
        : isPlainObject(input) && Array.isArray((input as Record<string, unknown>).roadmap)
            ? (input as Record<string, unknown>).roadmap
            : null;

    if (!raw) return null;

    const sanitized = raw
        .map((item) => sanitizeItem(item, 0))
        .filter(Boolean) as SkillRoadmapItem[];

    if (!sanitized.length) return null;

    const total = countItems(sanitized);
    if (total > MAX_ROADMAP_ITEMS) return null;

    return sanitized;
};
