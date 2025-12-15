import { Skill } from '../../types';

/**
 * Initial mock data for skills when user first loads the app.
 * This provides a demo skill to show the module's capabilities.
 */
export const INITIAL_SKILLS: Skill[] = [
    {
        id: `initial_skill_${Date.now()}`,
        name: 'Inglês Avançado',
        description: 'Fluência total para negócios e viagens.',
        level: 'Intermediário',
        currentMinutes: 3600, // 60h
        goalMinutes: 6000, // 100h
        colorTheme: 'emerald',
        resources: [
            { id: 'r1', title: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish/', type: 'OTHER' },
        ],
        roadmap: [
            { id: 'rm0', title: 'Fundamentos', isCompleted: false, type: 'SECTION' },
            { id: 'rm1', title: 'Dominar Phrasal Verbs', isCompleted: true, type: 'TASK' },
            { id: 'rm2', title: 'Praticar conversação (Shadowing)', isCompleted: false, type: 'TASK' },
        ],
        logs: [],
        createdAt: Date.now()
    }
];
