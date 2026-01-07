import React, { useState, useMemo, useCallback } from 'react';
import {
    Sparkles, Plus, Trash2, CheckCircle2, Circle,
    Zap, Trophy, Rocket, ChevronLeft, ChevronRight,
    Link2, ExternalLink, FileText
} from 'lucide-react';
import { Skill, MicroAchievement, NextDayContent } from '../../types';
import { useSkillsStore } from '../../stores/skillsStore';
import { THEME_VARIANTS, ThemeKey } from './constants';

interface MicroAchievementsTabProps {
    skill: Skill;
}

type TabView = 'micro' | 'nextDay';

const MOTIVATIONAL_MESSAGES = [
    "Começar é 70% da vitória! 🚀",
    "Cada micro-passo conta! ✨",
    "Você está construindo momentum! 🔥",
    "Pequenas vitórias = Grandes resultados! 🏆",
    "Seu cérebro agradece! 🧠💚",
    "Você tomou a iniciativa! 💪",
    "O poder está em começar! ⚡",
];

const NEXT_DAY_MESSAGES = [
    "Preparação é metade do sucesso! 📚",
    "Organize hoje, vença amanhã! 🎯",
    "Antecipe seu progresso! ⚡",
    "Planeje agora, execute depois! 🚀",
];

const CELEBRATION_EMOJIS = ['🎉', '✨', '🌟', '💫', '🎯', '🏆', '🚀', '💪'];

/**
 * MicroAchievementsTab - ADHD-friendly micro-victories and next-day content system
 * Toggles between micro-achievements and content preparation views
 */
