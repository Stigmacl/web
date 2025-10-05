import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, UserCheck, UserX, Clock, MapPin, Shield, Star, X, LogIn, Wifi, WifiOff, Activity, EyeOff, Eye, Crown, Calendar, Trophy, Target, Zap, Award, Medal, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import ClanProfile from './ClanProfile';
import TournamentDetail from './TournamentDetail';
import { API_BASE_URL } from '../config/api';

type ViewMode = 'players' | 'clans' | 'tournaments';

interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'clan';
  teamSize: number;
  maxParticipants: number;
  participantCount: number;
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  prizePool?: string;
  rules?: string;
  maps: string[];
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  createdBy: string;
  createdAt: string;
}


const Players: React.FC = () => {
  const { users, user, clans } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'player'>('all');
  const [clanFilter, setClanFilter] = useState<'all' | string>('all');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedClanId, setSelectedClanId] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);

  // Cargar torneos al montar el componente
  useEffect(() => {
    loadTournaments();
  }, []);

  // Escuchar eventos para cambiar el modo de vista
  useEffect(() => {
    const handleViewModeChange = (event: CustomEvent) => {
      const mode = event.detail as ViewMode;
      setViewMode(mode);
    };

    window.addEventListener('set-players-view-mode', handleViewModeChange as EventListener);

    return () => {
      window.removeEventListener('set-players-view-mode', handleViewModeChange as EventListener);
    };
  }, []);

  const loadTournaments = async () => {
    try {
      setIsLoadingTournaments(true);
      const response = await fetch(`${API_BASE_URL}/tournaments/get-all.php`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  const filteredUsers = users.filter(userItem => {
    const matchesSearch = userItem.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'online' && userItem.isOnline && userItem.isActive) ||
      (statusFilter === 'offline' && (!userItem.isOnline || !userItem.isActive));
    const matchesRole = roleFilter === 'all' || userItem.role === roleFilter;

    // Filtro de clan: '' significa sin clan (null o vacío), cualquier otro valor busca ese clan específico
    const matchesClan = clanFilter === 'all' ||
      (clanFilter === '' ? (!userItem.clan || userItem.clan === '') : userItem.clan === clanFilter);

    return matchesSearch && matchesStatus && matchesRole && matchesClan;
  });

  const filteredClans = clans.filter(clan => 
    clan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clan.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (clan.description && clan.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (isOnline: boolean, isActive: boolean) => {
    if (!isActive) return 'bg-red-500 shadow-lg shadow-red-500/30'; // Suspendido
    if (isOnline) return 'bg-green-500 shadow-lg shadow-green-500/30'; // En línea
    return 'bg-gray-500'; // Desconectado
  };

  const getStatusText = (isOnline: boolean, isActive: boolean) => {
    if (!isActive) return 'Suspendido';
    if (isOnline) return 'En línea';
    return 'Desconectado';
  };

  const getStatusIcon = (isOnline: boolean, isActive: boolean) => {
    if (!isActive) return UserX;
    if (isOnline) return Wifi;
    return WifiOff;
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

  const getClanIcon = (iconId: string) => {
    const clanIcons = [
      { id: 'crown', icon: Crown, name: 'Corona', color: 'text-yellow-400' },
      { id: 'sword', icon: Shield, name: 'Espada', color: 'text-red-400' },
      { id: 'shield', icon: Shield, name: 'Escudo', color: 'text-blue-400' },
      { id: 'star', icon: Star, name: 'Estrella', color: 'text-purple-400' },
      { id: 'zap', icon: Shield, name: 'Rayo', color: 'text-green-400' },
      { id: 'target', icon: Shield, name: 'Diana', color: 'text-orange-400' }
    ];
    
    const clanIcon = clanIcons.find(icon => icon.id === iconId);
    return clanIcon || clanIcons[0];
  };

  const getStatusColorTournament = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'registration': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIconTournament = (status: string) => {
    switch (status) {
      case 'draft': return Target;
      case 'registration': return Users;
      case 'active': return Trophy;
      case 'completed': return Medal;
      case 'cancelled': return X;
      default: return Target;
    }
  };

  const getStatusTextTournament = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'registration': return 'Registro Abierto';
      case 'active': return 'En Progreso';
      case 'completed': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const isUserClanLeader = (userItem: any) => {
    if (!userItem.clan) return false;
    const clan = clans.find(c => c.tag === userItem.clan);
    return clan && clan.leaderId === userItem.id;
  };

  const handleViewProfile = (targetUser: any) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    setSelectedUserId(targetUser.id);
  };

  const handleViewClan = (clan: any) => {
    setSelectedClanId(clan.id);
  };

  const handleViewTournament = (tournament: Tournament) => {
    setSelectedTournamentId(tournament.id);
  };

  const navigateToLogin = () => {
    setShowLoginPrompt(false);
    // Trigger navigation to user panel
    const event = new CustomEvent('navigate-to-section', { detail: 'user-panel' });
    window.dispatchEvent(event);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTournament = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estadísticas actualizadas
  const onlineUsers = users.filter(u => u.isOnline && u.isActive).length;
  const offlineUsers = users.filter(u => !u.isOnline || !u.isActive).length;
  const suspendedUsers = users.filter(u => !u.isActive).length;

  // Si hay un usuario seleccionado, mostrar su perfil
  if (selectedUserId) {
    return (
      <UserProfile 
        userId={selectedUserId} 
        onBack={() => setSelectedUserId(null)} 
      />
    );
  }

  // Si hay un clan seleccionado, mostrar su perfil
  if (selectedClanId) {
    return (
      <ClanProfile 
        clanId={selectedClanId} 
        onBack={() => setSelectedClanId(null)} 
      />
    );
  }

  // Si hay un torneo seleccionado, mostrar su detalle
  if (selectedTournamentId) {
    return (
      <TournamentDetail 
        tournamentId={selectedTournamentId} 
        onBack={() => setSelectedTournamentId(null)} 
      />
    );
  }

  // Determinar qué pestañas mostrar
  const availableTabs = [
    { id: 'players' as ViewMode, label: 'Jugadores', icon: Users },
    { id: 'clans' as ViewMode, label: 'Clanes', icon: Shield }
  ];

  // Solo agregar la pestaña de torneos si hay torneos creados
  if (tournaments.length > 0) {
    availableTabs.push({ id: 'tournaments' as ViewMode, label: 'Torneos', icon: Trophy });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Comunidad</h1>
        <p className="text-blue-200 text-lg">Conoce a los miembros, clanes y torneos de nuestra comunidad</p>
        {!user && (
          <div className="mt-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
            <p className="text-blue-300 text-sm">
              💡 <strong>¿Quieres ver más detalles?</strong> Inicia sesión para acceder a los perfiles completos de los jugadores y clanes
            </p>
          </div>
        )}
      </div>

      {/* Toggle entre secciones */}
      <div className="mb-8">
        <div className="flex flex-wrap space-x-2 bg-slate-800/40 backdrop-blur-lg rounded-xl p-2 border border-blue-700/30 max-w-fit">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300
                  ${viewMode === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              type="text"
              placeholder={
                viewMode === 'players' ? "Buscar jugadores..." : 
                viewMode === 'clans' ? "Buscar clanes..." : 
                "Buscar torneos..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          {viewMode === 'players' && (
            <div className="flex space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'online' | 'offline')}
                className="px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="all">Todos los estados</option>
                <option value="online">En línea</option>
                <option value="offline">Desconectados</option>
              </select>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'player')}
                className="px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="player">Jugadores</option>
              </select>
              
              <select
                value={clanFilter}
                onChange={(e) => setClanFilter(e.target.value)}
                className="px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="all">Todos los clanes</option>
                <option value="">Sin clan</option>
                {clans.map((clan) => (
                  <option key={clan.id} value={clan.tag}>
                    [{clan.tag}] {clan.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {viewMode === 'players' ? (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-blue-300 text-sm">Total Jugadores</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{onlineUsers}</p>
                <p className="text-green-300 text-sm">En Línea Ahora</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <WifiOff className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-white">{offlineUsers}</p>
                <p className="text-gray-300 text-sm">Desconectados</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-yellow-300 text-sm">Administradores</p>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'clans' ? (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{clans.length}</p>
                <p className="text-blue-300 text-sm">Total Clanes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{users.filter(u => u.clan).length}</p>
                <p className="text-green-300 text-sm">Jugadores en Clanes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{clans.filter(c => c.leaderId).length}</p>
                <p className="text-yellow-300 text-sm">Clanes con Líder</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {Math.round(users.filter(u => u.clan).length / Math.max(clans.length, 1))}
                </p>
                <p className="text-purple-300 text-sm">Promedio Miembros</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{tournaments.length}</p>
                <p className="text-yellow-300 text-sm">Total Torneos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{tournaments.filter(t => t.status === 'active').length}</p>
                <p className="text-green-300 text-sm">Activos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{tournaments.filter(t => t.status === 'registration').length}</p>
                <p className="text-blue-300 text-sm">En Registro</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Medal className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{tournaments.filter(t => t.status === 'completed').length}</p>
                <p className="text-purple-300 text-sm">Completados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Status Indicator */}
      <div className="mb-6 bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-blue-300 text-sm">Estado actualizado en tiempo real</span>
          </div>
          <div className="text-blue-400 text-xs">
            Última actualización: {new Date().toLocaleTimeString('es-CL')}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {viewMode === 'players' ? (
        /* Players Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((userItem) => {
            const StatusIcon = getStatusIcon(userItem.isOnline, userItem.isActive);
            const isLeader = isUserClanLeader(userItem);
            
            return (
              <div
                key={userItem.id}
                className={`bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:transform hover:scale-105 ${
                  !userItem.isActive ? 'opacity-75 border-red-500/30' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={userItem.avatar || '/Logo-Comunidad.png'}
                        alt={userItem.username}
                        className={`w-16 h-16 rounded-full border-4 object-cover ${
                          userItem.isActive ? 'border-blue-500/30' : 'border-red-500/30'
                        }`}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getStatusColor(userItem.isOnline, userItem.isActive)} border-2 border-slate-800`}></div>
                      {isLeader && (
                        <div className="absolute -top-1 -left-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                          <Crown className="w-3 h-3 text-yellow-900" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-white">{userItem.username}</h3>
                        {isLeader && (
                          <Crown className="w-4 h-4 text-yellow-400" title="Líder de Clan" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-blue-300 text-sm">
                          {userItem.hideEmail ? '••••••@••••••.com' : userItem.email}
                        </p>
                        {userItem.hideEmail && (
                          <EyeOff className="w-3 h-3 text-blue-400" title="Email oculto" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 ${getRoleBadgeColor(userItem.role)}`}>
                    {getRoleIcon(userItem.role)}
                    <span>{userItem.role === 'admin' ? 'Admin' : 'Jugador'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-400">Estado:</span>
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`w-4 h-4 ${
                        !userItem.isActive ? 'text-red-400' :
                        userItem.isOnline ? 'text-green-400' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        !userItem.isActive ? 'text-red-300' :
                        userItem.isOnline ? 'text-green-300' : 'text-gray-300'
                      }`}>
                        {getStatusText(userItem.isOnline, userItem.isActive)}
                      </span>
                    </div>
                  </div>

                  {userItem.status && (
                    <div className="text-sm">
                      <span className="text-blue-400">Estado personalizado:</span>
                      <p className="text-white italic mt-1">"{userItem.status}"</p>
                    </div>
                  )}

                  {userItem.clan && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400">Clan:</span>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const clan = clans.find(c => c.tag === userItem.clan);
                          if (clan) {
                            const IconComponent = getClanIcon(clan.icon).icon;
                            return (
                              <>
                                <IconComponent className={`w-4 h-4 ${getClanIcon(clan.icon).color}`} />
                                <span className="text-blue-300 font-mono">[{userItem.clan}]</span>
                                {isLeader && (
                                  <Crown className="w-3 h-3 text-yellow-400" title="Líder" />
                                )}
                              </>
                            );
                          }
                          return <span className="text-blue-200 font-mono">[{userItem.clan}]</span>;
                        })()}
                      </div>
                    </div>
                  )}

                  {userItem.playerName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400">Jugador:</span>
                      <span className="text-green-300 font-mono">{userItem.playerName}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-blue-700/30">
                    <div className="flex items-center space-x-4 text-xs text-blue-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatLastLogin(userItem.lastLogin)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>Chile</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-700/30">
                  <div className="flex justify-center">
                    <button 
                      onClick={() => handleViewProfile(userItem)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        user
                          ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200'
                          : 'bg-slate-600/20 text-slate-400 cursor-not-allowed'
                      }`}
                      title={!user ? 'Inicia sesión para ver perfiles' : 'Ver perfil completo'}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver Perfil Completo</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'clans' ? (
        /* Clans Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClans.map((clan) => {
            const IconComponent = getClanIcon(clan.icon).icon;
            const iconColor = getClanIcon(clan.icon).color;
            const leader = users.find(u => u.id === clan.leaderId);
            const onlineMembers = users.filter(u => u.clan === clan.tag && u.isOnline && u.isActive).length;
            
            return (
              <div
                key={clan.id}
                className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer"
                onClick={() => handleViewClan(clan)}
              >
                <div className="text-center mb-4">
                  <div className="relative inline-block mb-3">
                    {clan.logo ? (
                      <img
                        src={clan.logo}
                        alt={`Logo de ${clan.name}`}
                        className="w-16 h-16 rounded-full border-4 border-blue-500/30 mx-auto object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-16 h-16 rounded-full border-4 border-blue-500/30 mx-auto bg-slate-700/40 flex items-center justify-center">
                                <svg class="w-8 h-8 ${iconColor}" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 mx-auto bg-slate-700/40 flex items-center justify-center">
                        <IconComponent className={`w-8 h-8 ${iconColor}`} />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1">{clan.name}</h3>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm font-mono font-bold">
                      [{clan.tag}]
                    </span>
                  </div>
                  
                  {clan.description && (
                    <p className="text-blue-200 text-sm italic mb-3 line-clamp-2">"{clan.description}"</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-400">Miembros:</span>
                    <span className="text-white font-medium">{clan.members}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-400">En línea:</span>
                    <span className="text-green-300 font-medium">{onlineMembers}</span>
                  </div>
                  
                  {leader && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400">Líder:</span>
                      <div className="flex items-center space-x-2">
                        <img
                          src={leader.avatar || '/Logo-Comunidad.png'}
                          alt={leader.username}
                          className="w-5 h-5 rounded-full border border-yellow-500/30 object-cover"
                        />
                        <span className="text-white font-medium">{leader.username}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-blue-700/30">
                    <div className="flex items-center justify-between text-xs text-blue-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Fundado</span>
                      </div>
                      <span>{formatDate(clan.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-700/30">
                  <div className="flex justify-center">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 rounded-lg text-blue-300 font-medium">
                      <Eye className="w-4 h-4" />
                      <span>Ver Perfil del Clan</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tournaments Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingTournaments ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No hay torneos disponibles</h3>
              <p className="text-blue-300">Los administradores pueden crear torneos desde el panel de administración</p>
            </div>
          ) : (
            filteredTournaments.map((tournament) => {
              const StatusIcon = getStatusIconTournament(tournament.status);
              
              return (
                <div
                  key={tournament.id}
                  id={`tournament-${tournament.id}`}
                  className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer"
                  onClick={() => handleViewTournament(tournament)}
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">{tournament.name}</h3>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColorTournament(tournament.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{getStatusTextTournament(tournament.status)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tournament.type === 'individual' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {tournament.type === 'individual' ? 'Individual' : 'Por Clanes'}
                      </div>
                      
                      <div className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs font-medium">
                        {tournament.bracketType.replace('_', ' ')}
                      </div>
                    </div>
                    
                    {tournament.description && (
                      <p className="text-blue-200 text-sm mb-3 line-clamp-2">{tournament.description}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400">Participantes:</span>
                      <span className="text-white font-medium">
                        {tournament.participantCount}/{tournament.maxParticipants}
                      </span>
                    </div>
                    
                    {tournament.type === 'clan' && tournament.teamSize > 1 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">Tamaño de equipo:</span>
                        <span className="text-white font-medium">{tournament.teamSize}</span>
                      </div>
                    )}
                    
                    {tournament.prizePool && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">Premio:</span>
                        <span className="text-yellow-300 font-medium">{tournament.prizePool}</span>
                      </div>
                    )}
                    
                    {tournament.startDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">Inicio:</span>
                        <span className="text-white font-medium">{formatDateTournament(tournament.startDate)}</span>
                      </div>
                    )}
                    
                    {tournament.maps.length > 0 && (
                      <div className="pt-3 border-t border-blue-700/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-orange-400" />
                          <span className="text-blue-400 text-sm font-medium">Mapas:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tournament.maps.slice(0, 3).map((map, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs"
                            >
                              {map}
                            </span>
                          ))}
                          {tournament.maps.length > 3 && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">
                              +{tournament.maps.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-700/30">
                    <div className="flex justify-center">
                      <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-600/20 rounded-lg text-yellow-300 font-medium">
                        <Trophy className="w-4 h-4" />
                        <span>Ver Detalles</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Empty States */}
      {viewMode === 'players' && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No se encontraron jugadores</h3>
          <p className="text-blue-300">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}

      {viewMode === 'clans' && filteredClans.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No se encontraron clanes</h3>
          <p className="text-blue-300">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Aún no hay clanes registrados en la comunidad'}
          </p>
        </div>
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-500/30 p-6 max-w-md w-full">
            <div className="text-center">
              <LogIn className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Inicia Sesión</h3>
              <p className="text-blue-300 mb-6">
                Para ver los perfiles completos de los jugadores y clanes necesitas tener una cuenta
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={navigateToLogin}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ir a Login</span>
                </button>
                
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;