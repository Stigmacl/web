import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, TrendingUp, Target, RefreshCw, Server, Users, Crosshair, Skull, Award } from 'lucide-react';

interface PlayerRanking {
  rank: number;
  playerName: string;
  serverIp: string;
  serverPort: number;
  totalKills: number;
  totalDeaths: number;
  totalScore: number;
  kdRatio: number;
  gamesPlayed: number;
  lastSeen: string;
}

interface ServerConfig {
  ip: string;
  port: number;
  name: string;
}

const Ranking: React.FC = () => {
  const serverConfigs: ServerConfig[] = [
    { ip: '38.225.91.120', port: 7777, name: 'Servidor Principal' },
    { ip: '38.225.91.120', port: 7755, name: 'Servidor #2' },
    { ip: '38.225.91.120', port: 7788, name: 'Servidor #3' },
    { ip: '38.225.91.120', port: 7744, name: 'Servidor #4' },
  ];

  const [selectedServer, setSelectedServer] = useState<ServerConfig>(serverConfigs[0]);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState<'kd_ratio' | 'total_kills' | 'total_score'>('kd_ratio');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [serverNames, setServerNames] = useState<Map<string, string>>(new Map());

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.lcto.cl/rankings?server_ip=${selectedServer.ip}&server_port=${selectedServer.port}&order_by=${orderBy}&limit=100`
      );

      if (!response.ok) {
        throw new Error('Error fetching rankings');
      }

      const data = await response.json();
      setRankings(data.rankings || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerNames = async () => {
    const names = new Map<string, string>();
    for (const server of serverConfigs) {
      try {
        const response = await fetch(`https://api.lcto.cl/server-info?ip=${server.ip}&port=${server.port}&timeOut=5`);
        if (response.ok) {
          const data = await response.json();
          if (data.hostname) {
            names.set(`${server.ip}:${server.port}`, data.hostname);
          }
        }
      } catch (error) {
        console.error(`Error fetching server name for ${server.ip}:${server.port}`, error);
      }
    }
    setServerNames(names);
  };

  useEffect(() => {
    fetchServerNames();
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [selectedServer, orderBy]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-blue-300';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Star className="w-5 h-5 text-blue-400" />;
  };

  const getKdColor = (kd: number) => {
    if (kd >= 2) return 'text-green-400';
    if (kd >= 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Ranking de Jugadores</h1>
          <p className="text-blue-200 text-lg">Los mejores jugadores de Tactical Ops Chile</p>
        </div>

        <button
          onClick={fetchRankings}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {serverConfigs.map((server) => {
          const serverKey = `${server.ip}:${server.port}`;
          const displayName = serverNames.get(serverKey) || server.name;

          return (
            <button
              key={serverKey}
              onClick={() => setSelectedServer(server)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                selectedServer.ip === server.ip && selectedServer.port === server.port
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-slate-800/40 border-blue-700/30 text-blue-300 hover:bg-blue-600/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-bold">{displayName}</p>
                  <p className="text-xs opacity-70">{server.ip}:{server.port}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center space-x-2 mb-8">
        {[
          { value: 'kd_ratio', label: 'K/D Ratio', icon: Target },
          { value: 'total_kills', label: 'Total Kills', icon: Crosshair },
          { value: 'total_score', label: 'Total Score', icon: Award }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setOrderBy(option.value as typeof orderBy)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              orderBy === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/40 text-blue-300 hover:bg-blue-600/20'
            }`}
          >
            <option.icon className="w-4 h-4" />
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-24 h-24 text-blue-400 mx-auto mb-6 opacity-50" />
          <h2 className="text-3xl font-bold text-white mb-4">Sin Datos de Ranking</h2>
          <p className="text-blue-300 text-lg mb-8 max-w-2xl mx-auto">
            Aún no hay estadísticas registradas para este servidor.
            ¡Sé el primero en aparecer en las tablas de clasificación!
          </p>
        </div>
      ) : (
        <>
          {rankings.slice(0, 3).length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {rankings.slice(0, 3).map((player, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${
                    player.rank === 1
                      ? 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/50'
                      : player.rank === 2
                      ? 'from-gray-600/20 to-gray-800/20 border-gray-400/50'
                      : 'from-amber-600/20 to-amber-800/20 border-amber-600/50'
                  } backdrop-blur-lg rounded-2xl border-2 p-6 text-center`}
                >
                  <div className="mb-4 flex justify-center">
                    {getRankIcon(player.rank)}
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${getRankColor(player.rank)}`}>
                    #{player.rank}
                  </h3>
                  <p className="text-xl text-white font-bold mb-4">{player.playerName}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <p className="text-blue-300 text-xs">K/D Ratio</p>
                      <p className={`font-bold ${getKdColor(player.kdRatio)}`}>
                        {player.kdRatio.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <p className="text-blue-300 text-xs">Kills</p>
                      <p className="text-green-400 font-bold">{player.totalKills}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <p className="text-blue-300 text-xs">Deaths</p>
                      <p className="text-red-400 font-bold">{player.totalDeaths}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <p className="text-blue-300 text-xs">Score</p>
                      <p className="text-blue-400 font-bold">{player.totalScore}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-blue-300">
                    {player.gamesPlayed} partidas jugadas
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 border-b border-blue-700/30">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <span>Tabla de Clasificación</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/40">
                  <tr>
                    <th className="text-left py-3 px-4 text-blue-300 font-medium">Rank</th>
                    <th className="text-left py-3 px-4 text-blue-300 font-medium">Jugador</th>
                    <th className="text-center py-3 px-4 text-blue-300 font-medium">K/D</th>
                    <th className="text-center py-3 px-4 text-blue-300 font-medium">Kills</th>
                    <th className="text-center py-3 px-4 text-blue-300 font-medium">Deaths</th>
                    <th className="text-center py-3 px-4 text-blue-300 font-medium">Score</th>
                    <th className="text-center py-3 px-4 text-blue-300 font-medium">Partidas</th>
                    <th className="text-center py-3 px-4 text-blue-300 font-medium">Última Vez</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((player) => (
                    <tr
                      key={`${player.playerName}-${player.rank}`}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {player.rank <= 3 ? (
                            getRankIcon(player.rank)
                          ) : (
                            <span className={`font-bold ${getRankColor(player.rank)}`}>
                              #{player.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{player.playerName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${getKdColor(player.kdRatio)}`}>
                          {player.kdRatio.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-green-400 font-bold">
                        {player.totalKills}
                      </td>
                      <td className="py-3 px-4 text-center text-red-400 font-bold">
                        {player.totalDeaths}
                      </td>
                      <td className="py-3 px-4 text-center text-blue-400 font-bold">
                        {player.totalScore}
                      </td>
                      <td className="py-3 px-4 text-center text-white">{player.gamesPlayed}</td>
                      <td className="py-3 px-4 text-center text-blue-300 text-sm">
                        {new Date(player.lastSeen).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-blue-400">
            Última actualización: {lastUpdate.toLocaleTimeString('es-CL')}
          </div>
        </>
      )}
    </div>
  );
};

export default Ranking;
