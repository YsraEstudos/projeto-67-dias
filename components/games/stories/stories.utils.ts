import { Game, GameStory } from '../../../types';

export interface StoryFeedItem {
    game: Game;
    story: GameStory;
}

export interface StudyLaterPayload {
    game: Game;
    story: GameStory;
    text: string;
    language?: string;
    field: 'original' | 'translation';
}

export const buildStoryFeed = (games: Game[], gameId?: string): StoryFeedItem[] => {
    return games
        .filter((game) => !gameId || game.id === gameId)
        .flatMap((game) => (game.stories || []).map((story) => ({ game, story })))
        .sort((a, b) => b.story.createdAt - a.story.createdAt);
};

export const matchesStorySearch = (item: StoryFeedItem, searchTerm: string) => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return true;

    return [
        item.game.title,
        item.game.platform,
        item.story.arc,
        item.story.content,
        item.story.translatedContent,
        item.story.originalLanguage,
        item.story.translatedLanguage,
    ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
};

export const buildStudyLaterContent = ({
    game,
    story,
    text,
    language,
    field,
}: StudyLaterPayload) => {
    const translationSection = story.translatedContent && story.translatedContent.trim() !== text.trim()
        ? `\n\nTradução registrada:\n${story.translatedContent}`
        : '';

    return [
        `Jogo: ${game.title}`,
        `Arco: ${story.arc || 'Sem arco'}`,
        'Origem: Central de Jogos > Histórias',
        `Idioma do trecho: ${language || (field === 'translation' ? 'Tradução' : 'Original')}`,
        'Trecho selecionado:',
        text,
    ].join('\n') + translationSection;
};
