/**
 * DayTemplateModal Component
 * 
 * Modal for managing day templates:
 * - List templates
 * - Create new template from current day
 * - Apply template to a date
 * - Delete templates
 */
import React, { useState } from 'react';
import { X, Layers, Plus, Trash2, Calendar, Clock, Copy, Check } from 'lucide-react';
import { useWeeklyAgendaStore } from '../../../stores/weeklyAgendaStore';
import { useSkillsStore } from '../../../stores/skillsStore';
import { DayTemplate } from '../../../types';
import { formatMinutes } from '../../../utils/weeklyAgendaUtils';

interface DayTemplateModalProps {
    onClose: () => void;
    currentDate?: string;  // Date being viewed (for "save current day")
    onApplyTemplate?: (templateId: string, date: string) => void;
}

export const DayTemplateModal: React.FC<DayTemplateModalProps> = ({
    onClose,
    currentDate,
    onApplyTemplate
}) => {
    const {
        templates,
        scheduledBlocks,
        activities,
        events,
        addTemplate,
        deleteTemplate,
        applyTemplateToDate,
        saveCurrentDayAsTemplate
    } = useWeeklyAgendaStore();
    const { skills } = useSkillsStore();

    const [mode, setMode] = useState<'list' | 'save' | 'apply'>('list');
    const [newTemplateName, setNewTemplateName] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [applyDate, setApplyDate] = useState(currentDate || new Date().toISOString().split('T')[0]);
    const [showSuccess, setShowSuccess] = useState(false);

    // Get block count for current date
    const currentDayBlocks = currentDate
        ? scheduledBlocks.filter(b => b.date === currentDate)
        : [];

    // Get display name for a block type and referenceId
    const getBlockTitle = (type: string, referenceId: string): string => {
        if (type === 'skill') {
            return skills.find(s => s.id === referenceId)?.name || 'Skill';
        } else if (type === 'activity') {
            return activities.find(a => a.id === referenceId)?.title || 'Atividade';
        } else if (type === 'event') {
            return events.find(e => e.id === referenceId)?.title || 'Evento';
        }
        return 'Item';
    };

    const handleSaveTemplate = () => {
        if (!newTemplateName.trim() || !currentDate) return;
        saveCurrentDayAsTemplate(currentDate, newTemplateName.trim());
        setNewTemplateName('');
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            setMode('list');
        }, 1500);
    };

    const handleApplyTemplate = () => {
        if (!selectedTemplateId || !applyDate) return;
        applyTemplateToDate(selectedTemplateId, applyDate);
        onApplyTemplate?.(selectedTemplateId, applyDate);
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            onClose();
        }, 1500);
    };

    const handleDeleteTemplate = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este template?')) {
            deleteTemplate(id);
        }
    };

    const formatTemplatePreview = (template: DayTemplate): string => {
        const totalMinutes = template.blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
        return `${template.blocks.length} blocos • ${formatMinutes(totalMinutes)}`;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 max-h-[85vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <Layers size={20} className="text-purple-400" />
                        <h3 className="font-bold text-white text-lg">Templates de Dia</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Success Toast */}
                {showSuccess && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg animate-in slide-in-from-top-4">
                        <Check size={16} />
                        <span className="font-medium text-sm">Sucesso!</span>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {mode === 'list' && (
                        <div className="space-y-4">
                            {/* Action buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setMode('save')}
                                    disabled={currentDayBlocks.length === 0}
                                    className="flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-all"
                                >
                                    <Plus size={16} />
                                    Salvar Dia
                                </button>
                                <button
                                    onClick={() => setMode('apply')}
                                    disabled={(templates?.length || 0) === 0}
                                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-all"
                                >
                                    <Copy size={16} />
                                    Aplicar
                                </button>
                            </div>

                            {/* Templates list */}
                            {(templates?.length || 0) === 0 ? (
                                <div className="text-center py-8">
                                    <Layers size={40} className="mx-auto text-slate-600 mb-3" />
                                    <p className="text-slate-400 text-sm">Nenhum template salvo</p>
                                    <p className="text-slate-500 text-xs mt-1">
                                        Agende blocos em um dia e salve como template
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        Templates Salvos
                                    </h4>
                                    {templates?.map(template => (
                                        <div
                                            key={template.id}
                                            className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 hover:border-slate-600 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-bold text-white truncate">
                                                        {template.name}
                                                    </h5>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {formatTemplatePreview(template)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            {/* Preview blocks */}
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {template.blocks.slice(0, 4).map((block, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700"
                                                    >
                                                        {getBlockTitle(block.type, block.referenceId)}
                                                    </span>
                                                ))}
                                                {template.blocks.length > 4 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                                                        +{template.blocks.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'save' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('list')}
                                className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
                            >
                                ← Voltar
                            </button>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    Nome do Template
                                </label>
                                <input
                                    type="text"
                                    value={newTemplateName}
                                    onChange={e => setNewTemplateName(e.target.value)}
                                    placeholder="Ex: Dia de Trabalho, Feriado..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-purple-500 outline-none"
                                />
                            </div>

                            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                    <Clock size={14} />
                                    <span>Blocos que serão salvos</span>
                                </div>
                                <div className="text-white font-bold">
                                    {currentDayBlocks.length} blocos • {formatMinutes(currentDayBlocks.reduce((s, b) => s + b.durationMinutes, 0))}
                                </div>
                            </div>

                            <button
                                onClick={handleSaveTemplate}
                                disabled={!newTemplateName.trim()}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold transition-all"
                            >
                                Salvar Template
                            </button>
                        </div>
                    )}

                    {mode === 'apply' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('list')}
                                className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
                            >
                                ← Voltar
                            </button>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    Escolha o Template
                                </label>
                                <div className="space-y-2">
                                    {templates?.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => setSelectedTemplateId(template.id)}
                                            className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTemplateId === template.id
                                                    ? 'bg-purple-600/20 border-purple-500 text-white'
                                                    : 'bg-slate-900/50 border-slate-700/50 text-slate-300 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="font-bold">{template.name}</div>
                                            <div className="text-xs text-slate-400">{formatTemplatePreview(template)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    <Calendar size={14} className="inline mr-1" />
                                    Aplicar na Data
                                </label>
                                <input
                                    type="date"
                                    value={applyDate}
                                    onChange={e => setApplyDate(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-sm">
                                ⚠️ Blocos existentes nesta data serão substituídos
                            </div>

                            <button
                                onClick={handleApplyTemplate}
                                disabled={!selectedTemplateId}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold transition-all"
                            >
                                Aplicar Template
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayTemplateModal;
