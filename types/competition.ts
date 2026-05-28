export type CompetitionCategoryId =
  | 'questoes'
  | 'habitos'
  | 'tarefas'
  | 'skillTree'
  | 'leitura'
  | 'descanso'
  | 'extras';

export interface CompetitionScoreBreakdown {
  id: CompetitionCategoryId;
  label: string;
  points: number;                      // Signed raw points for the category
  maxPoints: number;
  remainingPoints: number;
  summary: string;
  priority: number;
}

export interface CompetitionDailyRecord {
  date: string;                         // YYYY-MM-DD
  projectDay: number;
  score: number;                        // Signed official adaptive championship XP
  activityScore: number;                // Signed raw sum of category points for the day
  maxScore: number;                     // Effective raw max possible for the day
  theoreticalMaxScore: number;          // Fixed system ceiling (1000)
  completionRate: number;               // Signed activityScore / scoring baseline
  availabilityRate: number;             // maxScore / theoreticalMaxScore
  difficultyMultiplier: number;         // Adaptive bonus based on availability
  remainingScore: number;               // Remaining positive raw activity XP for the day
  breakdown: CompetitionScoreBreakdown[];
  updatedAt: number;
}

export interface CompetitionLeague {
  name: string;
  minPoints: number;
  maxPoints: number;
  rankRange: [number, number];
  color: string;
}

export interface CompetitionState {
  competitionStartedAt: number | null;
  engineVersion: string;
  dailyRecords: Record<string, CompetitionDailyRecord>;
  lastSyncedDate: string | null;
}
