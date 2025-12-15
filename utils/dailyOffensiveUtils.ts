import { Book, Skill } from '../types';

/**
 * Calcula % de progresso de leitura do dia atual
 */
export function calculateReadingProgress(books: Book[]): number {
    const today = new Date().toISOString().split('T')[0];

    const booksWithGoal = books.filter(b => b.dailyGoal && b.dailyGoal > 0 && b.status === 'READING');
    if (booksWithGoal.length === 0) return 0; // Sem metas ou livros em leitura = 0% para incentivar configuração??
    // OBS: Se não tiver meta, tecnicamente não tem como calcular % do objetivo. 
    // Vou assumir que se não tem meta, o progresso é 0 até que defina meta, ou 100?
    // O plano dizia 100, mas isso pode dar "falsa" ofensiva.
    // Melhor: Se não tem nenhum livro COM meta, retorna 0 (não conta).
    // Se tem livros, mas o user não leu nada, é 0.

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
export function calculateSkillProgress(skills: Skill[]): number {
    const today = new Date().toISOString().split('T')[0];

    // Consider only skills with explicit goals (or default to something?)
    // For now, only skills with goalMinutes > 0
    const activeSkills = skills.filter(s => s.goalMinutes > 0);

    if (activeSkills.length === 0) return 0; // Incentivar configuração

    let totalProgress = 0;
    for (const skill of activeSkills) {
        const todayMinutes = skill.logs
            .filter(l => l.date.split('T')[0] === today)
            .reduce((acc, l) => acc + l.minutes, 0);

        // Meta diária = meta total / 67 dias (aproximação simples sugerida no plano)
        // OU user poderia definir meta diária. Como não tem campo `dailyGoal` na skill ainda (tem goalMinutes total),
        // vou usar a lógica de "meta total / 67" ou fixar algo razoável se não tiver.
        // Opcionalmente: goalMinutes na skill é "meta total" ou "meta diária"? 
        // No types.ts: goalMinutes: number; // Meta em minutos
        // Geralmente em skill tree é meta para completar a skill.
        // Vamos assumir que goalMinutes é TOTAL.

        // Melhor abordagem: Calcular progresso baseado em uma meta fixa de estudo diário?
        // O usuário disse "Baseado na meta da skill (ex: se meta é 60 min/dia e você fez 30 min = 50%)"
        // Isso implica que existe uma "meta da skill p/ dia".
        // Como não adicionei `dailyGoal` em Skill (falha minha no plano vs types), vou inferir ou usar um padrão.
        // Vou usar 60 mins como padrão se não tiver logica melhor, ou dividir total por 67.
        // Mas espere, o usuário disse "se meta é 60 min/dia".
        // Vou checar se Skill já tem algo assim. Types diz `goalMinutes`. Se for total, dividir por 67 é justo.

        let dailyGoal = 0;
        if (skill.goalMinutes > 0) {
            // Se a meta for pequena (< 200 min), talvez seja meta diária? Não, skill costuma ser horas.
            // Vamos assumir Divisão por 67 dias (duração do projeto).
            dailyGoal = Math.ceil(skill.goalMinutes / 67);
            if (dailyGoal < 15) dailyGoal = 15; // Mínimo 15 min
        } else {
            dailyGoal = 30; // Fallback
        }

        const progress = Math.min(100, (todayMinutes / dailyGoal) * 100);
        totalProgress += progress;
    }

    return Math.round(totalProgress / activeSkills.length);
}

/**
 * Calcula média do progresso diário (leitura + estudo)
 */
export function calculateDailyOffensive(books: Book[], skills: Skill[]): {
    readingProgress: number;
    skillProgress: number;
    averageProgress: number;
    isOffensive: boolean;
} {
    const readingProgress = calculateReadingProgress(books);
    const skillProgress = calculateSkillProgress(skills);

    // Se não tiver livros ou skills ativos, como calcular?
    // Se tiver ambos: média simples.
    // Se só tiver um deles ativo (ex: só lendo, sem skills), media é o próprio?
    // O usuário pediu "média entre leitura e estudo".
    // Vou fazer média simples div 2. Se um for 0 pq não tem config, puxa pra baixo.
    // Isso incentiva a fazer ambos.

    const averageProgress = Math.round((readingProgress + skillProgress) / 2);

    return {
        readingProgress,
        skillProgress,
        averageProgress,
        isOffensive: averageProgress >= 50
    };
}
