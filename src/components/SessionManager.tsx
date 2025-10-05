import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SessionManager: React.FC = () => {
  const { user, sessionInfo, extendSession, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user || !sessionInfo.isActive) return;

    const interval = setInterval(() => {
      const remaining = sessionInfo.expiresAt - Date.now();
      setTimeLeft(Math.max(0, remaining));

      // Mostrar advertencia si quedan menos de 5 minutos
      const shouldShowWarning = remaining <= 5 * 60 * 1000 && remaining > 0;
      setShowWarning(shouldShowWarning);

      // Auto-cerrar sesión si expiró
      if (remaining <= 0) {
        logout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, sessionInfo, logout]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    const success = await extendSession();
    
    if (success) {
      setShowSuccess(true);
      setShowWarning(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    
    setIsExtending(false);
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!user || !sessionInfo.isActive) return null;

  return (
    <>
      {/* Indicador de sesión en la esquina */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl border border-blue-700/30 p-3 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Clock className={`w-4 h-4 ${timeLeft <= 5 * 60 * 1000 ? 'text-red-400' : 'text-blue-400'}`} />
              <span className={`text-sm font-medium ${timeLeft <= 5 * 60 * 1000 ? 'text-red-300' : 'text-blue-300'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            
            <button
              onClick={handleExtendSession}
              disabled={isExtending}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 text-xs font-medium transition-all duration-300 disabled:opacity-50"
              title="Extender sesión por 20 minutos más"
            >
              {isExtending ? (
                <div className="w-3 h-3 border border-blue-300 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              <span>Extender</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advertencia de expiración */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-red-500/30 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-lg font-bold text-white">⚠️ Sesión por Expirar</h3>
                <p className="text-red-300 text-sm">Tu sesión expirará pronto</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-red-300 font-medium">Tiempo restante:</span>
                  <span className="text-red-200 font-bold text-lg">{formatTime(timeLeft)}</span>
                </div>
              </div>
              
              <p className="text-blue-200 text-sm">
                ¿Quieres extender tu sesión por 20 minutos más?
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleExtendSession}
                disabled={isExtending}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
              >
                {isExtending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Extendiendo...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Sí, Extender</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowWarning(false)}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación de éxito */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50">
          <div className="bg-green-600/90 backdrop-blur-lg rounded-xl border border-green-500/30 p-4 shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-200" />
              <div>
                <p className="text-green-100 font-medium">✅ Sesión Extendida</p>
                <p className="text-green-200 text-sm">20 minutos adicionales</p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="p-1 hover:bg-green-500/20 rounded text-green-200 hover:text-green-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionManager;