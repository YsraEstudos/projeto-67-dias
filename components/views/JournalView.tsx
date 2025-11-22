import React, { useState, useMemo } from 'react';
import { 
  Book, Calendar, Plus, Trash2, 
  Smile, Meh, Frown, CloudRain, Zap, 
  Sparkles, Quote
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { useLocalStorage } from '../../hooks/useLocalStorage';

// --- TYPES ---
type Mood = 'HAPPY' | 'NEUTRAL' | 'SAD' | 'STRESSED' | 'ENERGETIC';

interface JournalEntry {
  id: string;
  date: string; // ISO String
  content: string;
  mood: Mood;
  aiAnalysis?: {
    sentiment: string;
    advice: string;
    quote: string;
  };
  updatedAt: number;
}

// --- MOCK DATA ---
const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    date: new Date().toISOString(),
    content: "Hoje foi um dia produtivo. Consegui finalizar o módulo de trabalho do projeto. Me sinto um pouco cansado, mas satisfeito com o progresso.",
    mood: 'HAPPY',
    updatedAt: Date.now()
  }
];

// --- COMPONENTS ---

const MoodSelector: React.FC<{ current: Mood; onSelect: (m: Mood) => void }> = ({ current, onSelect }) => {
  const moods: { id: Mood; icon: any; color: string; label: string }[] = [
    { id: 'HAPPY', icon: Smile, color: 'text-green-400', label: 'Feliz' },
    { id: 'ENERGETIC', icon: Zap, color: 'text-yellow-400', label: 'Energizado' },
    { id: 'NEUTRAL', icon: Meh, color: 'text-blue-400', label: 'Neutro' },
    { id: 'STRESSED', icon: CloudRain, color: 'text-indigo-400', label: 'Estressado' },
    { id: 'SAD', icon: Frown, color: 'text-slate-400', label: 'Triste' },
  ];

  return (
    <div className="flex gap-2">
      {moods.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          title={m.label}
          className={`p-2 rounded-lg transition-all border ${
            current === m.id 
              ? `bg-slate-700 ${m.color} border-slate-500 scale-110 shadow-lg` 
              : 'bg-slate-900 text-slate-600 border-slate-800 hover:bg-slate-800 hover:scale-105'
          }`}
        >
          <m.icon size={20} />
        </button>
      ))}
    </div>
  );
};

