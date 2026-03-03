import React from 'react';
import { BookOpenText } from 'lucide-react';
import { StoryCard, StorySelectionEvent } from './StoryCard';
import { StoryFeedItem } from './stories.utils';

interface StoriesTimelineProps {
    items: StoryFeedItem[];
    showGameTitle?: boolean;
    onDelete: (item: StoryFeedItem) => void;
    onSelectionMenu: (event: StorySelectionEvent) => void;
}

export const StoriesTimeline: React.FC<StoriesTimelineProps> = ({
    items,
    showGameTitle = true,
    onDelete,
    onSelectionMenu,
}) => {
    if (items.length === 0) {
        return (
            <div className="rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-950/40 px-6 py-14 text-center">
                <BookOpenText size={42} className="mx-auto text-slate-600" />
                <p className="mt-4 text-lg font-semibold text-slate-300">Nenhuma história nesse recorte.</p>
                <p className="mt-2 text-sm text-slate-500">
                    Registre uma cena, diálogo ou captura para começar seu arquivo de campanha.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {items.map((item) => (
                <StoryCard
                    key={item.story.id}
                    item={item}
                    showGameTitle={showGameTitle}
                    onDelete={onDelete}
                    onSelectionMenu={onSelectionMenu}
                />
            ))}
        </div>
    );
};
