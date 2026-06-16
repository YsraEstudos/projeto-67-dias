import type { Skill, SkillRoadmapItem } from '../../../../types';

export type SkillRoadmapIndexEntry = {
  skillId: string;
  skillName: string;
  item: SkillRoadmapItem;
};

const indexRoadmapItems = (
  index: Map<string, SkillRoadmapIndexEntry>,
  skill: Skill,
  items: SkillRoadmapItem[],
) => {
  items.forEach((item) => {
    index.set(item.id, {
      skillId: skill.id,
      skillName: skill.name,
      item,
    });

    if (item.subTasks?.length) {
      indexRoadmapItems(index, skill, item.subTasks);
    }
  });
};

export const buildSkillRoadmapIndex = (skills: Skill[]): Map<string, SkillRoadmapIndexEntry> => {
  const index = new Map<string, SkillRoadmapIndexEntry>();

  skills.forEach((skill) => {
    indexRoadmapItems(index, skill, skill.roadmap ?? []);
  });

  return index;
};

const skillRoadmapIndexCache = new WeakMap<Skill[], Map<string, SkillRoadmapIndexEntry>>();

export const getSkillRoadmapIndex = (skills: Skill[]): Map<string, SkillRoadmapIndexEntry> => {
  const cached = skillRoadmapIndexCache.get(skills);
  if (cached) {
    return cached;
  }

  const index = buildSkillRoadmapIndex(skills);
  skillRoadmapIndexCache.set(skills, index);
  return index;
};