const JournalView: React.FC = () => {
  // State
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('p67_journal', INITIAL_ENTRIES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Derived State
  const activeEntry = useMemo(() => 
    entries.find(e => e.id === selectedId) || null, 
  [entries, selectedId]);

  // Handlers
  const createNewEntry = () => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: '',
      mood: 'NEUTRAL',
      updatedAt: Date.now()
    };
    setEntries([newEntry, ...entries]);
    setSelectedId(newEntry.id);
  };

  const updateEntry = (id: string, updates: Partial<JournalEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e));
  };

  const deleteEntry = (id: string) => {
    if(confirm("Excluir esta entrada?")) {
        setEntries(prev => prev.filter(e => e.id !== id));
        if (selectedId === id) setSelectedId(null);
    }
  };

  const handleGenerateInsight = async () => {
    if (!activeEntry || !activeEntry.content.trim()) return;

    setIsAiLoading(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze this journal entry based on Stoic philosophy and psychology.
            
            Entry: "${activeEntry.content}"
            Current Mood: ${activeEntry.mood}
            
            Return a JSON object with:
            1. "sentiment": A 1-2 word tag describing the underlying emotion (in Portuguese).
            2. "advice": A concise, actionable, and empathetic advice (max 2 sentences, in Portuguese).
            3. "quote": A relevant quote from a philosopher (Marcus Aurelius, Seneca, Epictetus, etc) or famous thinker (in Portuguese).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sentiment: { type: Type.STRING },
                        advice: { type: Type.STRING },
                        quote: { type: Type.STRING },
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            updateEntry(activeEntry.id, { aiAnalysis: data });
        }
    } catch (error) {
        console.error(error);
        alert("Erro ao gerar insight. Tente novamente.");
    } finally {
        setIsAiLoading(false);
    }
  };

  // Format Date Helper
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] min-h-[600px] grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 animate-in fade-in">
        
        {/* SIDEBAR LIST */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Book size={18} className="text-purple-400"/> Diário
                </h3>
                <button 
                    onClick={createNewEntry}
                    className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-lg shadow-purple-900/20"
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
                        className={`w-full text-left p-3 rounded-xl border transition-all group relative ${
                            selectedId === entry.id 
                            ? 'bg-slate-700 border-purple-500/50 shadow-md' 
                            : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-400">
                                {new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short'})}
                            </span>
                            {entry.aiAnalysis && <Sparkles size={12} className="text-purple-400" />}
                        </div>
                        <div className="text-sm text-slate-200 font-medium truncate pr-6">
                            {entry.content || 'Nova entrada...'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                            <span className="truncate max-w-[100px]">{new Date(entry.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            {entry.aiAnalysis?.sentiment && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-purple-300 border border-purple-500/20">
                                    {entry.aiAnalysis.sentiment}
                                </span>
                            )}
                        </div>
                        
                        {/* Mood Indicator Dot */}
                        <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                            entry.mood === 'HAPPY' ? 'bg-green-500' :
                            entry.mood === 'SAD' ? 'bg-slate-500' :
                            entry.mood === 'STRESSED' ? 'bg-indigo-500' :
                            entry.mood === 'ENERGETIC' ? 'bg-yellow-500' : 'bg-blue-500'
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
                            onSelect={(m) => updateEntry(activeEntry.id, { mood: m })} 
                        />
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button 
                            onClick={() => deleteEntry(activeEntry.id)}
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
                    onChange={(e) => updateEntry(activeEntry.id, { content: e.target.value })}
                    placeholder="Como você está se sentindo hoje? O que você aprendeu? No que você progrediu?"
                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-slate-200 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-lg leading-relaxed scrollbar-thin placeholder:text-slate-600"
                />

                {/* AI INSIGHT CARD or BUTTON */}
                {activeEntry.aiAnalysis ? (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-purple-500/30 relative overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles size={120} className="text-purple-500" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-purple-500/20 rounded-lg">
                                    <Sparkles size={16} className="text-purple-400" />
                                </div>
                                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Insight do Dia</span>
                                <span className="text-xs bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800">
                                    {activeEntry.aiAnalysis.sentiment}
                                </span>
                            </div>
                            
                            <p className="text-slate-300 mb-4 text-sm leading-relaxed">
                                "{activeEntry.aiAnalysis.advice}"
                            </p>
                            
                            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex gap-3">
                                <Quote size={24} className="text-slate-600 shrink-0" />
                                <div>
                                    <p className="text-slate-400 italic text-sm font-serif">"{activeEntry.aiAnalysis.quote}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end">
                        <button 
                            onClick={handleGenerateInsight}
                            disabled={isAiLoading || !activeEntry.content.length}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                        >
                            {isAiLoading ? (
                                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Analisando...</span>
                            ) : (
                                <><Sparkles size={18} /> Gerar Insight com IA</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center bg-slate-800/30 rounded-2xl border border-slate-700/50 text-slate-500">
                <div className="p-6 bg-slate-800 rounded-full mb-4 border border-slate-700">
                    <Book size={48} className="text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">Seu espaço de reflexão</h3>
                <p className="max-w-xs text-center text-sm mb-6">Selecione uma entrada ao lado ou crie uma nova para começar a escrever.</p>
                <button onClick={createNewEntry} className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2 hover:underline">
                    <Plus size={18} /> Criar nova entrada
                </button>
            </div>
        )}
    </div>
  );
};

export default JournalView;