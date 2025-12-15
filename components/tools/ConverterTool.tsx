import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { CONVERTER_TYPES, ConverterType } from './constants';

export const ConverterTool: React.FC = () => {
    const [activeConverter, setActiveConverter] = useState<ConverterType>('weight');
    const [converterInput, setConverterInput] = useState('');
    const [converterResult, setConverterResult] = useState<string | null>(null);

    const handleConvert = () => {
        const val = parseFloat(converterInput);
        if (isNaN(val)) return;

        let result = '';
        switch (activeConverter) {
            case 'weight':
                result = `${val} kg = ${(val * 2.20462).toFixed(2)} lbs\n${val} kg = ${(val * 1000).toFixed(0)} g`;
                break;
            case 'length':
                const feet = val * 3.28084;
                const inches = val * 39.3701;
                result = `${val} m = ${feet.toFixed(2)} ft\n${val} m = ${inches.toFixed(2)} in`;
                break;
            case 'temperature':
                const fahrenheit = (val * 9 / 5) + 32;
                const kelvin = val + 273.15;
                result = `${val}°C = ${fahrenheit.toFixed(2)}°F\n${val}°C = ${kelvin.toFixed(2)} K`;
                break;
            case 'speed':
                const mph = val * 0.621371;
                const ms = val / 3.6;
                result = `${val} km/h = ${mph.toFixed(2)} mph\n${val} km/h = ${ms.toFixed(2)} m/s`;
                break;
            case 'area':
                const sqft = val * 10.7639;
                const acres = val * 0.000247105;
                result = `${val} m² = ${sqft.toFixed(2)} ft²\n${val} m² = ${acres.toFixed(6)} acres`;
                break;
            case 'volume':
                const gallons = val * 0.264172;
                const quarts = val * 1.05669;
                result = `${val} L = ${gallons.toFixed(2)} gal (US)\n${val} L = ${quarts.toFixed(2)} qt`;
                break;
        }
        setConverterResult(result);
    };

    const handleConverterTypeChange = (type: ConverterType) => {
        setActiveConverter(type);
        setConverterResult(null);
    };

    return (
        <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300">
            <div className="grid grid-cols-3 gap-2 mb-8">
                {CONVERTER_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => handleConverterTypeChange(type.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${activeConverter === type.id
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                            }`}
                    >
                        <type.icon size={20} className="mb-2" />
                        <span className="text-xs font-medium">{type.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        Valor ({
                            activeConverter === 'temperature' ? '°C' :
                                activeConverter === 'speed' ? 'km/h' :
                                    activeConverter === 'weight' ? 'kg' :
                                        activeConverter === 'length' ? 'metros' :
                                            activeConverter === 'area' ? 'm²' : 'litros'
                        })
                    </label>
                    <input
                        type="number"
                        value={converterInput}
                        onChange={(e) => setConverterInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        placeholder="0.00"
                    />
                </div>

                <button
                    onClick={handleConvert}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mb-6"
                >
                    <ArrowRightLeft size={18} /> Converter
                </button>

                {converterResult && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
                        <pre className="text-indigo-300 font-mono text-lg whitespace-pre-wrap">{converterResult}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};
