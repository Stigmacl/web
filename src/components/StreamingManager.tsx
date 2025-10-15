import React, { useState, useEffect } from 'react';
import { Radio, Save, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const StreamingManager: React.FC = () => {
  const [streamUrl, setStreamUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [descriptiveText, setDescriptiveText] = useState('Vuelve pronto para ver contenido en vivo');
  const [offlineUrl, setOfflineUrl] = useState('');
  const [offlineText, setOfflineText] = useState('');
  const [showOffline, setShowOffline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/streaming/get-config.php`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.success && data.config) {
        setStreamUrl(data.config.stream_url || '');
        setIsActive(data.config.is_active || false);
        setDescriptiveText(data.config.descriptive_text || 'Vuelve pronto para ver contenido en vivo');
        setOfflineUrl(data.config.offline_url || '');
        setOfflineText(data.config.offline_text || '');
        setShowOffline(data.config.show_offline || false);
      }
    } catch (error) {
      console.error('Error loading streaming config:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/streaming/update-config.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          stream_url: streamUrl,
          is_active: isActive,
          descriptive_text: descriptiveText,
          offline_url: offlineUrl,
          offline_text: offlineText,
          show_offline: showOffline
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar la configuración' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setIsSaving(false);
    }
  };

  const getPlatformInfo = (url: string) => {
    if (url.includes('twitch.tv')) return { platform: 'Twitch', color: 'purple' };
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { platform: 'YouTube', color: 'red' };
    if (url.includes('kick.com')) return { platform: 'Kick', color: 'green' };
    return { platform: 'Desconocido', color: 'gray' };
  };

  const platformInfo = streamUrl ? getPlatformInfo(streamUrl) : null;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Radio className="w-6 h-6 text-red-400" />
          <h2 className="text-2xl font-bold text-white">Gestión de Streaming en Vivo</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-blue-300 text-sm font-medium mb-2">
              URL del Stream
            </label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://twitch.tv/tu_canal o https://youtube.com/watch?v=..."
              className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-blue-400 text-xs mt-2">
              Soporta Twitch, YouTube y Kick. El sistema detectará automáticamente la plataforma.
            </p>

            {platformInfo && (
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-sm text-blue-300">Plataforma detectada:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  platformInfo.color === 'purple' ? 'bg-purple-500/20 text-purple-300' :
                  platformInfo.color === 'red' ? 'bg-red-500/20 text-red-300' :
                  platformInfo.color === 'green' ? 'bg-green-500/20 text-green-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {platformInfo.platform}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-blue-300 text-sm font-medium mb-2">
              Texto Descriptivo (cuando no hay transmisión activa)
            </label>
            <textarea
              value={descriptiveText}
              onChange={(e) => setDescriptiveText(e.target.value)}
              placeholder="Mensaje personalizado para mostrar cuando no hay transmisión en vivo"
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-blue-400 text-xs mt-2">
              Este texto se mostrará cuando tengas una URL configurada pero el stream no esté activo.
            </p>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-slate-700/40 rounded-xl border border-blue-600/30">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-blue-500/30 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-slate-600"
            />
            <label htmlFor="isActive" className="flex-1 cursor-pointer">
              <div className="text-white font-medium">Activar transmisión en vivo</div>
              <div className="text-blue-400 text-sm">
                Cuando está activo, el reproductor se mostrará en la página de inicio
              </div>
            </label>
            {isActive && (
              <span className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                <span>EN VIVO</span>
              </span>
            )}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-2 border-blue-500/40 rounded-2xl space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Radio className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Videos Offline</h3>
                <p className="text-blue-300 text-sm">Muestra contenido grabado cuando no estés en vivo</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-blue-600/20 rounded-xl border-2 border-blue-500/40">
              <input
                type="checkbox"
                id="showOffline"
                checked={showOffline}
                onChange={(e) => setShowOffline(e.target.checked)}
                className="w-6 h-6 rounded border-blue-500/30 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-slate-600"
              />
              <label htmlFor="showOffline" className="flex-1 cursor-pointer">
                <div className="text-white font-bold text-lg">Activar Contenido Offline</div>
                <div className="text-blue-300 text-sm">
                  Activa esta opción para mostrar videos grabados cuando no estés transmitiendo en vivo
                </div>
              </label>
              {showOffline && (
                <span className="flex items-center space-x-2 px-4 py-2 bg-blue-500/30 text-blue-200 rounded-full text-sm font-bold">
                  <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                  <span>ACTIVO</span>
                </span>
              )}
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-blue-600/30">
              <label className="block text-blue-300 text-sm font-bold mb-2">
                URL del Video/Stream Offline
              </label>
              <input
                type="text"
                value={offlineUrl}
                onChange={(e) => setOfflineUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... o https://twitch.tv/videos/..."
                className="w-full px-4 py-3 bg-slate-700/60 border border-blue-600/40 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-colors"
              />
              <p className="text-blue-400 text-xs mt-2 flex items-start space-x-1">
                <span>💡</span>
                <span>Este video se mostrará cuando actives la opción offline. Soporta YouTube y Twitch VODs.</span>
              </p>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-blue-600/30">
              <label className="block text-blue-300 text-sm font-bold mb-2">
                Texto Descriptivo para Contenido Offline
              </label>
              <textarea
                value={offlineText}
                onChange={(e) => setOfflineText(e.target.value)}
                placeholder="Ej: Revive nuestro último torneo, Mejores momentos de la semana, Highlights del campeonato..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-700/60 border border-blue-600/40 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-colors resize-none"
              />
              <p className="text-blue-400 text-xs mt-2">
                Este texto aparecerá como título del reproductor offline
              </p>
            </div>
          </div>

          {streamUrl && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 text-blue-300 hover:text-blue-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'Ocultar' : 'Ver'} vista previa</span>
            </button>
          )}

          {message && (
            <div className={`flex items-center space-x-2 p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-xl text-white font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </div>
      </div>

      {showPreview && streamUrl && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Vista Previa</h3>
          <div className="bg-black rounded-xl overflow-hidden aspect-video">
            <iframe
              src={streamUrl}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          </div>
          <p className="text-blue-400 text-sm mt-3">
            Así es como se verá el reproductor en la página de inicio
          </p>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <span>📋</span>
          <span>Guía de Uso</span>
        </h3>
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h4 className="text-red-300 font-bold mb-2 flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
              <span>Transmisión en Vivo</span>
            </h4>
            <p className="text-blue-200 text-sm">Activa cuando estés transmitiendo en vivo. Se mostrará con el indicador rojo "EN VIVO" parpadeante. Tiene prioridad sobre el contenido offline.</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-bold mb-2 flex items-center space-x-2">
              <Radio className="w-4 h-4" />
              <span>Videos Offline</span>
            </h4>
            <p className="text-blue-200 text-sm mb-2">Muestra contenido grabado (replays, highlights, torneos) cuando no estés transmitiendo en vivo. Perfecto para mantener a tus visitantes entretenidos.</p>
            <p className="text-blue-300 text-xs italic">✨ Nueva funcionalidad destacada en la sección superior</p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-purple-300 font-bold text-sm mb-1">🎮 Twitch</p>
              <p className="text-blue-200 text-xs">Canal: twitch.tv/usuario<br/>VOD: twitch.tv/videos/123</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 font-bold text-sm mb-1">📺 YouTube</p>
              <p className="text-blue-200 text-xs">youtube.com/watch?v=ID<br/>youtu.be/VIDEO_ID</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-300 font-bold text-sm mb-1">⚡ Kick</p>
              <p className="text-blue-200 text-xs">kick.com/tu_usuario<br/>Streams en vivo</p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-300 text-sm"><strong>⚠️ Importante:</strong> Solo se muestra un reproductor a la vez. Si ambos están activos, el stream en vivo tiene prioridad sobre el contenido offline.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingManager;
