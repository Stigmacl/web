import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Users, Calendar, MapPin, Award, Crown, Shield, Star, Clock, Target, Zap, Settings, Eye, Play, CheckCircle, AlertTriangle, Medal, TrendingUp, User, Activity } from 'lucide-react';

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

interface Participant {
  id: string;
  participantType: 'user' | 'clan';
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  clanTag?: string;
  clanIcon?: string;
  teamName?: string;
  teamMembers: string[];
  points: number;
  wins: number;
  losses: number;
  status: 'registered' | 'active' | 'eliminated' | 'winner';
  registeredAt: string;
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  participant1?: {
    id: string;
    type: string;
    name: string;
    teamName?: string;
    avatar?: string;
    clanTag?: string;
  };
  participant2?: {
    id: string;
    type: string;
    name: string;
    teamName?: string;
    avatar?: string;
    clanTag?: string;
  };
  winnerId?: string;
  score1: number;
  score2: number;
  mapPlayed?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt?: string;
  completedAt?: string;
  notes?: string;
}

interface TournamentDetailProps {
  tournamentId: string;
  onBack: () => void;
}

// Detectar automáticamente la URL base de la API
const getApiBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  if (hostname === 'localhost' && port === '5173') {
    return 'http://localhost/api';
  }
  
  if (port && port !== '80' && port !== '443') {
    return `${protocol}//${hostname}:${port}/api`;
  }
  
  return `${protocol}//${hostname}/api`;
};

const API_BASE_URL = getApiBaseUrl();

