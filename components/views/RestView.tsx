import React, { useState, useMemo } from 'react';
import {
    CalendarDays, CheckCircle2, Circle, GripVertical,
    Sparkles, Trash2, BrainCircuit, ChevronLeft, ChevronRight,
    Calendar, Bot, X, Plus
} from 'lucide-react';
import { Type } from "@google/genai";
import { getGeminiModel } from '../../services/gemini';
import { RestActivity } from '../types';
import { useStorage } from '../../hooks/useStorage';

// --- MOCK INITIAL DATA ---
const INITIAL_ACTIVITIES: RestActivity[] = [
    { id: '1', title: 'Alongamento de pescoço (30s)', isCompleted: false, type: 'DAILY', order: 0 },
    { id: '2', title: 'Beber 1 copo de água', isCompleted: false, type: 'DAILY', order: 1 },
    { id: '3', title: 'Flexão (Série 1)', isCompleted: false, type: 'WEEKLY', daysOfWeek: [1, 3, 5], order: 2 }, // Mon, Wed, Fri
];

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const RestView: React.FC = () => {
    // State
    const [activities, setActivities] = useStorage<RestActivity[]>('p67_rest_activities', INITIAL_ACTIVITIES);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // --- FILTERING LOGIC ---
    const filteredActivities = useMemo(() => {
        const dayOfWeek = selectedDate.getDay();
        const dateString = selectedDate.toISOString().split('T')[0];

        return activities
            .filter(act => {
                if (act.type === 'DAILY') return true;
                if (act.type === 'WEEKLY') return act.daysOfWeek?.includes(dayOfWeek);
                if (act.type === 'ONCE') return act.specificDate === dateString;
                return false;
            })
            .sort((a, b) => a.order - b.order);
    }, [activities, selectedDate]);

    // --- HANDLERS ---

    const handleAddGeneratedItems = (items: { title: string, type: 'DAILY' | 'ONCE' | 'WEEKLY' }[]) => {
        const baseOrder = activities.length;
        const newItems: RestActivity[] = items.map((item, idx) => ({
            id: Date.now().toString() + idx,
            title: item.title,
            isCompleted: false,
            type: item.type,
            order: baseOrder + idx,
            daysOfWeek: item.type === 'WEEKLY' ? [selectedDate.getDay()] : undefined,
            specificDate: item.type === 'ONCE' ? selectedDate.toISOString().split('T')[0] : undefined,
        }));
        setActivities([...activities, ...newItems]);
        setIsAIModalOpen(false);
    };

    const toggleComplete = (id: string) => {
        setActivities(prev => prev.map(a => a.id === id ? { ...a, isCompleted: !a.isCompleted } : a));
    };

    const deleteActivity = (id: string) => {
        setActivities(prev => prev.filter(a => a.id !== id));
    };

    // --- DRAG AND DROP ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('index', index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndex = Number(e.dataTransfer.getData('index'));
        if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

        // Work with the filtered list to show immediate feedback
        const newFiltered = [...filteredActivities];
        const [movedItem] = newFiltered.splice(sourceIndex, 1);
        newFiltered.splice(targetIndex, 0, movedItem);

        // Re-calculate orders for the whole visible group
        const updatedOrders = newFiltered.map((item, idx) => ({
            id: item.id,
            newOrder: idx
        }));

        // Update global state
        setActivities(prev => prev.map(item => {
            const update = updatedOrders.find(u => u.id === item.id);
            return update ? { ...item, order: update.newOrder } : item;
        }));
    };

    // --- DATE NAVIGATION ---
    const changeDay = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto animate-in fade-in duration-500 pb-24 relative">

            {/* HEADER: Date Selector */}
            <div className="flex items-center justify-between mb-8 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg">
                <button onClick={() => changeDay(-1)} className="p-3 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">Planejador de Descansos</span>
                    <div className="flex items-center gap-2 text-xl md:text-2xl font-bold text-slate-200">
                        <CalendarDays size={24} className="text-cyan-500" />
                        <span className="capitalize">
                            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </span>
                        <span className="text-slate-600 font-light">|</span>
                        <span className="text-slate-400 text-lg">
                            {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </div>

                <button onClick={() => changeDay(1)} className="p-3 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* LIST AREA */}
            <div className="space-y-3">
                {filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                        <Calendar size={48} className="text-slate-700 mb-4" />
                        <div className="text-slate-500 font-medium">Nenhum descanso planejado para hoje.</div>
                        <div className="text-sm text-slate-600 mt-1">Use o assistente IA no canto para adicionar treinos ou pausas.</div>
                    </div>
                ) : (
                    filteredActivities.map((activity, index) => (
                        <div
                            key={activity.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${activity.isCompleted
                                ? 'bg-slate-900/30 border-slate-800 opacity-60'
                                : 'bg-slate-800 border-slate-700 hover:border-cyan-500/30 hover:bg-slate-750 shadow-md'
                                }`}
                        >
                            {/* Drag Handle */}
                            <div className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-cyan-500 p-1 transition-colors">
                                <GripVertical size={20} />
                            </div>

                            {/* Checkbox */}
                            <button
                                onClick={() => toggleComplete(activity.id)}
                                className={`flex-shrink-0 transition-all duration-300 ${activity.isCompleted
                                    ? 'text-cyan-500 scale-110'
                                    : 'text-slate-600 hover:text-cyan-400'
                                    }`}
                            >
                                {activity.isCompleted ? <CheckCircle2 size={28} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" /> : <Circle size={28} />}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className={`font-medium text-lg truncate transition-colors ${activity.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                    {activity.title}
                                </div>
                                <div className="flex gap-2 mt-1.5">
                                    {activity.type === 'DAILY' && (
                                        <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 tracking-wider">
                                            DIÁRIO
                                        </span>
                                    )}
                                    {activity.type === 'WEEKLY' && (
                                        <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 tracking-wider">
                                            SEMANAL
                                        </span>
                                    )}
                                    {activity.type === 'ONCE' && (
                                        <span className="text-[10px] font-bold bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded border border-slate-600/50 tracking-wider">
                                            HOJE
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                onClick={() => deleteActivity(activity.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-all duration-200"
                                title="Remover"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* FLOATING AI BUTTON */}
            <button
                onClick={() => setIsAIModalOpen(true)}
                className="fixed bottom-8 right-8 z-40 group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-full shadow-lg shadow-cyan-500/30 hover:scale-110 transition-all duration-300 hover:shadow-cyan-500/50 border border-white/10"
                title="IA Fitness & Descanso"
            >
                <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000"></div>
            </button>

            {/* AI MODAL */}
            {isAIModalOpen && (
                <AIRestAssistantModal
                    onClose={() => setIsAIModalOpen(false)}
                    onApply={handleAddGeneratedItems}
                />
            )}
        </div>
    );
};

// --- AI COMPONENT ---
const AIRestAssistantModal: React.FC<{
    onClose: () => void;
    onApply: (items: any[]) => void;
}> = ({ onClose, onApply }) => {
    const [input, setInput] = useState('');
    const [frequency, setFrequency] = useState<'ONCE' | 'DAILY'>('ONCE');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedItems, setGeneratedItems] = useState<any[] | null>(null);
    const [conversation, setConversation] = useState<{ role: 'user' | 'ai', text: string }[]>([]);

    const handleGenerate = async () => {
        if (!input.trim()) return;

        setIsLoading(true);
        const userMsg = input;
        setConversation(prev => [...prev, { role: 'user', text: userMsg }]);
        setGeneratedItems(null);
        setInput('');

        try {
            const models = getGeminiModel();
            const response = await models.generateContent({
                model: "gemini-2.5-flash",
                contents: `User request: "${userMsg}".
                
                Task: The user is planning physical activities, chores, or breaks.
                Break this request down into small, actionable items.
                
                Rules:
                1. If the user mentions sets (e.g., "3 sets of squats"), split them into separate items.
                2. Return JSON object with property "items" which is array of strings (titles).
                3. Keep titles concise and in Portuguese.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            items: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        }
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                const itemsWithType = data.items.map((title: string) => ({
                    title,
                    type: frequency
                }));
                setGeneratedItems(itemsWithType);
                setConversation(prev => [...prev, {
                    role: 'ai',
                    text: `Entendido! Quebrei sua solicitação em ${itemsWithType.length} itens.`
                }]);
            }
        } catch (error) {
            console.error(error);
            setConversation(prev => [...prev, { role: 'ai', text: 'Erro ao processar. Tente novamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-cyan-900/30 to-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-600 rounded-lg">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Treinador IA</h3>
                            <p className="text-xs text-cyan-400">Gemini 2.5</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                    {conversation.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                            <BrainCircuit size={48} className="mx-auto mb-4 text-cyan-500/50" />
                            <p className="text-sm mb-2">Digita o exercício ou rotina.</p>
                            <p className="text-xs">Ex: "3 séries de 15 flexões", "Alongamento completo".</p>
                        </div>
                    )}

                    {conversation.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-cyan-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-700 flex gap-1 items-center">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}

                    {generatedItems && (
                        <div className="mt-4 bg-slate-950/50 rounded-xl border border-slate-800 p-2 animate-in slide-in-from-bottom-2">
                            <div className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mb-1">Preview ({generatedItems.length})</div>
                            <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin pr-2">
                                {generatedItems.map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800/50 text-xs">
                                        <span className="text-slate-300 truncate">{t.title}</span>
                                        <span className="text-[10px] text-slate-500">{t.type === 'ONCE' ? 'Hoje' : 'Diário'}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => onApply(generatedItems)}
                                className="w-full mt-3 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
                            >
                                <Plus size={16} /> Adicionar Rotina
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <div className="flex gap-2 mb-3">
                        <button onClick={() => setFrequency('ONCE')} className={`flex-1 py-1 text-xs rounded border ${frequency === 'ONCE' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Só Hoje</button>
                        <button onClick={() => setFrequency('DAILY')} className={`flex-1 py-1 text-xs rounded border ${frequency === 'DAILY' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>Diário</button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none placeholder:text-slate-600"
                            placeholder="Digite sua rotina (ex: 4x12 Supino)..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
                            autoFocus
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={!input.trim() || isLoading}
                            className="bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl hover:bg-cyan-500 transition-colors"
                        >
                            <Bot size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestView;