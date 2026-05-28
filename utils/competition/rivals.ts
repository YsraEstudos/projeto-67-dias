import { CompetitionDailyRecord } from '../../types';
import { getStartOfDay } from '../dateUtils';

export const hashSeed = (value: string) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

export const seededUnit = (seed: string) => {
    const hashed = hashSeed(seed);
    return (hashed % 10000) / 10000;
};

export const generateCumulativeHistory = (dailyRecords: Record<string, CompetitionDailyRecord>, daysToLookBack = 10) => {
    const history = [];
    const sortedKeys = Object.keys(dailyRecords).sort();
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToLookBack + 1);
    
    let baseScore = 0;
    for (const key of sortedKeys) {
        if (new Date(key) < getStartOfDay(startDate)) {
            baseScore += dailyRecords[key].score;
        }
    }

    let currentScore = baseScore;
    let fakeTopScoreDelta = 0;
    
    for (let i = daysToLookBack - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        
        const dayRecord = dailyRecords[iso];
        if (dayRecord) {
            currentScore += dayRecord.score;
        }
        
        const seedStr = iso + "fake";
        const dailyGrowthFake = Math.floor(200 + seededUnit(seedStr) * 150);
        fakeTopScoreDelta += dailyGrowthFake;

        history.push({
            date: iso,
            dateLabel: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
            fullDateLabel: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            playerTotal: currentScore,
            playerDaily: dayRecord ? dayRecord.score : 0,
            simulatedRivalTotal: baseScore + fakeTopScoreDelta, 
        });
    }

    return history;
};

export const generateSimulatedRivals = (playerTotal: number, playerRank: number) => {
    const rivals = [];
    const names = ['Alex', 'Luccas', 'Sarah', 'Jorge', 'Alice', 'Pedro', 'Nathalia', 'Leo', 'Marcos', 'Julia', 'Caio', 'Malu'];
    const titles = ['🔥', '⚡', '🛡️', '⚔️', '🎯', '🚀'];
    
    for (let i = -2; i <= 2; i++) {
        if (i === 0) continue; 
        const rivalRank = playerRank + i;
        if (rivalRank < 1) continue;
        
        const seed = hashSeed(`rival-v2-${rivalRank}`);
        const nameIndex = seed % names.length;
        const titleIndex = (seed >> 2) % titles.length;
        
        const pointDiff = (i * (15 + (seed % 10))) + (seed % 20); 
        const rivalScore = Math.max(0, playerTotal - pointDiff);

        rivals.push({
            id: `fake-${rivalRank}`,
            rank: rivalRank,
            name: `${names[nameIndex]} ${titles[titleIndex]}`,
            score: rivalScore
        });
    }
    
    return rivals.sort((a, b) => a.rank - b.rank);
};
