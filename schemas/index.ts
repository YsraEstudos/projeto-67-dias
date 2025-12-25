import { z } from 'zod';
import { GAME_STATUSES } from '../types';

// ================================
// Game & Skill Form Schemas (existing)
// ================================

export const gameSchema = z.object({
    title: z.string().min(1, 'O nome do jogo é obrigatório').max(50, 'O nome deve ter no máximo 50 caracteres'),
    platform: z.string().min(1, 'A plataforma é obrigatória').max(30, 'A plataforma deve ter no máximo 30 caracteres'),
    status: z.enum(GAME_STATUSES),
    coverUrl: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
    // Allow string (from input), number (from defaultValues), or undefined (not provided)
    totalHoursEstimate: z.union([z.string(), z.number(), z.undefined()])
        .transform((val) => val === '' || val === undefined ? undefined : Number(val))
        .pipe(z.number().min(0, 'As horas devem ser positivas').optional()),
    folderId: z.string().optional(),
});

export const skillSchema = z.object({
    name: z.string().min(1, 'O nome da habilidade é obrigatório'),
    level: z.enum(['Iniciante', 'Intermediário', 'Avançado']),
    goalHours: z.number().min(1, 'A meta deve ser de pelo menos 1 hora'),
    theme: z.enum(['emerald', 'blue', 'purple', 'amber', 'rose']),
    deadline: z.string().optional(), // ISO date (YYYY-MM-DD)
});

// ================================
// Visual Roadmap Schemas (import validation)
// ================================

const visualNodeTypeSchema = z.enum(['main', 'alternative', 'optional', 'info', 'section']);

const visualRoadmapNodeSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        id: z.string().min(1),
        title: z.string().min(1).max(500),
        type: visualNodeTypeSchema,
        x: z.number().finite(),
        y: z.number().finite(),
        isCompleted: z.boolean(),
        description: z.string().max(2000).optional(),
        children: z.array(visualRoadmapNodeSchema).optional(),
    })
);

const visualRoadmapConnectionSchema = z.object({
    id: z.string().min(1),
    sourceId: z.string().min(1),
    targetId: z.string().min(1),
    style: z.enum(['solid', 'dashed']),
});

export const visualRoadmapSchema = z.object({
    nodes: z.array(visualRoadmapNodeSchema).max(500, 'Máximo de 500 nós'),
    connections: z.array(visualRoadmapConnectionSchema).max(1000, 'Máximo de 1000 conexões'),
    rootId: z.string().optional(),
});

// ================================
// Backup Import Validation
// ================================

/**
 * Schema flexível para validação de backup.
 * Aceita qualquer objeto com chaves conhecidas do sistema.
 * Não valida profundamente cada entidade para manter compatibilidade
 * com backups de versões anteriores.
 */
export const backupSchema = z.object({
    // Metadata
    exportedAt: z.string().optional(),
    version: z.string().optional(),
}).passthrough().refine(
    (data) => {
        // Deve ter pelo menos uma chave além das de metadata
        const dataKeys = Object.keys(data).filter(k => k !== 'exportedAt' && k !== 'version');
        return dataKeys.length > 0;
    },
    { message: 'O arquivo de backup está vazio ou não contém dados válidos' }
);

// ================================
// Safe Parse Utilities
// ================================

export type SafeParseResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Valida dados usando um schema Zod e retorna resultado tipado.
 * Não lança exceção, retorna erro formatado.
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): SafeParseResult<T> {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }

    // Formata erros de forma legível
    const errors = result.error.issues.map(issue => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
    });

    return { success: false, error: errors.join('; ') };
}

/**
 * Valida JSON string e retorna dados tipados ou null.
 * Útil para validação em uma linha.
 */
export function parseJsonSafe<T>(schema: z.ZodSchema<T>, jsonString: string): T | null {
    try {
        const parsed = JSON.parse(jsonString);
        const result = schema.safeParse(parsed);
        return result.success ? result.data : null;
    } catch {
        return null;
    }
}

// ================================
// Type Exports
// ================================

export type GameFormData = z.infer<typeof gameSchema>;
export type GameFormInput = z.input<typeof gameSchema>;
export type SkillFormData = z.infer<typeof skillSchema>;
export type VisualRoadmapData = z.infer<typeof visualRoadmapSchema>;
