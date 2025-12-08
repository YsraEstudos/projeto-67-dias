import React from 'react';
import { Skill, SkillResource, Prompt, PromptCategory } from '../../types';
import { SkillHeader } from './SkillHeader';
import { ProgressStats } from './ProgressStats';
import { ResourcesVault } from './ResourcesVault';
import { RoadmapSection } from './RoadmapSection';
import { syncRoadmapState } from './roadmapSync';

interface SkillDetailViewProps {
    skill: Skill;
    prompts: Prompt[];
    promptCategories: PromptCategory[];
    onBack: () => void;
    onUpdate: (u: Partial<Skill>) => void;
    onDelete: () => void;
}

/**
 * Detail view for a single skill, showing progress stats, resources, and roadmap.
 * This component orchestrates the sub-components and manages data flow.
 */
export const SkillDetailView: React.FC<SkillDetailViewProps> = ({
    skill,
    prompts,
    promptCategories,
    onBack,
    onUpdate,
    onDelete
}) => {
    // Session handler that creates a log entry
    const handleAddSession = (minutes: number) => {
        onUpdate({
            currentMinutes: skill.currentMinutes + minutes,
            logs: [...skill.logs, { id: Date.now().toString(), date: new Date().toISOString(), minutes }]
        });
    };

    // Resource handlers
    const handleAddResource = (resource: SkillResource) => {
        onUpdate({ resources: [...skill.resources, resource] });
    };

    const handleRemoveResource = (id: string) => {
        onUpdate({ resources: skill.resources.filter(r => r.id !== id) });
    };

    return (
        <div className="animate-in slide-in-from-right-4 duration-500 pb-20">
            <SkillHeader
                skill={skill}
                onBack={onBack}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN: Stats & Resources */}
                <div className="space-y-6">
                    <ProgressStats
                        skill={skill}
                        onAddSession={handleAddSession}
                        onUpdateGoal={(goalMinutes) => onUpdate({ goalMinutes })}
                    />

                    <ResourcesVault
                        resources={skill.resources}
                        prompts={prompts}
                        promptCategories={promptCategories}
                        onAdd={handleAddResource}
                        onRemove={handleRemoveResource}
                    />
                </div>

                {/* RIGHT COLUMN: Roadmap */}
                <RoadmapSection
                    roadmap={skill.roadmap}
                    visualRoadmap={skill.visualRoadmap}
                    skillName={skill.name}
                    skillLevel={skill.level}
                    skillColorTheme={skill.colorTheme}
                    viewMode={skill.roadmapViewMode || 'tasks'}
                    onUpdate={(newRoadmap) => {
                        const { roadmap, visualRoadmap } = syncRoadmapState(newRoadmap, skill.visualRoadmap, 'tasks');
                        onUpdate({ roadmap, visualRoadmap });
                    }}
                    onUpdateVisual={(newVisualRoadmap) => {
                        const { roadmap, visualRoadmap } = syncRoadmapState(skill.roadmap, newVisualRoadmap, 'visual');
                        onUpdate({ roadmap, visualRoadmap });
                    }}
                    onViewModeChange={(roadmapViewMode) => onUpdate({ roadmapViewMode })}
                />
            </div>
        </div>
    );
};
