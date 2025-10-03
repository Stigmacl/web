import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type GameTheme = 'tactical' | 'counter-strike' | 'call-of-duty' | 'cyberpunk' | 'military' | 'neon';

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
    id: 'call-of-duty',
    name: 'Verde',
    description: 'Estilo militar con verdes y marrones',
    preview: 'from-stone-900 via-green-900 to-stone-800',
    colors: {
      primary: 'rgb(34, 197, 94)',
      secondary: 'rgb(21, 128, 61)',
      accent: 'rgb(187, 247, 208)',
      background: 'from-stone-900 via-green-900 to-stone-800',
      surface: 'rgba(68, 64, 60, 0.4)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(187, 247, 208)',
      border: 'rgba(34, 197, 94, 0.3)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-green-600 to-emerald-600',
      gradientHover: 'from-green-700 to-emerald-700'
    },
    effects: {
      blur: 'backdrop-blur-lg',
      shadow: 'shadow-2xl shadow-green-500/10',
      glow: 'shadow-lg shadow-green-500/30'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Purpura',
    description: 'Futurista con púrpuras y cianes',
    preview: 'from-purple-900 via-pink-900 to-purple-800',
    colors: {
      primary: 'rgb(168, 85, 247)',
      secondary: 'rgb(126, 34, 206)',
      accent: 'rgb(221, 214, 254)',
      background: 'from-purple-900 via-pink-900 to-purple-800',
      surface: 'rgba(88, 28, 135, 0.4)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(221, 214, 254)',
      border: 'rgba(168, 85, 247, 0.3)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-purple-600 to-pink-600',
      gradientHover: 'from-purple-700 to-pink-700'
    },
    effects: {
      blur: 'backdrop-blur-lg',
      shadow: 'shadow-2xl shadow-purple-500/10',
      glow: 'shadow-lg shadow-purple-500/30'
    }
  },
  {
    id: 'military',
    name: 'Naranjo Oscuro',
    description: 'Camuflaje militar con tonos tierra',
    preview: 'from-amber-900 via-yellow-900 to-amber-800',
    colors: {
      primary: 'rgb(245, 158, 11)',
      secondary: 'rgb(180, 83, 9)',
      accent: 'rgb(254, 243, 199)',
      background: 'from-amber-900 via-yellow-900 to-amber-800',
      surface: 'rgba(120, 113, 108, 0.4)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(254, 243, 199)',
      border: 'rgba(245, 158, 11, 0.3)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-amber-600 to-yellow-600',
      gradientHover: 'from-amber-700 to-yellow-700'
    },
    effects: {
      blur: 'backdrop-blur-lg',
      shadow: 'shadow-2xl shadow-amber-500/10',
      glow: 'shadow-lg shadow-amber-500/30'
    }
  },
  {
    id: 'neon',
    name: 'Cian',
    description: 'Neón brillante con cianes y magentas',
    preview: 'from-cyan-900 via-teal-900 to-cyan-800',
    colors: {
      primary: 'rgb(6, 182, 212)',
      secondary: 'rgb(14, 116, 144)',
      accent: 'rgb(165, 243, 252)',
      background: 'from-cyan-900 via-teal-900 to-cyan-800',
      surface: 'rgba(22, 78, 99, 0.4)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(165, 243, 252)',
      border: 'rgba(6, 182, 212, 0.3)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(251, 191, 36)',
      error: 'rgb(239, 68, 68)',
      gradient: 'from-cyan-600 to-teal-600',
      gradientHover: 'from-cyan-700 to-teal-700'
    },
    effects: {
      blur: 'backdrop-blur-lg',
      shadow: 'shadow-2xl shadow-cyan-500/10',
      glow: 'shadow-lg shadow-cyan-500/30'
    }
  }
];

const lightThemes: ThemeConfig[] = themes.map(theme => ({
  ...theme,
  colors: {
    ...theme.colors,
    background: theme.id === 'tactical' ? 'from-blue-50 via-indigo-50 to-blue-100' :
                theme.id === 'counter-strike' ? 'from-orange-50 via-amber-50 to-orange-100' :
                theme.id === 'call-of-duty' ? 'from-green-50 via-emerald-50 to-green-100' :
                theme.id === 'cyberpunk' ? 'from-purple-50 via-pink-50 to-purple-100' :
                theme.id === 'military' ? 'from-amber-50 via-yellow-50 to-amber-100' :
                'from-cyan-50 via-teal-50 to-cyan-100',
    surface: theme.id === 'tactical' ? 'rgba(255, 255, 255, 0.8)' :
             theme.id === 'counter-strike' ? 'rgba(255, 251, 235, 0.8)' :
             theme.id === 'call-of-duty' ? 'rgba(240, 253, 244, 0.8)' :
             theme.id === 'cyberpunk' ? 'rgba(250, 245, 255, 0.8)' :
             theme.id === 'military' ? 'rgba(255, 251, 235, 0.8)' :
             'rgba(240, 253, 250, 0.8)',
    text: 'rgb(17, 24, 39)',
    textSecondary: theme.id === 'tactical' ? 'rgb(30, 64, 175)' :
                   theme.id === 'counter-strike' ? 'rgb(194, 65, 12)' :
                   theme.id === 'call-of-duty' ? 'rgb(21, 128, 61)' :
                   theme.id === 'cyberpunk' ? 'rgb(126, 34, 206)' :
                   theme.id === 'military' ? 'rgb(180, 83, 9)' :
                   'rgb(14, 116, 144)',
    border: theme.id === 'tactical' ? 'rgba(59, 130, 246, 0.2)' :
            theme.id === 'counter-strike' ? 'rgba(251, 146, 60, 0.2)' :
            theme.id === 'call-of-duty' ? 'rgba(34, 197, 94, 0.2)' :
            theme.id === 'cyberpunk' ? 'rgba(168, 85, 247, 0.2)' :
            theme.id === 'military' ? 'rgba(245, 158, 11, 0.2)' :
            'rgba(6, 182, 212, 0.2)'
  },
  effects: {
    ...theme.effects,
    shadow: theme.id === 'tactical' ? 'shadow-xl shadow-blue-500/5' :
            theme.id === 'counter-strike' ? 'shadow-xl shadow-orange-500/5' :
            theme.id === 'call-of-duty' ? 'shadow-xl shadow-green-500/5' :
            theme.id === 'cyberpunk' ? 'shadow-xl shadow-purple-500/5' :
            theme.id === 'military' ? 'shadow-xl shadow-amber-500/5' :
            'shadow-xl shadow-cyan-500/5'
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