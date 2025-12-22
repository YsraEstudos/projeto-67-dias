import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsCategoryProps {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBgColor: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

export const SettingsCategory: React.FC<SettingsCategoryProps> = memo(({
    title,
    description,
    icon,
    iconBgColor,
    isExpanded,
    onToggle,
    children
}) => {
    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            {/* Header - Clickable Macro Level */}
            <button
                onClick={onToggle}
                className="w-full p-4 sm:p-6 flex items-center gap-3 sm:gap-4 hover:bg-slate-750 transition-colors text-left group"
            >
                <div className={`p-2 sm:p-3 rounded-xl ${iconBgColor}`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 truncate">
                        {description}
                    </p>
                </div>
                <ChevronRight
                    size={20}
                    className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-1'
                        }`}
                />
            </button>

            {/* Content - Micro Level (Expandable) */}
            <div
                className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-slate-700">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
});

SettingsCategory.displayName = 'SettingsCategory';

export default SettingsCategory;
