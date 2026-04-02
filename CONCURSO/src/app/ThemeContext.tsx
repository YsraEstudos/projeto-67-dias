import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeColors = {
  primary: string;
  secondary: string;
  tertiary: string;
};

interface ThemeContextType {
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => void;
}

const defaultColors: ThemeColors = {
  primary: '#f5ffc4', // Studio Pro primary (Neon Yellow/Green)
  secondary: '#fed01b', // Studio Pro secondary (Active Focus Gold)
  tertiary: '#c6fff3', // Studio Pro tertiary (Content Review Cyan)
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors, setColors] = useState<ThemeColors>(() => {
    try {
      const saved = localStorage.getItem('studioProThemeColors');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignored
    }
    return defaultColors;
  });

  useEffect(() => {
    localStorage.setItem('studioProThemeColors', JSON.stringify(colors));
    
    // Apply colors to root CSS variables dynamically
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-tertiary', colors.tertiary);
    
    // Update container colors (10% opacity)
    // We assume primary/secondary are hex colors for this simple operation, 
    // real implementation might need a hex-to-rgb converter for precision if using rgba
    // But since CSS variables like --color-primary-container are mostly used directly, we can inject a hex with transparency (e.g. + "1A" for ~10%)
    const addAlpha = (hex: string, alpha: string) => {
      // Ensure hex has 6 chars
      if (hex.length === 7) return hex + alpha;
      if (hex.length === 4) return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] + alpha;
      return hex;
    };

    root.style.setProperty('--color-primary-container', addAlpha(colors.primary, '1A'));
    root.style.setProperty('--color-secondary-container', addAlpha(colors.secondary, '1A'));
    
    // Fallback overrides
    root.style.setProperty('--accent-primary', colors.primary);

  }, [colors]);

  return (
    <ThemeContext.Provider value={{ colors, setColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
