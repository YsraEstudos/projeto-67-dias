/**
 * SessionHistoryModal Component
 * 
 * Modal showing the history of study sessions for a skill
 * Displays date, time, and duration of each session
 */
import React, { useMemo } from 'react';
import { X, History, Clock, Trash2, Calendar } from 'lucide-react';
import { Skill, SkillLog } from '../../types';

interface SessionHistoryModalProps {
    skill: Skill;
    onClose: () => void;
    onDeleteLog: (logId: string) => void;
}

// Format date to readable string (e.g., "24/12/2024 às 14:30")
const formatLogDate = (isoDateString: string): string => {
    try {
        const date = new Date(isoDateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch {
        return isoDateString;
    }
};

// Format duration (e.g., "2h 30min" or "45min")
const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
};

// Group logs by date for better visualization
const groupLogsByDate = (logs: SkillLog[]): Map<string, SkillLog[]> => {
    const groups = new Map<string, SkillLog[]>();

    // Sort logs by date descending
    const sortedLogs = [...logs].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedLogs.forEach(log => {
        const dateKey = log.date.split('T')[0]; // Get YYYY-MM-DD part
        const existing = groups.get(dateKey) || [];
        existing.push(log);
        groups.set(dateKey, existing);
    });

    return groups;
};

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
    skill,
    onClose,
    onDeleteLog
}) => {
    // Sort logs by date descending
    const sortedLogs = useMemo(() =>
        [...skill.logs].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        [skill.logs]
    );

    // Calculate totals
    const totalMinutes = useMemo(() =>
        skill.logs.reduce((sum, log) => sum + log.minutes, 0),
        [skill.logs]
    );

    const handleDelete = (logId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Remover esta sessão do histórico?')) {
            onDeleteLog(logId);
        }
    };

    // Format date header (e.g., "Terça, 24 de Dezembro")
    const formatDateHeader = (dateStr: string): string => {
        try {
            const date = new Date(dateStr + 'T12:00:00');
            return new Intl.DateTimeFormat('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-${skill.colorTheme || 'emerald'}-500/20 flex items-center justify-center`}>
                            <History className={`text-${skill.colorTheme || 'emerald'}-400`} size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Histórico</h3>
                            <p className="text-sm text-slate-400">{skill.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {sortedLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock size={48} className="mx-auto text-slate-600 mb-4" />
                            <h4 className="text-white font-medium mb-2">Nenhuma sessão registrada</h4>
                            <p className="text-slate-500 text-sm">
                                Adicione sessões de estudo para ver o histórico aqui
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                            <Calendar size={14} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium text-sm">
                                                {formatLogDate(log.date)}
                                            </div>
                                            {log.notes && (
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">
                                                    {log.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`px-2 py-1 rounded-lg bg-${skill.colorTheme || 'emerald'}-500/20 text-${skill.colorTheme || 'emerald'}-400 text-sm font-medium`}>
                                            {formatDuration(log.minutes)}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(log.id, e)}
                                            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remover sessão"
                                        >
                                            <Trash2 size={14} className="text-slate-400 hover:text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with totals */}
                {sortedLogs.length > 0 && (
                    <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-400">
                                <span className="font-medium text-white">{sortedLogs.length}</span>
                                {' '}sessões registradas
                            </div>
                            <div className="text-sm">
                                <span className="text-slate-400">Total: </span>
                                <span className={`font-bold text-${skill.colorTheme || 'emerald'}-400`}>
                                    {formatDuration(totalMinutes)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionHistoryModal;
