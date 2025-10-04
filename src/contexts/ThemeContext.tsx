import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type GameTheme = 'tactical' | 'counter-strike' | 'black-glass' | 'neon-cyberpunk' | 'toxic-green' | 'plasma-red';

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
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Futurista con efectos neón y humo rosa-cyan',
    preview: 'from-fuchsia-950 via-cyan-950 to-slate-900',
    colors: {
      primary: 'rgb(236, 72, 153)',
      secondary: 'rgb(6, 182, 212)',
      accent: 'rgb(244, 114, 182)',
      background: 'from-fuchsia-950 via-cyan-950 to-slate-900',
      surface: 'rgba(24, 24, 27, 0.5)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(250, 204, 21)',
      border: 'rgba(236, 72, 153, 0.4)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-fuchsia-600 via-pink-600 to-cyan-600',
      gradientHover: 'from-fuchsia-500 via-pink-500 to-cyan-500'
    },
    effects: {
      blur: 'backdrop-blur-xl',
      shadow: 'shadow-2xl shadow-fuchsia-500/20',
      glow: 'shadow-lg shadow-pink-500/50'
    }
  },
  {
    id: 'toxic-green',
    name: 'Toxic Green',
    description: 'Energía radioactiva con humo verde brillante',
    preview: 'from-emerald-950 via-lime-950 to-green-950',
    colors: {
      primary: 'rgb(34, 197, 94)',
      secondary: 'rgb(132, 204, 22)',
      accent: 'rgb(163, 230, 53)',
      background: 'from-emerald-950 via-lime-950 to-green-950',
      surface: 'rgba(20, 83, 45, 0.4)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(220, 252, 231)',
      border: 'rgba(34, 197, 94, 0.4)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-emerald-600 via-green-500 to-lime-600',
      gradientHover: 'from-emerald-500 via-green-400 to-lime-500'
    },
    effects: {
      blur: 'backdrop-blur-lg',
      shadow: 'shadow-2xl shadow-green-500/20',
      glow: 'shadow-lg shadow-lime-500/40'
    }
  },
  {
    id: 'plasma-red',
    name: 'Plasma Rojo',
    description: 'Explosión de plasma con humo rojo y amarillo',
    preview: 'from-red-950 via-rose-950 to-orange-950',
    colors: {
      primary: 'rgb(239, 68, 68)',
      secondary: 'rgb(225, 29, 72)',
      accent: 'rgb(251, 146, 60)',
      background: 'from-red-950 via-rose-950 to-orange-950',
      surface: 'rgba(69, 10, 10, 0.5)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(254, 202, 202)',
      border: 'rgba(239, 68, 68, 0.4)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-red-600 via-rose-600 to-orange-600',
      gradientHover: 'from-red-500 via-rose-500 to-orange-500'
    },
    effects: {
      blur: 'backdrop-blur-lg',
      shadow: 'shadow-2xl shadow-red-500/20',
      glow: 'shadow-lg shadow-rose-500/50'
    }
  }
];

const lightThemes: ThemeConfig[] = themes.map(theme => ({
  ...theme,
  colors: {
    ...theme.colors,
    background: theme.id === 'tactical' ? 'from-blue-50 via-indigo-50 to-blue-100' :
                theme.id === 'counter-strike' ? 'from-orange-50 via-amber-50 to-orange-100' :
                theme.id === 'neon-cyberpunk' ? 'from-fuchsia-50 via-pink-50 to-cyan-50' :
                theme.id === 'toxic-green' ? 'from-emerald-50 via-lime-50 to-green-50' :
                theme.id === 'plasma-red' ? 'from-red-50 via-rose-50 to-orange-50' :
                'from-gray-50 via-slate-50 to-gray-100',
    surface: theme.id === 'tactical' ? 'rgba(255, 255, 255, 0.8)' :
             theme.id === 'counter-strike' ? 'rgba(255, 251, 235, 0.8)' :
             theme.id === 'neon-cyberpunk' ? 'rgba(253, 242, 248, 0.8)' :
             theme.id === 'toxic-green' ? 'rgba(240, 253, 244, 0.8)' :
             theme.id === 'plasma-red' ? 'rgba(254, 242, 242, 0.8)' :
             'rgba(249, 250, 251, 0.8)',
    text: 'rgb(17, 24, 39)',
    textSecondary: theme.id === 'tactical' ? 'rgb(30, 64, 175)' :
                   theme.id === 'counter-strike' ? 'rgb(194, 65, 12)' :
                   theme.id === 'neon-cyberpunk' ? 'rgb(219, 39, 119)' :
                   theme.id === 'toxic-green' ? 'rgb(21, 128, 61)' :
                   theme.id === 'plasma-red' ? 'rgb(185, 28, 28)' :
                   'rgb(75, 85, 99)',
    border: theme.id === 'tactical' ? 'rgba(59, 130, 246, 0.2)' :
            theme.id === 'counter-strike' ? 'rgba(251, 146, 60, 0.2)' :
            theme.id === 'neon-cyberpunk' ? 'rgba(236, 72, 153, 0.2)' :
            theme.id === 'toxic-green' ? 'rgba(34, 197, 94, 0.2)' :
            theme.id === 'plasma-red' ? 'rgba(239, 68, 68, 0.2)' :
            'rgba(156, 163, 175, 0.2)'
  },
  effects: {
    ...theme.effects,
    shadow: theme.id === 'tactical' ? 'shadow-xl shadow-blue-500/5' :
            theme.id === 'counter-strike' ? 'shadow-xl shadow-orange-500/5' :
            theme.id === 'neon-cyberpunk' ? 'shadow-xl shadow-fuchsia-500/5' :
            theme.id === 'toxic-green' ? 'shadow-xl shadow-green-500/5' :
            theme.id === 'plasma-red' ? 'shadow-xl shadow-red-500/5' :
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