const TournamentDetail: React.FC<TournamentDetailProps> = ({ tournamentId, onBack }) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'participants' | 'matches'>('info');

  useEffect(() => {
    loadTournamentData();
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar información del torneo
      const tournamentsResponse = await fetch(`${API_BASE_URL}/tournaments/get-all.php`, {
        credentials: 'include'
      });
      const tournamentsData = await tournamentsResponse.json();
      
      if (tournamentsData.success) {
        const foundTournament = tournamentsData.tournaments.find((t: Tournament) => t.id === tournamentId);
        if (foundTournament) {
          setTournament(foundTournament);
          
          // Cargar participantes
          await loadParticipants(tournamentId);
          
          // Cargar partidas
          await loadMatches(tournamentId);
        }
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipants = async (tournamentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/get-participants.php?tournamentId=${tournamentId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.participants);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const loadMatches = async (tournamentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/get-matches.php?tournamentId=${tournamentId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'registration': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return Settings;
      case 'registration': return Users;
      case 'active': return Play;
      case 'completed': return CheckCircle;
      case 'cancelled': return AlertTriangle;
      default: return Settings;
    }
  };

  const getClanIcon = (iconId: string) => {
    const clanIcons = [
      { id: 'crown', icon: Crown, color: 'text-yellow-400' },
      { id: 'sword', icon: Shield, color: 'text-red-400' },
      { id: 'shield', icon: Shield, color: 'text-blue-400' },
      { id: 'star', icon: Star, color: 'text-purple-400' },
      { id: 'zap', icon: Zap, color: 'text-green-400' },
      { id: 'target', icon: Target, color: 'text-orange-400' }
    ];
    
    const clanIcon = clanIcons.find(icon => icon.id === iconId);
    return clanIcon || clanIcons[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'registration': return 'Registro Abierto';
      case 'active': return 'En Progreso';
      case 'completed': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getBracketTypeText = (type: string) => {
    switch (type) {
      case 'single_elimination': return 'Eliminación Simple';
      case 'double_elimination': return 'Eliminación Doble';
      case 'round_robin': return 'Round Robin';
      case 'swiss': return 'Sistema Suizo';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!tournament) {
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
          <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-2">Torneo no encontrado</h2>
          <p className="text-blue-300">El torneo que buscas no existe o no está disponible</p>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(tournament.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 mb-6 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Torneos</span>
      </button>

      {/* Header del Torneo */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tournament.status)}`}>
                <StatusIcon className="w-4 h-4" />
                <span>{getStatusText(tournament.status)}</span>
              </div>
            </div>
            
            {tournament.description && (
              <p className="text-blue-200 text-lg mb-4">{tournament.description}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300">
                  {tournament.participantCount}/{tournament.maxParticipants} participantes
                </span>
              </div>
              
              <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${
                tournament.type === 'individual' 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-purple-500/20 text-purple-300'
              }`}>
                {tournament.type === 'individual' ? (
                  <>
                    <User className="w-3 h-3" />
                    <span>Individual</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3" />
                    <span>Por Clanes</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-blue-300">{getBracketTypeText(tournament.bracketType)}</span>
              </div>
              
              {tournament.prizePool && (
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 font-medium">{tournament.prizePool}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fechas del torneo */}
        {(tournament.startDate || tournament.endDate) && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {tournament.startDate && (
              <div className="bg-slate-700/40 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-medium">Fecha de Inicio</span>
                </div>
                <p className="text-white text-lg">{formatDate(tournament.startDate)}</p>
              </div>
            )}
            
            {tournament.endDate && (
              <div className="bg-slate-700/40 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 font-medium">Fecha de Fin</span>
                </div>
                <p className="text-white text-lg">{formatDate(tournament.endDate)}</p>
              </div>
            )}
          </div>
        )}

        {/* Mapas */}
        {tournament.maps.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-5 h-5 text-orange-400" />
              <span className="text-orange-300 font-medium">Mapas del Torneo</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tournament.maps.map((map, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg text-sm font-medium"
                >
                  {map}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex space-x-2 bg-slate-800/40 backdrop-blur-lg rounded-xl p-2 border border-blue-700/30">
          {[
            { id: 'info', label: 'Información', icon: Trophy },
            { id: 'participants', label: `Participantes (${participants.length})`, icon: Users },
            { id: 'matches', label: `Partidas (${matches.length})`, icon: Target }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300
                  ${activeTab === tab.id
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

      {/* Contenido de tabs */}
      {activeTab === 'info' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Información Detallada</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-blue-300 mb-3">Detalles del Torneo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-400">Tipo:</span>
                    <span className="text-white font-medium">
                      {tournament.type === 'individual' ? 'Individual' : 'Por Clanes'}
                    </span>
                  </div>
                  
                  {tournament.type === 'clan' && tournament.teamSize > 1 && (
                    <div className="flex justify-between">
                      <span className="text-blue-400">Tamaño de Equipo:</span>
                      <span className="text-white font-medium">{tournament.teamSize} jugadores</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-blue-400">Formato:</span>
                    <span className="text-white font-medium">{getBracketTypeText(tournament.bracketType)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-blue-400">Participantes:</span>
                    <span className="text-white font-medium">
                      {tournament.participantCount} / {tournament.maxParticipants}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-blue-400">Creado:</span>
                    <span className="text-white font-medium">{formatDate(tournament.createdAt)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-blue-400">Organizador:</span>
                    <span className="text-white font-medium">{tournament.createdBy}</span>
                  </div>
                </div>
              </div>
              
              {tournament.prizePool && (
                <div>
                  <h3 className="text-lg font-bold text-yellow-300 mb-3">Premio</h3>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <Award className="w-8 h-8 text-yellow-400" />
                      <span className="text-2xl font-bold text-yellow-300">{tournament.prizePool}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {tournament.rules && (
                <div>
                  <h3 className="text-lg font-bold text-blue-300 mb-3">Reglas del Torneo</h3>
                  <div className="bg-slate-700/40 rounded-xl p-4">
                    <p className="text-blue-100 whitespace-pre-wrap leading-relaxed">{tournament.rules}</p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-bold text-blue-300 mb-3">Progreso del Torneo</h3>
                <div className="bg-slate-700/40 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400">Participantes Registrados</span>
                    <span className="text-white font-medium">
                      {Math.round((tournament.participantCount / tournament.maxParticipants) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(tournament.participantCount / tournament.maxParticipants) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Participantes ({participants.length})
          </h2>
          
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Sin participantes</h3>
              <p className="text-blue-300">Aún no hay participantes registrados en este torneo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {participants
                .sort((a, b) => b.points - a.points || b.wins - a.wins)
                .map((participant, index) => {
                  const IconComponent = participant.clanIcon ? getClanIcon(participant.clanIcon).icon : Users;
                  const iconColor = participant.clanIcon ? getClanIcon(participant.clanIcon).color : 'text-blue-400';
                  
                  return (
                    <div
                      key={participant.id}
                      className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400 font-bold text-xl">#{index + 1}</span>
                              {index < 3 && (
                                <Medal className={`w-6 h-6 ${
                                  index === 0 ? 'text-yellow-400' : 
                                  index === 1 ? 'text-gray-300' : 'text-amber-600'
                                }`} />
                              )}
                            </div>
                            
                            {participant.participantAvatar ? (
                              <img
                                src={participant.participantAvatar}
                                alt={participant.participantName}
                                className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 bg-slate-600/40 flex items-center justify-center">
                                <IconComponent className={`w-6 h-6 ${iconColor}`} />
                              </div>
                            )}
                            
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-white text-lg">{participant.participantName}</span>
                                {participant.clanTag && (
                                  <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-sm font-mono">
                                    [{participant.clanTag}]
                                  </span>
                                )}
                              </div>
                              {participant.teamName && (
                                <p className="text-blue-300 text-sm">{participant.teamName}</p>
                              )}
                              <p className="text-blue-400 text-xs">
                                Registrado: {formatDate(participant.registeredAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-8">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-blue-400">{participant.points}</p>
                            <p className="text-blue-300 text-sm">Puntos</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xl font-bold text-green-400">{participant.wins}</p>
                            <p className="text-blue-300 text-sm">Victorias</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xl font-bold text-red-400">{participant.losses}</p>
                            <p className="text-blue-300 text-sm">Derrotas</p>
                          </div>
                          
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            participant.status === 'winner' ? 'bg-yellow-500/20 text-yellow-300' :
                            participant.status === 'eliminated' ? 'bg-red-500/20 text-red-300' :
                            participant.status === 'active' ? 'bg-green-500/20 text-green-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {participant.status === 'winner' ? 'Ganador' :
                             participant.status === 'eliminated' ? 'Eliminado' :
                             participant.status === 'active' ? 'Activo' :
                             'Registrado'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Partidas ({matches.length})
          </h2>
          
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Sin partidas</h3>
              <p className="text-blue-300">Las partidas se generarán cuando comience el torneo</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                matches.reduce((acc, match) => {
                  const round = `Ronda ${match.round}`;
                  if (!acc[round]) acc[round] = [];
                  acc[round].push(match);
                  return acc;
                }, {} as Record<string, Match[]>)
              ).map(([round, roundMatches]) => (
                <div key={round} className="bg-slate-700/40 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-orange-400" />
                    <span>{round}</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {roundMatches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-slate-600/40 rounded-lg p-4 border border-blue-600/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Participante 1 */}
                            <div className="flex items-center space-x-3 flex-1">
                              {match.participant1 ? (
                                <>
                                  {match.participant1.avatar && (
                                    <img
                                      src={match.participant1.avatar}
                                      alt={match.participant1.name}
                                      className="w-10 h-10 rounded-full border border-blue-500/30"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <span className="text-white font-medium block">
                                      {match.participant1.name}
                                    </span>
                                    {match.participant1.clanTag && (
                                      <span className="text-purple-300 text-sm">[{match.participant1.clanTag}]</span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-400 flex-1">Por definir</span>
                              )}
                            </div>
                            
                            {/* Marcador */}
                            <div className="flex items-center space-x-3 px-4">
                              <div className="text-center">
                                <div className={`text-2xl font-bold ${
                                  match.winnerId === match.participant1?.id ? 'text-green-400' : 'text-white'
                                }`}>
                                  {match.score1}
                                </div>
                              </div>
                              
                              <div className="text-blue-400 text-xl">-</div>
                              
                              <div className="text-center">
                                <div className={`text-2xl font-bold ${
                                  match.winnerId === match.participant2?.id ? 'text-green-400' : 'text-white'
                                }`}>
                                  {match.score2}
                                </div>
                              </div>
                            </div>
                            
                            {/* Participante 2 */}
                            <div className="flex items-center space-x-3 flex-1 justify-end">
                              {match.participant2 ? (
                                <>
                                  <div className="flex-1 text-right">
                                    <span className="text-white font-medium block">
                                      {match.participant2.name}
                                    </span>
                                    {match.participant2.clanTag && (
                                      <span className="text-purple-300 text-sm">[{match.participant2.clanTag}]</span>
                                    )}
                                  </div>
                                  {match.participant2.avatar && (
                                    <img
                                      src={match.participant2.avatar}
                                      alt={match.participant2.name}
                                      className="w-10 h-10 rounded-full border border-blue-500/30"
                                    />
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400 flex-1 text-right">Por definir</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Estado de la partida */}
                          <div className="ml-6">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              match.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              match.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                              match.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {match.status === 'completed' ? 'Completada' :
                               match.status === 'in_progress' ? 'En Progreso' :
                               match.status === 'cancelled' ? 'Cancelada' :
                               'Pendiente'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Información adicional */}
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            {match.mapPlayed && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4 text-orange-400" />
                                <span className="text-orange-300">{match.mapPlayed}</span>
                              </div>
                            )}
                            
                            {match.scheduledAt && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-300">
                                  Programada: {formatDate(match.scheduledAt)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {match.completedAt && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-300">
                                Finalizada: {formatDate(match.completedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {match.notes && (
                          <div className="mt-3 p-3 bg-slate-500/20 rounded-lg">
                            <p className="text-blue-200 text-sm italic">{match.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentDetail;