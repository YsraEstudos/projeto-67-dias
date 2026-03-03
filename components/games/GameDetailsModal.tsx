import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gameSchema, GameFormData, GameFormInput } from '../../schemas';
import { X, Clock, Trophy, Trash2, Save, Plus, Check, AlertCircle, PencilLine, Bookmark } from 'lucide-react';
import { Game, GameStatus } from '../../types';
import { useGameActions, useGameReviewActions, useGamesStore } from '../../stores';

interface GameDetailsModalProps {
    gameId: string;
    onClose: () => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({ gameId, onClose }) => {
    // Obtém o game diretamente da store para garantir reatividade
    const game = useGamesStore(s => s.games.find(g => g.id === gameId));

    const { deleteGame, logHours, addMission, toggleMission, deleteMission, updateGame } = useGameActions();
    const { setGameReview, toggleReviewPending } = useGameReviewActions();
    const [activeTab, setActiveTab] = useState<'QUESTS' | 'LOG' | 'DETAILS' | 'REVIEW'>('QUESTS');

    // Mission Input
    const [newMissionTitle, setNewMissionTitle] = useState('');

    // Hours Input
    const [hoursInput, setHoursInput] = useState('');

    // Image error state
    const [imgError, setImgError] = useState(false);

    // Review Input - usa valor inicial vazio, será sincronizado via useEffect
    const [reviewText, setReviewText] = useState('');

    // Form Setup - defaultValues serão atualizados via reset
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm<GameFormInput, any, GameFormData>({
        resolver: zodResolver(gameSchema),
        defaultValues: {
            title: '',
            platform: '',
            status: 'PLAYING',
            coverUrl: '',
            totalHoursEstimate: undefined,
            folderId: ''
        }
    });

    const watchedCoverUrl = watch('coverUrl');

    // Sync form and reviewText when game changes
    useEffect(() => {
        if (game) {
            reset({
                title: game.title,
                platform: game.platform,
                status: game.status,
                coverUrl: game.coverUrl || '',
                totalHoursEstimate: game.totalHoursEstimate,
                folderId: game.folderId
            });
            setReviewText(game.review || '');
        }
    }, [game, reset]);

    // Reset img error when url changes
    useEffect(() => {
        setImgError(false);
    }, [watchedCoverUrl]);

    // Early return se o jogo não existir mais
    if (!game) {
        return null;
    }


    const handleAddMission = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMissionTitle.trim()) return;
        addMission(game.id, { title: newMissionTitle });
        setNewMissionTitle('');
    };

    const handleLogHours = (e: React.FormEvent) => {
        e.preventDefault();
        const hours = parseFloat(hoursInput);
        if (isNaN(hours) || hours <= 0) return;
        logHours(game.id, hours);
        setHoursInput('');
    };

    const handleSaveReview = () => {
        setGameReview(game.id, reviewText);
    };

    const handleDelete = () => {
        if (window.confirm('Tem certeza que deseja remover este jogo?')) {
            deleteGame(game.id);
            onClose();
        }
    };

    const onSubmitDetails = (data: GameFormData) => {
        updateGame(game.id, {
            title: data.title,
            platform: data.platform,
            status: data.status,
            coverUrl: data.coverUrl || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Sidebar / Cover */}
                <div className="w-full md:w-72 lg:w-80 bg-slate-950 p-4 md:p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 shrink-0 max-h-[40vh] md:max-h-none overflow-hidden md:overflow-visible">
                    {watchedCoverUrl && !imgError ? (
                        <img
                            src={watchedCoverUrl}
                            alt="Game Cover"
                            loading="lazy"
                            onError={() => setImgError(true)}
                            className="w-full max-h-[200px] md:max-h-none md:aspect-[3/4] object-cover rounded-xl shadow-lg shadow-purple-900/20 mb-4"
                        />
                    ) : (
                        <div className="w-full max-h-[200px] md:max-h-none md:aspect-[3/4] bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center mb-4 flex-col gap-2 text-slate-700">
                            <AlertCircle size={32} />
                            <span className="text-xs">Sem capa</span>
                        </div>
                    )}

                    <h2 className="text-xl font-bold text-white mb-2 break-words">{game.title}</h2>
                    <div className="flex flex-col gap-2 text-sm text-slate-400 mb-6">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            {game.platform || 'Plataforma não definida'}
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock size={14} />
                            {game.hoursPlayed}h jogadas
                        </span>
                        <span className="flex items-center gap-2">
                            <Trophy size={14} />
                            {game.missions.filter(m => m.isCompleted).length}/{game.missions.length} missões
                        </span>
                    </div>

                    <div className="mt-auto">
                        <button
                            onClick={handleDelete}
                            className="w-full py-2 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                        >
                            <Trash2 size={16} />
                            Remover Jogo
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-0">

                    {/* Header & Tabs */}
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <div className="flex gap-1 bg-slate-950 p-1 rounded-lg">
                            {(['QUESTS', 'LOG', 'DETAILS', 'REVIEW'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    {tab === 'QUESTS' ? 'Missões' : tab === 'LOG' ? 'Tempo' : tab === 'DETAILS' ? 'Detalhes' : 'Resenha'}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {activeTab === 'QUESTS' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Trophy className="text-yellow-500" size={20} />
                                        Quadro de Missões
                                    </h3>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Main & Side Quests</span>
                                </div>

                                <form onSubmit={handleAddMission} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMissionTitle}
                                        onChange={(e) => setNewMissionTitle(e.target.value)}
                                        placeholder="Nova missão..."
                                        maxLength={100}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMissionTitle.trim()}
                                        className="bg-slate-800 hover:bg-purple-600 text-purple-400 hover:text-white p-2.5 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </form>

                                <div className="space-y-2">
                                    {game.missions.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                                            Nenhuma missão ativa. Adicione objetivos para acompanhar seu progresso!
                                        </div>
                                    ) : (
                                        game.missions.map((mission) => (
                                            <div
                                                key={mission.id}
                                                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${mission.isCompleted
                                                    ? 'bg-purple-500/10 border-purple-500/20 opacity-75'
                                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => toggleMission(game.id, mission.id)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${mission.isCompleted
                                                        ? 'bg-purple-500 border-purple-500 text-white'
                                                        : 'border-slate-600 hover:border-purple-400'
                                                        }`}
                                                >
                                                    {mission.isCompleted && <Check size={14} />}
                                                </button>
                                                <span className={`flex-1 break-words ${mission.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                                    {mission.title}
                                                </span>
                                                <button
                                                    onClick={() => deleteMission(game.id, mission.id)}
                                                    className="md:opacity-0 md:group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'LOG' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Clock className="text-blue-500" size={20} />
                                        Registro de Tempo
                                    </h3>
                                </div>

                                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center">
                                    <div className="text-4xl font-bold text-white mb-1">{game.hoursPlayed}h</div>
                                    <div className="text-slate-400 text-sm">Tempo Total Jogado</div>
                                    {game.totalHoursEstimate && (
                                        <div className="mt-4 pt-4 border-t border-slate-800">
                                            <div className="text-sm text-slate-500">Progresso Estimado</div>
                                            <div className="flex items-center gap-2 justify-center mt-1">
                                                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${Math.min(100, (game.hoursPlayed / game.totalHoursEstimate) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-blue-400 font-mono">
                                                    {Math.round((game.hoursPlayed / game.totalHoursEstimate) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleLogHours} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="text-xs text-slate-500 mb-1 block">Adicionar horas</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max="99"
                                            value={hoursInput}
                                            onChange={(e) => setHoursInput(e.target.value)}
                                            placeholder="Ex: 2.5"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                                    >
                                        Registrar
                                    </button>
                                </form>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-slate-400 border-b border-slate-800 pb-2">Histórico Recente</h4>
                                    {game.history.slice().reverse().map((log) => (
                                        <div key={log.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-800/30 rounded-lg transition-colors">
                                            <span className="text-slate-300">
                                                {new Date(log.date).toLocaleDateString()}
                                                <span className="text-slate-500 text-xs ml-2">
                                                    {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </span>
                                            <span className="font-mono text-blue-400">+{log.hoursPlayed}h</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'DETAILS' && (
                            <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                                    <input
                                        {...register('title')}
                                        className={`w-full bg-slate-950 border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 ${errors.title ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-800 focus:ring-purple-500/50'}`}
                                    />
                                    {errors.title && <span className="text-xs text-red-400">{errors.title.message}</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Plataforma</label>
                                        <input
                                            {...register('platform')}
                                            className={`w-full bg-slate-950 border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 ${errors.platform ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-800 focus:ring-purple-500/50'}`}
                                        />
                                        {errors.platform && <span className="text-xs text-red-400">{errors.platform.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                                        <select
                                            {...register('status')}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        >
                                            <option value="PLAYING">Jogando</option>
                                            <option value="WISHLIST">Desejados</option>
                                            <option value="COMPLETED">Zerado</option>
                                            <option value="PAUSED">Pausado</option>
                                            <option value="ABANDONED">Dropado</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">URL da Capa</label>
                                    <input
                                        {...register('coverUrl')}
                                        className={`w-full bg-slate-950 border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 ${errors.coverUrl ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-800 focus:ring-purple-500/50'}`}
                                    />
                                    {errors.coverUrl && <span className="text-xs text-red-400">{errors.coverUrl.message}</span>}
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="submit"
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        Salvar Alterações
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'REVIEW' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

                                {/* Card destacado "Marcar para Resenhar" no topo */}
                                <button
                                    onClick={() => toggleReviewPending(game.id)}
                                    className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group
                                        ${game.reviewPending
                                            ? 'bg-pink-500/10 border-pink-500/30 hover:border-pink-500/50'
                                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                >
                                    <div className={`p-3 rounded-lg transition-colors ${game.reviewPending ? 'bg-pink-500/20' : 'bg-slate-800'}`}>
                                        <Bookmark
                                            size={24}
                                            className={`transition-colors ${game.reviewPending ? 'text-pink-400 fill-pink-400' : 'text-slate-400'}`}
                                        />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className={`font-semibold ${game.reviewPending ? 'text-pink-300' : 'text-white'}`}>
                                            Marcar para Resenhar
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {game.reviewPending
                                                ? 'Este jogo aparecerá na sua lista de resenhas pendentes'
                                                : 'Adicione à fila para escrever uma resenha depois'}
                                        </div>
                                    </div>
                                    {/* Toggle Switch Visual */}
                                    <div className={`w-12 h-6 rounded-full transition-all duration-200 flex items-center ${game.reviewPending ? 'bg-pink-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                                        <div className="w-5 h-5 bg-white rounded-full mx-0.5 shadow-md transition-all" />
                                    </div>
                                </button>

                                {/* Header da seção de resenha */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <PencilLine className="text-pink-500" size={20} />
                                        Resenha do Jogo
                                    </h3>
                                </div>

                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <div className="mb-4 text-sm text-slate-400">
                                        O que você achou deste jogo? Escreva suas impressões, pontos fortes e fracos.
                                        Esta resenha será salva e contará para seu progresso de revisão.
                                    </div>
                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Minha resenha..."
                                        className="w-full h-64 bg-slate-900 border border-slate-800 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none leading-relaxed"
                                    />
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={handleSaveReview}
                                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                        >
                                            <Save size={18} />
                                            Salvar Resenha
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
};

GameDetailsModal.displayName = 'GameDetailsModal';
