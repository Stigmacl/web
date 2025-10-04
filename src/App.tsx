import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import DynamicBanner from './components/DynamicBanner';
import Home from './components/Home';
import Players from './components/Players';
import Contact from './components/Contact';
import UserPanel from './components/UserPanel';
import Forum from './components/Forum';
import Sponsors from './components/Sponsors';
import Servers from './components/Servers';
import SessionManager from './components/SessionManager';
import ThemeSelector from './components/ThemeSelector';
import PasswordReset from './components/PasswordReset';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { BannerProvider, useBanner } from './contexts/BannerContext';

export type Section = 'home' | 'players' | 'servers' | 'download' | 'user-panel' | 'forum' | 'sponsors';

function AppContent() {
  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const { themeConfig } = useTheme();
  const { bannerItems, isEnabled } = useBanner();

  useEffect(() => {
    // Check if we're on password reset page
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
      setShowPasswordReset(true);
      setIsLoading(false);
      return;
    }
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
      case 'players':
        return <Players />;
      case 'servers':
        return <Servers />;
      case 'download':
        return <Contact />;
      case 'user-panel':
        return <UserPanel />;
      case 'forum':
        return <Forum />;
      case 'sponsors':
        return <Sponsors />;
      default:
        return <Home />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black"></div>

        <div className="smoke-container absolute inset-0 opacity-30">
          <div className="smoke smoke-1"></div>
          <div className="smoke smoke-2"></div>
          <div className="smoke smoke-3"></div>
          <div className="smoke smoke-4"></div>
        </div>

        <div className="particles absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        <div className="text-center relative z-10">
          <div className="mb-8 logo-pulse px-4">
            <img
              src="/Tactical_Ops_Logo.png"
              alt="Tactical Ops Logo"
              className="w-full max-w-5xl mx-auto drop-shadow-2xl"
            />
          </div>

          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
          </div>

          <p className="text-lg font-bold text-white tracking-wider loading-text">
            CARGANDO TACTICAL OPS
          </p>

          <div className="mt-6 w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-red-600 via-blue-600 to-red-600 animate-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showPasswordReset) {
    return <PasswordReset />;
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background} relative overflow-hidden`}
      style={{ color: themeConfig.colors.text }}
    >
      {/* Pattern overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>

      {/* Metallic Orange Effects */}
      {themeConfig.id === 'metallic-orange' && (
        <>
          {/* Tactical Grid Background */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="tactical-grid"></div>
          </div>

          {/* Tactical Smoke */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="cod-smoke cod-smoke-1"></div>
            <div className="cod-smoke cod-smoke-2"></div>
            <div className="cod-smoke cod-smoke-3"></div>
            <div className="cod-smoke cod-smoke-4"></div>
          </div>

          {/* Muzzle Flashes */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="muzzle-flash muzzle-flash-1"></div>
            <div className="muzzle-flash muzzle-flash-2"></div>
            <div className="muzzle-flash muzzle-flash-3"></div>
          </div>

          {/* Scan Lines */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="scan-line scan-line-1"></div>
            <div className="scan-line scan-line-2"></div>
          </div>

          {/* Bullet Tracers */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bullet-tracer"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 6}s`,
                  animationDuration: `${4 + Math.random() * 6}s`
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Banner dinámico */}
      {isEnabled && bannerItems.length > 0 && (
        <div className="relative z-40">
          <DynamicBanner bannerItems={bannerItems} />
        </div>
      )}

      {/* Navigation debajo del banner */}
      <div className={isEnabled && bannerItems.length > 0 ? 'mt-0' : ''}>
        <Navigation currentSection={currentSection} onSectionChange={setCurrentSection} />
      </div>
      <SessionManager />
      <ThemeSelector />

      <main className={`relative z-10 ${isEnabled && bannerItems.length > 0 ? 'pt-44' : 'pt-24'}`}>
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