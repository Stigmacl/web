import React, { useState, useEffect } from 'react';
import { User, Shield, Star, Trophy, Clock, MapPin, Calendar, ArrowLeft, Eye, EyeOff, Award, Crown, Server, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserWall from './UserWall';
import { API_BASE_URL } from '../config/api';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onBack }) => {
  const { users, user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const foundUser = users.find(u => u.id === userId);
    setProfileUser(foundUser);
    setIsLoading(false);
  }, [userId, users]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastLogin = (lastLogin: string | undefined) => {
    if (!lastLogin) return 'Nunca';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return date.toLocaleDateString('es-CL');
  };

  const getStatusColor = (isOnline: boolean, isActive: boolean) => {
    if (!isActive) return 'bg-red-500 shadow-lg shadow-red-500/30';
    if (isOnline) return 'bg-green-500 shadow-lg shadow-green-500/30';
    return 'bg-gray-500';
  };

  const getStatusText = (isOnline: boolean, isActive: boolean) => {
    if (!isActive) return 'Suspendido';
    if (isOnline) return 'En línea';
    return 'Desconectado';
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? (
      <Shield className="w-4 h-4 text-yellow-400" />
    ) : (
      <Star className="w-4 h-4 text-blue-400" />
    );
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
      : 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  const [playerStats, setPlayerStats] = useState<any>(null);
  const [playerTitles, setPlayerTitles] = useState<any[]>([]);
  const [rankingStats, setRankingStats] = useState<any>(null);

  useEffect(() => {
    if (profileUser) {
      loadPlayerStats();
      loadPlayerTitles();
      loadRankingStats();
    }
  }, [profileUser]);

  const loadPlayerStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/get-all.php`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.success) {
        // Comparar user_id como strings para evitar problemas de tipo
        const userStats = data.stats.find((s: any) => String(s.user_id) === String(userId));
        if (userStats) {
          setPlayerStats(userStats);
        }
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  const loadRankingStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/get-player-stats.php?user_id=${userId}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.success && data.hasPlayerName && data.stats) {
        setRankingStats(data);
      }
    } catch (error) {
      console.error('Error loading ranking stats:', error);
    }
  };

  const loadPlayerTitles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/get-all.php`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.success) {
        // Comparar user_id como strings para evitar problemas de tipo
        const userTitles = data.titles.filter((t: any) => String(t.user_id) === String(userId));
        setPlayerTitles(userTitles || []);
      }
    } catch (error) {
      console.error('Error loading player titles:', error);
    }
  };

  // Usar estadísticas del ranking si están disponibles, sino usar player_stats
  const stats = rankingStats?.stats ? [
    { label: 'Total Kills', value: rankingStats.stats.total_kills || 0, icon: Trophy, color: 'text-yellow-400' },
    { label: 'Total Muertes', value: rankingStats.stats.total_deaths || 0, icon: Shield, color: 'text-red-400' },
    { label: 'K/D Ratio', value: rankingStats.stats.kd_ratio || 0, icon: Star, color: 'text-blue-400' }
  ] : [
    { label: 'Mejor Racha', value: playerStats?.best_streak || 0, icon: Star, color: 'text-yellow-400' },
    { label: 'Total Kills', value: playerStats?.total_kills || 0, icon: Trophy, color: 'text-blue-400' },
    { label: 'Total Muertes', value: playerStats?.total_deaths || 0, icon: Shield, color: 'text-red-400' }
  ];

  const achievements = [
    { name: 'Primera Conexión', description: 'Se ha registrado en la comunidad', unlocked: true },
    { name: 'Primera Victoria', description: 'Ganar la primera partida', unlocked: false },
    { name: 'Francotirador', description: 'Conseguir 50 eliminaciones con sniper', unlocked: false },
    { name: 'Veterano', description: 'Jugar 100 partidas', unlocked: false },
    { name: 'Leyenda', description: 'Alcanzar el top 10 del ranking', unlocked: false }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 mb-6 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
        
        <div className="text-center py-20">
          <User className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-2">Usuario no encontrado</h2>
          <p className="text-blue-300">El perfil que buscas no existe o no está disponible</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 mb-6 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Jugadores</span>
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <img
                  src={profileUser.avatar || '/Logo-Comunidad.png'}
                  alt={profileUser.username}
                  className={`w-24 h-24 rounded-full border-4 mx-auto object-cover ${
                    profileUser.isActive ? 'border-blue-500/30' : 'border-red-500/30'
                  }`}
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getStatusColor(profileUser.isOnline, profileUser.isActive)} border-2 border-slate-800`}></div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mt-4">{profileUser.username}</h2>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <p className="text-blue-300">
                  {profileUser.hideEmail ? '••••••@••••••.com' : profileUser.email}
                </p>
                {profileUser.hideEmail && (
                  <EyeOff className="w-4 h-4 text-blue-400" title="Email oculto" />
                )}
              </div>
              
              {profileUser.clan && (
                <div className="mt-2">
                  <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm font-medium">
                    [{profileUser.clan}]
                  </span>
                </div>
              )}

              {profileUser.playerName && (
                <div className="mt-2">
                  <span className="px-3 py-1 bg-green-600/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30">
                    {profileUser.playerName}
                  </span>
                  <p className="text-xs text-blue-400 mt-1">Nombre de Jugador</p>
                </div>
              )}
              
              <div className="mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center justify-center space-x-1 ${getRoleBadgeColor(profileUser.role)}`}>
                  {getRoleIcon(profileUser.role)}
                  <span>{profileUser.role === 'admin' ? 'Administrador' : 'Jugador'}</span>
                </span>
              </div>

              <div className="mt-4 p-3 bg-slate-700/40 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <span className={`font-medium ${
                    !profileUser.isActive ? 'text-red-300' :
                    profileUser.isOnline ? 'text-green-300' : 'text-gray-300'
                  }`}>
                    {getStatusText(profileUser.isOnline, profileUser.isActive)}
                  </span>
                </div>
              </div>

              {profileUser.status && (
                <div className="mt-4 p-3 bg-slate-700/40 rounded-lg">
                  <p className="text-blue-200 italic text-sm">"{profileUser.status}"</p>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-400">Último acceso:</span>
                <span className="text-white">{formatLastLogin(profileUser.lastLogin)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-400">Miembro desde:</span>
                <span className="text-white">{formatDate(profileUser.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-400">Ubicación:</span>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span className="text-white">Chile</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* User Wall */}
          <UserWall userId={userId} isOwnProfile={isOwnProfile} />

          {/* Statistics */}
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Estadísticas de Juego</h3>

            <div className="grid md:grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-slate-700/40 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                      <div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-blue-300 text-sm">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ranking Statistics */}
          {rankingStats && rankingStats.stats && (
            <>
              {/* Estadísticas por Servidor */}
              {rankingStats.serverStats && rankingStats.serverStats.length > 0 && (
                <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Server className="w-6 h-6 text-blue-400" />
                      <span>Estadísticas por Servidor</span>
                    </h3>
                  </div>

                  <div className="mb-4 p-3 bg-slate-700/40 rounded-lg">
                    <p className="text-sm text-blue-400 mb-1">Nombre de Jugador</p>
                    <p className="text-lg font-bold text-white">{rankingStats.playerName}</p>
                  </div>

                  <div className="space-y-4">
                    {rankingStats.serverStats.map((serverStat: any, index: number) => (
                      <div key={index} className="bg-slate-700/30 rounded-xl border border-blue-600/20 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-bold text-blue-300 flex items-center space-x-2">
                            <Server className="w-5 h-5" />
                            <span>Servidor {serverStat.server_id}</span>
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          <div className="bg-slate-800/40 rounded-lg p-3">
                            <div className="flex flex-col">
                              <Trophy className="w-6 h-6 text-yellow-400 mb-1" />
                              <p className="text-xl font-bold text-white">{serverStat.total_kills || 0}</p>
                              <p className="text-blue-300 text-xs">Kills</p>
                            </div>
                          </div>

                          <div className="bg-slate-800/40 rounded-lg p-3">
                            <div className="flex flex-col">
                              <Shield className="w-6 h-6 text-red-400 mb-1" />
                              <p className="text-xl font-bold text-white">{serverStat.total_deaths || 0}</p>
                              <p className="text-blue-300 text-xs">Deaths</p>
                            </div>
                          </div>

                          <div className="bg-slate-800/40 rounded-lg p-3">
                            <div className="flex flex-col">
                              <Star className="w-6 h-6 text-blue-400 mb-1" />
                              <p className="text-xl font-bold text-white">{serverStat.kd_ratio || 0}</p>
                              <p className="text-blue-300 text-xs">K/D</p>
                            </div>
                          </div>

                          <div className="bg-slate-800/40 rounded-lg p-3">
                            <div className="flex flex-col">
                              <Award className="w-6 h-6 text-green-400 mb-1" />
                              <p className="text-xl font-bold text-white">{serverStat.total_score || 0}</p>
                              <p className="text-blue-300 text-xs">Score</p>
                            </div>
                          </div>

                          <div className="bg-slate-800/40 rounded-lg p-3">
                            <div className="flex flex-col">
                              <Clock className="w-6 h-6 text-purple-400 mb-1" />
                              <p className="text-xl font-bold text-white">{serverStat.games_played || 0}</p>
                              <p className="text-blue-300 text-xs">Partidas</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estadísticas Totales del Ranking */}
              <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-yellow-700/30 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                    <span>Estadísticas Totales del Ranking</span>
                  </h3>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30">
                    <Crown className="w-4 h-4" />
                    <span className="font-bold">Rank #{rankingStats.stats.rank}</span>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-400 mb-1">Suma de todos los servidores</p>
                  <p className="text-xs text-yellow-500">Estas estadísticas combinan tu desempeño en todos los servidores</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-700/40 rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-8 h-8 text-yellow-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{rankingStats.stats.total_kills || 0}</p>
                        <p className="text-yellow-300 text-sm font-medium">Total Kills</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/40 rounded-xl p-4 border border-red-500/20">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-8 h-8 text-red-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{rankingStats.stats.total_deaths || 0}</p>
                        <p className="text-red-300 text-sm font-medium">Total Deaths</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/40 rounded-xl p-4 border border-blue-500/20">
                    <div className="flex items-center space-x-3">
                      <Star className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{rankingStats.stats.kd_ratio || 0}</p>
                        <p className="text-blue-300 text-sm font-medium">K/D Ratio</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/40 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center space-x-3">
                      <Award className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{rankingStats.stats.total_score || 0}</p>
                        <p className="text-green-300 text-sm font-medium">Total Score</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/40 rounded-xl p-4 border border-purple-500/20">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-8 h-8 text-purple-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{rankingStats.stats.games_played || 0}</p>
                        <p className="text-purple-300 text-sm font-medium">Partidas Jugadas</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/40 rounded-xl p-4 border border-cyan-500/20">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-8 h-8 text-cyan-400" />
                      <div>
                        <p className="text-sm font-bold text-white">{formatLastLogin(rankingStats.stats.last_seen)}</p>
                        <p className="text-cyan-300 text-sm font-medium">Última Partida</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Títulos y Logros */}
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Award className="w-6 h-6 text-yellow-400" />
                <span>Títulos y Logros</span>
              </h3>
              {playerStats?.is_champion && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-300 font-bold">CAMPEÓN</span>
                </div>
              )}
            </div>

            {playerTitles.length > 0 ? (
              <div className="grid gap-4">
                {playerTitles.map((title) => (
                  <div
                    key={title.id}
                    className="flex items-center space-x-4 p-4 rounded-xl border bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border-yellow-500/30"
                  >
                    <div className="p-2 rounded-lg bg-yellow-600/20">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-bold text-yellow-300">
                        {title.title}
                      </h4>
                      <p className="text-sm text-yellow-400">
                        {title.tournament_name}
                      </p>
                      <p className="text-xs text-yellow-500 mt-1">
                        {formatDate(title.awarded_date)}
                      </p>
                    </div>

                    <div className="text-yellow-400 font-bold text-sm">
                      🏆
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                <p className="text-slate-400">Sin títulos todavía</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;