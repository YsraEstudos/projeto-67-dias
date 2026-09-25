import { describe, it, expect } from 'vitest';
import {
    skillSchema,
    visualRoadmapSchema,
    backupSchema,
    safeParse,
    parseJsonSafe,
} from '../../schemas';

// ================================
// safeParse Utility Tests
// ================================

describe('safeParse', () => {
    describe('cenário feliz', () => {
        it('retorna success=true com dados válidos', () => {
            const schema = skillSchema;
            const validData = {
                name: 'TypeScript',
                level: 'Iniciante',
                goalHours: 10,
                theme: 'emerald',
            };

            const result = safeParse(schema, validData);

            expect(result.success).toBe(true);
            if (result.success === true) {
                expect(result.data.name).toBe('TypeScript');
            }
        });
    });

    describe('cenário de erro', () => {
        it('retorna success=false com mensagem formatada para dados inválidos', () => {
            const schema = skillSchema;
            const invalidData = {
                name: '', // vazio - inválido
                level: 'Iniciante',
                goalHours: 10,
                theme: 'emerald',
            };

            const result = safeParse(schema, invalidData);

            expect(result.success).toBe(false);
            if (result.success === false) {
                expect(result.error).toContain('O nome da habilidade é obrigatório');
            }
        });

        it('inclui path no erro quando campo aninhado falha', () => {
            const invalidRoadmap = {
                nodes: [{ id: '', title: 'Test', type: 'main', x: 0, y: 0, isCompleted: false }],
                connections: [],
            };

            const result = safeParse(visualRoadmapSchema, invalidRoadmap);

            expect(result.success).toBe(false);
        });
    });
});

// ================================
// parseJsonSafe Utility Tests
// ================================

describe('parseJsonSafe', () => {
    describe('cenário feliz', () => {
        it('parseia JSON válido e retorna dados tipados', () => {
            const jsonString = JSON.stringify({
                name: 'React',
                level: 'Intermediário',
                goalHours: 20,
                theme: 'blue',
            });

            const result = parseJsonSafe(skillSchema, jsonString);

            expect(result).not.toBeNull();
            expect(result?.name).toBe('React');
        });
    });

    describe('cenário de erro', () => {
        it('retorna null para JSON malformado', () => {
            const badJson = '{ invalid json }';

            const result = parseJsonSafe(skillSchema, badJson);

            expect(result).toBeNull();
        });

        it('retorna null para JSON válido mas schema inválido', () => {
            const jsonString = JSON.stringify({
                name: '', // inválido
                level: 'Iniciante',
                goalHours: 10,
                theme: 'emerald',
            });

            const result = parseJsonSafe(skillSchema, jsonString);

            expect(result).toBeNull();
        });
    });
});

// ================================
// skillSchema Tests
// ================================

