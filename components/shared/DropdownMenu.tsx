import React from 'react';
import { Settings } from 'lucide-react';

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
    onClick: () => void;
}

interface DropdownMenuProps {
    isOpen: boolean;
    onClose: () => void;
    items: MenuItem[];
}

/**
 * Reusable dropdown menu component with overlay backdrop.
 * Provides consistent styling for menu items with icons.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({ isOpen, onClose, items }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay to close menu on outside click */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Menu Content */}
            <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.onClick}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-all group text-left"
                        >
                            <div className="p-2 bg-slate-600/30 rounded-lg text-slate-400 group-hover:bg-slate-600/50 group-hover:text-slate-300 transition-colors">
                                {item.icon}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white">{item.label}</div>
                                {item.sublabel && (
                                    <div className="text-xs text-slate-400">{item.sublabel}</div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default DropdownMenu;
