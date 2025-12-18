export interface DataCategory {
    key: string;
    label: string;
    description: string;
    iconName: string;
    color: string;
}

export const DATA_CATEGORIES: DataCategory[] = [
    {
        key: 'p67_project_config',
        label: 'Configurações do Projeto',
        description: 'Data de início, nome de usuário e preferências.',
        iconName: 'Settings',
        color: 'text-slate-400'
    },
    {
        key: 'p67_work_store',
        label: 'Trabalho',
        description: 'Metas e sessões de trabalho.',
        iconName: 'Briefcase',
        color: 'text-orange-500'
    },
    {
        key: 'p67_sunday_store',
        label: 'Ajeitar Rápido',
        description: 'Planejamento e tarefas do domingo.',
        iconName: 'CalendarCheck',
        color: 'text-pink-500'
    },
    {
        key: 'p67_links_store',
        label: 'Meus Links',
        description: 'Coleção de links salvos.',
        iconName: 'Globe',
        color: 'text-indigo-400'
    },
    {
        key: 'p67_reading_store',
        label: 'Livros & Leitura',
        description: 'Progresso de leitura e biblioteca.',
        iconName: 'Library',
        color: 'text-yellow-500'
    },
    {
        key: 'p67_skills_store',
        label: 'Habilidades (Skill Tree)',
        description: 'Árvore de habilidades e logs de estudo.',
        iconName: 'GraduationCap',
        color: 'text-emerald-400'
    },
    {
        key: 'p67_habits_store',
        label: 'Hábitos & Tarefas',
        description: 'Histórico de hábitos e tarefas diárias.',
        iconName: 'Flame',
        color: 'text-orange-400'
    },
    {
        key: 'p67_journal_store',
        label: 'Diário & Reflexões',
        description: 'Entradas do diário pessoal.',
        iconName: 'PenTool',
        color: 'text-purple-500'
    },
    {
        key: 'p67_notes_store',
        label: 'Notas do Sistema',
        description: 'Anotações rápidas e organizadas.',
        iconName: 'StickyNote',
        color: 'text-blue-400'
    },
    {
        key: 'p67_prompts_store',
        label: 'Prompts & Categorias',
        description: 'Biblioteca de prompts salvos.',
        iconName: 'Image',
        color: 'text-teal-400'
    },
    {
        key: 'p67_rest_store',
        label: 'Atividades de Descanso',
        description: 'Configurações de descanso.',
        iconName: 'Coffee',
        color: 'text-cyan-400'
    },
    {
        key: 'p67_tool_timer',
        label: 'Dados do Timer',
        description: 'Estado salvo do timer global.',
        iconName: 'Wrench',
        color: 'text-slate-400'
    },
    {
        key: 'p67_review_store',
        label: 'Revisões Semanais',
        description: 'Revisões e reflexões semanais.',
        iconName: 'Wrench',
        color: 'text-indigo-400'
    },
    {
        key: 'p67_water_store',
        label: 'Hidratação',
        description: 'Controle de água ingerida.',
        iconName: 'Coffee',
        color: 'text-cyan-500'
    },
    {
        key: 'p67_streak_store',
        label: 'Streak',
        description: 'Sequência diária do desafio.',
        iconName: 'Flame',
        color: 'text-orange-300'
    },
    {
        key: 'games-storage',
        label: 'Games',
        description: 'Jogos, pastas e missões.',
        iconName: 'Briefcase',
        color: 'text-purple-400'
    }
];

// Helper to get all keys
export const ALL_DATA_KEYS = DATA_CATEGORIES.map(c => c.key);
