// Funções utilitárias do módulo Trabalho (WorkView)

/**
 * Converte string de horário (HH:MM) para minutos desde meia-noite
 */
export const getMinutesFromMidnight = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

/**
 * Formata diferença de tempo em minutos para string "Xh Ym"
 */
export const formatTimeDiff = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

/**
 * Formata duração em segundos para string "HH:MM:SS"
 */
export const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Retorna a segunda-feira (início da semana) para uma data
 */
export const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0); // Normalize to midnight
    return weekStart;
};

/**
 * Verifica se duas datas estão na mesma semana
 */
export const isSameWeek = (date1: Date, date2: Date): boolean => {
    const week1Start = getWeekStart(date1);
    const week2Start = getWeekStart(date2);
    return week1Start.getTime() === week2Start.getTime();
};

/**
 * Retorna chave única para o dia atual (para memoização)
 */
export const getTodayKey = (): string => new Date().toDateString();
