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
import { getOperationalWeekKey, formatWeekLabel } from '../utils/weekUtils';

export function useWeeklyGoal() {
    const weeklyGoals = useWorkStore((s) => s.weeklyGoals);
    const getWeeklyGoal = useWorkStore((s) => s.getWeeklyGoal);
    const getWeeklyWorkDays = useWorkStore((s) => s.getWeeklyWorkDays);
    const setWeeklyGoal = useWorkStore((s) => s.setWeeklyGoal);
    const setWeeklyWorkDays = useWorkStore((s) => s.setWeeklyWorkDays);

    // Recalculado a cada render (barato): com memo vazio a chave ficava presa na
    // semana da montagem e a edição gravava na semana errada após a virada.
    // A WorkView re-renderiza a cada minuto via useWorkMetrics.
    const currentWeekKey = getOperationalWeekKey();

    // Meta atual (com herança) lida da mesma chave usada na escrita
    const currentGoal = getWeeklyGoal(currentWeekKey);
    const currentWorkDays = getWeeklyWorkDays(currentWeekKey);

    // Label amigável
    const weekLabel = useMemo(() => formatWeekLabel(currentWeekKey), [currentWeekKey]);

    // Callback para atualizar meta da semana atual
    const updateCurrentWeekGoal = useCallback((newGoal: number) => {
        setWeeklyGoal(currentWeekKey, newGoal);
    }, [currentWeekKey, setWeeklyGoal]);

    const updateCurrentWeekWorkDays = useCallback((newWorkDays: number) => {
        setWeeklyWorkDays(currentWeekKey, newWorkDays);
    }, [currentWeekKey, setWeeklyWorkDays]);

    return {
        currentWeekKey,
        currentGoal,
        currentWorkDays,
        weekLabel,
        updateCurrentWeekGoal,
        updateCurrentWeekWorkDays,
        weeklyGoals,
    };
}
