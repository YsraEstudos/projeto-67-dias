import React, { useMemo } from 'react';
import { Calendar, Video, Check, X, BookOpen } from 'lucide-react';
import { StudySubject, ScheduledStudyItem, DailyStudySchedule } from '../../../stores';

interface StudySchedulerProps {
    today: string;
    tomorrow: string;
    todaySchedule: DailyStudySchedule;
    tomorrowSchedule: DailyStudySchedule;
    studySubjects: StudySubject[];
    onToggleComplete: (date: string, subjectId: string, type: 'VIDEO' | 'ANKI') => void;
    onRemoveItem: (date: string, subjectId: string, type: 'VIDEO' | 'ANKI') => void;
    onAddItem: (date: string, subjectId: string, type: 'VIDEO' | 'ANKI') => void;
    setActiveTab: (tab: 'SETTINGS') => void;
    getItemsForDateAndType: (schedule: DailyStudySchedule, type: 'VIDEO' | 'ANKI') => ScheduledStudyItem[];
}

export const StudyScheduler: React.FC<StudySchedulerProps> = React.memo(({
    today, tomorrow, todaySchedule, tomorrowSchedule, studySubjects,
    onToggleComplete, onRemoveItem, onAddItem, setActiveTab, getItemsForDateAndType
}) => {
    // Memoize date labels to avoid recreation on each render
    const dateLabels = useMemo(() => ({
        today: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        tomorrow: new Date(Date.now() + 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }), [today]); // Recalculate only when day changes

    const renderScheduleColumn = (
        date: string,
        schedule: DailyStudySchedule,
        colorClass: string,
        title: string,
        dateLabel: string
    ) => {
        const videos = getItemsForDateAndType(schedule, 'VIDEO');
        const ankiItems = getItemsForDateAndType(schedule, 'ANKI');

        return (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
                <div className={`p-3 ${colorClass} border-b border-slate-700`}>
                    <h5 className={`font-bold ${colorClass.includes('cyan') ? 'text-cyan-400' : 'text-purple-400'} flex items-center gap-2`}>
                        <Calendar size={16} />
                        {title} ({dateLabel})
                    </h5>
                </div>
                <div className="p-4 space-y-4">
                    {/* Videos */}
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                            <Video size={14} /> Vídeos
                        </div>
                        <div className="space-y-2">
                            {videos.map(item => {
                                const subject = studySubjects.find(s => s.id === item.subjectId);
                                if (!subject) return null;
                                return (
                                    <div key={item.subjectId} className={`flex items-center gap-2 p-2 rounded-lg ${item.isCompleted ? 'bg-green-500/10' : 'bg-slate-800'}`}>
                                        <button
                                            onClick={() => onToggleComplete(date, item.subjectId, 'VIDEO')}
                                            className={`w-5 h-5 rounded flex items-center justify-center ${item.isCompleted ? 'bg-green-500 text-white' : 'border-2 border-slate-600'}`}
                                        >
                                            {item.isCompleted && <Check size={12} />}
                                        </button>
                                        <span className={`w-3 h-3 rounded-full ${subject.color}`}></span>
                                        <span className={`text-sm flex-1 ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{subject.name}</span>
                                        <button onClick={() => onRemoveItem(date, item.subjectId, 'VIDEO')} className="text-slate-500 hover:text-red-400">
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                            {studySubjects.length > 0 && (
                                <select
                                    onChange={(e) => { if (e.target.value) onAddItem(date, e.target.value, 'VIDEO'); e.target.value = ''; }}
                                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-400 focus:border-${colorClass.includes('cyan') ? 'cyan' : 'purple'}-500 focus:outline-none`}
                                >
                                    <option value="">+ Adicionar vídeo...</option>
                                    {studySubjects.filter(s => !videos.some(i => i.subjectId === s.id)).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                    {/* Anki */}
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                            <BookOpen size={14} /> Anki
                        </div>
                        <div className="space-y-2">
                            {ankiItems.map(item => {
                                const subject = studySubjects.find(s => s.id === item.subjectId);
                                if (!subject) return null;
                                return (
                                    <div key={item.subjectId} className={`flex items-center gap-2 p-2 rounded-lg ${item.isCompleted ? 'bg-green-500/10' : 'bg-slate-800'}`}>
                                        <button
                                            onClick={() => onToggleComplete(date, item.subjectId, 'ANKI')}
                                            className={`w-5 h-5 rounded flex items-center justify-center ${item.isCompleted ? 'bg-green-500 text-white' : 'border-2 border-slate-600'}`}
                                        >
                                            {item.isCompleted && <Check size={12} />}
                                        </button>
                                        <span className={`w-3 h-3 rounded-full ${subject.color}`}></span>
                                        <span className={`text-sm flex-1 ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{subject.name}</span>
                                        <button onClick={() => onRemoveItem(date, item.subjectId, 'ANKI')} className="text-slate-500 hover:text-red-400">
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                            {studySubjects.length > 0 && (
                                <select
                                    onChange={(e) => { if (e.target.value) onAddItem(date, e.target.value, 'ANKI'); e.target.value = ''; }}
                                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-400 focus:border-${colorClass.includes('cyan') ? 'cyan' : 'purple'}-500 focus:outline-none`}
                                >
                                    <option value="">+ Adicionar Anki...</option>
                                    {studySubjects.filter(s => !ankiItems.some(i => i.subjectId === s.id)).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mt-8 pt-6 border-t border-slate-700">
            <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <Calendar className="text-cyan-400" size={20} />
                📚 Planejamento de Estudo
            </h4>

            {studySubjects.length === 0 ? (
                <div className="text-center py-8 bg-slate-800/50 rounded-xl border border-dashed border-slate-600">
                    <BookOpen className="mx-auto text-slate-500 mb-3" size={32} />
                    <p className="text-slate-400 text-sm mb-3">Nenhuma matéria cadastrada.</p>
                    <button
                        onClick={() => setActiveTab('SETTINGS')}
                        className="text-yellow-500 text-sm font-medium hover:text-yellow-400 transition-colors"
                    >
                        Ir para Configurações →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderScheduleColumn(today, todaySchedule, 'bg-cyan-500/10', 'HOJE', dateLabels.today)}
                    {renderScheduleColumn(tomorrow, tomorrowSchedule, 'bg-purple-500/10', 'AMANHÃ', dateLabels.tomorrow)}
                </div>
            )}
        </div>
    );
});

StudyScheduler.displayName = 'StudyScheduler';
