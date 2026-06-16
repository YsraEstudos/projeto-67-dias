import { describe, expect, it } from 'vitest';
import { getSkillRoadmapIndex } from '../../../../components/views/PomodoroView/lib/skillRoadmapIndex';
import type { Skill } from '../../../../types';

const createSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: 'skill-1',
  name: 'JavaScript',
  level: 'Iniciante',
  currentMinutes: 0,
  goalMinutes: 600,
  resources: [],
  roadmap: [],
  logs: [],
  colorTheme: 'emerald',
  createdAt: 0,
  ...overrides,
});

describe('getSkillRoadmapIndex', () => {
  it('indexes nested roadmap items by id', () => {
    const skills = [
      createSkill({
        roadmap: [
          {
            id: 'section-1',
            title: 'Fundamentos',
            type: 'SECTION',
            isCompleted: false,
            subTasks: [
              {
                id: 'task-1',
                title: 'Promises',
                isCompleted: true,
              },
            ],
          },
        ],
      }),
    ];

    const index = getSkillRoadmapIndex(skills);

    expect(index.get('task-1')).toMatchObject({
      skillId: 'skill-1',
      skillName: 'JavaScript',
      item: expect.objectContaining({ title: 'Promises' }),
    });
  });

  it('reuses the cached index while the skills array reference is stable', () => {
    const skills = [createSkill()];

    expect(getSkillRoadmapIndex(skills)).toBe(getSkillRoadmapIndex(skills));
  });
});
