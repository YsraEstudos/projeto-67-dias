import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenText, Layers3, Search, Sparkles, Swords } from 'lucide-react';
import { Note, Tag } from '../../../types';
import { useGameActions, useGamesStore, useNotesStore } from '../../../stores';
import { decrementPendingWrites, incrementPendingWrites } from '../../../stores/firestoreSync';
import { deleteGameStoryImage, uploadGameStoryImage } from '../../../services/storageService';
import { generateId } from '../../../utils/generateId';
import { STORY_FEEDBACK_TIMEOUT_MS, STORIES_STUDY_TAG_COLOR, STORIES_STUDY_TAG_LABEL } from './stories.constants';
import { StoryComposer, StoryDraftInput } from './StoryComposer';
import { StoriesTimeline } from './StoriesTimeline';
import { StorySelectionContextMenu } from './StorySelectionContextMenu';
import { buildStoryFeed, buildStudyLaterContent, matchesStorySearch, StoryFeedItem } from './stories.utils';
import type { StorySelectionEvent } from './StoryCard';

interface StoriesPanelProps {
    mode: 'global' | 'game';
    gameId?: string;
}

type FeedbackState = {
    type: 'success' | 'error';
    message: string;
} | null;

export const StoriesPanel: React.FC<StoriesPanelProps> = ({ mode, gameId }) => {
    const games = useGamesStore((state) => state.games);
    const { addStory, deleteStory } = useGameActions();
    const notes = useNotesStore((state) => state.notes);
    const tags = useNotesStore((state) => state.tags);
    const addTag = useNotesStore((state) => state.addTag);
    const addNote = useNotesStore((state) => state.addNote);

    const scopedGames = useMemo(
        () => (mode === 'game' && gameId ? games.filter((game) => game.id === gameId) : games),
        [gameId, games, mode]
    );
    const storyFeed = useMemo(() => buildStoryFeed(scopedGames), [scopedGames]);
    const gameLookup = useMemo(() => new Map(games.map((game) => [game.id, game])), [games]);

    const [filterGameId, setFilterGameId] = useState(mode === 'game' ? (gameId || 'ALL') : 'ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [arcFilter, setArcFilter] = useState('ALL');
    const [feedback, setFeedback] = useState<FeedbackState>(null);
    const [contextMenu, setContextMenu] = useState<StorySelectionEvent | null>(null);

    useEffect(() => {
        if (!feedback) return;
        const timer = window.setTimeout(() => setFeedback(null), STORY_FEEDBACK_TIMEOUT_MS);
        return () => window.clearTimeout(timer);
    }, [feedback]);

    useEffect(() => {
        const handleClose = () => setContextMenu(null);
        document.addEventListener('click', handleClose);
        return () => document.removeEventListener('click', handleClose);
    }, []);

    const arcOptions = useMemo(() => {
        return [...new Set(storyFeed.map((item) => item.story.arc).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
    }, [storyFeed]);

    const filteredItems = useMemo(() => {
        return storyFeed.filter((item) => {
            const matchesGame = filterGameId === 'ALL' || item.game.id === filterGameId;
            const matchesArc = arcFilter === 'ALL' || item.story.arc === arcFilter;
            return matchesGame && matchesArc && matchesStorySearch(item, searchTerm);
        });
    }, [arcFilter, filterGameId, searchTerm, storyFeed]);

    const summary = useMemo(() => {
        const gamesWithStories = new Set(storyFeed.map((item) => item.game.id)).size;
        const latestArc = storyFeed.find((item) => item.story.arc)?.story.arc || 'Sem arco recente';
        return {
            totalStories: storyFeed.length,
            gamesWithStories,
            latestArc,
        };
    }, [storyFeed]);

    const createStudyTagIfNeeded = (): string => {
        const existing = tags.find((tag) => tag.label === STORIES_STUDY_TAG_LABEL);
        if (existing) return existing.id;

        const newTag: Tag = {
            id: generateId(),
            label: STORIES_STUDY_TAG_LABEL,
            color: STORIES_STUDY_TAG_COLOR,
            createdAt: Date.now(),
        };
        addTag(newTag);
        return newTag.id;
    };

    const handleCreateStory = async (draft: StoryDraftInput) => {
        const targetGame = gameLookup.get(draft.gameId);
        if (!targetGame) {
            throw new Error('Jogo selecionado não encontrado.');
        }

        const storyId = generateId();
        let uploadedImage: { url: string; storagePath: string } | null = null;

        try {
            incrementPendingWrites();
            if (draft.imageFile) {
                uploadedImage = await uploadGameStoryImage(targetGame.id, storyId, draft.imageFile);
            }

            addStory(targetGame.id, {
                id: storyId,
                content: draft.content,
                translatedContent: draft.translatedContent,
                arc: draft.arc,
                originalLanguage: draft.originalLanguage,
                translatedLanguage: draft.translatedLanguage,
                imageUrl: uploadedImage?.url || draft.imageUrl,
                imageStoragePath: uploadedImage?.storagePath,
            });

            setFeedback({
                type: 'success',
                message: `História salva em ${targetGame.title}.`,
            });
        } catch (error) {
            throw error instanceof Error ? error : new Error('Nao foi possivel salvar a historia.');
        } finally {
            decrementPendingWrites();
        }
    };

    const handleDeleteStory = async (item: StoryFeedItem) => {
        try {
            incrementPendingWrites();
            if (item.story.imageStoragePath) {
                await deleteGameStoryImage(item.story.imageStoragePath);
            }
            deleteStory(item.game.id, item.story.id);
            setFeedback({
                type: 'success',
                message: `História removida de ${item.game.title}.`,
            });
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Nao foi possivel remover a historia.',
            });
        } finally {
            decrementPendingWrites();
        }
    };

    const handleStudyLater = async () => {
        if (!contextMenu) return;

        try {
            incrementPendingWrites();
            const tagId = createStudyTagIfNeeded();
            const note: Note = {
                id: generateId(),
                title: `[${contextMenu.item.game.title}] Estudar Depois`,
                content: buildStudyLaterContent({
                    game: contextMenu.item.game,
                    story: contextMenu.item.story,
                    text: contextMenu.text,
                    language: contextMenu.language,
                    field: contextMenu.field,
                }),
                color: 'blue',
                tags: [tagId],
                isPinned: false,
                pinnedToTags: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            addNote(note);
            setFeedback({
                type: 'success',
                message: 'Trecho enviado para Notas.',
            });
        } finally {
            decrementPendingWrites();
            setContextMenu(null);
        }
    };

    const title = mode === 'game' ? 'Histórias do jogo' : 'Mural de histórias';
    const subtitle = mode === 'game'
        ? 'Cenas, diálogos, capturas e traduções do jogo atual.'
        : 'Diário editorial de todos os seus jogos, com busca, idiomas e estudo posterior.';

    return (
        <section className="space-y-6">
            <div className="overflow-hidden rounded-[2.2rem] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_18%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.96))] shadow-[0_30px_100px_-55px_rgba(59,130,246,0.6)]">
                <div className="border-b border-slate-800/80 px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-300">Central de jogos</p>
                            <h2 className="mt-1 text-2xl font-bold text-white">{title}</h2>
                            <p className="mt-2 max-w-3xl text-sm text-slate-400">{subtitle}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Histórias</p>
                                <p className="mt-1 text-2xl font-bold text-white">{summary.totalStories}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Jogos</p>
                                <p className="mt-1 text-2xl font-bold text-white">{summary.gamesWithStories}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Arco recente</p>
                                <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{summary.latestArc}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-5 sm:px-6">
                    {feedback && (
                        <div
                            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                                feedback.type === 'success'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                    : 'border-red-500/30 bg-red-500/10 text-red-100'
                            }`}
                        >
                            {feedback.message}
                        </div>
                    )}

                    <StoryComposer
                        mode={mode}
                        games={scopedGames}
                        gameId={gameId}
                        onCreateStory={handleCreateStory}
                    />
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/35 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Arquivo vivo</p>
                        <h3 className="mt-1 text-lg font-bold text-white">Timeline filtrável</h3>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-slate-400">
                        <Swords size={12} className="text-purple-400" />
                        clique direito para estudar depois
                    </div>
                </div>

                <div className={`mt-5 grid gap-4 ${mode === 'game' ? 'lg:grid-cols-[1.4fr_0.9fr]' : 'lg:grid-cols-[1.2fr_0.9fr_0.9fr]'}`}>
                    <label className="relative block">
                        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por jogo, arco, texto ou idioma..."
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-3 pl-11 pr-4 text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </label>

                    {mode === 'global' && (
                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Jogo</span>
                            <select
                                value={filterGameId}
                                onChange={(e) => setFilterGameId(e.target.value)}
                                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="ALL">Todos os jogos</option>
                                {scopedGames.map((game) => (
                                    <option key={game.id} value={game.id}>
                                        {game.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label className="block">
                        <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            <Layers3 size={12} className="text-purple-400" />
                            Arco
                        </span>
                        <select
                            value={arcFilter}
                            onChange={(e) => setArcFilter(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                        >
                            <option value="ALL">Todos os arcos</option>
                            {arcOptions.map((arc) => (
                                <option key={arc} value={arc}>
                                    {arc}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-2">
                            <BookOpenText size={14} className="text-blue-400" />
                            {filteredItems.length} registros visíveis
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <Sparkles size={14} className="text-purple-400" />
                            {notes.length} notas totais no arquivo
                        </span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        mais recentes primeiro
                    </p>
                </div>

                <div className="mt-6">
                    <StoriesTimeline
                        items={filteredItems}
                        showGameTitle={mode === 'global'}
                        onDelete={handleDeleteStory}
                        onSelectionMenu={setContextMenu}
                    />
                </div>
            </div>

            {contextMenu && (
                <StorySelectionContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    text={contextMenu.text}
                    onStudyLater={handleStudyLater}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </section>
    );
};
