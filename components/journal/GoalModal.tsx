import React, { useState } from 'react';
import { X, Link2, ExternalLink } from 'lucide-react';
import { useLinks } from '../../stores/linksStore';
import { useSites } from '../../stores/sitesStore';
import { YearlyGoal, GoalPriority, GoalLink } from '../../types';
import { PRIORITY_CONFIG } from './GoalCard';

interface GoalModalProps {
    goal: YearlyGoal | null;
    defaultYear: number;
    onClose: () => void;
    onSave: (data: Partial<YearlyGoal>) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({ goal, defaultYear, onClose, onSave }) => {
    const [title, setTitle] = useState(goal?.title || '');
    const [description, setDescription] = useState(goal?.description || '');
    const [category, setCategory] = useState(goal?.category || '');
    const [year, setYear] = useState(goal?.year || defaultYear);
    const [priority, setPriority] = useState<GoalPriority>(goal?.priority || 'MEDIUM');
    const [links, setLinks] = useState<GoalLink[]>(goal?.links || []);
    
    const [showLinkSelector, setShowLinkSelector] = useState(false);
    const [showAddExternalForm, setShowAddExternalForm] = useState(false);
    const [newExternalUrl, setNewExternalUrl] = useState('');
    const [newExternalTitle, setNewExternalTitle] = useState('');

    const allLinks = useLinks();
    const sites = useSites();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            title: title.trim(),
            description: description.trim() || undefined,
            category: category.trim() || undefined,
            year,
            priority,
            links
        });
    };

    const handleAddInternalLink = (linkId: string) => {
        const link = allLinks.find(l => l.id === linkId);
        if (!link) return;

        const newGoalLink: GoalLink = {
            id: `gl_${Date.now()}`,
            type: 'INTERNAL',
            linkId: link.id,
            title: link.title
        };
        setLinks([...links, newGoalLink]);
        setShowLinkSelector(false);
    };

    const handleSaveExternalLink = () => {
        if (!newExternalUrl.trim()) return;

        const newGoalLink: GoalLink = {
            id: `gl_${Date.now()}`,
            type: 'EXTERNAL',
            url: newExternalUrl.trim(),
            title: newExternalTitle.trim() || newExternalUrl.trim()
        };
        setLinks([...links, newGoalLink]);
        setNewExternalUrl('');
        setNewExternalTitle('');
        setShowAddExternalForm(false);
    };

    const handleRemoveLink = (linkId: string) => {
        setLinks(links.filter(l => l.id !== linkId));
    };

    const handleUpdateLinkDescription = (linkId: string, description: string) => {
        setLinks(links.map(l =>
            l.id === linkId ? { ...l, description } : l
        ));
    };

    const handleUpdateLinkTitle = (linkId: string, title: string) => {
        setLinks(links.map(l =>
            l.id === linkId ? { ...l, title } : l
        ));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                        {goal ? 'Editar Meta' : 'Nova Meta'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Aprender TypeScript avançado"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Detalhes sobre a meta..."
                            rows={3}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none resize-none"
                        />
                    </div>

                    {/* Category & Year */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Categoria
                            </label>
                            <input
                                type="text"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                placeholder="Ex: Carreira"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Ano
                            </label>
                            <input
                                type="number"
                                value={year}
                                onChange={e => setYear(parseInt(e.target.value))}
                                min={2020}
                                max={2050}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Prioridade
                        </label>
                        <div className="flex gap-2">
                            {(Object.keys(PRIORITY_CONFIG) as GoalPriority[]).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${priority === p
                                        ? PRIORITY_CONFIG[p].bgColor + ' ' + PRIORITY_CONFIG[p].color
                                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    {PRIORITY_CONFIG[p].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Links Vinculados
                            </label>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowLinkSelector(true)}
                                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                                >
                                    <Link2 size={12} /> Meus Links
                                </button>
                                <span className="text-slate-600">|</span>
                                <button
                                    type="button"
                                    onClick={() => setShowAddExternalForm(true)}
                                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                                >
                                    <ExternalLink size={12} /> URL
                                </button>
                            </div>
                        </div>

                        {showAddExternalForm && (
                            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2 mb-3">
                                <p className="text-xs font-bold text-slate-300">Adicionar Link Externo</p>
                                <input
                                    type="url"
                                    value={newExternalUrl}
                                    onChange={e => setNewExternalUrl(e.target.value)}
                                    placeholder="https://exemplo.com"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500"
                                />
                                <input
                                    type="text"
                                    value={newExternalTitle}
                                    onChange={e => setNewExternalTitle(e.target.value)}
                                    placeholder="Título do Link (opcional)"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500"
                                />
                                <div className="flex justify-end gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddExternalForm(false)}
                                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveExternalLink}
                                        disabled={!newExternalUrl.trim()}
                                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs rounded-lg font-medium transition-colors"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        )}

                        {links.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-700 rounded-xl">
                                Nenhum link vinculado
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {links.map(link => (
                                    <div key={link.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                                        <div className="flex items-center gap-2 mb-2">
                                            {link.type === 'INTERNAL' ? (
                                                <Link2 size={14} className="text-purple-400 shrink-0" />
                                            ) : (
                                                <ExternalLink size={14} className="text-blue-400 shrink-0" />
                                            )}
                                            <input
                                                type="text"
                                                value={link.title || ''}
                                                onChange={e => handleUpdateLinkTitle(link.id, e.target.value)}
                                                placeholder="Nome do link"
                                                className="flex-1 bg-transparent border-b border-slate-600 px-1 py-0.5 text-sm text-slate-200 focus:border-purple-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLink(link.id)}
                                                className="p-1 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        {link.type === 'EXTERNAL' && link.url && (
                                            <p className="text-[10px] text-slate-500 truncate mb-2 pl-5">{link.url}</p>
                                        )}
                                        <input
                                            type="text"
                                            value={link.description || ''}
                                            onChange={e => handleUpdateLinkDescription(link.id, e.target.value)}
                                            placeholder="O que vou fazer com isso? (opcional)"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:border-purple-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit as any}
                        disabled={!title.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors"
                    >
                        {goal ? 'Salvar' : 'Criar Meta'}
                    </button>
                </div>

                {/* Link Selector Modal */}
                {showLinkSelector && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md max-h-96 overflow-hidden flex flex-col">
                            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                                <span className="font-bold text-white">Selecionar Link</span>
                                <button onClick={() => setShowLinkSelector(false)} className="p-1 text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-2">
                                {allLinks.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-8">Nenhum link disponível</p>
                                ) : (
                                    <div className="space-y-1">
                                        {allLinks.map(link => {
                                            const site = sites.find(s => s.id === link.siteId);
                                            const isAlreadyLinked = links.some(l => l.linkId === link.id);
                                            return (
                                                <button
                                                    key={link.id}
                                                    onClick={() => !isAlreadyLinked && handleAddInternalLink(link.id)}
                                                    disabled={isAlreadyLinked}
                                                    className={`w-full text-left p-2 rounded-lg transition-colors ${isAlreadyLinked
                                                        ? 'opacity-50 cursor-not-allowed bg-slate-700/50'
                                                        : 'hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <p className="text-sm text-slate-200 truncate">{link.title}</p>
                                                    {site && <p className="text-[10px] text-slate-500">{site.name}</p>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default GoalModal;
