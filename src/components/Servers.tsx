import React, { useState, useEffect } from 'react';
import { Server, Users, Map, Clock, Shield, Lock, Unlock, RefreshCw, Copy, AlertCircle, ExternalLink } from 'lucide-react';

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

const Servers: React.FC = () => {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [copied, setCopied] = useState(false);

  const serverIP = '38.225.91.120';
  const serverPort = 7777;

  const fetchServerInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.lcto.cl/server-info?ip=${serverIP}&port=${serverPort}&timeOut=8`
      );

      if (!response.ok) {
        throw new Error('No se pudo obtener la información del servidor');
      }

      const data = await response.json();
      setServerInfo(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerInfo();

    const interval = setInterval(fetchServerInfo, 30000);

    return () => clearInterval(interval);
  }, []);

  const copyServerAddress = async () => {
    try {
      await navigator.clipboard.writeText(`${serverIP}:${serverPort}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getTeamColor = (team: number) => {
    if (team === 0) return 'text-red-400';
    if (team === 1) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getServerStatus = () => {
    if (!serverInfo) return { color: 'bg-gray-500', text: 'Desconocido', ringColor: 'ring-gray-500/30' };
    if (serverInfo.numPlayers > 0) return { color: 'bg-green-500', text: 'Activo', ringColor: 'ring-green-500/30' };
    return { color: 'bg-yellow-500', text: 'Disponible', ringColor: 'ring-yellow-500/30' };
  };

  const status = getServerStatus();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Estado del Servidor</h1>
        <p className="text-blue-200 text-lg">Información en tiempo real del servidor Tactical Ops 3.5 Chile</p>
      </div>

      {loading && !serverInfo ? (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-300 text-lg">Conectando al servidor...</span>
          </div>
        </div>
      ) : error && !serverInfo ? (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-red-700/30 p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-300 mb-2">Error de Conexión</h3>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={fetchServerInfo}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      ) : serverInfo ? (
        <div className="space-y-8">
          <div className={`bg-slate-800/40 backdrop-blur-lg rounded-2xl border-2 ${status.ringColor} border-blue-700/30 overflow-hidden shadow-2xl`}>
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-blue-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Server className="w-12 h-12 text-blue-300" />
                    <div className={`absolute -top-1 -right-1 w-4 h-4 ${status.color} rounded-full border-2 border-slate-800 animate-pulse`}></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{serverInfo.hostname}</h2>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${status.color}/20 border border-${status.color}/30`}>
                        <div className={`w-2 h-2 ${status.color} rounded-full animate-pulse`}></div>
                        <span className="text-sm font-medium text-white">{status.text}</span>
                      </div>
                      <span className="text-sm text-blue-300">Versión {serverInfo.gameVer}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={fetchServerInfo}
                  disabled={loading}
                  className="p-3 hover:bg-blue-500/20 rounded-xl transition-colors disabled:opacity-50"
                  title="Actualizar"
                >
                  <RefreshCw className={`w-6 h-6 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <Users className="w-6 h-6 text-blue-400" />
                    <span className="text-lg font-medium text-blue-300">Jugadores Conectados</span>
                  </div>
                  <p className="text-5xl font-bold text-white mb-3">
                    {serverInfo.numPlayers}<span className="text-2xl text-blue-400">/{serverInfo.maxPlayers}</span>
                  </p>
                  <div className="bg-slate-600/40 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500"
                      style={{ width: `${(serverInfo.numPlayers / serverInfo.maxPlayers) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <Map className="w-6 h-6 text-blue-400" />
                    <span className="text-lg font-medium text-blue-300">Mapa Actual</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{serverInfo.mapTitle}</p>
                  <p className="text-blue-400">{serverInfo.mapName}</p>
                  <div className="mt-3 pt-3 border-t border-blue-700/30">
                    <span className="text-sm text-blue-300">Modo: </span>
                    <span className="text-sm font-medium text-white">{serverInfo.gameType}</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 rounded-xl p-6 border border-red-500/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <Shield className="w-6 h-6 text-red-400" />
                    <span className="text-lg font-medium text-red-300">Terroristas</span>
                  </div>
                  <p className="text-4xl font-bold text-red-400">{serverInfo.scoreTerrorists}</p>
                  <p className="text-sm text-red-300 mt-1">Puntos</p>
                </div>

                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-6 border border-blue-500/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <span className="text-lg font-medium text-blue-300">Fuerzas Especiales</span>
                  </div>
                  <p className="text-4xl font-bold text-blue-400">{serverInfo.scoreSpecialForces}</p>
                  <p className="text-sm text-blue-300 mt-1">Puntos</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/40 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-blue-300">Ronda Actual</span>
                  </div>
                  <p className="text-2xl font-bold text-white">#{serverInfo.roundNumber}</p>
                </div>

                <div className="bg-slate-700/40 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-blue-300">Límite de Tiempo</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{serverInfo.timeLimit} min</p>
                </div>

                <div className="bg-slate-700/40 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-blue-300">Fuego Amigo</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{serverInfo.friendlyFire}</p>
                </div>
              </div>

              {serverInfo.mutators && (
                <div className="bg-slate-700/40 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Server className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Mutadores Activos</span>
                  </div>
                  <p className="text-white">{serverInfo.mutators}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-700/40 rounded-xl p-4">
                  <span className="text-sm text-blue-300">Administrador:</span>
                  <p className="text-white font-medium">{serverInfo.adminName}</p>
                </div>
                <div className="bg-slate-700/40 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    {serverInfo.password === 'False' ? (
                      <>
                        <Unlock className="w-5 h-5 text-green-400" />
                        <span className="text-green-300 font-medium">Servidor Público</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-300 font-medium">Servidor Privado</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl p-6 border border-blue-600/30">
                <div className="text-center">
                  <p className="text-lg text-blue-300 mb-3 font-medium">Dirección del Servidor</p>
                  <div className="flex items-center justify-center space-x-3">
                    <code className="text-2xl text-white font-mono bg-slate-700/60 px-6 py-3 rounded-lg">
                      {serverIP}:{serverPort}
                    </code>
                    <button
                      onClick={copyServerAddress}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center space-x-2"
                    >
                      <Copy className="w-5 h-5" />
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-blue-700/30">
                <div className="text-sm text-blue-400">
                  Última actualización: {lastUpdate.toLocaleTimeString('es-CL')}
                </div>
                <div className="text-xs text-blue-500">
                  Se actualiza automáticamente cada 30 segundos
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8">
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
                  <li>• Escribe: <code className="bg-slate-600 px-2 py-1 rounded text-white block my-2">connect {serverIP}:{serverPort}</code></li>
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
      ) : null}
    </div>
  );
};

export default Servers;
