/**
 * Types for Skills Store Slices
 * Shared types used across all skill action slices
 */
import type { Draft } from 'immer';
import { Skill, SkillLog, SkillResource, SkillRoadmapItem, VisualRoadmap, RoadmapViewMode, MicroAchievement, NextDayContent } from '../../types';

/**
 * Base state interface for skills store
 */
export interface SkillsStateBase {
    skills: Skill[];
    hasInitialized: boolean;
    isLoading: boolean;
    _initialized: boolean;
}

/**
 * Internal methods interface
 */
export interface SkillsInternals {
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { skills: Skill[]; hasInitialized: boolean } | null) => void;
    _reset: () => void;
}

/**
 * Type for Zustand's set function with Immer middleware
 * Accepts a function that mutates the draft state directly
 */
export type SkillsSet = (
    fn: (state: Draft<SkillsStateBase>) => void
) => void;

/**
 * Type for Zustand's get function - returns full state including internals
 */
export type SkillsGet = () => SkillsStateBase & SkillsInternals;

/**
 * Helper type to map skill by ID
 */
export type SkillMapper<T = Skill> = (skill: Skill) => T;

/**
 * Re-export types used in actions
 */
export type {
    Skill,
    SkillLog,
    SkillResource,
    SkillRoadmapItem,
    VisualRoadmap,
    RoadmapViewMode,
    MicroAchievement,
    NextDayContent
};
