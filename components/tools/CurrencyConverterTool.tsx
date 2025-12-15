import React, { useState, useCallback, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';

import { CURRENCIES, FALLBACK_RATES } from './constants';

const useCurrencyRates = (fromCur: string, toCur: string, amount: string) => {
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [usingFallback, setUsingFallback] = useState(false);

    const calculateWithFallback = useCallback((amountVal: number, from: string, to: string) => {
        const fromRate = FALLBACK_RATES[from] || 0;
        const toRate = FALLBACK_RATES[to] || 0;

        if (fromRate > 0 && toRate > 0) {
            const finalValue = (amountVal * fromRate) / toRate;
            const isCrypto = to === 'BTC' || to === 'ETH';
            const decimals = isCrypto ? 8 : 2;
            return finalValue.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        }
        return null;
    }, []);

    const fetchRates = useCallback(async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            setResult(null);
            return;
        }

        setLoading(true);
        setError(null);
        setUsingFallback(false);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL', {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            const getBRLValue = (code: string): number => {
                if (code === 'BRL') return 1;
                const key = `${code}BRL`;
                const rate = data[key]?.bid;
                if (!rate) return 0;
                return parseFloat(rate);
            };

            const fromRate = getBRLValue(fromCur);
            const toRate = getBRLValue(toCur);

            if (fromRate > 0 && toRate > 0) {
                const val = parseFloat(amount);
                const finalValue = (val * fromRate) / toRate;
                const isCrypto = toCur === 'BTC' || toCur === 'ETH';
                const decimals = isCrypto ? 8 : 2;
                setResult(finalValue.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
                setLastUpdate(new Date().toLocaleTimeString());
            } else {
                throw new Error('Taxa não encontrada na resposta');
            }
        } catch (err) {
            console.warn('API indisponível, usando taxas de fallback:', err);
            const val = parseFloat(amount);
            const fallbackResult = calculateWithFallback(val, fromCur, toCur);

            if (fallbackResult) {
                setResult(fallbackResult);
                setUsingFallback(true);
                setLastUpdate('Estimativa');
                setError(null);
            } else {
                setError('Conversão não disponível');
                setResult(null);
            }
        } finally {
            setLoading(false);
        }
    }, [fromCur, toCur, amount, calculateWithFallback]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (amount && parseFloat(amount) > 0) {
                fetchRates();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [fromCur, toCur, amount, fetchRates]);

    return { result, loading, lastUpdate, fetchRates, error, usingFallback };
};

export const CurrencyConverterTool: React.FC = () => {
    const [amount, setAmount] = useState('1');
    const [fromCur, setFromCur] = useState('USD');
    const [toCur, setToCur] = useState('BRL');
    const { result, loading, lastUpdate, fetchRates, error, usingFallback } = useCurrencyRates(fromCur, toCur, amount);

    const handleSwapCurrencies = () => {
        setFromCur(toCur);
        setToCur(fromCur);
    };

    return (
        <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valor</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase">De</label>
                            <select
                                value={fromCur}
                                onChange={(e) => setFromCur(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                            >
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.icon} {c.code}</option>)}
                            </select>
                        </div>

                        <button onClick={handleSwapCurrencies} className="p-2.5 mb-[2px] rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <ArrowRightLeft size={18} />
                        </button>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Para</label>
                            <select
                                value={toCur}
                                onChange={(e) => setToCur(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                            >
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.icon} {c.code}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-6 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-slate-400 text-sm mb-1">{amount} {fromCur} =</div>
                        {loading ? (
                            <div className="text-3xl font-bold text-indigo-300 animate-pulse">Calculando...</div>
                        ) : error ? (
                            <div className="text-xl font-bold text-red-400">{error}</div>
                        ) : (
                            <>
                                <div className="text-4xl font-bold text-white tracking-tight">{result} <span className="text-lg text-indigo-300">{toCur}</span></div>
                                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
                                    {usingFallback && <span className="text-amber-500 font-bold px-2 py-0.5 rounded-full bg-amber-500/10">Estimado</span>}
                                    <span>Atualizado: {lastUpdate}</span>
                                    <button onClick={fetchRates} className="p-1 hover:text-white hover:bg-slate-800 rounded">
                                        <RefreshCw size={12} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
