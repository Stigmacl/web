import React, { useState, useEffect } from 'react';
import { Server, Users, Map, Clock, Shield, Lock, Unlock, RefreshCw } from 'lucide-react';

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

const ServerStatus: React.FC = () => {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchServerInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        'https://api.lcto.cl/server-info?ip=38.225.91.120&port=7777&timeOut=8'
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

  const getTeamColor = (team: number) => {
    if (team === 0) return 'text-red-400';
    if (team === 1) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getServerStatus = () => {
    if (!serverInfo) return { color: 'bg-gray-500', text: 'Desconocido' };
    if (serverInfo.numPlayers > 0) return { color: 'bg-green-500', text: 'Activo' };
    return { color: 'bg-yellow-500', text: 'Disponible' };
  };

  if (loading && !serverInfo) {
    return (
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-300">Conectando al servidor...</span>
        </div>
      </div>
    );
  }

  if (error && !serverInfo) {
    return (
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-red-700/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-300">Estado del Servidor</h3>
          <button
            onClick={fetchServerInfo}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Reintentar"
          >
            <RefreshCw className="w-4 h-4 text-red-400" />
          </button>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!serverInfo) return null;

  const status = getServerStatus();

  return (
    <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 border-b border-blue-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Server className="w-6 h-6 text-blue-300" />
              <div className={`absolute -top-1 -right-1 w-3 h-3 ${status.color} rounded-full border-2 border-slate-800 animate-pulse`}></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Estado del Servidor</h3>
              <p className="text-xs text-blue-300">{serverInfo.hostname}</p>
            </div>
          </div>
          <button
            onClick={fetchServerInfo}
            disabled={loading}
            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700/40 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Jugadores</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {serverInfo.numPlayers}/{serverInfo.maxPlayers}
            </p>
            <div className="mt-2 bg-slate-600/40 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                style={{ width: `${(serverInfo.numPlayers / serverInfo.maxPlayers) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-700/40 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 ${status.color} rounded-full animate-pulse`}></div>
              <span className="text-sm text-blue-300">Estado</span>
            </div>
            <p className="text-xl font-bold text-white">{status.text}</p>
            <p className="text-xs text-blue-400 mt-1">v{serverInfo.gameVer}</p>
          </div>
        </div>

        <div className="bg-slate-700/40 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Map className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Mapa Actual</span>
          </div>
          <p className="text-lg font-bold text-white">{serverInfo.mapTitle}</p>
          <p className="text-sm text-blue-400">{serverInfo.mapName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/40 rounded-xl p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-xs text-blue-300">Terroristas</span>
            </div>
            <p className={`text-xl font-bold ${getTeamColor(0)}`}>
              {serverInfo.scoreTerrorists}
            </p>
          </div>

          <div className="bg-slate-700/40 rounded-xl p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-300">Fuerzas Especiales</span>
            </div>
            <p className={`text-xl font-bold ${getTeamColor(1)}`}>
              {serverInfo.scoreSpecialForces}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/40 rounded-xl p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-300">Ronda</span>
            </div>
            <p className="text-lg font-bold text-white">#{serverInfo.roundNumber}</p>
          </div>

          <div className="bg-slate-700/40 rounded-xl p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-300">Límite</span>
            </div>
            <p className="text-lg font-bold text-white">{serverInfo.timeLimit} min</p>
          </div>
        </div>

        <div className="bg-slate-700/40 rounded-xl p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-300">Tipo de Juego:</span>
              <p className="text-white font-medium">{serverInfo.gameType}</p>
            </div>
            <div>
              <span className="text-blue-300">Fuego Amigo:</span>
              <p className="text-white font-medium">{serverInfo.friendlyFire}</p>
            </div>
          </div>
        </div>

        {serverInfo.mutators && (
          <div className="bg-slate-700/40 rounded-xl p-3">
            <span className="text-xs text-blue-300">Mutadores:</span>
            <p className="text-sm text-white mt-1">{serverInfo.mutators}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-blue-700/30">
          <div className="flex items-center space-x-2">
            {serverInfo.password === 'False' ? (
              <>
                <Unlock className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-300">Servidor Público</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-300">Servidor Privado</span>
              </>
            )}
          </div>
          <div className="text-xs text-blue-400">
            Actualizado: {lastUpdate.toLocaleTimeString('es-CL')}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl p-4 border border-blue-600/30">
          <div className="text-center">
            <p className="text-sm text-blue-300 mb-2">Conéctate al servidor</p>
            <code className="text-white font-mono bg-slate-700/60 px-3 py-2 rounded-lg inline-block text-sm">
              38.225.91.120:{serverInfo.hostport}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerStatus;
