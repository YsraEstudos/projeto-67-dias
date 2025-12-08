import {
    Library,
    Globe,
    GraduationCap,
    Briefcase,
    Flame,
    PenTool,
    CalendarCheck,
    Coffee,
    Wrench,
    LineChart,
    Settings,
    StickyNote,
    Image
} from 'lucide-react';

export interface DataCategory {
    key: string;
    label: string;
    description: string;
    icon: any;
    color: string;
}

export const DATA_CATEGORIES: DataCategory[] = [
    {
        key: 'p67_project_config',
        label: 'Configurações do Projeto',
        description: 'Data de início, nome de usuário e preferências.',
        icon: Settings,
        color: 'text-slate-400'
    },
    {
        key: 'p67_work_met_target_history',
        label: 'Histórico de Trabalho',
        description: 'Registros de dias com meta batida.',
        icon: Briefcase,
        color: 'text-orange-500'
    },
    {
        key: 'p67_sunday_tasks',
        label: 'Ajeitar Rápido (Domingo)',
        description: 'Tarefas e checklists de domingo.',
        icon: CalendarCheck,
        color: 'text-pink-500'
    },
    {
        key: 'p67_links',
        label: 'Meus Links',
        description: 'Coleção de links salvos.',
        icon: Globe,
        color: 'text-indigo-400'
    },
    {
        key: 'p67_books',
        label: 'Livros & Leitura',
        description: 'Progresso de leitura e biblioteca.',
        icon: Library,
        color: 'text-yellow-500'
    },
    {
        key: 'p67_skills',
        label: 'Habilidades (Skill Tree)',
        description: 'Árvore de habilidades e logs de estudo.',
        icon: GraduationCap,
        color: 'text-emerald-400'
    },
    {
        key: 'p67_habits',
        label: 'Hábitos & Tarefas',
        description: 'Histórico de hábitos e tarefas diárias.',
        icon: Flame,
        color: 'text-orange-400'
    },
    {
        key: 'p67_journal',
        label: 'Diário & Reflexões',
        description: 'Entradas do diário pessoal.',
        icon: PenTool,
        color: 'text-purple-500'
    },
    {
        key: 'p67_notes',
        label: 'Notas do Sistema',
        description: 'Anotações rápidas e organizadas.',
        icon: StickyNote,
        color: 'text-blue-400'
    },
    {
        key: 'p67_tags',
        label: 'Tags & Categorias',
        description: 'Tags personalizadas para notas.',
        icon: StickyNote,
        color: 'text-rose-400'
    },
    {
        key: 'p67_prompts',
        label: 'Prompts & Categorias',
        description: 'Biblioteca de prompts salvos.',
        icon: Image,
        color: 'text-teal-400'
    },
    {
        key: 'p67_rest_activities',
        label: 'Atividades de Descanso',
        description: 'Configurações de descanso.',
        icon: Coffee,
        color: 'text-cyan-400'
    },
    {
        key: 'p67_tool_timer',
        label: 'Dados do Timer',
        description: 'Estado salvo do timer global.',
        icon: Wrench,
        color: 'text-slate-400'
    }
];

// Helper to get all keys
export const ALL_DATA_KEYS = DATA_CATEGORIES.map(c => c.key);
