import { RestActivity, RestActivitySeries } from '../types';
import { generateId } from './generateId';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const createRestSeries = (
    total: number,
    existingSeries: Partial<RestActivitySeries>[] = [],
    completedFallback = 0,
): RestActivitySeries[] => {
    const normalizedTotal = Math.max(1, total);
    const fallbackCompleted = clamp(completedFallback, 0, normalizedTotal);

    return Array.from({ length: normalizedTotal }, (_, index) => {
        const existing = existingSeries[index];
        const isCompleted = existing?.isCompleted ?? index < fallbackCompleted;

        return {
            id: existing?.id || generateId(),
            label: existing?.label?.trim() || `Série ${index + 1}`,
            isCompleted,
            completedAt: isCompleted ? existing?.completedAt : undefined,
            order: typeof existing?.order === 'number' ? existing.order : index,
        };
    });
};

export const getRestActivitySeriesStats = (activity: RestActivity) => {
    const total = activity.series?.length || 0;
    const completed = activity.series?.filter((series) => series.isCompleted).length || 0;

    return {
        hasSeries: total > 0,
        total,
        completed,
    };
};

export const normalizeRestActivity = (activity: RestActivity): RestActivity => {
    const explicitSeries = [...(activity.series || [])].sort((left, right) => left.order - right.order);
    const shouldUseSeries = explicitSeries.length > 0 || Boolean(activity.totalSets && activity.totalSets > 0);

    if (shouldUseSeries) {
        const totalFromLegacy = explicitSeries.length > 0
            ? explicitSeries.length
            : Math.max(1, activity.totalSets || 1);
        const fallbackCompleted = clamp(activity.completedSets || 0, 0, totalFromLegacy);
        const series = createRestSeries(totalFromLegacy, explicitSeries, fallbackCompleted);
        const completedSets = series.filter((item) => item.isCompleted).length;

        return {
            ...activity,
            series,
            totalSets: series.length,
            completedSets,
            isCompleted: completedSets === series.length,
        };
    }

    return {
        ...activity,
        series: undefined,
        totalSets: undefined,
        completedSets: undefined,
        isCompleted: Boolean(activity.isCompleted),
        completedAt: activity.isCompleted ? activity.completedAt : undefined,
    };
};

export const toggleRestActivitySeries = (activity: RestActivity, seriesId: string): RestActivity => {
    const normalized = normalizeRestActivity(activity);

    if (!normalized.series?.length) {
        return normalized;
    }

    return normalizeRestActivity({
        ...normalized,
        series: normalized.series.map((series) => {
            if (series.id !== seriesId) {
                return series;
            }

            const isCompleted = !series.isCompleted;
            return {
                ...series,
                isCompleted,
                completedAt: isCompleted ? Date.now() : undefined,
            };
        }),
    });
};

export const toggleRestActivityQuickComplete = (activity: RestActivity): RestActivity => {
    const normalized = normalizeRestActivity(activity);

    if (normalized.series?.length) {
        const nextPending = normalized.series.find((series) => !series.isCompleted);
        if (nextPending) {
            return toggleRestActivitySeries(normalized, nextPending.id);
        }

        const lastCompleted = [...normalized.series]
            .sort((left, right) => right.order - left.order)
            .find((series) => series.isCompleted);

        return lastCompleted ? toggleRestActivitySeries(normalized, lastCompleted.id) : normalized;
    }

    const nextCompleted = !normalized.isCompleted;

    return {
        ...normalized,
        isCompleted: nextCompleted,
        completedAt: nextCompleted ? Date.now() : undefined,
    };
};
