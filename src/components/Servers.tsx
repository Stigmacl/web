import React, { useState, useEffect } from 'react';
import { Server, Users, Map, Clock, Shield, Lock, Unlock, RefreshCw, Copy, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface ServerInfo {
  hostname: string;
  hostport: number;
  gameVer: number;
  mapTitle: string;
  mapName: string;
  maxPlayers: number;
  numPlayers: number;
  gameType: string;
  scoreTerrorists: number;
  scoreSpecialForces: number;
  roundNumber: number;
  lastWinningTeam: number;
  mutators: string;
  timeLimit: number;
  friendlyFire: string;
  tostVersion: string | null;
  adminName: string;
  adminEmail: string;
  password: string;
}

interface Player {
  name: string;
  ping: number;
  score: number;
  team: number;
  frags: number;
  deaths: number;
}

interface ServerConfig {
  ip: string;
  port: number;
  name: string;
}

interface ServerWithStatus extends ServerConfig {
  info: ServerInfo | null;
  players: Player[];
  loading: boolean;
  error: string | null;
}

const Servers: React.FC = () => {
  const [serverConfigs, setServerConfigs] = useState<ServerConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  const [servers, setServers] = useState<ServerWithStatus[]>(
    serverConfigs.map(config => ({
      ...config,
      info: null,
      players: [],
      loading: true,
      error: null
    }))
  );

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [copied, setCopied] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadServerConfigs();
  }, []);

  const loadServerConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const response = await fetch(`${API_BASE_URL}/servers/get-all.php`);
      const data = await response.json();

      if (data.success && Array.isArray(data.servers)) {
        const configs = data.servers.map((s: any) => ({
          ip: s.ip,
          port: s.port,
          name: s.name
        }));
        setServerConfigs(configs);
      }
    } catch (error) {
      console.error('Error loading server configs:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const toggleServerExpand = (serverKey: string) => {
    setExpandedServers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serverKey)) {
        newSet.delete(serverKey);
      } else {
        newSet.add(serverKey);
      }
      return newSet;
    });
  };

  const fetchServerInfo = async (ip: string, port: number): Promise<{ info: ServerInfo | null; error: string | null }> => {
    try {
      const apiUrl = `https://api.lcto.cl/server-info?ip=${ip}&port=${port}&timeOut=8`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error('No se pudo obtener la información del servidor');
      }

      const data = await response.json();
      return { info: data, error: null };
    } catch (err) {
      return { info: null, error: err instanceof Error ? err.message : 'Error desconocido' };
    }
  };

  const fetchPlayers = async (ip: string, port: number): Promise<Player[]> => {
    try {
      const apiUrl = `https://api.lcto.cl/players?ip=${ip}&port=${port}&timeOut=12`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  };

  const fetchAllServers = async () => {
    setIsRefreshing(true);

    const results = await Promise.all(
      serverConfigs.map(async (config) => {
        const [{ info, error }, players] = await Promise.all([
          fetchServerInfo(config.ip, config.port),
          fetchPlayers(config.ip, config.port)
        ]);
        return {
          ...config,
          info,
          players,
          loading: false,
          error
        };
      })
    );

    setServers(results);
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (serverConfigs.length > 0) {
      fetchAllServers();
      const interval = setInterval(fetchAllServers, 30000);
      return () => clearInterval(interval);
    }
  }, [serverConfigs]);

  const copyServerAddress = async (ip: string, port: number) => {
    try {
      await navigator.clipboard.writeText(`${ip}:${port}`);
      setCopied(`${ip}:${port}`);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getServerStatus = (server: ServerWithStatus) => {
    if (!server.info) return { color: 'bg-gray-500', text: 'Desconocido', ringColor: 'ring-gray-500/30' };
    if (server.info.numPlayers > 0) return { color: 'bg-green-500', text: 'Activo', ringColor: 'ring-green-500/30' };
    return { color: 'bg-yellow-500', text: 'Disponible', ringColor: 'ring-yellow-500/30' };
  };

  const getTotalPlayers = () => {
    return servers.reduce((total, server) => total + (server.info?.numPlayers || 0), 0);
  };

  const getOnlineServers = () => {
    return servers.filter(server => server.info !== null).length;
  };

  if (loadingConfigs) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (serverConfigs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Server className="w-24 h-24 text-blue-400 mx-auto mb-6 opacity-50" />
          <h2 className="text-3xl font-bold text-white mb-4">No hay servidores configurados</h2>
          <p className="text-blue-300 text-lg">Contacta al administrador para configurar los servidores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Estado de Servidores</h1>
          <p className="text-blue-200 text-lg">Información en tiempo real de los servidores Tactical Ops 3.5 Chile</p>
        </div>

        <button
          onClick={fetchAllServers}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Actualizando...' : 'Actualizar Todo'}</span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-6">
          <div className="flex items-center space-x-3">
            <Server className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-3xl font-bold text-white">{servers.length}</p>
              <p className="text-blue-300 text-sm">Servidores Totales</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-6">
          <div className="flex items-center space-x-3">
            <Server className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-3xl font-bold text-white">{getOnlineServers()}</p>
              <p className="text-green-300 text-sm">Servidores Online</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-3xl font-bold text-white">{getTotalPlayers()}</p>
              <p className="text-purple-300 text-sm">Jugadores Totales</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {servers.map((server, index) => {
          const status = getServerStatus(server);
          const serverKey = `${server.ip}:${server.port}`;
          const isExpanded = expandedServers.has(serverKey);

          return (
            <div
              key={serverKey}
              className={`bg-slate-800/40 backdrop-blur-lg rounded-2xl border-2 ${status.ringColor} overflow-hidden shadow-2xl transition-all duration-300`}
            >
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-blue-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Server className="w-10 h-10 text-blue-300" />
                      <div className={`absolute -top-1 -right-1 w-4 h-4 ${status.color} rounded-full border-2 border-slate-800 animate-pulse`}></div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {server.info?.hostname || server.name}
                      </h2>
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${status.color}/20 border border-${status.color}/30`}>
                          <div className={`w-2 h-2 ${status.color} rounded-full animate-pulse`}></div>
                          <span className="text-sm font-medium text-white">{status.text}</span>
                        </div>
                        {server.info && (
                          <span className="text-sm text-blue-300">Versión {server.info.gameVer}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {!server.loading && !server.error && server.info && (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-700/60 rounded-xl p-4 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Server className="w-5 h-5 text-blue-400" />
                          <span className="text-sm text-blue-300 font-medium">Dirección</span>
                        </div>
                      </div>
                      <code className="text-lg text-white font-mono bg-slate-800/60 px-3 py-2 rounded block">
                        {server.ip}:{server.port}
                      </code>
                    </div>

                    <div className="bg-slate-700/60 rounded-xl p-4 border border-purple-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <Map className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-purple-300 font-medium">Mapa Actual</span>
                      </div>
                      <p className="text-lg font-bold text-white truncate">{server.info.mapTitle}</p>
                      <p className="text-xs text-purple-300 truncate">{server.info.mapName}</p>
                    </div>

                    <div className="bg-slate-700/60 rounded-xl p-4 border border-green-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-green-300 font-medium">Jugadores</span>
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {server.info.numPlayers}<span className="text-lg text-green-400">/{server.info.maxPlayers}</span>
                      </p>
                      <div className="mt-2 bg-slate-600/40 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all duration-500"
                          style={{ width: `${(server.info.numPlayers / server.info.maxPlayers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {server.loading ? (
                <div className="p-8">
                  <div className="flex items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-300 ml-3">Cargando información...</span>
                  </div>
                </div>
              ) : server.error ? (
                <div className="p-8">
                  <div className="flex items-center justify-center text-red-400">
                    <AlertCircle className="w-6 h-6 mr-2" />
                    <span>{server.error}</span>
                  </div>
                </div>
              ) : server.info ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => toggleServerExpand(serverKey)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-300 hover:text-blue-200 transition-all duration-300"
                    >
                      <Info className="w-4 h-4" />
                      <span>{isExpanded ? 'Ocultar Detalles' : 'Más Información'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => copyServerAddress(server.ip, server.port)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl text-green-300 hover:text-green-200 transition-all duration-300"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copied === serverKey ? 'Copiado!' : 'Copiar IP'}</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <Info className="w-5 h-5 text-blue-400" />
                        <span>Información Detallada</span>
                      </h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 rounded-xl p-4 border border-red-500/30">
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-300 font-medium">Terroristas</span>
                          </div>
                          <p className="text-3xl font-bold text-red-400">{server.info.scoreTerrorists}</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-4 border border-blue-500/30">
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-blue-300 font-medium">Fuerzas Especiales</span>
                          </div>
                          <p className="text-3xl font-bold text-blue-400">{server.info.scoreSpecialForces}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="bg-slate-700/40 rounded-lg p-3 border border-blue-600/30">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-blue-300 font-medium">Ronda</span>
                          </div>
                          <p className="text-xl font-bold text-white">#{server.info.roundNumber}</p>
                        </div>

                        <div className="bg-slate-700/40 rounded-lg p-3 border border-blue-600/30">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-blue-300 font-medium">Límite</span>
                          </div>
                          <p className="text-xl font-bold text-white">{server.info.timeLimit} min</p>
                        </div>

                        <div className="bg-slate-700/40 rounded-lg p-3 border border-blue-600/30">
                          <div className="flex items-center space-x-2 mb-1">
                            {server.info.password === 'False' ? (
                              <Unlock className="w-4 h-4 text-green-400" />
                            ) : (
                              <Lock className="w-4 h-4 text-yellow-400" />
                            )}
                            <span className="text-xs text-blue-300 font-medium">Acceso</span>
                          </div>
                          <p className="text-sm font-bold text-white">
                            {server.info.password === 'False' ? 'Público' : 'Privado'}
                          </p>
                        </div>
                      </div>

                      {server.players.length > 0 && (
                        <div className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/30">
                          <div className="flex items-center space-x-2 mb-3">
                            <Users className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-bold text-white">Jugadores Conectados</h3>
                            <span className="text-sm text-blue-300">({server.players.length})</span>
                          </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-blue-600/30">
                              <th className="text-left py-2 px-3 text-blue-300 font-medium">Jugador</th>
                              <th className="text-center py-2 px-3 text-blue-300 font-medium">Equipo</th>
                              <th className="text-center py-2 px-3 text-blue-300 font-medium">Puntos</th>
                              <th className="text-center py-2 px-3 text-blue-300 font-medium">Frags</th>
                              <th className="text-center py-2 px-3 text-blue-300 font-medium">Muertes</th>
                              <th className="text-center py-2 px-3 text-blue-300 font-medium">K/D</th>
                              <th className="text-center py-2 px-3 text-blue-300 font-medium">Ping</th>
                            </tr>
                          </thead>
                          <tbody>
                            {server.players.map((player, idx) => {
                              const kd = player.deaths > 0 ? (player.frags / player.deaths).toFixed(2) : player.frags.toFixed(2);
                              return (
                                <tr key={idx} className="border-b border-slate-600/30 hover:bg-slate-600/20">
                                  <td className="py-2 px-3 text-white font-medium">{player.name}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                      player.team === 0 ? 'bg-red-600/20 text-red-300 border border-red-500/30' :
                                      player.team === 1 ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' :
                                      'bg-gray-600/20 text-gray-300 border border-gray-500/30'
                                    }`}>
                                      {player.team === 0 ? 'Terroristas' : player.team === 1 ? 'Fuerzas Especiales' : 'Espectador'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center text-white font-bold">{player.score}</td>
                                  <td className="py-2 px-3 text-center text-green-400 font-bold">{player.frags}</td>
                                  <td className="py-2 px-3 text-center text-red-400 font-bold">{player.deaths}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={`font-bold ${
                                      parseFloat(kd) >= 2 ? 'text-green-400' :
                                      parseFloat(kd) >= 1 ? 'text-yellow-400' :
                                      'text-red-400'
                                    }`}>
                                      {kd}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={`font-medium ${
                                      player.ping < 50 ? 'text-green-400' :
                                      player.ping < 100 ? 'text-yellow-400' :
                                      'text-red-400'
                                    }`}>
                                      {player.ping}ms
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-sm text-blue-400">
        Última actualización: {lastUpdate.toLocaleTimeString('es-CL')} - Se actualiza automáticamente cada 30 segundos
      </div>

      <div className="mt-8 bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <AlertCircle className="w-6 h-6 text-blue-400" />
          <span>Cómo Conectarse</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-700/40 rounded-xl p-6">
            <h4 className="text-blue-300 font-medium mb-4 flex items-center space-x-2">
              <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">1</span>
              <span>Método Consola (Recomendado)</span>
            </h4>
            <ol className="text-blue-200 space-y-2">
              <li>• Abre la consola con la tecla <kbd className="bg-slate-600 px-2 py-1 rounded text-white">~</kbd></li>
              <li>• Escribe: <code className="bg-slate-600 px-2 py-1 rounded text-white">connect IP:PUERTO</code></li>
              <li>• Presiona <kbd className="bg-slate-600 px-2 py-1 rounded text-white">Enter</kbd></li>
            </ol>
          </div>

          <div className="bg-slate-700/40 rounded-xl p-6">
            <h4 className="text-blue-300 font-medium mb-4 flex items-center space-x-2">
              <span className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">2</span>
              <span>Método Lista de Servidores</span>
            </h4>
            <ol className="text-blue-200 space-y-2">
              <li>• Ve a <strong>Multijugador</strong> → <strong>Buscar servidores</strong></li>
              <li>• Haz clic en <strong>Añadir servidor</strong></li>
              <li>• Ingresa la IP y puerto manualmente</li>
              <li>• Conecta directamente desde la lista</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 p-6 bg-blue-600/10 border border-blue-500/30 rounded-xl">
          <h4 className="text-blue-300 font-medium mb-3 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Problemas de Conexión?</span>
          </h4>
          <ul className="text-blue-200 space-y-2">
            <li>• Verifica que tengas la versión correcta del juego (Tactical Ops 3.5)</li>
            <li>• Asegúrate de que tu firewall no bloquee el juego</li>
            <li>• Si el servidor aparece lleno, intenta conectarte en unos minutos</li>
            <li>• Para soporte técnico, visita nuestra sección de <strong>Contacto</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Servers;
