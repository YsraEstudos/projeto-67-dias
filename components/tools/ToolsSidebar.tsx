import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ToolType = 'calc' | 'convert' | 'currency' | 'text' | 'clicker' | 'time' | 'breathing' | 'focus';

interface ToolMenuItem {
    id: ToolType;
    icon: LucideIcon;
    label: string;
}

interface ToolsSidebarProps {
    activeTool: ToolType;
    onSelectTool: (tool: ToolType) => void;
    menuItems: ToolMenuItem[];
}

export const ToolsSidebar: React.FC<ToolsSidebarProps> = ({ activeTool, onSelectTool, menuItems }) => {
    return (
        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onSelectTool(item.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all min-w-[160px] ${activeTool === item.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                </button>
            ))}
        </div>
    );
};
