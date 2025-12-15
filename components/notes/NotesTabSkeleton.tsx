import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const NotesTabSkeleton: React.FC = () => {
    return (
        <div className="animate-in fade-in duration-500 w-full">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="w-32 h-12 rounded-xl" />
            </div>

            {/* Search and Sort Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Notes Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-2xl p-5 border border-slate-700 h-64 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-6 rounded" />
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-auto" />

                        <div className="flex gap-2 mt-4">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
