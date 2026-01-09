import React, { useState, useMemo, useEffect, Suspense } from 'react';
import {
    Book, Calendar, Plus, Trash2,
    Smile, Meh, Frown, CloudRain, Zap, Quote, Target, PenLine
} from 'lucide-react';
import { useJournalStore, JournalEntry } from '../../stores/journalStore';
import { useTabStore } from '../../stores/tabStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigationHistory } from '../../hooks/useNavigationHistory';
import { useStreakTracking } from '../../hooks/useStreakTracking';

import { Mood, MOOD_CONFIG } from '../../types';

// Lazy load components
const GoalsTab = React.lazy(() => import('../journal/GoalsTab'));
const EntryTypeSelector = React.lazy(() => import('../journal/EntryTypeSelector'));
const DrawingCanvas = React.lazy(() => import('../journal/DrawingCanvas'));

// Extended entry for UI
type UIJournalEntry = JournalEntry;

// --- MOCK DATA ---
const INITIAL_ENTRIES: UIJournalEntry[] = [
    {
        id: `initial_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        content: "Hoje foi um dia produtivo. Consegui finalizar o módulo de trabalho do projeto. Me sinto um pouco cansado, mas satisfeito com o progresso.",
        mood: 'great', // Matches Mood type
        entryType: 'text',
        createdAt: Date.now(),
        updatedAt: Date.now()
    }
];

// --- COMPONENTS ---

const MoodSelector: React.FC<{ current: Mood; onSelect: (m: Mood) => void }> = ({ current, onSelect }) => {
    return (
        <div className="flex gap-2">
            {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG[Mood]][]).map(([key, config]) => {
                // Map icons based on key - recreating mapping since we can't store components in JSON/types easily without losing serializability if we were to put it there,
                // but here we can just map. Or we can import icons here.
                // let's stick to the icons we have or use the config color.
                const Icon = key === 'great' ? Smile :
                    key === 'good' ? Zap :
                        key === 'neutral' ? Meh :
                            key === 'bad' ? CloudRain : Frown;

                const isSelected = current === key;

                return (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        title={config.label}
                        className={`p-2.5 rounded-xl transition-all duration-300 relative group ${isSelected
                            ? `bg-slate-800 ${config.color} ring-2 ring-offset-2 ring-offset-slate-900 ring-${config.color.split('-')[1]}-500/50 scale-110 shadow-lg`
                            : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:scale-105 hover:text-slate-300'
                            }`}
                    >
                        <div className={`transition-transform duration-300 ${isSelected ? 'rotate-12' : 'group-hover:rotate-6'}`}>
                            <Icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
                        </div>

                        {/* Status Dot for glowing effect */}
                        {isSelected && (
                            <span className={`absolute inset-0 rounded-xl bg-current opacity-20 blur-md ${config.color}`}></span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

const JournalView: React.FC = () => {
    // Tab Store Integration
    const { activeTabId, tabs, updateTabState } = useTabStore(useShallow(state => ({
        activeTabId: state.activeTabId,
        tabs: state.tabs,
        updateTabState: state.updateTabState
    })));

    // Navigation History for browser back button
    const { pushNavigation } = useNavigationHistory();

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
    const tabSelectedId = activeTab?.state?.selectedEntryId as string | undefined;

    // Zustand store
    const { entries, addEntry, updateEntry: storeUpdateEntry, deleteEntry: storeDeleteEntry, isLoading } = useJournalStore();

    // Local state fallback
    const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);

    // Resolved Selected ID
    const selectedId = activeTabId ? tabSelectedId || null : localSelectedId;

    // Main tab state (journal vs goals)
    const [activeMainTab, setActiveMainTab] = useState<'journal' | 'goals'>('journal');

    // Drawing mode state
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [drawingMode, setDrawingMode] = useState<{ active: boolean; entryId: string | null }>({
        active: false,
        entryId: null
    });

    const setSelectedId = (id: string | null) => {
        if (activeTabId) {
            updateTabState(activeTabId, { selectedEntryId: id });
            // Push to browser history when selecting entry
            if (id) {
                pushNavigation({ tabId: activeTabId, subView: 'entry', itemId: id });
            }
        } else {
            setLocalSelectedId(id);
        }
    };

    // Streak Tracking
    const { trackActivity } = useStreakTracking();

    // Initialize with default entries if empty
    // Initialize with default entries if empty
    useEffect(() => {
        const localInit = localStorage.getItem('p67_journal_initialized');

        if (!isLoading && entries.length === 0 && !localInit) {
            // Generate unique IDs at runtime to prevent duplicate keys
            const entriesWithUniqueIds = INITIAL_ENTRIES.map((entry, index) => ({
                ...entry,
                id: `entry_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
            }));
            entriesWithUniqueIds.forEach(entry => addEntry(entry));
            localStorage.setItem('p67_journal_initialized', 'true');
        } else if (entries.length > 0 && !localInit) {
            // If data exists but flag doesn't, set flag to prevent future re-init
            localStorage.setItem('p67_journal_initialized', 'true');
        }
    }, [isLoading, entries.length, addEntry]);

    // Derived State
    const activeEntry = useMemo(() =>
        entries.find(e => e.id === selectedId) as UIJournalEntry | null,
        [entries, selectedId]);

    // Handlers
    const handleCreateTextEntry = () => {
        const newEntry: UIJournalEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            content: '',
            mood: 'neutral',
            entryType: 'text',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        addEntry(newEntry);
        setSelectedId(newEntry.id);
        setShowTypeSelector(false);
    };

    const handleCreateDrawingEntry = () => {
        const newEntry: UIJournalEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            content: '',
            entryType: 'drawing',
            drawingPages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        addEntry(newEntry);
        setShowTypeSelector(false);
        // Open drawing canvas
        setDrawingMode({ active: true, entryId: newEntry.id });
    };

    const handleOpenNewEntrySelector = () => {
        setShowTypeSelector(true);
    };

    const handleUpdateEntry = (id: string, updates: Partial<UIJournalEntry>) => {
        storeUpdateEntry(id, updates);
        // Track activity when updating journal content
        if (updates.content) {
            trackActivity();
        }
    };

    const handleDeleteEntry = (id: string) => {
        if (confirm("Excluir esta entrada?")) {
            storeDeleteEntry(id);
            if (selectedId === id) setSelectedId(null);
        }
    };

    // Format Date Helper
    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in">
            {/* MAIN TABS */}
            <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700 mb-6 w-full max-w-md">
                <button
                    onClick={() => setActiveMainTab('journal')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeMainTab === 'journal' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Book size={18} /> Diário
                </button>
                <button
                    onClick={() => setActiveMainTab('goals')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeMainTab === 'goals' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Target size={18} /> Metas do Ano
                </button>
            </div>

            {/* CONTENT */}
            {activeMainTab === 'goals' ? (
                <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div></div>}>
                    <GoalsTab />
                </Suspense>
            ) : (
                <div className="h-[calc(100vh-220px)] min-h-[500px] grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">

                    {/* SIDEBAR LIST */}
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                <Book size={18} className="text-purple-400" /> Diário
                            </h3>
                            <button
                                onClick={handleOpenNewEntrySelector}
                                className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors border border-violet-500/20 shadow-lg shadow-violet-500/20"
                                title="Nova Entrada"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                            {entries.length === 0 && (
                                <div className="text-center text-slate-500 py-10 text-sm px-4">
                                    Seu diário está vazio. Comece a escrever sua jornada hoje.
                                </div>
                            )}
                            {entries.map(entry => (
                                <button
                                    key={entry.id}
                                    onClick={() => setSelectedId(entry.id)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all group relative ${selectedId === entry.id
                                        ? 'bg-slate-700 border-purple-500/50 shadow-md'
                                        : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-slate-400">
                                            {new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-200 font-medium truncate pr-6 flex items-center gap-2">
                                        {entry.entryType === 'drawing' && <PenLine size={14} className="text-emerald-400 shrink-0" />}
                                        {entry.entryType === 'drawing'
                                            ? `Desenho (${entry.drawingPages?.length || 0} páginas)`
                                            : (entry.content || 'Nova entrada...')}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                                        <span className="truncate max-w-[100px]">{new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    {/* Mood Indicator Dot */}
                                    <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full shadow-sm ${entry.mood ? MOOD_CONFIG[entry.mood]?.color.replace('text-', 'bg-') : 'bg-slate-600'
                                        }`}></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* MAIN EDITOR */}
                    {activeEntry ? (
                        <div className="flex flex-col h-full gap-4">
                            {/* EDITOR HEADER */}
                            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                                        <Calendar size={14} />
                                        {formatDate(activeEntry.date)}
                                    </div>
                                    <MoodSelector
                                        current={activeEntry.mood}
                                        onSelect={(m) => handleUpdateEntry(activeEntry.id, { mood: m })}
                                    />
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <button
                                        onClick={() => handleDeleteEntry(activeEntry.id)}
                                        className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* TEXT AREA */}
                            <textarea
                                value={activeEntry.content}
                                onChange={(e) => handleUpdateEntry(activeEntry.id, { content: e.target.value })}
                                placeholder="Como você está se sentindo hoje? O que você aprendeu? No que você progrediu?"
                                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-slate-200 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-lg leading-relaxed scrollbar-thin placeholder:text-slate-600"
                            />

                            {/* INSPIRATIONAL QUOTE */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex gap-3">
                                    <Quote size={24} className="text-slate-600 shrink-0" />
                                    <div>
                                        <p className="text-slate-400 italic text-sm font-serif">"A excelência não é um ato, mas um hábito."</p>
                                        <p className="text-xs text-slate-500 mt-2">— Aristóteles</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center bg-slate-800/30 rounded-2xl border border-slate-700/50 text-slate-500">
                            <div className="p-6 bg-slate-800 rounded-full mb-4 border border-slate-700">
                                <Book size={48} className="text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-300 mb-2">Seu espaço de reflexão</h3>
                            <p className="max-w-xs text-center text-sm mb-6">Selecione uma entrada ao lado ou crie uma nova para começar a escrever.</p>
                            <button onClick={handleOpenNewEntrySelector} className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2 hover:underline">
                                <Plus size={18} /> Criar nova entrada
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Entry Type Selector Modal */}
            {showTypeSelector && (
                <Suspense fallback={null}>
                    <EntryTypeSelector
                        onSelectText={handleCreateTextEntry}
                        onSelectDrawing={handleCreateDrawingEntry}
                        onClose={() => setShowTypeSelector(false)}
                    />
                </Suspense>
            )}

            {/* Drawing Canvas (Fullscreen) */}
            {drawingMode.active && drawingMode.entryId && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                }>
                    <DrawingCanvas
                        entryId={drawingMode.entryId}
                        existingPages={entries.find(e => e.id === drawingMode.entryId)?.drawingPages}
                        onClose={() => setDrawingMode({ active: false, entryId: null })}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default JournalView;