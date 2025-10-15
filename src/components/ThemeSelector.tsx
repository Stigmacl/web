import React, { useState } from 'react';
import { Palette, Sun, Moon, ChevronRight } from 'lucide-react';
import { useTheme, GameTheme } from '../contexts/ThemeContext';

const ThemeSelector: React.FC = () => {
  const { mode, theme, themeConfig, toggleMode, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-24 right-4 z-50 p-3 rounded-xl border transition-all duration-300 hover:scale-105"
        style={{
          backgroundColor: `${themeConfig.colors.surface}80`,
          backdropFilter: 'blur(24px)',
          borderColor: themeConfig.colors.border,
          boxShadow: `0 8px 32px ${themeConfig.colors.primary}20`
        }}
      >
        <Palette className="w-5 h-5" style={{ color: themeConfig.colors.primary }} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="fixed top-24 right-4 z-50 w-80 rounded-2xl border shadow-2xl p-6 space-y-6 animate-in slide-in-from-right duration-300"
            style={{
              backgroundColor: themeConfig.colors.surface,
              backdropFilter: 'blur(24px)',
              borderColor: themeConfig.colors.border
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: themeConfig.colors.text }}>
                <Palette className="w-5 h-5" style={{ color: themeConfig.colors.primary }} />
                Personalización
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: themeConfig.colors.textSecondary }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-3 block" style={{ color: themeConfig.colors.text }}>
                  Modo
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={toggleMode}
                    className="flex-1 p-3 rounded-xl border transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: mode === 'dark' ? `${themeConfig.colors.primary}30` : 'transparent',
                      borderColor: mode === 'dark' ? themeConfig.colors.primary : themeConfig.colors.border,
                      color: mode === 'dark' ? themeConfig.colors.primary : themeConfig.colors.textSecondary
                    }}
                  >
                    <Moon className="w-4 h-4" />
                    <span className="text-sm font-medium">Oscuro</span>
                  </button>
                  <button
                    onClick={toggleMode}
                    className="flex-1 p-3 rounded-xl border transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: mode === 'light' ? `${themeConfig.colors.primary}30` : 'transparent',
                      borderColor: mode === 'light' ? themeConfig.colors.primary : themeConfig.colors.border,
                      color: mode === 'light' ? themeConfig.colors.primary : themeConfig.colors.textSecondary
                    }}
                  >
                    <Sun className="w-4 h-4" />
                    <span className="text-sm font-medium">Claro</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 block" style={{ color: themeConfig.colors.text }}>
                  Esquema de Color
                </label>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as GameTheme)}
                      className="w-full p-4 rounded-xl border transition-all duration-300 hover:scale-102 group"
                      style={{
                        backgroundColor: theme === t.id ? `${themeConfig.colors.primary}20` : 'transparent',
                        borderColor: theme === t.id ? themeConfig.colors.primary : themeConfig.colors.border
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border-2 transition-transform duration-300 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`,
                            borderColor: theme === t.id ? themeConfig.colors.primary : 'transparent',
                            boxShadow: theme === t.id ? `0 4px 12px ${t.colors.primary}40` : 'none'
                          }}
                        />
                        <div className="flex-1 text-left">
                          <h4
                            className="font-semibold text-sm"
                            style={{ color: theme === t.id ? themeConfig.colors.primary : themeConfig.colors.text }}
                          >
                            {t.name}
                          </h4>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: themeConfig.colors.textSecondary }}
                          >
                            {t.description}
                          </p>
                        </div>
                        {theme === t.id && (
                          <ChevronRight className="w-4 h-4" style={{ color: themeConfig.colors.primary }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="pt-4 border-t text-center"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <p className="text-xs" style={{ color: themeConfig.colors.textSecondary }}>
                Los cambios se guardan automáticamente
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${themeConfig.colors.border};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${themeConfig.colors.primary};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${themeConfig.colors.secondary};
        }
        @keyframes slide-in-from-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-in {
          animation: slide-in-from-right 0.3s ease-out;
        }
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
};

export default ThemeSelector;
