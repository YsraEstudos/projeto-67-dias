import React from 'react';
import { BookOpen, Trash2, Plus } from 'lucide-react';
import { StudySubject } from '../../../../stores';
import { SUBJECT_COLORS } from '../hooks/useStudyScheduler';

interface WorkGoals {
    weekly: number;
    ultra: number;
    anki: number;
    ncm: number;
}

interface SettingsTabProps {
    localGoals: WorkGoals;
    setLocalGoals: (goals: WorkGoals) => void;
    onSaveSettings: () => void;
    // Subject mgmt
    studySubjects: StudySubject[];
    onDeleteSubject: (id: string) => void;
    showAddSubject: boolean;
    setShowAddSubject: (v: boolean) => void;
    newSubjectName: string;
    setNewSubjectName: (v: string) => void;
    newSubjectColor: string;
    setNewSubjectColor: (v: string) => void;
    onAddSubject: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = React.memo(({
    localGoals, setLocalGoals, onSaveSettings,
    studySubjects, onDeleteSubject, showAddSubject, setShowAddSubject,
    newSubjectName, setNewSubjectName, newSubjectColor, setNewSubjectColor, onAddSubject
}) => {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">
                Ajuste as metas para personalizar sua experiência. As alterações serão salvas automaticamente.
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-slate-400 text-xs font-bold uppercase">Meta Semanal (pts)</label>
                        <input
                            type="number"
                            value={localGoals.weekly}
                            onChange={e => setLocalGoals({ ...localGoals, weekly: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-slate-400 text-xs font-bold uppercase">Ultra Meta (pts)</label>
                        <input
                            type="number"
                            value={localGoals.ultra}
                            onChange={e => setLocalGoals({ ...localGoals, ultra: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-slate-400 text-xs font-bold uppercase">Meta Diária Anki</label>
                        <input
                            type="number"
                            value={localGoals.anki}
                            onChange={e => setLocalGoals({ ...localGoals, anki: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-slate-400 text-xs font-bold uppercase">Meta Diária NCM</label>
                        <input
                            type="number"
                            value={localGoals.ncm}
                            onChange={e => setLocalGoals({ ...localGoals, ncm: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={onSaveSettings}
                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition-colors"
            >
                Salvar Configurações
            </button>

            {/* Subject Management Section */}
            <div className="mt-8 pt-6 border-t border-slate-700">
                <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <BookOpen className="text-cyan-400" size={20} />
                    Matérias de Estudo
                </h4>

                {/* Existing Subjects */}
                <div className="space-y-2 mb-4">
                    {studySubjects.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-sm bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
                            Nenhuma matéria cadastrada ainda.
                        </div>
                    ) : (
                        studySubjects.map(subject => (
                            <div key={subject.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
                                <span className={`w-4 h-4 rounded-full ${subject.color}`}></span>
                                <span className="flex-1 text-slate-200 font-medium">{subject.name}</span>
                                <button
                                    onClick={() => onDeleteSubject(subject.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Subject Form */}
                {showAddSubject ? (
                    <div className="p-4 bg-slate-800 rounded-xl border border-cyan-500/20">
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                placeholder="Nome da matéria (ex: Português, Informática)"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs font-bold uppercase">Cor:</span>
                                <div className="flex gap-1 flex-wrap">
                                    {SUBJECT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewSubjectColor(color)}
                                            className={`w-6 h-6 rounded-full ${color} transition-all ${newSubjectColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-60 hover:opacity-100'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={onAddSubject}
                                    disabled={!newSubjectName.trim()}
                                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-colors"
                                >
                                    Adicionar
                                </button>
                                <button
                                    onClick={() => { setShowAddSubject(false); setNewSubjectName(''); }}
                                    className="px-4 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddSubject(true)}
                        className="w-full py-3 border-2 border-dashed border-slate-600 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Adicionar Matéria
                    </button>
                )}
            </div>
        </div>
    );
});

SettingsTab.displayName = 'SettingsTab';
