import { Book, Skill, Game, OffensiveGoalsConfig, FocusSkill } from '../types';
import { DEFAULT_OFFENSIVE_GOALS } from '../stores/configStore';

/**
 * Calcula % de progresso de leitura do dia atual
 */
export function calculateReadingProgress(books: Book[]): number {
    const today = new Date().toISOString().split('T')[0];

    const booksWithGoal = books.filter(b => b.dailyGoal && b.dailyGoal > 0 && b.status === 'READING');
    if (booksWithGoal.length === 0) return 0;

    let totalProgress = 0;
    for (const book of booksWithGoal) {
        const todayLog = book.logs?.find(l => l.date === today);
        const pagesRead = todayLog?.pagesRead || 0;
        // Cap at 100% per book to avoid one book carrying the others
        const progress = Math.min(100, (pagesRead / book.dailyGoal!) * 100);
        totalProgress += progress;
    }

    return Math.round(totalProgress / booksWithGoal.length);
}

/**
 * Calcula % de progresso de estudo do dia atual
 */
export function calculateSkillProgress(skills: Skill[], focusSkills?: FocusSkill[]): number {
    const today = new Date().toISOString().split('T')[0];

    // Se tiver skills em foco configuradas, usar lógica ponderada
    // MAS só se pelo menos uma focusSkill ainda existir no array de skills
    if (focusSkills && focusSkills.length > 0) {
        const validFocusSkills = focusSkills.filter(f => skills.some(s => s.id === f.skillId));
        if (validFocusSkills.length > 0) {
            return calculateWeightedFocusSkills(skills, validFocusSkills, today);
        }
        // Se todos os focusSkills são órfãos, cair para a lógica padrão
    }

    // Fallback: Considerar skills que têm meta OU que tiveram atividade hoje
    const activeSkills = skills.filter(s =>
        s.goalMinutes > 0 ||
        (s.logs && s.logs.some(l => l.date.split('T')[0] === today))
    );
    if (activeSkills.length === 0) return 0;

    let totalProgress = 0;
    for (const skill of activeSkills) {
        const todayMinutes = (skill.logs || [])
            .filter(l => l.date.split('T')[0] === today)
            .reduce((acc, l) => acc + l.minutes, 0);

        let dailyGoal = 0;
        if (skill.goalMinutes > 0) {
            dailyGoal = Math.ceil(skill.goalMinutes / 67);
            if (dailyGoal < 15) dailyGoal = 15;
        } else {
            // Meta padrão de 30 minutos para skills sem meta definida
            dailyGoal = 30;
        }

        const progress = Math.min(100, (todayMinutes / dailyGoal) * 100);
        totalProgress += progress;
    }

    return Math.round(totalProgress / activeSkills.length);
}

/**
 * Lógica auxiliar para calcular progresso ponderado de skills em foco
 */
function calculateWeightedFocusSkills(skills: Skill[], focusSkills: FocusSkill[], today: string): number {
    let totalWeightedProgress = 0;
    let totalWeight = 0;

    for (const focus of focusSkills) {
        const skill = skills.find(s => s.id === focus.skillId);
        if (!skill) continue;

        const todayMinutes = skill.logs
            .filter(l => l.date.split('T')[0] === today)
            .reduce((acc, l) => acc + l.minutes, 0);

        // Assume meta diária baseada em 67 dias se não houver lógica melhor
        // Idealmente futuramente skill teria dailyGoal explícito
        let dailyGoal = Math.ceil(skill.goalMinutes / 67);
        if (dailyGoal < 15) dailyGoal = 15;

        const progress = Math.min(100, (todayMinutes / dailyGoal) * 100);

        // Ponderar pelo peso definido
        totalWeightedProgress += progress * (focus.weight / 100);
        totalWeight += focus.weight;
    }

    // Normalizar se os pesos não somarem 100 (embora a UI deva garantir)
    if (totalWeight === 0) return 0;

    // Se a soma dos pesos for diferente de 100, ajustamos
    return Math.round((totalWeightedProgress / totalWeight) * 100);
}

/**
 * Calcula % de progresso de jogos do dia atual
 */