describe('skillSchema', () => {
    describe('cenário feliz', () => {
        it('valida skill com campos obrigatórios', () => {
            const result = safeParse(skillSchema, {
                name: 'TypeScript',
                level: 'Intermediário',
                goalHours: 100,
                theme: 'blue',
            });
            expect(result.success).toBe(true);
        });

        it('aceita deadline opcional', () => {
            const result = safeParse(skillSchema, {
                name: 'React',
                level: 'Avançado',
                goalHours: 200,
                theme: 'emerald',
                deadline: '2025-12-31',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('cenário de erro', () => {
        it('rejeita goalHours menor que 1', () => {
            const result = safeParse(skillSchema, {
                name: 'Test',
                level: 'Iniciante',
                goalHours: 0,
                theme: 'purple',
            });
            expect(result.success).toBe(false);
        });

        it('rejeita level inválido', () => {
            const result = safeParse(skillSchema, {
                name: 'Test',
                level: 'Expert', // inválido
                goalHours: 10,
                theme: 'amber',
            });
            expect(result.success).toBe(false);
        });

        it('rejeita theme inválido', () => {
            const result = safeParse(skillSchema, {
                name: 'Test',
                level: 'Iniciante',
                goalHours: 10,
                theme: 'red', // inválido
            });
            expect(result.success).toBe(false);
        });
    });
});

// ================================
// visualRoadmapSchema Tests
// ================================

describe('visualRoadmapSchema', () => {
    describe('cenário feliz', () => {
        it('valida roadmap vazio', () => {
            const result = safeParse(visualRoadmapSchema, {
                nodes: [],
                connections: [],
            });
            expect(result.success).toBe(true);
        });

        it('valida roadmap com nodes e connections', () => {
            const result = safeParse(visualRoadmapSchema, {
                nodes: [
                    { id: '1', title: 'Início', type: 'main', x: 0, y: 0, isCompleted: false },
                    { id: '2', title: 'Fase 2', type: 'section', x: 100, y: 0, isCompleted: true },
                ],
                connections: [
                    { id: 'c1', sourceId: '1', targetId: '2', style: 'solid' },
                ],
            });
            expect(result.success).toBe(true);
        });

        it('aceita rootId opcional', () => {
            const result = safeParse(visualRoadmapSchema, {
                nodes: [{ id: '1', title: 'Root', type: 'main', x: 0, y: 0, isCompleted: false }],
                connections: [],
                rootId: '1',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('cenário de erro', () => {
        it('rejeita node sem id', () => {
            const result = safeParse(visualRoadmapSchema, {
                nodes: [{ id: '', title: 'Test', type: 'main', x: 0, y: 0, isCompleted: false }],
                connections: [],
            });
            expect(result.success).toBe(false);
        });

        it('rejeita node com type inválido', () => {
            const result = safeParse(visualRoadmapSchema, {
                nodes: [{ id: '1', title: 'Test', type: 'invalid', x: 0, y: 0, isCompleted: false }],
                connections: [],
            });
            expect(result.success).toBe(false);
        });

        it('rejeita connection com style inválido', () => {
            const result = safeParse(visualRoadmapSchema, {
                nodes: [],
                connections: [{ id: 'c1', sourceId: '1', targetId: '2', style: 'dotted' }],
            });
            expect(result.success).toBe(false);
        });
    });

    describe('casos de borda', () => {
        it('rejeita mais de 500 nodes', () => {
            const nodes = Array.from({ length: 501 }, (_, i) => ({
                id: `node-${i}`,
                title: `Node ${i}`,
                type: 'main' as const,
                x: i * 10,
                y: 0,
                isCompleted: false,
            }));

            const result = safeParse(visualRoadmapSchema, { nodes, connections: [] });
            expect(result.success).toBe(false);
            if (result.success === false) {
                expect(result.error).toContain('500');
            }
        });
    });
});

// ================================
// backupSchema Tests
// ================================

describe('backupSchema', () => {
    describe('cenário feliz', () => {
        it('valida backup com dados', () => {
            const result = safeParse(backupSchema, {
                exportedAt: '2025-12-25T10:00:00Z',
                version: '3.0',
                p67_skills: [{ id: '1', name: 'Test' }],
            });
            expect(result.success).toBe(true);
        });

        it('valida backup sem metadata', () => {
            const result = safeParse(backupSchema, {
                p67_habits: [],
                p67_journal: {},
            });
            expect(result.success).toBe(true);
        });

        it('preserva dados extras com passthrough', () => {
            const result = safeParse(backupSchema, {
                customKey: 'value',
                anotherKey: { nested: true },
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect((result.data as any).customKey).toBe('value');
            }
        });
    });

    describe('cenário de erro', () => {
        it('rejeita objeto vazio (apenas metadata)', () => {
            const result = safeParse(backupSchema, {
                exportedAt: '2025-12-25T10:00:00Z',
                version: '3.0',
            });
            expect(result.success).toBe(false);
            if (result.success === false) {
                expect(result.error).toContain('vazio');
            }
        });

        it('rejeita objeto completamente vazio', () => {
            const result = safeParse(backupSchema, {});
            expect(result.success).toBe(false);
        });
    });

    describe('casos de borda', () => {
        it('aceita backup com apenas uma chave de dados', () => {
            const result = safeParse(backupSchema, {
                single_key: 'value',
            });
            expect(result.success).toBe(true);
        });
    });
});
