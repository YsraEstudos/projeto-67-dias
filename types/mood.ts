export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export const MOOD_CONFIG: Record<Mood, { label: string; color: string; value: number }> = {
  great: { label: 'Incrível', color: 'text-green-400', value: 5 },
  good: { label: 'Bem', color: 'text-yellow-400', value: 4 },
  neutral: { label: 'Normal', color: 'text-blue-400', value: 3 },
  bad: { label: 'Mal', color: 'text-orange-400', value: 2 },
  terrible: { label: 'Péssimo', color: 'text-red-400', value: 1 },
};
