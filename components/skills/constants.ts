export const THEMES = {
    emerald: 'text-emerald-400 bg-emerald-500',
    blue: 'text-blue-400 bg-blue-500',
    purple: 'text-purple-400 bg-purple-500',
    amber: 'text-amber-400 bg-amber-500',
    rose: 'text-rose-400 bg-rose-500',
} as const;

export const THEME_VARIANTS = {
    emerald: {
        text: 'text-emerald-400',
        textDark: 'text-emerald-500',
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-500/10',
        bgHover: 'hover:bg-emerald-500/20',
        border: 'border-emerald-500',
        borderLight: 'border-emerald-500/20',
        button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20',
        inputFocus: 'focus:border-emerald-500',
        checkbox: 'text-emerald-500',
        icon: 'text-emerald-400',
        // Complete hover classes for dynamic usage
        hoverText: 'hover:text-emerald-400',
        hoverBorderLight: 'hover:border-emerald-500/30',
        hoverIcon: 'hover:text-emerald-400'
    },
    blue: {
        text: 'text-blue-400',
        textDark: 'text-blue-500',
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-500/10',
        bgHover: 'hover:bg-blue-500/20',
        border: 'border-blue-500',
        borderLight: 'border-blue-500/20',
        button: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20',
        inputFocus: 'focus:border-blue-500',
        checkbox: 'text-blue-500',
        icon: 'text-blue-400',
        hoverText: 'hover:text-blue-400',
        hoverBorderLight: 'hover:border-blue-500/30',
        hoverIcon: 'hover:text-blue-400'
    },
    purple: {
        text: 'text-purple-400',
        textDark: 'text-purple-500',
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-500/10',
        bgHover: 'hover:bg-purple-500/20',
        border: 'border-purple-500',
        borderLight: 'border-purple-500/20',
        button: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20',
        inputFocus: 'focus:border-purple-500',
        checkbox: 'text-purple-500',
        icon: 'text-purple-400',
        hoverText: 'hover:text-purple-400',
        hoverBorderLight: 'hover:border-purple-500/30',
        hoverIcon: 'hover:text-purple-400'
    },
    amber: {
        text: 'text-amber-400',
        textDark: 'text-amber-500',
        bg: 'bg-amber-500',
        bgLight: 'bg-amber-500/10',
        bgHover: 'hover:bg-amber-500/20',
        border: 'border-amber-500',
        borderLight: 'border-amber-500/20',
        button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20',
        inputFocus: 'focus:border-amber-500',
        checkbox: 'text-amber-500',
        icon: 'text-amber-400',
        hoverText: 'hover:text-amber-400',
        hoverBorderLight: 'hover:border-amber-500/30',
        hoverIcon: 'hover:text-amber-400'
    },
    rose: {
        text: 'text-rose-400',
        textDark: 'text-rose-500',
        bg: 'bg-rose-500',
        bgLight: 'bg-rose-500/10',
        bgHover: 'hover:bg-rose-500/20',
        border: 'border-rose-500',
        borderLight: 'border-rose-500/20',
        button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20',
        inputFocus: 'focus:border-rose-500',
        checkbox: 'text-rose-500',
        icon: 'text-rose-400',
        hoverText: 'hover:text-rose-400',
        hoverBorderLight: 'hover:border-rose-500/30',
        hoverIcon: 'hover:text-rose-400'
    }
} as const;

// Visual Roadmap Node Styles (matching roadmap.sh aesthetic)
export const VISUAL_NODE_STYLES = {
    main: {
        bg: 'bg-amber-700/90',
        bgHover: 'hover:bg-amber-600',
        border: 'border-amber-500',
        text: 'text-amber-100',
        checkColor: 'text-green-400',
        label: 'Recomendação',
        labelIcon: '●',
        labelColor: 'text-green-400'
    },
    alternative: {
        bg: 'bg-purple-700/90',
        bgHover: 'hover:bg-purple-600',
        border: 'border-purple-500',
        text: 'text-purple-100',
        checkColor: 'text-purple-400',
        label: 'Alternativo',
        labelIcon: '●',
        labelColor: 'text-purple-400'
    },
    optional: {
        bg: 'bg-cyan-700/90',
        bgHover: 'hover:bg-cyan-600',
        border: 'border-cyan-500',
        text: 'text-cyan-100',
        checkColor: 'text-cyan-400',
        label: 'Ordem Flexível',
        labelIcon: '●',
        labelColor: 'text-cyan-400'
    },
    info: {
        bg: 'bg-slate-700/90',
        bgHover: 'hover:bg-slate-600',
        border: 'border-slate-500',
        text: 'text-slate-100',
        checkColor: 'text-slate-400',
        label: 'Informação',
        labelIcon: null,
        labelColor: 'text-slate-400'
    },
    section: {
        bg: 'bg-slate-800/90',
        bgHover: 'hover:bg-slate-700',
        border: 'border-slate-600',
        text: 'text-slate-300 font-bold tracking-widest uppercase',
        checkColor: 'text-slate-500',
        label: 'Divisor',
        labelIcon: '━',
        labelColor: 'text-slate-400'
    }
} as const;

export type ThemeKey = keyof typeof THEMES;
export type ThemeVariant = typeof THEME_VARIANTS[ThemeKey];
export type VisualNodeStyleKey = keyof typeof VISUAL_NODE_STYLES;
