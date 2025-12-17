import { Prompt, PromptCategory } from '../types';

export const DEFAULT_PROMPT_CATEGORIES: PromptCategory[] = [
    { id: 'geral', name: 'Geral', color: 'slate', icon: 'default', order: 0 },
    { id: 'codigo', name: 'Código', color: 'emerald', icon: 'code', order: 1 },
    { id: 'escrita', name: 'Escrita', color: 'blue', icon: 'writing', order: 2 },
    { id: 'criativo', name: 'Criativo', color: 'purple', icon: 'creative', order: 3 },
    { id: 'ideias', name: 'Ideias', color: 'amber', icon: 'ideas', order: 4 },
];

export const DEFAULT_PROMPTS: Prompt[] = [
    {
        id: '1',
        title: 'Refatorar Código',
        content: 'Analise o código abaixo e sugira melhorias de performance, legibilidade e boas práticas. Explique cada mudança sugerida.\n\n```\n[COLE SEU CÓDIGO AQUI]\n```',
        category: 'codigo',
        images: [],
        copyCount: 5,
        isFavorite: true,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
    },
    {
        id: '2',
        title: 'Revisar Texto',
        content: 'Revise o texto abaixo corrigindo erros gramaticais, melhorando a clareza e mantendo o tom original. Destaque as principais mudanças feitas.\n\n[COLE SEU TEXTO AQUI]',
        category: 'escrita',
        images: [],
        copyCount: 3,
        isFavorite: false,
        createdAt: Date.now() - 172800000,
        updatedAt: Date.now() - 172800000,
    },
];
