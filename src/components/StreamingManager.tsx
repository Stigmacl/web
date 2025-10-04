import React, { useState, useEffect } from 'react';
import { Radio, Save, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const StreamingManager: React.FC = () => {
  const [streamUrl, setStreamUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [descriptiveText, setDescriptiveText] = useState('Vuelve pronto para ver contenido en vivo');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/streaming/get-config.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.config) {
        setStreamUrl(data.config.stream_url || '');
        setIsActive(data.config.is_active || false);
        setDescriptiveText(data.config.descriptive_text || 'Vuelve pronto para ver contenido en vivo');
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
          descriptive_text: descriptiveText
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

      <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">Instrucciones</h3>
        <ul className="space-y-2 text-blue-300 text-sm">
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>Twitch:</strong> Usa la URL de tu canal (ej: https://twitch.tv/tu_usuario)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>YouTube:</strong> Usa la URL del video en vivo (ej: https://youtube.com/watch?v=VIDEO_ID)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>Kick:</strong> Usa la URL de tu canal (ej: https://kick.com/tu_usuario)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Activa el checkbox solo cuando estés transmitiendo en vivo</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Los visitantes solo verán el reproductor cuando esté activo</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StreamingManager;
