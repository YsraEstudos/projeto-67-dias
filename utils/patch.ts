export const CHAMPIONSHIP_LEAGUES: import('../types').CompetitionLeague[] = [
    { name: 'Bronze III', minPoints: 0, maxPoints: 500, rankRange: [10000, 8000], color: 'text-orange-700' },
    { name: 'Bronze II', minPoints: 501, maxPoints: 1000, rankRange: [8000, 6500], color: 'text-orange-600' },
    { name: 'Bronze I', minPoints: 1001, maxPoints: 2000, rankRange: [6500, 5000], color: 'text-orange-500' },
    { name: 'Prata III', minPoints: 2001, maxPoints: 3500, rankRange: [5000, 4000], color: 'text-slate-400' },
    { name: 'Prata II', minPoints: 3501, maxPoints: 5000, rankRange: [4000, 3000], color: 'text-slate-300' },
    { name: 'Prata I', minPoints: 5001, maxPoints: 7000, rankRange: [3000, 2000], color: 'text-slate-200' },
    { name: 'Ouro III', minPoints: 7001, maxPoints: 9500, rankRange: [2000, 1000], color: 'text-yellow-500' },
    { name: 'Ouro II', minPoints: 9501, maxPoints: 12500, rankRange: [1000, 500], color: 'text-yellow-400' },
    { name: 'Ouro I', minPoints: 12501, maxPoints: 16000, rankRange: [500, 200], color: 'text-yellow-300' },
    { name: 'Platina', minPoints: 16001, maxPoints: 22000, rankRange: [200, 50], color: 'text-cyan-400' },
    { name: 'Diamante', minPoints: 22001, maxPoints: 30000, rankRange: [50, 10], color: 'text-purple-400' },
    { name: 'Mestre', minPoints: 30001, maxPoints: Infinity, rankRange: [10, 1], color: 'text-rose-500' },
];

export const calculateLeagueStanding = (totalPoints: number) => {
    let currentLeagueIndex = CHAMPIONSHIP_LEAGUES.findIndex(l => totalPoints >= l.minPoints && totalPoints <= l.maxPoints);
    if (currentLeagueIndex === -1) {
        if (totalPoints > CHAMPIONSHIP_LEAGUES[CHAMPIONSHIP_LEAGUES.length - 1].maxPoints) {
            currentLeagueIndex = CHAMPIONSHIP_LEAGUES.length - 1;
        } else {
            currentLeagueIndex = 0;
        }
    }
    
    const league = CHAMPIONSHIP_LEAGUES[currentLeagueIndex];
    const nextLeague = currentLeagueIndex < CHAMPIONSHIP_LEAGUES.length - 1 ? CHAMPIONSHIP_LEAGUES[currentLeagueIndex + 1] : null;

    // Calculate approximate rank mathematically based on progress through the current league tier.
    const pointProgress = Math.max(0, totalPoints - Math.max(0, league.minPoints));
    const tierSize = league.maxPoints - Math.max(0, league.minPoints);
    const rankSize = league.rankRange[0] - league.rankRange[1];
    
    let currentRank = league.rankRange[0];
    if (tierSize > 0 && tierSize !== Infinity) {
        const progressPercent = Math.min(1, pointProgress / tierSize);
        currentRank = Math.floor(league.rankRange[0] - (rankSize * progressPercent));
    } else if (tierSize === Infinity) {
        // High scores converge to Rank 1.
        currentRank = Math.max(1, league.rankRange[0] - Math.floor(pointProgress / 1000));
    }
    
    const pointsToNext = nextLeague ? (nextLeague.minPoints - totalPoints) : 0;

    return {
        currentLeague: league,
        currentRank: Math.max(1, currentRank),
        nextLeague,
        pointsToNext: Math.max(0, pointsToNext)
    };
};