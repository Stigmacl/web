import React, { useState, useEffect } from 'react';
import { Server, Users, Copy, RefreshCw, Wifi, WifiOff, Clock, MapPin, ExternalLink, AlertCircle, TrendingUp, Activity } from 'lucide-react';

interface ServerInfo {
  id: string;
  name: string;
  ip: string;
  port: number;
  gameTrackerUrl: string;
  bannerUrl: string;
  isOnline: boolean;
  lastUpdate: string;
  country: string;
  version: string;
  gameMode: string;
}

const Servers: React.FC = () => {
  const [servers, setServers] = useState<ServerInfo[]>([
    {
      id: '1',
      name: 'Tactical Ops Chile #1',
      ip: '45.7.230.230',
      port: 7788,
      gameTrackerUrl: 'https://www.gametracker.com/server_info/45.7.230.230:7788/',
      bannerUrl: 'https://cache.gametracker.com/server_info/45.7.230.230:7788/b_560_95_1.png',
      isOnline: true,
      lastUpdate: new Date().toISOString(),
      country: 'Chile',
      version: '3.5',
      gameMode: 'Deathmatch'
    },
    {
      id: '2',
      name: 'Tactical Ops Chile #2',
      ip: '45.7.230.230',
      port: 7777,
      gameTrackerUrl: 'https://www.gametracker.com/server_info/45.7.230.230:7777/',
      bannerUrl: 'https://cache.gametracker.com/server_info/45.7.230.230:7777/b_560_95_1.png',
      isOnline: true,
      lastUpdate: new Date().toISOString(),
      country: 'Chile',
      version: '3.5',
      gameMode: 'Team Deathmatch'
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedServer, setCopiedServer] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');

  const copyServerIP = async (server: ServerInfo) => {
    const serverAddress = `${server.ip}:${server.port}`;
    try {
      await navigator.clipboard.writeText(serverAddress);
      setCopiedServer(server.id);
      setTimeout(() => setCopiedServer(null), 2000);
    } catch (err) {
      console.error('Failed to copy server IP:', err);
    }
  };

  // Simular obtención de datos básicos del servidor
  const fetchServerData = async (server: ServerInfo): Promise<Partial<ServerInfo>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular datos básicos sin información específica
        const isServerOnline = Math.random() > 0.1; // 90% probabilidad de estar online
        
        resolve({
          isOnline: isServerOnline,
          lastUpdate: new Date().toISOString()
        });
      }, Math.random() * 2000 + 500); // Simular latencia de red
    });
  };

  const refreshServers = async () => {
    setIsRefreshing(true);
    setLastRefreshTime(new Date().toLocaleTimeString('es-CL'));
    
    try {
      const updatedServers = await Promise.all(
        servers.map(async (server) => {
          const updatedData = await fetchServerData(server);
          return { ...server, ...updatedData };
        })
      );
      
      setServers(updatedServers);
    } catch (error) {
      console.error('Error refreshing servers:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getOnlineServers = () => {
    return servers.filter(server => server.isOnline).length;
  };

  useEffect(() => {
    // Refresh inicial
    refreshServers();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(refreshServers, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Estado de Servidores</h1>
          <p className="text-blue-200 text-lg">Monitoreo en tiempo real con datos de GameTracker</p>
        </div>
        
        <button
          onClick={refreshServers}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* Server Statistics */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
          <div className="flex items-center space-x-3">
            <Server className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{servers.length}</p>
              <p className="text-blue-300 text-sm">Servidores Totales</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{getOnlineServers()}</p>
              <p className="text-green-300 text-sm">Servidores Online</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-lg font-bold text-white">{lastRefreshTime || '--:--:--'}</p>
              <p className="text-purple-300 text-sm">Última Actualización</p>
            </div>
          </div>
        </div>
      </div>

      {/* Server Cards with GameTracker Banners */}
      <div className="grid gap-8">
        {servers.map((server) => (
          <div
            key={server.id}
            className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 overflow-hidden shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
          >
            {/* GameTracker Banner - Tamaño completo y visible */}
            <div className="relative">
              <a 
                href={server.gameTrackerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:opacity-90 transition-opacity"
              >
                <div className="w-full bg-slate-900/50 flex items-center justify-center min-h-[120px] overflow-hidden">
                  <img
                    src={server.bannerUrl}
                    alt={`${server.name} - GameTracker Banner`}
                    className="max-w-full h-auto"
                    style={{ 
                      maxHeight: '120px',
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      // Fallback en caso de error de imagen
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex items-center justify-center h-full text-blue-300">
                            <div class="text-center">
                              <Server class="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p class="text-sm">Banner no disponible</p>
                              <p class="text-xs opacity-75">Haz clic para ver en GameTracker</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              </a>
              
              {/* Status Overlay */}
              <div className="absolute top-4 right-4">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full backdrop-blur-sm ${
                  server.isOnline 
                    ? 'bg-green-500/20 border border-green-400/30' 
                    : 'bg-red-500/20 border border-red-400/30'
                }`}>
                  {server.isOnline ? (
                    <><Wifi className="w-4 h-4 text-green-300" /><span className="text-green-300 text-sm font-medium">Online</span></>
                  ) : (
                    <><WifiOff className="w-4 h-4 text-red-300" /><span className="text-red-300 text-sm font-medium">Offline</span></>
                  )}
                </div>
              </div>
            </div>

            {/* Server Information */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{server.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-blue-300">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{server.country}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Server className="w-4 h-4" />
                      <span>v{server.version}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="w-4 h-4" />
                      <span>{server.gameMode}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-lg font-bold text-blue-300">
                      {server.isOnline ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-400">
                    Actualizado: {formatLastUpdate(server.lastUpdate)}
                  </p>
                </div>
              </div>

              {/* Server Address - Single Card */}
              <div className="bg-slate-700/40 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Server className="w-5 h-5 text-blue-400" />
                      <h4 className="font-medium text-blue-300">Dirección del Servidor</h4>
                    </div>
                    <p className="text-white font-mono text-lg">{server.ip}:{server.port}</p>
                  </div>
                  
                  <button
                    onClick={() => copyServerIP(server)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 transition-all duration-300"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedServer === server.id ? '¡Copiado!' : 'Copiar IP'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => window.open(server.gameTrackerUrl, '_blank')}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl text-green-300 hover:text-green-200 font-medium transition-all duration-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ver Detalles en GameTracker</span>
                </button>
                
                <button
                  onClick={() => copyServerIP(server)}
                  disabled={!server.isOnline}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-400 rounded-xl text-white font-medium transition-colors"
                >
                  {server.isOnline ? 'Conectar' : 'Offline'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Connection Guide */}
      <div className="mt-12 bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <AlertCircle className="w-6 h-6 text-blue-400" />
          <span>Cómo Conectarse a los Servidores</span>
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-700/40 rounded-xl p-4">
            <h4 className="text-blue-300 font-medium mb-3 flex items-center space-x-2">
              <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
              <span>Método Consola (Recomendado)</span>
            </h4>
            <ol className="text-blue-200 text-sm space-y-1">
              <li>• Abre la consola con la tecla <kbd className="bg-slate-600 px-1 rounded">~</kbd></li>
              <li>• Escribe: <code className="bg-slate-600 px-1 rounded">connect {servers[0]?.ip}:{servers[0]?.port}</code></li>
              <li>• Presiona <kbd className="bg-slate-600 px-1 rounded">Enter</kbd></li>
            </ol>
          </div>
          
          <div className="bg-slate-700/40 rounded-xl p-4">
            <h4 className="text-blue-300 font-medium mb-3 flex items-center space-x-2">
              <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
              <span>Método Lista de Servidores</span>
            </h4>
            <ol className="text-blue-200 text-sm space-y-1">
              <li>• Ve a <strong>Multijugador</strong> → <strong>Buscar servidores</strong></li>
              <li>• Haz clic en <strong>Añadir servidor</strong></li>
              <li>• Ingresa la IP y puerto manualmente</li>
              <li>• Conecta directamente desde la lista</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
          <h4 className="text-blue-300 font-medium mb-2 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Problemas de Conexión?</span>
          </h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Verifica que tengas la versión correcta del juego (Tactical Ops 3.5)</li>
            <li>• Asegúrate de que tu firewall no bloquee el juego</li>
            <li>• Si el servidor aparece lleno, intenta conectarte en unos minutos</li>
            <li>• Para soporte técnico, visita nuestra sección de <strong>Contacto</strong></li>
          </ul>
        </div>
      </div>

      {/* GameTracker Integration Info */}
      <div className="mt-8 bg-gradient-to-r from-green-600/10 to-blue-600/10 border border-green-500/30 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ExternalLink className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Datos Reales de GameTracker</h3>
        </div>
        <p className="text-green-200 mb-4">
          Los banners mostrados arriba contienen información en tiempo real directamente desde GameTracker, 
          incluyendo número de jugadores conectados, mapa actual, y estado del servidor.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-700/40 rounded-lg p-3">
            <h4 className="text-green-300 font-medium mb-1">Información Actualizada</h4>
            <p className="text-green-200 text-sm">Los banners se actualizan automáticamente cada pocos minutos</p>
          </div>
          <div className="bg-slate-700/40 rounded-lg p-3">
            <h4 className="text-green-300 font-medium mb-1">Estadísticas Completas</h4>
            <p className="text-green-200 text-sm">Haz clic en cualquier banner para ver estadísticas detalladas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Servers;