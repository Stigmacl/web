import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import DynamicBanner from './components/DynamicBanner';
import Home from './components/Home';
import Servers from './components/Servers';
import Ranking from './components/Ranking';
import Players from './components/Players';
import Contact from './components/Contact';
import UserPanel from './components/UserPanel';
import Forum from './components/Forum';
import SessionManager from './components/SessionManager';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { BannerProvider, useBanner } from './contexts/BannerContext';

export type Section = 'home' | 'servers' | 'ranking' | 'players' | 'contact' | 'user-panel' | 'forum';

function AppContent() {
  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [isLoading, setIsLoading] = useState(true);
  const { themeConfig } = useTheme();
  const { bannerItems, isEnabled } = useBanner();

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for navigation events from components
  useEffect(() => {
    const handleNavigationEvent = (event: CustomEvent) => {
      setCurrentSection(event.detail as Section);
    };

    window.addEventListener('navigate-to-section', handleNavigationEvent as EventListener);
    
    return () => {
      window.removeEventListener('navigate-to-section', handleNavigationEvent as EventListener);
    };
  }, []);

  const renderSection = () => {
    switch (currentSection) {
      case 'home':
        return <Home />;
      case 'servers':
        return <Servers />;
      case 'ranking':
        return <Ranking />;
      case 'players':
        return <Players />;
      case 'contact':
        return <Contact />;
      case 'user-panel':
        return <UserPanel />;
      case 'forum':
        return <Forum />;
      default:
        return <Home />;
    }
  };

  if (isLoading) {
    return (
      <div 
        className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background} flex items-center justify-center`}
      >
        <div className="text-center">
          <div 
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${themeConfig.colors.primary} transparent transparent transparent` }}
          ></div>
          <p 
            className="text-lg font-medium"
            style={{ color: themeConfig.colors.textSecondary }}
          >
            Cargando Tactical Ops ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background}`}
      style={{ color: themeConfig.colors.text }}
    >
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
      
      {/* Banner dinámico */}
      {isEnabled && bannerItems.length > 0 && (
        <div className="relative z-10">
          <DynamicBanner bannerItems={bannerItems} />
        </div>
      )}
      
      <Navigation currentSection={currentSection} onSectionChange={setCurrentSection} />
      <SessionManager />
      
      <main className={`relative z-10 ${isEnabled && bannerItems.length > 0 ? 'pt-20' : 'pt-24'}`}>
        {renderSection()}
      </main>
      
      <footer 
        className="relative z-10 mt-20 py-8 border-t"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="container mx-auto px-4 text-center">
          <p style={{ color: `${themeConfig.colors.textSecondary}70` }}>
            © 2025 Tactical Ops Chile - Comunidad oficial
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BannerProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BannerProvider>
    </ThemeProvider>
  );
}

export default App;