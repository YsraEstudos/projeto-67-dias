import { z } from 'zod';
import { GameStatus, GAME_STATUSES } from '../types';

export const gameSchema = z.object({
    title: z.string().min(1, 'O nome do jogo é obrigatório').max(50, 'O nome deve ter no máximo 50 caracteres'),
    platform: z.string().min(1, 'A plataforma é obrigatória').max(30, 'A plataforma deve ter no máximo 30 caracteres'),
    status: z.enum(GAME_STATUSES),
    coverUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    // Allow string (from input) or number (from defaultValues)
    totalHoursEstimate: z.union([z.string(), z.number()])
        .transform((val) => val === '' ? undefined : Number(val))
        .pipe(z.number().min(0, 'As horas devem ser positivas').optional()),
    folderId: z.string().optional(),
});

export const skillSchema = z.object({
    name: z.string().min(1, 'O nome da habilidade é obrigatório'),
    level: z.enum(['Iniciante', 'Intermediário', 'Avançado']),
    goalHours: z.number().min(1, 'A meta deve ser de pelo menos 1 hora'),
    theme: z.enum(['emerald', 'blue', 'purple', 'amber', 'rose']),
});

export type GameFormData = z.infer<typeof gameSchema>;
export type GameFormInput = z.input<typeof gameSchema>;
export type SkillFormData = z.infer<typeof skillSchema>;
