import React from 'react';
import { ArrowLeft, Trash2, Edit2, Trophy } from 'lucide-react';
import { Skill } from '../../types';
import { useEditableField } from '../../hooks/useEditableField';
import { THEME_VARIANTS, ThemeKey } from './constants';

interface SkillHeaderProps {
    skill: Skill;
    onBack: () => void;
    onUpdate: (updates: Partial<Skill>) => void;
    onDelete: () => void;
    onComplete?: () => void;
    onUncomplete?: () => void;
}

/**
 * Header component for skill detail view.
 * Includes back button, inline-editable skill name, level badge, and delete action.
 */
export const SkillHeader: React.FC<SkillHeaderProps> = ({ skill, onBack, onUpdate, onDelete, onComplete, onUncomplete }) => {
    const nameEditor = useEditableField(skill.name, (newName) => {
        if (newName.trim()) {
            onUpdate({ name: newName.trim() });
        }
    });

    const theme = (skill.colorTheme as ThemeKey) || 'emerald';
    const variants = THEME_VARIANTS[theme];

    return (
        <div className="flex items-center gap-4 mb-6">
            <button
                onClick={onBack}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                title="Voltar"
            >
                <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
                {nameEditor.isEditing ? (
                    <input
                        ref={nameEditor.inputRef}
                        value={nameEditor.editedValue}
                        onChange={e => nameEditor.setEditedValue(e.target.value)}
                        onBlur={nameEditor.save}
                        onKeyDown={nameEditor.handleKeyDown}
                        className={`text-3xl font-bold text-white bg-slate-800 border ${variants.border} rounded-lg px-3 py-1 outline-none w-full max-w-md`}
                        placeholder="Nome do módulo..."
                    />
                ) : (
                    <div className="flex items-center gap-2 group">
                        <h2 className="text-3xl font-bold text-white">{skill.name}</h2>
                        <button
                            onClick={nameEditor.startEditing}
                            className={`p-1.5 text-slate-600 ${variants.hoverText} hover:bg-slate-800 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100`}
                            title="Renomear módulo"
                        >
                            <Edit2 size={18} />
                        </button>
                    </div>
                )}
                <p className="text-slate-400 flex items-center gap-2 text-sm mt-1">
                    <span className={`${variants.bgLight} ${variants.text} ${variants.borderLight} px-2 py-0.5 rounded border`}>{skill.level}</span>
                    • Criado em {new Date(skill.createdAt).toLocaleDateString('pt-BR')}
                </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
                {skill.isCompleted ? (
                    <button
                        onClick={onUncomplete}
                        className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all font-medium text-sm"
                        title="Reativar habilidade"
                    >
                        <Trophy size={16} fill="currentColor" />
                        Dominada
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            if (window.confirm('Tem certeza que deseja marcar esta habilidade como concluída?\nEla será movida para o histórico de habilidades dominadas.')) {
                                onComplete?.();
                            }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-all text-sm group"
                        title="Marcar como dominada"
                    >
                        <Trophy size={16} className="group-hover:scale-110 transition-transform" />
                        <span>Concluir</span>
                    </button>
                )}

                <div className="w-px h-6 bg-slate-700 mx-2" />

                <button
                    onClick={onDelete}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Excluir módulo"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
};
