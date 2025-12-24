import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skill, FocusSkill } from '../../types';

interface FocusSkillsCarouselProps {
    skills: Skill[];
    focusSkills: FocusSkill[];
    onToggleFocusSkill: (skillId: string) => void;
    onUpdateWeight: (skillId: string, weight: number) => void;
    totalFocusWeight: number;
}

export const FocusSkillsCarousel: React.FC<FocusSkillsCarouselProps> = React.memo(({
    skills,
    focusSkills,
    onToggleFocusSkill,
    onUpdateWeight,
    totalFocusWeight
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // O(1) lookup map instead of O(n) find()
    const skillMap = useMemo(() => new Map(skills.map(s => [s.id, s])), [skills]);

    // Get selected skills with their config
    const selectedSkills = useMemo(() => {
        return focusSkills
            .map(fs => {
                const skill = skillMap.get(fs.skillId);
                return skill ? { skill, config: fs } : null;
            })
            .filter(Boolean) as { skill: Skill; config: FocusSkill }[];
    }, [skillMap, focusSkills]);

    // Auto-rotation effect
    useEffect(() => {
        if (isPaused || selectedSkills.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % selectedSkills.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [isPaused, selectedSkills.length]);

    // Reset index if out of bounds
    useEffect(() => {
        if (currentIndex >= selectedSkills.length && selectedSkills.length > 0) {
            setCurrentIndex(0);
        }
    }, [selectedSkills.length, currentIndex]);

    if (selectedSkills.length === 0) return null;

    const currentItem = selectedSkills[currentIndex];

    const goToNext = () => {
        setCurrentIndex(prev => (prev + 1) % selectedSkills.length);
    };

    const goToPrev = () => {
        setCurrentIndex(prev => (prev - 1 + selectedSkills.length) % selectedSkills.length);
    };

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Main Carousel Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-slate-900/50 border border-cyan-500/30 p-6">
                {/* Navigation Arrows */}
                {selectedSkills.length > 1 && (
                    <>
                        <button
                            onClick={goToPrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors z-10"
                            aria-label="Skill anterior"
                        >
                            <ChevronLeft size={20} className="text-cyan-400" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors z-10"
                            aria-label="Próxima skill"
                        >
                            <ChevronRight size={20} className="text-cyan-400" />
                        </button>
                    </>
                )}

                {/* Skill Content */}
                <div className="text-center px-10">
                    {/* Skill Name */}
                    <h3 className="text-xl font-bold text-white mb-2 transition-all duration-300">
                        {currentItem.skill.name}
                    </h3>

                    {/* Weight Display */}
                    <div className="text-3xl font-bold text-cyan-400 mb-4">
                        {currentItem.config.weight}%
                    </div>

                    {/* Weight Slider */}
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-xs text-slate-400 w-8">1%</span>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={currentItem.config.weight}
                            onChange={(e) => onUpdateWeight(currentItem.skill.id, Number(e.target.value))}
                            className="flex-1 accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs text-slate-400 w-10">100%</span>
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={() => onToggleFocusSkill(currentItem.skill.id)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                        Remover do foco
                    </button>
                </div>

                {/* Total Weight Indicator */}
                <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded ${totalFocusWeight === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    Σ {totalFocusWeight}%
                </div>
            </div>

            {/* Dot Indicators */}
            {selectedSkills.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {selectedSkills.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex
                                ? 'bg-cyan-400 w-6'
                                : 'bg-slate-600 w-2 hover:bg-slate-500'
                                }`}
                            aria-label={`Ir para skill ${idx + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Pause Indicator */}
            {isPaused && selectedSkills.length > 1 && (
                <div className="absolute top-3 left-3 text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Pausado
                </div>
            )}
        </div>
    );
});
