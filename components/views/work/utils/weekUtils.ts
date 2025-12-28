/**
 * Utilitários para cálculo de ISO Week (semana inicia segunda-feira)
 * ISO 8601: semana 01 é a que contém a primeira quinta-feira do ano
 */

/**
 * Retorna a ISO week key no formato "YYYY-Wxx"
 * Semana começa na segunda-feira (ISO 8601)
 */
export function getISOWeekKey(date: Date = new Date()): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    // Ajustar para quinta-feira da semana (ISO: semana do ano baseada na quinta)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));

    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Retorna a week key anterior
 */
export function getPreviousWeekKey(weekKey: string): string {
    const [year, weekPart] = weekKey.split('-W');
    const weekNum = parseInt(weekPart, 10);

    if (weekNum === 1) {
        // Primeira semana: voltar para última semana do ano anterior
        // Calcular quantas semanas tem o ano anterior
        const prevYear = parseInt(year) - 1;
        const lastWeek = getISOWeeksInYear(prevYear);
        return `${prevYear}-W${lastWeek.toString().padStart(2, '0')}`;
    }
    return `${year}-W${(weekNum - 1).toString().padStart(2, '0')}`;
}

/**
 * Calcula quantas semanas ISO um ano tem (52 ou 53)
 */
export function getISOWeeksInYear(year: number): number {
    const dec28 = new Date(year, 11, 28);
    const weekKey = getISOWeekKey(dec28);
    const [, weekPart] = weekKey.split('-W');
    return parseInt(weekPart, 10);
}

/**
 * Formata week key para exibição amigável
 * "2024-W52" -> "Semana 52 de 2024"
 */
export function formatWeekLabel(weekKey: string): string {
    const [year, weekPart] = weekKey.split('-W');
    return `Semana ${parseInt(weekPart)} de ${year}`;
}

/**
 * Retorna data de início (segunda) e fim (domingo) de uma semana ISO
 */
export function getWeekDateRange(weekKey: string): { start: Date; end: Date } {
    const [yearStr, weekPart] = weekKey.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekPart, 10);

    // Primeiro dia do ano
    const jan1 = new Date(year, 0, 1);
    // Dia da semana do dia 1 (0=dom, 1=seg, ..., 6=sab)
    const jan1Day = jan1.getDay();

    // Ajuste para primeira segunda-feira da semana 1
    // Se jan1 é segunda (1), offset = 0
    // Se jan1 é terça (2), offset = -1 (volta)
    // Se jan1 é quarta (3), offset = -2
    // Se jan1 é quinta (4), offset = -3
    // Se jan1 é sexta (5), offset = 3 (avança para próxima seg)
    // Se jan1 é sábado (6), offset = 2
    // Se jan1 é domingo (0), offset = 1
    const daysToMonday = jan1Day <= 4 ? 1 - jan1Day : 8 - jan1Day;

    const firstMonday = new Date(year, 0, 1 + daysToMonday);
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return { start: weekStart, end: weekEnd };
}
