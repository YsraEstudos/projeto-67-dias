/**
 * History Actions Slice
 * Handles roadmap backup creation, rollback, and deletion
 */
import { SkillsSet, SkillsGet, SkillRoadmapItem } from './types';
import { RoadmapBackup } from '../../types';

const MAX_BACKUPS = 10;

export interface HistoryActions {
    /**
     * Creates a backup of the current roadmap before an import
     * Called internally by setRoadmap when createBackup is true
     */
    createRoadmapBackup: (skillId: string, label?: string) => void;

    /**
     * Restores roadmap from a specific backup
     * Creates a new backup before restoring (rollback is reversible)
     */
    rollbackToBackup: (skillId: string, backupId: string) => void;

    /**
     * Deletes a specific backup from history
     */
    deleteBackup: (skillId: string, backupId: string) => void;

    /**
     * Clears all backups for a skill
     */
    clearBackupHistory: (skillId: string) => void;
}

export const createHistoryActions = (set: SkillsSet, get: SkillsGet): HistoryActions => ({
    createRoadmapBackup: (skillId, label) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (!skill) return;

            // Don't create backup if roadmap is empty
            if (!skill.roadmap || skill.roadmap.length === 0) return;

            const backup: RoadmapBackup = {
                id: crypto.randomUUID(),
                createdAt: Date.now(),
                label,
                previousRoadmap: JSON.parse(JSON.stringify(skill.roadmap)) // Deep clone
            };

            // Initialize history if needed
            if (!skill.roadmapHistory) {
                skill.roadmapHistory = [];
            }

            // Add new backup at the beginning (most recent first)
            skill.roadmapHistory.unshift(backup);

            // Enforce max backups limit (remove oldest)
            if (skill.roadmapHistory.length > MAX_BACKUPS) {
                skill.roadmapHistory = skill.roadmapHistory.slice(0, MAX_BACKUPS);
            }
        });
        get()._syncToFirestore();
    },

    rollbackToBackup: (skillId, backupId) => {
        const skill = get().skills.find(s => s.id === skillId);
        if (!skill) return;

        const backup = skill.roadmapHistory?.find(b => b.id === backupId);
        if (!backup) return;

        // Create a backup of current state before rollback (so rollback is reversible)
        get().createRoadmapBackup(skillId, `Antes do rollback para ${backup.label || formatDate(backup.createdAt)}`);

        // Restore the roadmap from backup
        set((state) => {
            const targetSkill = state.skills.find(s => s.id === skillId);
            if (targetSkill) {
                targetSkill.roadmap = JSON.parse(JSON.stringify(backup.previousRoadmap));
            }
        });
        get()._syncToFirestore();
    },

    deleteBackup: (skillId, backupId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (!skill || !skill.roadmapHistory) return;

            skill.roadmapHistory = skill.roadmapHistory.filter(b => b.id !== backupId);
        });
        get()._syncToFirestore();
    },

    clearBackupHistory: (skillId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                skill.roadmapHistory = [];
            }
        });
        get()._syncToFirestore();
    }
});

// Helper function to format date for backup labels
function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
