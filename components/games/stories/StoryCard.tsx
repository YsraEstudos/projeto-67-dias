import React from 'react';
import { BookMarked, Languages, Trash2 } from 'lucide-react';
import { StoryFeedItem } from './stories.utils';

export interface StorySelectionEvent {
    x: number;
    y: number;
    text: string;
    language?: string;
    field: 'original' | 'translation';
    item: StoryFeedItem;
}

interface StoryCardProps {
    item: StoryFeedItem;
    showGameTitle?: boolean;
    onDelete: (item: StoryFeedItem) => void;
    onSelectionMenu: (event: StorySelectionEvent) => void;
}

const StoryTextBlock: React.FC<{
    title: string;
    text?: string;
    language?: string;
    field: 'original' | 'translation';
    accent: 'blue' | 'purple';
    item: StoryFeedItem;
    onSelectionMenu: (event: StorySelectionEvent) => void;
}> = ({ title, text, language, field, accent, item, onSelectionMenu }) => {
    if (!text?.trim()) return null;

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

        if (!selectedText || !range || !e.currentTarget.contains(range.commonAncestorContainer)) {
            return;
        }

        e.preventDefault();
        onSelectionMenu({
            x: e.clientX,
            y: e.clientY,
            text: selectedText,
            language,
            field,
            item,
        });
    };

    return (
        <div
            onContextMenu={handleContextMenu}
            className={`rounded-[1.4rem] border px-4 py-4 ${
                accent === 'blue'
                    ? 'border-blue-500/20 bg-blue-500/10 selection:bg-blue-500/30'
                    : 'border-purple-500/20 bg-purple-500/10 selection:bg-purple-500/30'
            }`}
        >
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{title}</p>
                {language && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                        <Languages size={11} className={accent === 'blue' ? 'text-blue-400' : 'text-purple-400'} />
                        {language}
                    </span>
                )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-100">{text}</p>
        </div>
    );
};

export const StoryCard: React.FC<StoryCardProps> = ({
    item,
    showGameTitle = true,
    onDelete,
    onSelectionMenu,
}) => {
    const { game, story } = item;

    return (
        <article className="overflow-hidden rounded-[2rem] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.92))] shadow-[0_24px_80px_-42px_rgba(15,23,42,0.9)]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 bg-slate-950/60 px-5 py-4">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {showGameTitle && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200">
                                <BookMarked size={12} className="text-blue-400" />
                                {game.title}
                            </span>
                        )}
                        {story.arc && (
                            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200">
                                {story.arc}
                            </span>
                        )}
                    </div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        {new Date(story.createdAt).toLocaleString()}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-500 transition-colors hover:border-red-500/30 hover:text-red-400"
                    aria-label={`Excluir história de ${game.title}`}
                >
                    <Trash2 size={15} />
                </button>
            </div>

            <div className={`grid gap-0 ${story.imageUrl ? 'lg:grid-cols-[1.05fr_0.95fr]' : ''}`}>
                {story.imageUrl && (
                    <div className="border-b border-slate-800 bg-slate-950/50 lg:border-b-0 lg:border-r">
                        <img
                            src={story.imageUrl}
                            alt={story.arc ? `Cena do arco ${story.arc}` : `História de ${game.title}`}
                            className="max-h-[420px] w-full object-cover"
                            loading="lazy"
                        />
                    </div>
                )}

                <div className={`gap-4 px-5 py-5 ${story.translatedContent?.trim() ? 'grid md:grid-cols-2' : 'grid'}`}>
                    <StoryTextBlock
                        title="Original"
                        text={story.content}
                        language={story.originalLanguage}
                        field="original"
                        accent="blue"
                        item={item}
                        onSelectionMenu={onSelectionMenu}
                    />

                    <StoryTextBlock
                        title="Tradução"
                        text={story.translatedContent}
                        language={story.translatedLanguage}
                        field="translation"
                        accent="purple"
                        item={item}
                        onSelectionMenu={onSelectionMenu}
                    />
                </div>
            </div>
        </article>
    );
};
