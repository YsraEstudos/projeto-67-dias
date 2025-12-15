import React, { useState } from 'react';
import { Game, getGameStatusLabel } from '../../types';
import { Clock, Trophy, PencilLine } from 'lucide-react';

interface GameCardProps {
    game: Game;
    onGameClick: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = React.memo(({ game, onGameClick }) => {
    const isPlaying = game.status === 'PLAYING';
    const isCompleted = game.status === 'COMPLETED';

    // Lazy loading image state
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Calculate progress based on missions if available
    const completedMissions = game.missions.filter((m) => m.isCompleted).length;
    const totalMissions = game.missions.length;
    const missionsProgress = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    const handleClick = () => onGameClick(game);

    const hasValidCover = game.coverUrl && (game.coverUrl.startsWith('http') || game.coverUrl.startsWith('/'));

    return (
        <div
            onClick={handleClick}
            className={`group relative bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all hover:scale-[1.02] hover:shadow-purple-900/20 cursor-pointer ${isPlaying ? 'ring-1 ring-purple-500/30' : ''}`}
        >
            {/* Lazy Loaded Cover Image with fade-in */}
            {hasValidCover && !imgError && (
                <img
                    src={game.coverUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500
                        ${imgLoaded ? 'opacity-20 group-hover:opacity-30' : 'opacity-0'}`}
                />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-950" />

            <div className="relative p-5 h-full flex flex-col">
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${isPlaying ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                        {getGameStatusLabel(game.status)}
                    </span>
                    {game.platform && (
                        <span className="text-xs text-slate-500 font-mono bg-slate-950/50 px-2 py-1 rounded">
                            {game.platform}
                        </span>
                    )}

                    {/* Review Pending Badge */}
                    {game.reviewPending && (
                        <div className="absolute top-4 right-4 animate-bounce-slow">
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                <PencilLine size={10} />
                                RESENHAR
                            </span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-tight">
                        {game.title}
                    </h3>
                </div>

                {/* Stats */}
                <div className="mt-4 space-y-3">

                    {/* Hours */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock size={14} className="text-purple-400" />
                        <span>{game.hoursPlayed}h {game.totalHoursEstimate ? `/ ${game.totalHoursEstimate}h` : ''}</span>
                    </div>

                    {/* Missions Progress Bar */}
                    {totalMissions > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Trophy size={12} />
                                    Missões
                                </span>
                                <span>{Math.round(missionsProgress)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${missionsProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

GameCard.displayName = 'GameCard';

