import React from 'react';
import { ThemeKey, THEMES } from './constants';

interface ThemePickerProps {
    selectedTheme: ThemeKey;
    onSelect: (theme: ThemeKey) => void;
}

/**
 * Available theme options for consistent color selection across the app.
 */
const THEME_OPTIONS: ThemeKey[] = ['emerald', 'blue', 'purple', 'amber', 'rose'];

/**
 * Mapping of theme keys to their Tailwind background color classes.
 */
const THEME_COLORS: Record<ThemeKey, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
};

/**
 * Reusable theme color picker component.
 */
export const ThemePicker: React.FC<ThemePickerProps> = ({ selectedTheme, onSelect }) => {
    return (
        <div className="flex gap-3">
            {THEME_OPTIONS.map(themeKey => (
                <button
                    key={themeKey}
                    onClick={() => onSelect(themeKey)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedTheme === themeKey
                            ? 'border-white scale-110'
                            : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                    title={themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
                >
                    <div className={`w-full h-full rounded-full ${THEME_COLORS[themeKey]}`}></div>
                </button>
            ))}
        </div>
    );
};