export function calculateGamesProgress(games: Game[], dailyGoalHours: number): number {
    if (!dailyGoalHours || dailyGoalHours <= 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    let totalHours = 0;

    // Considera apenas jogos 'PLAYING'
    const playingGames = games.filter(g => g.status === 'PLAYING');

    playingGames.forEach(game => {
        game.history?.forEach(log => {
            if (log.date.split('T')[0] === today) {
                totalHours += log.hoursPlayed;
            }
        });
    });

    return Math.min(100, Math.round((totalHours / dailyGoalHours) * 100));
}

/**
 * Calcula ofensiva diária avançada com pesos por categoria
 */
export function calculateDailyOffensiveAdvanced(
    books: Book[],
    skills: Skill[],
    games: Game[],
    config: OffensiveGoalsConfig = DEFAULT_OFFENSIVE_GOALS
): {
    readingProgress: number;
    skillProgress: number;
    gamesProgress: number;
    weightedProgress: number;
    isOffensive: boolean;
    targetPercentage: number;
    categoryBreakdown: {
        skills: { progress: number; weight: number; contribution: number; enabled: boolean };
        reading: { progress: number; weight: number; contribution: number; enabled: boolean };
        games: { progress: number; weight: number; contribution: number; enabled: boolean };
    };
} {
    // Verificar módulos habilitados (fallback para todos true se não existir)
    const enabled = config.enabledModules ?? { skills: true, reading: true, games: true };

    // 1. Calcular progressos individuais (0 se desativado)
    const readingProgress = enabled.reading ? calculateReadingProgress(books) : 0;
    const skillProgress = enabled.skills ? calculateSkillProgress(skills, config.focusSkills) : 0;
    const gamesProgress = enabled.games ? calculateGamesProgress(games, config.dailyGameHoursGoal) : 0;

    // 2. Extrair pesos efetivos (0 se desativado)
    const rawWeights = {
        skills: enabled.skills ? config.categoryWeights.skills : 0,
        reading: enabled.reading ? config.categoryWeights.reading : 0,
        games: enabled.games ? config.categoryWeights.games : 0,
    };

    // 3. Normalizar pesos para soma = 1
    const totalRaw = rawWeights.skills + rawWeights.reading + rawWeights.games;
    const wSkills = totalRaw > 0 ? rawWeights.skills / totalRaw : 0;
    const wReading = totalRaw > 0 ? rawWeights.reading / totalRaw : 0;
    const wGames = totalRaw > 0 ? rawWeights.games / totalRaw : 0;

    // 4. Calcular contribuições
    const cSkills = skillProgress * wSkills;
    const cReading = readingProgress * wReading;
    const cGames = gamesProgress * wGames;

    // 5. Progresso final ponderado
    const weightedProgress = totalRaw > 0
        ? Math.round(cSkills + cReading + cGames)
        : 0;

    return {
        readingProgress,
        skillProgress,
        gamesProgress,
        weightedProgress,
        isOffensive: weightedProgress >= config.minimumPercentage,
        targetPercentage: config.minimumPercentage,
        categoryBreakdown: {
            skills: {
                progress: skillProgress,
                weight: config.categoryWeights.skills,
                contribution: Math.round(cSkills),
                enabled: enabled.skills
            },
            reading: {
                progress: readingProgress,
                weight: config.categoryWeights.reading,
                contribution: Math.round(cReading),
                enabled: enabled.reading
            },
            games: {
                progress: gamesProgress,
                weight: config.categoryWeights.games,
                contribution: Math.round(cGames),
                enabled: enabled.games
            }
        }
    };
}

/**
 * Wrapper de compatibilidade para código antigo que chama calculateDailyOffensive
 */
export function calculateDailyOffensive(books: Book[], skills: Skill[]): {
    readingProgress: number;
    skillProgress: number;
    averageProgress: number;
    isOffensive: boolean;
} {
    // Usa defaults se chamado sem config
    const result = calculateDailyOffensiveAdvanced(books, skills, []);
    return {
        readingProgress: result.readingProgress,
        skillProgress: result.skillProgress,
        averageProgress: result.weightedProgress,
        isOffensive: result.isOffensive
    };
}
