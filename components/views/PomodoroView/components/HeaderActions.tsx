import React from 'react';
import { Crown, Users, Leaf, Trophy, BarChart2, Bell, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';

export function HeaderActions() {
  const { setReportOpen, setSettingsOpen } = useStore();
  
  return (
    <div className="flex items-center space-x-2 text-[var(--color-text-muted)]">
      <button className="p-2 hover:bg-[var(--color-surface)] rounded-md transition-colors hover:text-yellow-500">
        <Crown className="w-4 h-4" />
      </button>
      <button className="p-2 hover:bg-[var(--color-surface)] rounded-md transition-colors hover:text-[var(--color-text)]">
        <Users className="w-4 h-4" />
      </button>
      <button className="p-2 hover:bg-[var(--color-surface)] rounded-md transition-colors hover:text-green-500">
        <Leaf className="w-4 h-4" />
      </button>
      <button className="p-2 hover:bg-[var(--color-surface)] rounded-md transition-colors hover:text-yellow-400">
        <Trophy className="w-4 h-4" />
      </button>
      <button 
        type="button"
        onClick={() => setReportOpen(true)}
        className="p-2 hover:bg-[var(--color-surface)] rounded-md transition-colors hover:text-[var(--color-text)]"
      >
        <BarChart2 className="w-4 h-4" />
      </button>
      <button className="p-2 hover:bg-[var(--color-surface)] rounded-md transition-colors hover:text-[var(--color-text)]">
        <Bell className="w-4 h-4" />
      </button>
      <button 
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setSettingsOpen(true);
        }}
        className="p-2 hover:bg-[var(--color-surface)] rounded-md transition-colors hover:text-[var(--color-text)]"
        title="Configurações"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}
