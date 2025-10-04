import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Users, Calendar, MapPin, Award, Crown, Shield, Star, Clock, Target, Zap, Settings, Eye, Play, CheckCircle, AlertTriangle, Medal, TrendingUp, User, Activity, RefreshCw, Image, X } from 'lucide-react';
import TournamentBracket from './TournamentBracket';
import { API_BASE_URL } from '../config/api';

interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'clan' | 'team';
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
  participantType: 'user' | 'clan' | 'team';
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
  draws: number;
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
  team1Participants?: any[];
  team2Participants?: any[];
  winnerId?: string;
  winnerTeam?: number;
  score1: number;
  score2: number;
  mapPlayed?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt?: string;
  completedAt?: string;
  notes?: string;
  teamSize?: number;
}

interface MatchImage {
  id: string;
  matchId: string;
  imageType: 'ida' | 'vuelta' | 'general';
  imageUrl: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface TournamentDetailProps {
  tournamentId: string;
  onBack: () => void;
}


const TournamentDetail: React.FC<TournamentDetailProps> = ({ tournamentId, onBack }) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchImages, setMatchImages] = useState<Record<string, MatchImage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'bracket' | 'participants' | 'matches' | 'info'>('bracket');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Manejar tecla Escape para cerrar imagen ampliada
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedImage]);

  useEffect(() => {
    loadTournamentData();
  }, [tournamentId]);

  // Auto-refresh cada 30 segundos cuando está en la pestaña de bracket
  useEffect(() => {
    if (activeTab !== 'bracket') return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh del torneo');
      refreshTournamentData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [activeTab, tournamentId]);

  const loadTournamentData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar información del torneo
      const tournamentsResponse = await fetch(`${API_BASE_URL}/tournaments/get-all.php`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const tournamentsData = await tournamentsResponse.json();
      
      if (tournamentsData.success) {
        const foundTournament = tournamentsData.tournaments.find((t: Tournament) => t.id === tournamentId);
        if (foundTournament) {
          setTournament(foundTournament);
          
          // Cargar participantes y partidas en paralelo
          await Promise.all([
            loadParticipants(tournamentId),
            loadMatches(tournamentId)
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  const refreshTournamentData = async () => {
    try {
      setIsRefreshing(true);
      
      // Cargar participantes y partidas en paralelo
      await Promise.all([
        loadParticipants(tournamentId),
        loadMatches(tournamentId)
      ]);
      
      setLastRefresh(new Date());
      console.log('✅ Datos del torneo actualizados');
    } catch (error) {
      console.error('Error refreshing tournament data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadParticipants = async (tournamentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/get-participants.php?tournamentId=${tournamentId}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.participants);
        console.log('📊 Participantes cargados:', data.participants.length);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const loadMatches = async (tournamentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/get-matches.php?tournamentId=${tournamentId}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.success) {
        setMatches(data.matches);
        console.log('🎯 Partidas cargadas:', data.matches.length);
        
        // Cargar imágenes para cada partida
        await loadMatchImages(data.matches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const loadMatchImages = async (matches: Match[]) => {
    try {
      const imagePromises = matches.map(async (match) => {
        try {
          const response = await fetch(`${API_BASE_URL}/tournaments/get-match-images.php?matchId=${match.id}`, {
            credentials: 'include',
            cache: 'no-store'
          });
          const data = await response.json();
          
          if (data.success) {
            return { matchId: match.id, images: data.images };
          }
          return { matchId: match.id, images: [] };
        } catch (error) {
          console.error(`Error loading images for match ${match.id}:`, error);
          return { matchId: match.id, images: [] };
        }
      });

      const results = await Promise.all(imagePromises);
      const imagesMap: Record<string, MatchImage[]> = {};
      
      results.forEach(({ matchId, images }) => {
        imagesMap[matchId] = images;
      });
      
      setMatchImages(imagesMap);
      console.log('🖼️ Imágenes de partidas cargadas:', Object.keys(imagesMap).length);
    } catch (error) {
      console.error('Error loading match images:', error);
    }
  };

  const handleMatchUpdate = (matchId: string, updates: any) => {
    setMatches(prev => prev.map(match => 
      match.id === matchId ? { ...match, ...updates } : match
    ));
    
    // Refrescar datos después de un breve delay para asegurar que la BD se actualizó
    setTimeout(() => {
      refreshTournamentData();
    }, 1000);
  };

  const handleBracketRegenerate = () => {
    console.log('🔄 Regenerando bracket del torneo');
    // Refrescar todos los datos
    refreshTournamentData();
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

  const getTypeText = (type: string, teamSize: number) => {
    switch (type) {
      case 'individual': return teamSize > 1 ? `Individual (${teamSize}v${teamSize})` : 'Individual (1v1)';
      case 'clan': return teamSize > 1 ? `Por Clanes (${teamSize}v${teamSize})` : 'Por Clanes (1v1)';
      case 'team': return `Por Equipos (${teamSize}v${teamSize})`;
      default: return type;
    }
  };

  const getMatchFormat = (teamSize: number) => {
    return teamSize === 1 ? '1v1' : `${teamSize}v${teamSize}`;
  };

  const getImageTypeText = (type: string) => {
    switch (type) {
      case 'ida': return 'Ida';
      case 'vuelta': return 'Vuelta';
      case 'general': return 'General';
      default: return type;
    }
  };

  const getImageTypeColor = (type: string) => {
    switch (type) {
      case 'ida': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'vuelta': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'general': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Función mejorada para obtener el nombre principal del equipo/participante
  const getParticipantDisplayName = (participant: Participant, tournament: Tournament) => {
    // Si es un equipo personalizado y tiene nombre de equipo, usarlo
    if (participant.participantType === 'team' && participant.teamName) {
      return participant.teamName;
    }
    
    // Si es un clan y tiene tag, mostrar el tag del clan
    if (participant.participantType === 'clan' && participant.clanTag) {
      return `[${participant.clanTag}] ${participant.participantName}`;
    }
    
    // Para torneos con equipos múltiples (teamSize > 1), crear un nombre descriptivo
    if (tournament.teamSize > 1) {
      if (participant.participantType === 'clan') {
        return participant.clanTag ? `Equipo [${participant.clanTag}]` : `Equipo ${participant.participantName}`;
      } else if (participant.participantType === 'user') {
        return `Equipo ${participant.participantName}`;
      } else {
        return participant.teamName || `Equipo ${participant.participantName}`;
      }
    }
    
    // Para 1v1, usar el nombre del participante
    return participant.participantName;
  };

  // Función mejorada para obtener nombres de equipos en partidas
  const getTeamDisplayName = (participant: any, teamParticipants: any[], tournament: Tournament) => {
    if (!participant && (!teamParticipants || teamParticipants.length === 0)) {
      return 'Por definir';
    }

    // Para equipos múltiples (teamSize > 1)
    if (tournament.teamSize > 1 && teamParticipants && teamParticipants.length > 0) {
      if (tournament.type === 'clan') {
        // Para clanes, mostrar el tag del clan
        const firstParticipant = teamParticipants[0];
        return firstParticipant.clanTag ? `Equipo [${firstParticipant.clanTag}]` : `Equipo ${firstParticipant.name}`;
      } else {
        // Para equipos, mostrar nombre del equipo o "Equipo X"
        const firstParticipant = teamParticipants[0];
        return firstParticipant.teamName || `Equipo ${firstParticipant.name}`;
      }
    }

    // Para 1v1 o participante individual
    if (participant) {
      if (participant.type === 'clan' && participant.clanTag) {
        return `[${participant.clanTag}] ${participant.name}`;
      } else if (participant.teamName) {
        return participant.teamName;
      } else {
        return participant.name;
      }
    }

    return 'Por definir';
  };

  // Función para obtener miembros del equipo
  const getTeamMembers = (participant: any, teamParticipants: any[], tournament: Tournament) => {
    if (tournament.teamSize > 1 && teamParticipants && teamParticipants.length > 0) {
      return teamParticipants.map(p => p.name).join(', ');
    } else if (participant && tournament.teamSize > 1) {
      return `Jugador en formato ${getMatchFormat(tournament.teamSize)}`;
    }
    return null;
  };

  // Función para crear un mapa de participantes por ID para búsqueda rápida
  const createParticipantMap = () => {
    const participantMap = new Map();
    participants.forEach(p => {
      participantMap.set(p.id, p);
    });
    return participantMap;
  };

  // Función para obtener información completa del participante desde el match
  const getParticipantFromMatch = (matchParticipant: any, participantMap: Map<string, Participant>) => {
    if (!matchParticipant) return null;
    
    // Buscar el participante completo en el mapa
    const fullParticipant = participantMap.get(matchParticipant.id);
    
    if (fullParticipant) {
      return {
        id: fullParticipant.id,
        participantType: fullParticipant.participantType,
        participantId: fullParticipant.participantId,
        participantName: fullParticipant.participantName,
        participantAvatar: fullParticipant.participantAvatar,
        clanTag: fullParticipant.clanTag,
        teamName: fullParticipant.teamName,
        teamMembers: fullParticipant.teamMembers
      };
    }
    
    // Fallback a los datos del match si no se encuentra el participante completo
    return {
      id: matchParticipant.id,
      participantType: matchParticipant.type as 'user' | 'clan' | 'team',
      participantId: matchParticipant.id,
      participantName: matchParticipant.name,
      participantAvatar: matchParticipant.avatar,
      clanTag: matchParticipant.clanTag,
      teamName: matchParticipant.teamName,
      teamMembers: []
    };
  };

  // Función para obtener participantes de equipos múltiples
  const getTeamParticipantsFromMatch = (teamParticipants: any[], participantMap: Map<string, Participant>) => {
    if (!teamParticipants || teamParticipants.length === 0) return [];
    
    return teamParticipants.map(tp => {
      const fullParticipant = participantMap.get(tp.id);
      if (fullParticipant) {
        return {
          id: fullParticipant.id,
          participantType: fullParticipant.participantType,
          participantId: fullParticipant.participantId,
          participantName: fullParticipant.participantName,
          participantAvatar: fullParticipant.participantAvatar,
          clanTag: fullParticipant.clanTag,
          teamName: fullParticipant.teamName,
          teamMembers: fullParticipant.teamMembers
        };
      }
      
      // Fallback a los datos del match
      return {
        id: tp.id,
        participantType: tp.type as 'user' | 'clan' | 'team',
        participantId: tp.id,
        participantName: tp.name,
        participantAvatar: tp.avatar,
        clanTag: tp.clanTag,
        teamName: tp.teamName,
        teamMembers: []
      };
    });
  };

  // Convertir participantes al formato esperado por TournamentBracket
  const bracketParticipants = participants.map(p => ({
    id: p.id,
    participantType: p.participantType,
    participantId: p.participantId,
    participantName: p.participantName,
    participantAvatar: p.participantAvatar,
    clanTag: p.clanTag,
    teamName: p.teamName,
    teamMembers: p.teamMembers
  }));

  // Convertir matches al formato esperado por TournamentBracket con información completa de participantes
  const participantMap = createParticipantMap();
  const bracketMatches = matches.map(m => {
    const participant1 = getParticipantFromMatch(m.participant1, participantMap);
    const participant2 = getParticipantFromMatch(m.participant2, participantMap);
    const team1Participants = getTeamParticipantsFromMatch(m.team1Participants || [], participantMap);
    const team2Participants = getTeamParticipantsFromMatch(m.team2Participants || [], participantMap);

    return {
      id: m.id,
      round: m.round,
      matchNumber: m.matchNumber,
      participant1,
      participant2,
      team1Participants,
      team2Participants,
      winnerId: m.winnerId,
      winnerTeam: m.winnerTeam,
      score1: m.score1,
      score2: m.score2,
      status: m.status,
      scheduledAt: m.scheduledAt,
      completedAt: m.completedAt,
      mapPlayed: m.mapPlayed,
      notes: m.notes,
      position: { x: 0, y: 0 } // Se calculará en el componente TournamentBracket
    };
  });

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
                  : tournament.type === 'clan'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-green-500/20 text-green-300'
              }`}>
                {tournament.type === 'individual' ? (
                  <>
                    <User className="w-3 h-3" />
                    <span>Individual</span>
                  </>
                ) : tournament.type === 'clan' ? (
                  <>
                    <Shield className="w-3 h-3" />
                    <span>Por Clanes</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3" />
                    <span>Por Equipos</span>
                  </>
                )}
                <span className="text-orange-400 font-bold">
                  ({getMatchFormat(tournament.teamSize)})
                </span>
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

          {/* Refresh Button */}
          <div className="flex items-center space-x-3">
            <div className="text-right text-xs text-blue-400">
              <div>Última actualización:</div>
              <div>{lastRefresh.toLocaleTimeString('es-CL')}</div>
            </div>
            <button
              onClick={refreshTournamentData}
              disabled={isRefreshing}
              className={`p-3 rounded-lg transition-all duration-300 ${
                isRefreshing 
                  ? 'bg-blue-600/20 text-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200'
              }`}
              title="Actualizar datos del torneo"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Información del formato de partidas */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-orange-400" />
            <div>
              <h5 className="text-orange-300 font-medium">Formato de Partidas</h5>
              <p className="text-orange-400 text-sm mt-1">
                Todas las partidas de este torneo se juegan en formato <strong>{getMatchFormat(tournament.teamSize)}</strong>
                {tournament.teamSize > 1 && ` (${tournament.teamSize} jugadores por equipo)`}
              </p>
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
            { id: 'bracket', label: 'Bracket', icon: Trophy },
            { id: 'participants', label: `Participantes (${participants.length})`, icon: Users },
            { id: 'matches', label: `Partidas (${matches.length})`, icon: Target },
            { id: 'info', label: 'Información', icon: Eye }
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
                {tab.id === 'bracket' && isRefreshing && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de tabs */}
      {activeTab === 'bracket' && (
        <TournamentBracket
          tournamentId={tournamentId}
          tournamentType={tournament.type}
          teamSize={tournament.teamSize}
          participants={bracketParticipants}
          matches={bracketMatches}
          bracketType={tournament.bracketType}
          isAdmin={false} // En la vista pública no es admin
          onMatchUpdate={handleMatchUpdate}
          onBracketRegenerate={handleBracketRegenerate}
          onRefreshData={refreshTournamentData}
        />
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
                  
                  // Obtener el nombre principal del equipo/participante
                  const displayName = getParticipantDisplayName(participant, tournament);
                  
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
                                alt={displayName}
                                className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 bg-slate-600/40 flex items-center justify-center">
                                <IconComponent className={`w-6 h-6 ${iconColor}`} />
                              </div>
                            )}
                            
                            <div>
                              <div className="flex items-center space-x-2">
                                {/* Nombre principal del equipo/participante */}
                                <span className="font-bold text-white text-lg">
                                  {displayName}
                                </span>
                                
                                {/* Formato del torneo */}
                                <span className="px-2 py-1 bg-orange-600/20 text-orange-300 rounded text-sm font-bold">
                                  {getMatchFormat(tournament.teamSize)}
                                </span>
                                
                                {/* Estado del participante */}
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  participant.status === 'winner' ? 'bg-yellow-500/20 text-yellow-300' :
                                  participant.status === 'eliminated' ? 'bg-red-500/20 text-red-300' :
                                  participant.status === 'active' ? 'bg-green-500/20 text-green-300' :
                                  'bg-blue-500/20 text-blue-300'
                                }`}>
                                  {participant.status === 'winner' ? 'Ganador' :
                                   participant.status === 'eliminated' ? 'Eliminado' :
                                   participant.status === 'active' ? 'Activo' :
                                   'Registrado'}
                                </span>
                              </div>
                              
                              {/* Miembros del equipo */}
                              {participant.teamMembers.length > 0 && (
                                <p className="text-blue-300 text-sm mt-1">
                                  <span className="text-blue-400 font-medium">Miembros:</span> {participant.teamMembers.join(', ')}
                                </p>
                              )}
                              
                              {/* Información adicional */}
                              <div className="flex items-center space-x-4 text-xs text-blue-400 mt-1">
                                <span>Registrado: {formatDate(participant.registeredAt)}</span>
                                {participant.participantType === 'user' && (
                                  <span>Jugador Individual</span>
                                )}
                                {participant.participantType === 'clan' && participant.clanTag && (
                                  <span>Clan: [{participant.clanTag}]</span>
                                )}
                                {participant.participantType === 'team' && (
                                  <span>Equipo Personalizado</span>
                                )}
                              </div>
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
                          
                          <div className="text-center">
                            <p className="text-xl font-bold text-yellow-400">{participant.draws}</p>
                            <p className="text-blue-300 text-sm">Empates</p>
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
            Partidas ({matches.length}) - Formato {getMatchFormat(tournament.teamSize)}
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
                  const round = tournament.bracketType === 'round_robin' 
                    ? 'Round Robin' 
                    : `Ronda ${match.round}`;
                  if (!acc[round]) acc[round] = [];
                  acc[round].push(match);
                  return acc;
                }, {} as Record<string, Match[]>)
              ).map(([round, roundMatches]) => (
                <div key={round} className="bg-slate-700/40 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-orange-400" />
                    <span>{round}</span>
                    <span className="text-orange-400 text-sm">({getMatchFormat(tournament.teamSize)})</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {roundMatches.map((match) => {
                      // Obtener nombres de equipos mejorados
                      const team1Name = getTeamDisplayName(match.participant1, match.team1Participants, tournament);
                      const team2Name = getTeamDisplayName(match.participant2, match.team2Participants, tournament);
                      const team1Members = getTeamMembers(match.participant1, match.team1Participants, tournament);
                      const team2Members = getTeamMembers(match.participant2, match.team2Participants, tournament);
                      const images = matchImages[match.id] || [];
                      
                      return (
                        <div
                          key={match.id}
                          className="bg-slate-600/40 rounded-lg p-4 border border-blue-600/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              {/* Participante 1 */}
                              <div className="flex items-center space-x-3 flex-1">
                                {match.participant1?.avatar && (
                                  <img
                                    src={match.participant1.avatar}
                                    alt={match.participant1.name}
                                    className="w-10 h-10 rounded-full border border-blue-500/30"
                                  />
                                )}
                                <div className="flex-1">
                                  <span className="text-white font-medium block">
                                    {team1Name}
                                  </span>
                                  {team1Members && (
                                    <span className="text-blue-300 text-sm">{team1Members}</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Marcador */}
                              <div className="flex items-center space-x-3 px-4">
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${
                                    match.winnerId === match.participant1?.id || match.winnerTeam === 1 ? 'text-green-400' : 'text-white'
                                  }`}>
                                    {match.score1}
                                  </div>
                                </div>
                                
                                <div className="text-blue-400 text-xl font-bold">
                                  {getMatchFormat(tournament.teamSize)}
                                </div>
                                
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${
                                    match.winnerId === match.participant2?.id || match.winnerTeam === 2 ? 'text-green-400' : 'text-white'
                                  }`}>
                                    {match.score2}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Participante 2 */}
                              <div className="flex items-center space-x-3 flex-1 justify-end">
                                <div className="flex-1 text-right">
                                  <span className="text-white font-medium block">
                                    {team2Name}
                                  </span>
                                  {team2Members && (
                                    <span className="text-blue-300 text-sm">{team2Members}</span>
                                  )}
                                </div>
                                {match.participant2?.avatar && (
                                  <img
                                    src={match.participant2.avatar}
                                    alt={match.participant2.name}
                                    className="w-10 h-10 rounded-full border border-blue-500/30"
                                  />
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
                          
                          {/* Imágenes de la partida */}
                          {images.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-blue-700/30">
                              <div className="flex items-center space-x-2 mb-3">
                                <Image className="w-4 h-4 text-purple-400" />
                                <span className="text-purple-300 font-medium text-sm">Imágenes de la partida</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {images.map((image) => (
                                  <div
                                    key={image.id}
                                    className="relative group cursor-pointer"
                                    onClick={() => setSelectedImage(image.imageUrl)}
                                  >
                                    <img
                                      src={image.imageUrl}
                                      alt={image.description || `Imagen ${getImageTypeText(image.imageType)}`}
                                      className="w-full h-24 object-cover rounded-lg border border-blue-600/30 hover:border-blue-500/50 transition-all duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                                      <Eye className="w-6 h-6 text-white" />
                                    </div>
                                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium border ${getImageTypeColor(image.imageType)}`}>
                                      {getImageTypeText(image.imageType)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {match.notes && (
                            <div className="mt-3 p-3 bg-slate-500/20 rounded-lg">
                              <p className="text-blue-200 text-sm italic">{match.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                      {getTypeText(tournament.type, tournament.teamSize)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-blue-400">Formato de Partidas:</span>
                    <span className="text-orange-300 font-bold">
                      {getMatchFormat(tournament.teamSize)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-blue-400">Bracket:</span>
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

      {/* Modal de imagen ampliada */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            {/* Botón de cerrar mejorado */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 z-10 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Imagen */}
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Indicador de tecla Escape */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
              <span className="text-white text-sm">Presiona <kbd className="px-2 py-1 bg-white/20 rounded text-xs">Esc</kbd> para cerrar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetail;