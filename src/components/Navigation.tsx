import React from 'react';
import { Home, Users, Download, User, MessageSquare, Award, Server, Trophy } from 'lucide-react';
import { Section } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

interface NavigationProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentSection, onSectionChange }) => {
  const { themeConfig } = useTheme();
  const { user } = useAuth();

  const navItems = [
    { id: 'home' as Section, label: 'Inicio', icon: Home },
    { id: 'players' as Section, label: 'Comunidad', icon: Users },
    { id: 'servers' as Section, label: 'Servidores', icon: Server },
    { id: 'ranking' as Section, label: 'Ranking', icon: Trophy },
    { id: 'forum' as Section, label: 'Foro', icon: MessageSquare },
    { id: 'sponsors' as Section, label: 'Sponsors', icon: Award },
    { id: 'download' as Section, label: 'Descarga', icon: Download },
    { id: 'user-panel' as Section, label: 'Mi Perfil', icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="container mx-auto">
        <div className="flex justify-center items-center gap-4">
          <div
            className="flex flex-wrap justify-center gap-2 p-4 rounded-2xl border shadow-2xl"
            style={{
              backgroundColor: `${themeConfig.colors.surface}40`,
              backdropFilter: 'blur(24px)',
              borderColor: themeConfig.colors.border
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`
                    group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2
                    backdrop-blur-sm border hover:scale-105
                  `}
                  style={{
                    backgroundColor: isActive 
                      ? `${themeConfig.colors.primary}30` 
                      : `${themeConfig.colors.surface}40`,
                    color: isActive 
                      ? themeConfig.colors.primary 
                      : themeConfig.colors.textSecondary,
                    borderColor: isActive 
                      ? `${themeConfig.colors.primary}50` 
                      : `${themeConfig.colors.border}30`,
                    boxShadow: isActive 
                      ? `0 8px 32px ${themeConfig.colors.primary}20` 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = `${themeConfig.colors.primary}20`;
                      e.currentTarget.style.color = themeConfig.colors.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = `${themeConfig.colors.surface}40`;
                      e.currentTarget.style.color = themeConfig.colors.textSecondary;
                    }
                  }}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span className="text-sm hidden sm:inline">{item.label}</span>
                  
                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-xl animate-pulse"
                      style={{
                        background: `linear-gradient(135deg, ${themeConfig.colors.primary}10, ${themeConfig.colors.accent}10)`
                      }}
                    ></div>
                  )}
                </button>
              );
            })}
          </div>

          {user && (
            <div
              className="p-2 rounded-2xl border shadow-2xl"
              style={{
                backgroundColor: `${themeConfig.colors.surface}40`,
                backdropFilter: 'blur(24px)',
                borderColor: themeConfig.colors.border
              }}
            >
              <NotificationBell />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;