import React from 'react';

// Generic skeleton wrapper
const SkeletonPulse: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-800 rounded-2xl ${className}`} />
);

// Skeleton for chart containers
export const ChartSkeleton: React.FC = () => (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
            <div className="h-5 w-32 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="h-[250px] bg-slate-900/50 rounded-xl animate-pulse" />
    </div>
);

// Skeleton for HabitsView
export const HabitsViewSkeleton: React.FC = () => (
    <div className="space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <SkeletonPulse className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                    <SkeletonPulse className="h-6 w-40" />
                    <SkeletonPulse className="h-4 w-24" />
                </div>
            </div>
            <SkeletonPulse className="h-10 w-32 rounded-xl" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
                <SkeletonPulse key={i} className="h-10 w-24 rounded-xl" />
            ))}
        </div>

        {/* Cards */}
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                <SkeletonPulse key={i} className="h-28 rounded-2xl" />
            ))}
        </div>
    </div>
);

// Skeleton for ReadingView
export const ReadingViewSkeleton: React.FC = () => (
    <div className="space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <SkeletonPulse className="w-12 h-12 rounded-xl" />
                <SkeletonPulse className="h-6 w-48" />
            </div>
            <div className="flex gap-2">
                <SkeletonPulse className="h-10 w-10 rounded-xl" />
                <SkeletonPulse className="h-10 w-32 rounded-xl" />
            </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-hidden">
            {[...Array(4)].map((_, i) => (
                <SkeletonPulse key={i} className="h-10 w-28 rounded-xl flex-shrink-0" />
            ))}
        </div>

        {/* Book grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
                <SkeletonPulse key={i} className="h-48 rounded-2xl" />
            ))}
        </div>
    </div>
);

// Skeleton for SkillsView
export const SkillsViewSkeleton: React.FC = () => (
    <div className="space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <SkeletonPulse className="w-12 h-12 rounded-xl" />
                <SkeletonPulse className="h-6 w-40" />
            </div>
            <SkeletonPulse className="h-10 w-36 rounded-xl" />
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
                <SkeletonPulse key={i} className="h-40 rounded-2xl" />
            ))}
        </div>
    </div>
);

// Skeleton for ProgressView
export const ProgressViewSkeleton: React.FC = () => (
    <div className="space-y-6 animate-in fade-in">
        {/* Tabs */}
        <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
                <SkeletonPulse key={i} className="h-10 w-28 rounded-xl" />
            ))}
        </div>

        {/* Hero card */}
        <SkeletonPulse className="h-48 rounded-3xl" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <SkeletonPulse key={i} className="h-32 rounded-2xl" />
            ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonPulse className="lg:col-span-2 h-[300px] rounded-2xl" />
            <SkeletonPulse className="h-[300px] rounded-2xl" />
        </div>
    </div>
);

// Generic view skeleton for smaller views
export const GenericViewSkeleton: React.FC = () => (
    <div className="space-y-6 animate-in fade-in">
        <SkeletonPulse className="h-16 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
                <SkeletonPulse key={i} className="h-32 rounded-2xl" />
            ))}
        </div>
    </div>
);
