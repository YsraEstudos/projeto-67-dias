import {
    Calculator, Ruler, Banknote, FileText, MousePointerClick, Clock, Wind, Headphones, LucideIcon
} from 'lucide-react';
import { ToolType } from './ToolsSidebar';

export const FALLBACK_RATES: Record<string, number> = {
    USD: 6.05,
    EUR: 6.35,
    BTC: 600000,
    ETH: 22000,
    BRL: 1,
};

export const CURRENCIES = [
    { code: 'BRL', name: 'Real Brasileiro', icon: '🇧🇷' },
    { code: 'USD', name: 'Dólar Americano', icon: '🇺🇸' },
    { code: 'EUR', name: 'Euro', icon: '🇪🇺' },
    { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    { code: 'ETH', name: 'Ethereum', icon: 'Ξ' }
];

export const TOOLS_MENU: { id: ToolType; icon: LucideIcon; label: string }[] = [
    { id: 'time', icon: Clock, label: 'Relógio/Timer' },
    { id: 'focus', icon: Headphones, label: 'Sons de Foco' },
    { id: 'calc', icon: Calculator, label: 'Calculadora' },
    { id: 'convert', icon: Ruler, label: 'Conversor' },
    { id: 'currency', icon: Banknote, label: 'Cotações' },
    { id: 'text', icon: FileText, label: 'Analisador Texto' },
    { id: 'clicker', icon: MousePointerClick, label: 'Contador' },
    { id: 'breathing', icon: Wind, label: 'Respiração' },
];

// Focus Mixer sounds
import { CloudRain, Coffee, Flame } from 'lucide-react';

export const FOCUS_SOUNDS = [
    { id: 'rain', label: 'Chuva', icon: CloudRain, url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'coffee', label: 'Cafeteria', icon: Coffee, url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'fireplace', label: 'Lareira', icon: Flame, url: 'https://actions.google.com/sounds/v1/ambiences/fireplace.ogg', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 'whitenoise', label: 'Ruído Branco', icon: Wind, url: 'https://actions.google.com/sounds/v1/water/air_conditioner_hum.ogg', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
];

// Converter types
import { Scale, Thermometer, Gauge, Square, Droplet } from 'lucide-react';

export type ConverterType = 'weight' | 'length' | 'temperature' | 'speed' | 'area' | 'volume';

export const CONVERTER_TYPES: { id: ConverterType; label: string; icon: LucideIcon }[] = [
    { id: 'weight', label: 'Peso', icon: Scale },
    { id: 'length', label: 'Comprimento', icon: Ruler },
    { id: 'temperature', label: 'Temperatura', icon: Thermometer },
    { id: 'speed', label: 'Velocidade', icon: Gauge },
    { id: 'area', label: 'Área', icon: Square },
    { id: 'volume', label: 'Volume', icon: Droplet },
];
