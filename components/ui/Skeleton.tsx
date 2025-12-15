import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = React.memo(({ className = '' }) => {
    return (
        <div
            className={`animate-pulse bg-slate-700/50 rounded ${className}`}
            aria-hidden="true"
        />
    );
});

Skeleton.displayName = 'Skeleton';
