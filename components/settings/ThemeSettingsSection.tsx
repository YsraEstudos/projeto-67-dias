import React from 'react';
import { Palette } from 'lucide-react';
import { useConfigStore } from '../../stores';
import { AppTheme } from '../../types';

const THEMES: { id: AppTheme; label: string; description: string; preview: string }[] = [
    {
        id: 'default',
        label: 'Escuro Padrão',
        description: 'Tema escuro com tons de azul slate',
        preview: 'bg-slate-800'
    },
    {
        id: 'amoled',
        label: 'AMOLED Preto',
        description: 'Preto puro para telas OLED/AMOLED',
        preview: 'bg-black'
    },
];

export const ThemeSettingsSection: React.FC = () => {
    const { config, setConfig } = useConfigStore();
    const currentTheme = config.theme || 'default';

    const handleThemeChange = (theme: AppTheme) => {
        setConfig({ theme });
    };

    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <Palette size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Aparência</h3>
                    <p className="text-sm text-slate-400">Personalize o tema visual do aplicativo.</p>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={`
                relative p-4 rounded-xl border-2 transition-all text-left
                ${currentTheme === theme.id
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                                }
              `}
                        >
                            {/* Preview swatch */}
                            <div className={`w-full h-16 rounded-lg mb-3 ${theme.preview} border border-slate-600`} />

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-white">{theme.label}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">{theme.description}</p>
                                </div>
                                {currentTheme === theme.id && (
                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
