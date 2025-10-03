import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type GameTheme = 'tactical' | 'counter-strike' | 'black-glass';

interface ThemeConfig {
  id: GameTheme;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    gradient: string;
    gradientHover: string;
  };
  effects: {
    blur: string;
    shadow: string;
    glow: string;
  };
}

interface ThemeContextType {
  mode: ThemeMode;
  theme: GameTheme;
  themeConfig: ThemeConfig;
  toggleMode: () => void;
  setTheme: (theme: GameTheme) => void;
  themes: ThemeConfig[];
}

const themes: ThemeConfig[] = [
  {
    id: 'tactical',
    name: 'Azul',
    description: 'Tema original con azules',
    preview: 'from-slate-900 via-blue-900 to-slate-800',
    colors: {
      primary: 'rgb(59, 130, 246)',
      secondary: 'rgb(30, 64, 175)',
      accent: 'rgb(147, 197, 253)',
      background: 'from-slate-900 via-blue-900 to-slate-800',
      surface: 'rgba(30, 41, 59, 0.4)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(191, 219, 254)',
      border: 'rgba(59, 130, 246, 0.3)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-blue-600 to-cyan-600',
      gradientHover: 'from-blue-700 to-cyan-700'
    },
    effects: {
      blur: 'backdrop-blur-lg',
      shadow: 'shadow-2xl shadow-blue-500/10',
      glow: 'shadow-lg shadow-blue-500/30'
    }
  },
  {
    id: 'counter-strike',
    name: 'Naranjo',
    description: 'Tema con naranjas y grises',
    preview: 'from-gray-900 via-orange-900 to-gray-800',
    colors: {
      primary: 'rgb(251, 146, 60)',
      secondary: 'rgb(194, 65, 12)',
      accent: 'rgb(254, 215, 170)',
      background: 'from-gray-900 via-orange-900 to-gray-800',
      surface: 'rgba(55, 65, 81, 0.4)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(254, 215, 170)',
      border: 'rgba(251, 146, 60, 0.3)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-orange-600 to-red-600',
      gradientHover: 'from-orange-700 to-red-700'
    },
    effects: {
      blur: 'backdrop-blur-lg',
      shadow: 'shadow-2xl shadow-orange-500/10',
      glow: 'shadow-lg shadow-orange-500/30'
    }
  },
  {
    id: 'black-glass',
    name: 'Negro Glass',
    description: 'Elegante negro con efecto cristal',
    preview: 'from-gray-950 via-slate-950 to-black',
    colors: {
      primary: 'rgb(156, 163, 175)',
      secondary: 'rgb(75, 85, 99)',
      accent: 'rgb(229, 231, 235)',
      background: 'from-gray-950 via-slate-950 to-black',
      surface: 'rgba(17, 24, 39, 0.3)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(209, 213, 219)',
      border: 'rgba(156, 163, 175, 0.2)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-gray-700 to-slate-700',
      gradientHover: 'from-gray-600 to-slate-600'
    },
    effects: {
      blur: 'backdrop-blur-2xl',
      shadow: 'shadow-2xl shadow-black/30',
      glow: 'shadow-lg shadow-gray-500/20'
    }
  }
];

const lightThemes: ThemeConfig[] = themes.map(theme => ({
  ...theme,
  colors: {
    ...theme.colors,
    background: theme.id === 'tactical' ? 'from-blue-50 via-indigo-50 to-blue-100' :
                theme.id === 'counter-strike' ? 'from-orange-50 via-amber-50 to-orange-100' :
                'from-gray-50 via-slate-50 to-gray-100',
    surface: theme.id === 'tactical' ? 'rgba(255, 255, 255, 0.8)' :
             theme.id === 'counter-strike' ? 'rgba(255, 251, 235, 0.8)' :
             'rgba(249, 250, 251, 0.8)',
    text: 'rgb(17, 24, 39)',
    textSecondary: theme.id === 'tactical' ? 'rgb(30, 64, 175)' :
                   theme.id === 'counter-strike' ? 'rgb(194, 65, 12)' :
                   'rgb(75, 85, 99)',
    border: theme.id === 'tactical' ? 'rgba(59, 130, 246, 0.2)' :
            theme.id === 'counter-strike' ? 'rgba(251, 146, 60, 0.2)' :
            'rgba(156, 163, 175, 0.2)'
  },
  effects: {
    ...theme.effects,
    shadow: theme.id === 'tactical' ? 'shadow-xl shadow-blue-500/5' :
            theme.id === 'counter-strike' ? 'shadow-xl shadow-orange-500/5' :
            'shadow-xl shadow-gray-500/5'
  }
}));

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [theme, setTheme] = useState<GameTheme>('tactical');

  // Load saved preferences
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    const savedTheme = localStorage.getItem('game-theme') as GameTheme;
    
    if (savedMode) setMode(savedMode);
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('game-theme', theme);
  }, [mode, theme]);

  const toggleMode = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const currentThemes = mode === 'dark' ? themes : lightThemes;
  const themeConfig = currentThemes.find(t => t.id === theme) || currentThemes[0];

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const config = themeConfig;
    
    root.style.setProperty('--color-primary', config.colors.primary);
    root.style.setProperty('--color-secondary', config.colors.secondary);
    root.style.setProperty('--color-accent', config.colors.accent);
    root.style.setProperty('--color-text', config.colors.text);
    root.style.setProperty('--color-text-secondary', config.colors.textSecondary);
    root.style.setProperty('--color-surface', config.colors.surface);
    root.style.setProperty('--color-border', config.colors.border);
    root.style.setProperty('--color-success', config.colors.success);
    root.style.setProperty('--color-warning', config.colors.warning);
    root.style.setProperty('--color-error', config.colors.error);
  }, [themeConfig]);

  return (
    <ThemeContext.Provider value={{
      mode,
      theme,
      themeConfig,
      toggleMode,
      setTheme,
      themes: currentThemes
    }}>
      {children}
    </ThemeContext.Provider>
  );
};