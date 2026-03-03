import React, { useEffect, useMemo, useState } from 'react';
import { Globe2, Plus, Sparkles } from 'lucide-react';
import { Game } from '../../../types';
import { STORY_LANGUAGE_OPTIONS } from './stories.constants';
import { StoryImageDropzone } from './StoryImageDropzone';

export interface StoryDraftInput {
    gameId: string;
    content: string;
    translatedContent?: string;
    arc?: string;
    originalLanguage?: string;
    translatedLanguage?: string;
    imageFile?: File | null;
    imageUrl?: string;
}

interface StoryComposerProps {
    mode: 'global' | 'game';
    games: Game[];
    gameId?: string;
    onCreateStory: (draft: StoryDraftInput) => Promise<void>;
    disabled?: boolean;
}

export const StoryComposer: React.FC<StoryComposerProps> = ({
    mode,
    games,
    gameId,
    onCreateStory,
    disabled = false,
}) => {
    const [selectedGameId, setSelectedGameId] = useState(mode === 'game' ? (gameId || games[0]?.id || '') : '');
    const [content, setContent] = useState('');
    const [translatedContent, setTranslatedContent] = useState('');
    const [arc, setArc] = useState('');
    const [originalLanguage, setOriginalLanguage] = useState('ja');
    const [translatedLanguage, setTranslatedLanguage] = useState('pt-BR');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lockedGame = useMemo(
        () => games.find((game) => game.id === (gameId || selectedGameId)),
        [gameId, games, selectedGameId]
    );

    useEffect(() => {
        if (mode === 'game' && gameId) {
            setSelectedGameId(gameId);
        }
    }, [gameId, mode]);

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const canSubmit = Boolean(
        selectedGameId &&
        (content.trim() || translatedContent.trim() || imageFile || imageUrl.trim()) &&
        !disabled &&
        !isSubmitting
    );

    const resetForm = () => {
        setContent('');
        setTranslatedContent('');
        setArc('');
        setImageFile(null);
        setImageUrl('');
        setError(null);
        if (mode === 'global') {
            setSelectedGameId('');
        }
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGameId) {
            setError('Selecione um jogo para registrar a história.');
            return;
        }

        setError(null);
        setIsSubmitting(true);
        try {
            await onCreateStory({
                gameId: selectedGameId,
                content: content.trim(),
                translatedContent: translatedContent.trim() || undefined,
                arc: arc.trim() || undefined,
                originalLanguage: originalLanguage || undefined,
                translatedLanguage: translatedContent.trim() ? translatedLanguage || undefined : undefined,
                imageFile,
                imageUrl: imageFile ? undefined : imageUrl.trim() || undefined,
            });
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nao foi possivel salvar a historia.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="overflow-hidden rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.92))]"
        >
            <div className="border-b border-slate-800/80 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-300">Arquivo de campanha</p>
                        <h3 className="mt-1 text-xl font-bold text-white">Registrar nova história</h3>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-400">
                        <Sparkles size={12} className="text-blue-400" />
                        {lockedGame ? lockedGame.title : 'Escolha um jogo'}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                    {mode === 'global' && (
                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Jogo</span>
                            <select
                                value={selectedGameId}
                                onChange={(e) => setSelectedGameId(e.target.value)}
                                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                            >
                                <option value="">Selecione um jogo</option>
                                {games.map((game) => (
                                    <option key={game.id} value={game.id}>
                                        {game.title} · {game.platform}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                        <label className="block md:col-span-1">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Arco</span>
                            <input
                                type="text"
                                value={arc}
                                onChange={(e) => setArc(e.target.value)}
                                placeholder="Capitulo 3"
                                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </label>
                        <label className="block md:col-span-1">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Idioma original</span>
                            <select
                                value={originalLanguage}
                                onChange={(e) => setOriginalLanguage(e.target.value)}
                                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                            >
                                {STORY_LANGUAGE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block md:col-span-1">
                            <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Idioma traduzido</span>
                            <select
                                value={translatedLanguage}
                                onChange={(e) => setTranslatedLanguage(e.target.value)}
                                className={`w-full rounded-2xl border px-4 py-3 text-white outline-none transition ${
                                    translatedContent.trim()
                                        ? 'border-purple-500/60 bg-purple-500/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20'
                                        : 'border-slate-800 bg-slate-950/70 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20'
                                }`}
                            >
                                {STORY_LANGUAGE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                <Globe2 size={12} className="text-blue-400" />
                                Texto original
                            </span>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Descreva a cena, dialogo ou anotacao importante..."
                                className="h-40 w-full rounded-[1.5rem] border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm leading-relaxed text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </label>

                        <label className="block">
                            <span className={`mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                                translatedContent.trim() ? 'text-purple-300' : 'text-slate-500'
                            }`}>
                                <Globe2 size={12} className="text-purple-400" />
                                Versão traduzida
                            </span>
                            <textarea
                                value={translatedContent}
                                onChange={(e) => setTranslatedContent(e.target.value)}
                                placeholder="Registre sua traducao, contexto ou versao adaptada..."
                                className={`h-40 w-full rounded-[1.5rem] border px-4 py-3 text-sm leading-relaxed text-white outline-none transition ${
                                    translatedContent.trim()
                                        ? 'border-purple-500/50 bg-purple-500/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20'
                                        : 'border-slate-800 bg-slate-950/70 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20'
                                }`}
                            />
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <StoryImageDropzone
                        selectedFile={imageFile}
                        previewUrl={previewUrl}
                        imageUrlInput={imageUrl}
                        onFileSelect={setImageFile}
                        onImageUrlChange={setImageUrl}
                        onError={setError}
                    />

                    {error && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                        <p className="text-sm text-slate-400">
                            Salve com texto, com imagem, ou com os dois. O bloco bilingue fica pronto para consulta depois.
                        </p>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:scale-[1.02] hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={15} />
                            {isSubmitting ? 'Salvando...' : 'Adicionar historia'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};
