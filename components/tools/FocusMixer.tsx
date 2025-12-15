import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { FOCUS_SOUNDS } from './constants';

export const FocusMixer: React.FC = () => {
    const [soundVolumes, setSoundVolumes] = useState<Record<string, number>>({
        rain: 0.5, coffee: 0.5, fireplace: 0.5, whitenoise: 0.5
    });
    const [playingSounds, setPlayingSounds] = useState<Record<string, boolean>>({});
    const [masterPlaying, setMasterPlaying] = useState(false);
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

    // Initialize Audio Objects
    useEffect(() => {
        FOCUS_SOUNDS.forEach(sound => {
            if (!audioRefs.current[sound.id]) {
                const audio = new Audio(sound.url);
                audio.loop = true;
                audio.volume = soundVolumes[sound.id];
                audioRefs.current[sound.id] = audio;
            }
        });

        // Cleanup
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            audioRefs.current = {};
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle Volume & Playback Changes
    useEffect(() => {
        const activeSounds = Object.entries(playingSounds).filter(([_, isPlaying]) => isPlaying).length > 0;
        setMasterPlaying(activeSounds);

        Object.entries(audioRefs.current).forEach(([id, audio]) => {
            // Update Volume
            if (soundVolumes[id] !== undefined) {
                audio.volume = soundVolumes[id];
            }

            // Play/Pause
            if (playingSounds[id]) {
                if (audio.paused) {
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => {
                            console.error("Audio play failed:", e);
                        });
                    }
                }
            } else {
                if (!audio.paused) audio.pause();
            }
        });
    }, [soundVolumes, playingSounds]);

    const toggleSound = (id: string) => {
        setPlayingSounds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleVolumeChange = (id: string, val: number) => {
        setSoundVolumes(prev => ({ ...prev, [id]: val }));
    };

    const toggleMasterPlay = () => {
        if (masterPlaying) {
            setPlayingSounds({});
        } else {
            setPlayingSounds({ rain: true });
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Headphones className="text-indigo-400" /> Mixer de Foco
                    </h3>
                    <p className="text-slate-400 text-sm">Combine sons para criar seu ambiente perfeito.</p>
                </div>

                <button
                    onClick={toggleMasterPlay}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${masterPlaying ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}
                >
                    {masterPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    {masterPlaying ? 'Pausar Todos' : 'Iniciar Foco'}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {FOCUS_SOUNDS.map((sound) => {
                    const isPlaying = playingSounds[sound.id];
                    const volume = soundVolumes[sound.id];

                    return (
                        <div
                            key={sound.id}
                            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${isPlaying ? `${sound.bg} ${sound.border} shadow-lg shadow-${sound.color.replace('text-', '')}/10` : 'bg-slate-800/50 border-slate-700/50'}`}
                        >
                            <div className="p-6 flex flex-col items-center gap-4 relative z-10">
                                {/* Icon Wrapper */}
                                <button
                                    onClick={() => toggleSound(sound.id)}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isPlaying ? 'bg-white text-slate-900 scale-110 shadow-xl' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                >
                                    <sound.icon size={28} className={isPlaying ? 'animate-pulse' : ''} />
                                </button>

                                <div className="text-center">
                                    <h4 className={`font-bold ${isPlaying ? 'text-white' : 'text-slate-400'}`}>{sound.label}</h4>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{Math.round(volume * 100)}%</p>
                                </div>

                                {/* Volume Slider */}
                                <div className="w-full flex items-center gap-2 mt-2">
                                    <button onClick={() => toggleSound(sound.id)} className="text-xs text-slate-500 hover:text-white">
                                        {volume === 0 || !isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                                        className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
