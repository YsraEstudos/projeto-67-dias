import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useSkillsStore } from '../../../../stores/skillsStore';
import { getSkillRoadmapIndex } from '../lib/skillRoadmapIndex';
import type { Task } from '../store/types';

export type ActiveTaskType = Task | {
  id: string;
  title: string;
  completed: boolean;
  skillId?: string;
  subtasks?: any[];
};

export function useActiveTask(): ActiveTaskType | null {
  const activeTaskId = useStore((state) => state.activeTaskId);
  const tasks = useStore((state) => state.tasks);
  const skills = useSkillsStore((s) => s.skills);

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    
    if (activeTaskId.startsWith('skill-focus:')) {
      const skillId = activeTaskId.replace('skill-focus:', '');
      const skill = skills.find(s => s.id === skillId);
      return {
        id: activeTaskId,
        title: skill ? `Estudar ${skill.name}` : 'Estudar Habilidade',
        completed: false,
        skillId,
        subtasks: []
      };
    }
    
    const standardTask = tasks.find(t => t.id === activeTaskId);
    if (standardTask) return standardTask;
    
    const roadmapEntry = getSkillRoadmapIndex(skills).get(activeTaskId);
    if (roadmapEntry) {
      return {
        id: roadmapEntry.item.id,
        title: roadmapEntry.item.title,
        completed: roadmapEntry.item.isCompleted,
        skillId: roadmapEntry.skillId,
        subtasks: []
      };
    }

    return null;
  }, [activeTaskId, tasks, skills]);

  return activeTask;
}
