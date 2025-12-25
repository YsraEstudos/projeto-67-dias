import React, { useRef, useCallback } from 'react';
import { X, Home } from 'lucide-react';
import { useTabStore, Tab } from '../../stores/tabStore';
import { ViewState } from '../../types';
import { useUIStore } from '../../stores';
import { useShallow } from 'zustand/react/shallow';

// Memoized Tab Item for performance
const TabItem = React.memo<{
    tab: Tab;
    isActive: boolean;
    onTabClick: (tabId: string, view: ViewState) => void;
    onCloseTab: (e: React.MouseEvent, tabId: string) => void;
}>(({ tab, isActive, onTabClick, onCloseTab }) => (
    <div
        onClick={() => onTabClick(tab.id, tab.view)}
        className={`
            group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer select-none
            min-w-[120px] max-w-[200px] hover:pr-8
            ${isActive
                ? 'bg-slate-800 border-slate-700 text-slate-200 shadow-sm'
                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800/30 hover:text-slate-300'
            }
        `}
    >
        <span className="truncate flex-1">{tab.label}</span>

        <button
            onClick={(e) => onCloseTab(e, tab.id)}
            className={`
                absolute right-1 p-1 rounded-md transition-all
                ${isActive ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700' : 'opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-slate-800'}
            `}
        >
            <X size={12} />
        </button>
    </div>
));

TabItem.displayName = 'TabItem';

export const TabBar: React.FC = React.memo(() => {
    // Use useShallow to prevent unnecessary re-renders
    const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore(
        useShallow((state) => ({
            tabs: state.tabs,
            activeTabId: state.activeTabId,
            setActiveTab: state.setActiveTab,
            closeTab: state.closeTab,
        }))
    );

    const setActiveView = useUIStore((state) => state.setActiveView);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleHomeClick = useCallback(() => {
        setActiveTab(''); // Clear active tab to show dashboard
        setActiveView(ViewState.DASHBOARD);
    }, [setActiveTab, setActiveView]);

    const handleTabClick = useCallback((tabId: string, view: ViewState) => {
        setActiveTab(tabId);
        setActiveView(view);
    }, [setActiveTab, setActiveView]);

    const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        const isClosingActiveTab = tabId === activeTabId;
        const tabCount = tabs.length;

        closeTab(tabId);

        // If we closed the last tab, go to dashboard
        if (tabCount <= 1) {
            setActiveView(ViewState.DASHBOARD);
        } else if (isClosingActiveTab) {
            // Get remaining tabs and navigate to the new active one
            const remainingTabs = tabs.filter(t => t.id !== tabId);
            if (remainingTabs.length > 0) {
                const newActiveTab = remainingTabs[remainingTabs.length - 1];
                setActiveView(newActiveTab.view);
            } else {
                setActiveView(ViewState.DASHBOARD);
            }
        }
    }, [activeTabId, tabs, closeTab, setActiveView]);

    if (tabs.length === 0) return null;

    return (
        <div className="w-full bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center px-2 py-1 gap-1 overflow-x-auto scrollbar-hide">
            {/* Home/Dashboard Button */}
            <button
                onClick={handleHomeClick}
                className={`flex items-center justify-center p-2 rounded-lg transition-colors min-w-[36px] ${!activeTabId
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                    }`}
                title="Dashboard"
            >
                <Home size={16} />
            </button>

            {/* Separator */}
            <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

            {/* Tabs - Memoized for performance */}
            <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide" ref={scrollRef}>
                {tabs.map((tab) => (
                    <TabItem
                        key={tab.id}
                        tab={tab}
                        isActive={tab.id === activeTabId}
                        onTabClick={handleTabClick}
                        onCloseTab={handleCloseTab}
                    />
                ))}
            </div>
        </div>
    );
});

TabBar.displayName = 'TabBar';
