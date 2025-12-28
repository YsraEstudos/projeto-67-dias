/**
 * Hook useWeeklyGoal - Gerencia meta semanal no contexto do Work
 * 
 * Fornece:
 * - currentWeekKey: Chave ISO da semana atual (ex: "2024-W52")
 * - currentGoal: Meta da semana atual (com herança automática)
 * - weekLabel: Label amigável para exibição
 * - updateCurrentWeekGoal: Função para atualizar meta da semana atual
 * - weeklyGoals: Histórico completo de metas
 */
import { useMemo, useCallback } from 'react';
import { useWorkStore } from '../../../../stores';
import { getISOWeekKey, formatWeekLabel } from '../utils/weekUtils';

export function useWeeklyGoal() {
    const weeklyGoals = useWorkStore((s) => s.weeklyGoals);
    const getCurrentWeekGoal = useWorkStore((s) => s.getCurrentWeekGoal);
    const setWeeklyGoal = useWorkStore((s) => s.setWeeklyGoal);

    // Memoizar week key (só muda se o dia mudar para outra semana)
    const currentWeekKey = useMemo(() => getISOWeekKey(), []);

    // Meta atual (com herança)
    const currentGoal = getCurrentWeekGoal();

    // Label amigável
    const weekLabel = useMemo(() => formatWeekLabel(currentWeekKey), [currentWeekKey]);

    // Callback para atualizar meta da semana atual
    const updateCurrentWeekGoal = useCallback((newGoal: number) => {
        setWeeklyGoal(currentWeekKey, newGoal);
    }, [currentWeekKey, setWeeklyGoal]);

    return {
        currentWeekKey,
        currentGoal,
        weekLabel,
        updateCurrentWeekGoal,
        weeklyGoals,
    };
}