export const MicroAchievementsTab: React.FC<MicroAchievementsTabProps> = ({ skill }) => {
    // === View State ===
    const [activeView, setActiveView] = useState<TabView>('micro');

    // === Micro-Victories State ===
    const [newTitle, setNewTitle] = useState('');
    const [celebratingId, setCelebratingId] = useState<string | null>(null);

    // === Next Day Content State ===
    const [contentTitle, setContentTitle] = useState('');
    const [contentUrl, setContentUrl] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);

    // === Store Hooks ===
    const {
        // Micro-Achievements
        addMicroAchievement,
        toggleMicroAchievement,
        deleteMicroAchievement,
        clearCompletedMicroAchievements,
        // Next Day Content
        addNextDayContent,
        toggleNextDayContent,
        deleteNextDayContent,
        clearCompletedNextDayContents
    } = useSkillsStore();

    // === Theme ===
    const theme = (skill.colorTheme as ThemeKey) || 'emerald';
    const variants = THEME_VARIANTS[theme];

    // === Micro-Achievements Data ===
    const achievements = skill.microAchievements || [];
    const completedToday = useMemo(() => {
        const today = new Date().toDateString();
        return achievements.filter(a =>
            a.isCompleted &&
            a.completedAt &&
            new Date(a.completedAt).toDateString() === today
        ).length;
    }, [achievements]);

    const pendingAchievements = useMemo(() => achievements.filter(a => !a.isCompleted), [achievements]);
    const completedAchievements = useMemo(() => achievements.filter(a => a.isCompleted), [achievements]);

    // === Next Day Content Data ===
    const contents = skill.nextDayContents || [];
    const pendingContents = useMemo(() => contents.filter(c => !c.isCompleted), [contents]);
    const completedContents = useMemo(() => contents.filter(c => c.isCompleted), [contents]);

    // === Messages ===
    const randomMessage = useMemo(() =>
        MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
        []
    );
    const nextDayMessage = useMemo(() =>
        NEXT_DAY_MESSAGES[Math.floor(Math.random() * NEXT_DAY_MESSAGES.length)],
        []
    );
    const randomEmoji = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];

    // === Micro-Achievements Handlers ===
    const handleAddAchievement = useCallback(() => {
        if (!newTitle.trim()) return;
        addMicroAchievement(skill.id, newTitle.trim());
        setNewTitle('');
    }, [skill.id, newTitle, addMicroAchievement]);

    const handleToggleAchievement = useCallback((achievement: MicroAchievement) => {
        if (!achievement.isCompleted) {
            setCelebratingId(achievement.id);
            setTimeout(() => setCelebratingId(null), 600);
        }
        toggleMicroAchievement(skill.id, achievement.id);
    }, [skill.id, toggleMicroAchievement]);

    const handleDeleteAchievement = useCallback((id: string) => {
        if (!confirm('Remover esta micro-vitória?')) return;
        deleteMicroAchievement(skill.id, id);
    }, [skill.id, deleteMicroAchievement]);

    const handleClearCompletedAchievements = useCallback(() => {
        if (completedAchievements.length > 0 &&
            confirm('Limpar todas as micro-realizações concluídas?')) {
            clearCompletedMicroAchievements(skill.id);
        }
    }, [skill.id, completedAchievements.length, clearCompletedMicroAchievements]);

    // === Next Day Content Handlers ===
    const handleAddContent = useCallback(() => {
        if (!contentTitle.trim()) return;
        addNextDayContent(skill.id, contentTitle.trim(), contentUrl.trim() || undefined);
        setContentTitle('');
        setContentUrl('');
        setShowUrlInput(false);
    }, [skill.id, contentTitle, contentUrl, addNextDayContent]);

    const handleToggleContent = useCallback((content: NextDayContent) => {
        if (!content.isCompleted) {
            setCelebratingId(content.id);
            setTimeout(() => setCelebratingId(null), 600);
        }
        toggleNextDayContent(skill.id, content.id);
    }, [skill.id, toggleNextDayContent]);

    const handleDeleteContent = useCallback((id: string) => {
        if (!confirm('Remover este conteúdo preparado?')) return;
        deleteNextDayContent(skill.id, id);
    }, [skill.id, deleteNextDayContent]);

    const handleClearCompletedContents = useCallback(() => {
        if (completedContents.length > 0 &&
            confirm('Limpar todos os conteúdos preparados?')) {
            clearCompletedNextDayContents(skill.id);
        }
    }, [skill.id, completedContents.length, clearCompletedNextDayContents]);

    const openUrl = useCallback((url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    // === Navigation ===
    const goToMicro = () => setActiveView('micro');
    const goToNextDay = () => setActiveView('nextDay');

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 animate-in fade-in duration-300">
            {/* Header with Toggle */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 flex-1">
                    {/* Left Arrow */}
                    <button
                        onClick={goToMicro}
                        className={`p-1.5 rounded-lg transition-all ${activeView === 'micro'
                            ? 'text-slate-600 cursor-default'
                            : `text-slate-400 hover:text-white hover:bg-slate-700`
                            }`}
                        disabled={activeView === 'micro'}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* Tab Titles */}
                    <div className="flex-1 flex items-center justify-center gap-4">
                        <button
                            onClick={goToMicro}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${activeView === 'micro'
                                ? `${variants.bgLight} ${variants.text} font-bold`
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Sparkles size={16} />
                            <span className="text-sm">Micro-Vitórias</span>
                        </button>

                        {/* Dots indicator */}
                        <div className="flex gap-1.5">
                            <div className={`w-2 h-2 rounded-full transition-all ${activeView === 'micro' ? variants.bg : 'bg-slate-600'}`} />
                            <div className={`w-2 h-2 rounded-full transition-all ${activeView === 'nextDay' ? variants.bg : 'bg-slate-600'}`} />
                        </div>

                        <button
                            onClick={goToNextDay}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${activeView === 'nextDay'
                                ? `${variants.bgLight} ${variants.text} font-bold`
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <FileText size={16} />
                            <span className="text-sm">Preparar Amanhã</span>
                        </button>
                    </div>

                    {/* Right Arrow */}
                    <button
                        onClick={goToNextDay}
                        className={`p-1.5 rounded-lg transition-all ${activeView === 'nextDay'
                            ? 'text-slate-600 cursor-default'
                            : `text-slate-400 hover:text-white hover:bg-slate-700`
                            }`}
                        disabled={activeView === 'nextDay'}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Subtitle */}
            <p className="text-sm text-slate-400 text-center mb-6">
                {activeView === 'micro' ? randomMessage : nextDayMessage}
            </p>

            {/* === MICRO-VICTORIES VIEW === */}
            {activeView === 'micro' && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                    {/* Today's Progress */}
                    {completedToday > 0 && (
                        <div className={`mb-6 p-4 rounded-xl ${variants.bgLight} border ${variants.borderLight} animate-micro-pop`}>
                            <div className="flex items-center gap-3">
                                <Trophy className={`${variants.text}`} size={24} />
                                <div>
                                    <p className={`font-bold ${variants.text}`}>
                                        {randomEmoji} Você já completou {completedToday} hoje!
                                    </p>
                                    <p className="text-sm text-slate-400">Incrível progresso!</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Add */}
                    <div className="mb-6">
                        <div className={`flex items-center gap-2 p-3 bg-slate-900/50 border ${variants.borderLight} rounded-xl focus-within:border-opacity-50 transition-colors`}>
                            <Plus className={`${variants.text} opacity-50`} size={18} />
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddAchievement()}
                                placeholder="Nova micro-vitória rápida..."
                                className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
                            />
                            <button
                                onClick={handleAddAchievement}
                                disabled={!newTitle.trim()}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${newTitle.trim()
                                    ? `${variants.button} hover:scale-105`
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Pending Achievements */}
                    <div className="space-y-3 mb-6">
                        {pendingAchievements.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Zap size={40} className="mx-auto mb-3 opacity-30" />
                                <p>Adicione micro-vitórias para começar!</p>
                                <p className="text-xs mt-1">Pequenas tarefas que você PODE fazer agora.</p>
                            </div>
                        ) : (
                            pendingAchievements.map((achievement) => (
                                <div
                                    key={achievement.id}
                                    className={`micro-card group flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer
                                        bg-slate-900/70 border-slate-700 hover:border-slate-600
                                        ${celebratingId === achievement.id ? 'animate-celebrate animate-success-pulse' : ''}
                                    `}
                                    onClick={() => handleToggleAchievement(achievement)}
                                >
                                    <button className={`transition-all ${variants.hoverIcon} text-slate-600`}>
                                        <Circle size={22} />
                                    </button>
                                    <span className="flex-1 text-slate-200 text-sm font-medium">
                                        {achievement.title}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteAchievement(achievement.id); }}
                                        className="md:opacity-0 md:group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Completed Achievements */}
                    {completedAchievements.length > 0 && (
                        <div className="border-t border-slate-700/50 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                                    Concluídas ({completedAchievements.length})
                                </span>
                                <button
                                    onClick={handleClearCompletedAchievements}
                                    className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Limpar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {completedAchievements.slice(0, 5).map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className="micro-card micro-card-completed flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 opacity-60 hover:opacity-80 transition-all cursor-pointer"
                                        onClick={() => handleToggleAchievement(achievement)}
                                    >
                                        <CheckCircle2 size={20} className="text-emerald-500 animate-check-bounce" />
                                        <span className="flex-1 text-slate-400 text-sm line-through">
                                            {achievement.title}
                                        </span>
                                        <span className="text-xs text-slate-600">🎉</span>
                                    </div>
                                ))}
                                {completedAchievements.length > 5 && (
                                    <p className="text-xs text-slate-600 text-center">
                                        +{completedAchievements.length - 5} mais concluídas
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === NEXT DAY CONTENT VIEW === */}
            {activeView === 'nextDay' && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                    {/* Add Content Form */}
                    <div className="mb-6 space-y-2">
                        <div className={`flex items-center gap-2 p-3 bg-slate-900/50 border ${variants.borderLight} rounded-xl focus-within:border-opacity-50 transition-colors`}>
                            <FileText className={`${variants.text} opacity-50`} size={18} />
                            <input
                                type="text"
                                value={contentTitle}
                                onChange={(e) => setContentTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !showUrlInput && handleAddContent()}
                                placeholder="Conteúdo para preparar..."
                                className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
                            />
                            <button
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                className={`p-1.5 rounded-lg transition-all ${showUrlInput ? variants.bgLight : 'hover:bg-slate-700'} ${variants.text}`}
                                title="Adicionar link"
                            >
                                <Link2 size={16} />
                            </button>
                            <button
                                onClick={handleAddContent}
                                disabled={!contentTitle.trim()}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${contentTitle.trim()
                                    ? `${variants.button} hover:scale-105`
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Adicionar
                            </button>
                        </div>

                        {/* URL Input (expandable) */}
                        {showUrlInput && (
                            <div className={`flex items-center gap-2 p-3 bg-slate-900/30 border ${variants.borderLight} rounded-xl animate-in fade-in slide-in-from-top-1 duration-200`}>
                                <Link2 className="text-slate-500" size={16} />
                                <input
                                    type="url"
                                    value={contentUrl}
                                    onChange={(e) => setContentUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddContent()}
                                    placeholder="https://exemplo.com/video..."
                                    className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Pending Contents */}
                    <div className="space-y-3 mb-6">
                        {pendingContents.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                                <p>Nenhum conteúdo para preparar</p>
                                <p className="text-xs mt-1">Adicione vídeos, artigos ou materiais para amanhã</p>
                            </div>
                        ) : (
                            pendingContents.map((content) => (
                                <div
                                    key={content.id}
                                    className={`group flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer
                                        bg-slate-900/70 border-slate-700 hover:border-slate-600
                                        ${celebratingId === content.id ? 'animate-celebrate animate-success-pulse' : ''}
                                    `}
                                    onClick={() => handleToggleContent(content)}
                                >
                                    <button className={`transition-all ${variants.hoverIcon} text-slate-600`}>
                                        <Circle size={22} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-slate-200 text-sm font-medium block">
                                            {content.title}
                                        </span>
                                        {content.url && (
                                            <span className="text-xs text-slate-500 truncate block mt-0.5">
                                                🔗 {content.url.replace(/^https?:\/\//, '').slice(0, 40)}...
                                            </span>
                                        )}
                                    </div>
                                    {content.url && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openUrl(content.url!); }}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
                                            title="Abrir link"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteContent(content.id); }}
                                        className="md:opacity-0 md:group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Completed Contents */}
                    {completedContents.length > 0 && (
                        <div className="border-t border-slate-700/50 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                                    Preparados ({completedContents.length})
                                </span>
                                <button
                                    onClick={handleClearCompletedContents}
                                    className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Limpar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {completedContents.slice(0, 5).map((content) => (
                                    <div
                                        key={content.id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 opacity-60 hover:opacity-80 transition-all cursor-pointer"
                                        onClick={() => handleToggleContent(content)}
                                    >
                                        <CheckCircle2 size={20} className="text-emerald-500" />
                                        <span className="flex-1 text-slate-400 text-sm line-through">
                                            {content.title}
                                        </span>
                                        <span className="text-xs text-slate-600">✅</span>
                                    </div>
                                ))}
                                {completedContents.length > 5 && (
                                    <p className="text-xs text-slate-600 text-center">
                                        +{completedContents.length - 5} mais preparados
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Motivational Footer */}
            <div className="mt-6 pt-4 border-t border-slate-700/30 text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Rocket size={14} className={variants.text} />
                    {activeView === 'micro'
                        ? 'Cada clique é uma vitória. Você está no caminho certo!'
                        : 'Preparar é vencer antes de começar!'}
                </p>
            </div>
        </div>
    );
};

export default MicroAchievementsTab;
