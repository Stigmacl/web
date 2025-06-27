import React, { useState, useEffect } from 'react';
import { Trophy, Users, Plus, Edit, Trash2, Save, X, Calendar, Award, Target, Shield, User, Crown, Star, Zap, Play, CheckCircle, Clock, AlertTriangle, Eye, Settings, MapPin, RefreshCw } from 'lucide-react';
import TournamentBracket from './TournamentBracket';
import { useAuth } from '../contexts/AuthContext';

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

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  clan?: string;
  isActive: boolean;
}

interface Map {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  imageUrl?: string;
  gameMode?: string;
  isActive: boolean;
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

const TournamentManager: React.FC = () => {
  const { clans } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'participants' | 'matches' | 'bracket'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    type: 'individual' as 'individual' | 'clan' | 'team',
    teamSize: 1,
    maxParticipants: 8,
    status: 'draft' as 'draft' | 'registration' | 'active' | 'completed' | 'cancelled',
    startDate: '',
    endDate: '',
    prizePool: '',
    rules: '',
    bracketType: 'single_elimination' as 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss'
  });

  const [newParticipant, setNewParticipant] = useState({
    participantType: 'user' as 'user' | 'clan' | 'team',
    participantId: '',
    teamName: '',
    teamMembers: [] as string[]
  });

  const [newMatch, setNewMatch] = useState({
    round: 1,
    matchNumber: 1,
    participant1Id: '',
    participant2Id: '',
    team1Participants: [] as string[],
    team2Participants: [] as string[],
    mapPlayed: '',
    scheduledAt: '',
    notes: ''
  });

  const [teamCreationMode, setTeamCreationMode] = useState<'single' | 'multiple'>('single');
  const [multipleTeamsData, setMultipleTeamsData] = useState({
    numberOfTeams: 4,
    teamSize: 3,
    teamNames: ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4'],
    selectedUsers: [] as string[]
  });

  useEffect(() => {
    loadTournaments();
    loadUsers();
    loadMaps();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadParticipants(selectedTournament.id);
      loadMatches(selectedTournament.id);
    }
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/tournaments/get-all.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
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

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/get-all.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users.filter((user: User) => user.isActive));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMaps = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/maps/get-all.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setMaps(data.maps.filter((map: Map) => map.isActive));
      }
    } catch (error) {
      console.error('Error loading maps:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadTournaments();
      if (selectedTournament) {
        await Promise.all([
          loadParticipants(selectedTournament.id),
          loadMatches(selectedTournament.id)
        ]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateTournament = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newTournament)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setNewTournament({
          name: '',
          description: '',
          type: 'individual',
          teamSize: 1,
          maxParticipants: 8,
          status: 'draft',
          startDate: '',
          endDate: '',
          prizePool: '',
          rules: '',
          bracketType: 'single_elimination'
        });
        await loadTournaments();
      } else {
        alert('Error al crear el torneo: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Error al crear el torneo');
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedTournament) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/add-participant.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          participantType: newParticipant.participantType,
          participantId: newParticipant.participantId,
          teamName: newParticipant.teamName,
          teamMembers: newParticipant.teamMembers
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowAddParticipantModal(false);
        setNewParticipant({
          participantType: 'user',
          participantId: '',
          teamName: '',
          teamMembers: []
        });
        await loadParticipants(selectedTournament.id);
        await loadTournaments(); // Actualizar contador
      } else {
        alert('Error al agregar participante: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Error al agregar participante');
    }
  };

  const handleCreateMultipleTeams = async () => {
    if (!selectedTournament) return;

    try {
      const { numberOfTeams, teamSize, teamNames, selectedUsers } = multipleTeamsData;
      
      // Verificar que tengamos suficientes usuarios
      if (selectedUsers.length < numberOfTeams * teamSize) {
        alert(`Necesitas seleccionar al menos ${numberOfTeams * teamSize} usuarios para crear ${numberOfTeams} equipos de ${teamSize} jugadores cada uno.`);
        return;
      }

      // Crear equipos automáticamente
      for (let i = 0; i < numberOfTeams; i++) {
        const teamMembers = selectedUsers.slice(i * teamSize, (i + 1) * teamSize);
        const teamName = teamNames[i] || `Equipo ${i + 1}`;

        const response = await fetch(`${API_BASE_URL}/tournaments/add-participant.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            tournamentId: selectedTournament.id,
            participantType: 'team',
            teamName: teamName,
            teamMembers: teamMembers
          })
        });

        const data = await response.json();
        
        if (!data.success) {
          console.error(`Error creando ${teamName}:`, data.message);
          alert(`Error al crear ${teamName}: ${data.message}`);
          return;
        }
      }

      setShowAddParticipantModal(false);
      setMultipleTeamsData({
        numberOfTeams: 4,
        teamSize: 3,
        teamNames: ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4'],
        selectedUsers: []
      });
      await loadParticipants(selectedTournament.id);
      await loadTournaments();
      
      alert(`Se crearon ${numberOfTeams} equipos exitosamente!`);
    } catch (error) {
      console.error('Error creating multiple teams:', error);
      alert('Error al crear los equipos');
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedTournament) return;

    try {
      const matchData: any = {
        tournamentId: selectedTournament.id,
        round: newMatch.round,
        matchNumber: newMatch.matchNumber,
        mapPlayed: newMatch.mapPlayed,
        scheduledAt: newMatch.scheduledAt,
        notes: newMatch.notes
      };

      // Agregar participantes según el tipo de torneo
      if (selectedTournament.teamSize > 1) {
        matchData.team1Participants = newMatch.team1Participants;
        matchData.team2Participants = newMatch.team2Participants;
      } else {
        matchData.participant1Id = newMatch.participant1Id;
        matchData.participant2Id = newMatch.participant2Id;
      }

      const response = await fetch(`${API_BASE_URL}/tournaments/create-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(matchData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateMatchModal(false);
        setNewMatch({
          round: 1,
          matchNumber: 1,
          participant1Id: '',
          participant2Id: '',
          team1Participants: [],
          team2Participants: [],
          mapPlayed: '',
          scheduledAt: '',
          notes: ''
        });
        await loadMatches(selectedTournament.id);
      } else {
        alert('Error al crear la partida: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error al crear la partida');
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este torneo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/delete.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id: tournamentId })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadTournaments();
        if (selectedTournament?.id === tournamentId) {
          setSelectedTournament(null);
          setActiveTab('list');
        }
      } else {
        alert('Error al eliminar el torneo: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Error al eliminar el torneo');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover este participante?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/remove-participant.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ participantId })
      });

      const data = await response.json();
      
      if (data.success && selectedTournament) {
        await loadParticipants(selectedTournament.id);
        await loadTournaments();
      } else {
        alert('Error al remover participante: ' + data.message);
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Error al remover participante');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchFormat = (teamSize: number) => {
    return teamSize === 1 ? '1v1' : `${teamSize}v${teamSize}`;
  };

  const getAvailableParticipants = () => {
    if (!selectedTournament) return [];
    
    return participants.filter(p => p.status === 'registered' || p.status === 'active');
  };

  const renderParticipantSelector = (
    value: string | string[], 
    onChange: (value: string | string[]) => void, 
    label: string,
    isMultiple: boolean = false
  ) => {
    const availableParticipants = getAvailableParticipants();
    
    if (isMultiple) {
      return (
        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">{label}</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableParticipants.map((participant) => (
              <label key={participant.id} className="flex items-center space-x-3 p-2 bg-slate-700/40 rounded-lg cursor-pointer hover:bg-slate-700/60">
                <input
                  type="checkbox"
                  checked={(value as string[]).includes(participant.id)}
                  onChange={(e) => {
                    const currentValue = value as string[];
                    if (e.target.checked) {
                      onChange([...currentValue, participant.id]);
                    } else {
                      onChange(currentValue.filter(id => id !== participant.id));
                    }
                  }}
                  className="rounded border-blue-600/30"
                />
                <div className="flex items-center space-x-2">
                  {participant.participantAvatar && (
                    <img
                      src={participant.participantAvatar}
                      alt={participant.participantName}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-white">
                    {participant.participantType === 'team' && participant.teamName 
                      ? participant.teamName 
                      : participant.participantName}
                  </span>
                  {participant.teamMembers.length > 0 && (
                    <span className="text-blue-300 text-sm">
                      ({participant.teamMembers.join(', ')})
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-blue-300 text-sm font-medium mb-2">{label}</label>
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Seleccionar participante</option>
          {availableParticipants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.participantType === 'team' && participant.teamName 
                ? `${participant.teamName} (${participant.teamMembers.join(', ')})` 
                : `${participant.participantName}${participant.teamMembers.length > 0 ? ` (${participant.teamMembers.join(', ')})` : ''}`}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-600/20 rounded-xl">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Gestión de Torneos</h2>
              <p className="text-blue-300">Administra torneos, participantes y partidas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className={`p-3 rounded-lg transition-all duration-300 ${
                isRefreshing 
                  ? 'bg-blue-600/20 text-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200'
              }`}
              title="Actualizar datos"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Torneo</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-2">
          {[
            { id: 'list', label: 'Lista de Torneos', icon: Trophy },
            ...(selectedTournament ? [
              { id: 'participants', label: `Participantes (${participants.length})`, icon: Users },
              { id: 'matches', label: `Partidas (${matches.length})`, icon: Target },
              { id: 'bracket', label: 'Bracket', icon: Eye }
            ] : [])
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Torneos ({tournaments.length})</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No hay torneos</h3>
              <p className="text-blue-300">Crea tu primer torneo para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => {
                const StatusIcon = getStatusIcon(tournament.status);
                
                return (
                  <div
                    key={tournament.id}
                    className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-white">{tournament.name}</h4>
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{tournament.status}</span>
                          </div>
                          <span className="px-2 py-1 bg-orange-600/20 text-orange-300 rounded text-xs font-bold">
                            {getMatchFormat(tournament.teamSize)}
                          </span>
                        </div>
                        
                        {tournament.description && (
                          <p className="text-blue-200 mb-3">{tournament.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm text-blue-400">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{tournament.participantCount}/{tournament.maxParticipants}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>{tournament.bracketType.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(tournament.createdAt)}</span>
                          </div>
                          {tournament.prizePool && (
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-300">{tournament.prizePool}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTournament(tournament);
                            setActiveTab('participants');
                          }}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                          title="Gestionar torneo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTournament(tournament.id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                          title="Eliminar torneo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'participants' && selectedTournament && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              Participantes de {selectedTournament.name} ({participants.length})
            </h3>
            <button
              onClick={() => setShowAddParticipantModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Participante</span>
            </button>
          </div>
          
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Sin participantes</h3>
              <p className="text-blue-300">Agrega participantes para comenzar el torneo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 font-bold">#{index + 1}</span>
                        {participant.participantAvatar && (
                          <img
                            src={participant.participantAvatar}
                            alt={participant.participantName}
                            className="w-10 h-10 rounded-full border border-blue-500/30"
                          />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">
                            {participant.participantType === 'team' && participant.teamName 
                              ? participant.teamName 
                              : participant.participantName}
                          </span>
                          {participant.clanTag && (
                            <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-sm font-mono">
                              [{participant.clanTag}]
                            </span>
                          )}
                          <span className="px-2 py-1 bg-orange-600/20 text-orange-300 rounded text-sm font-bold">
                            {getMatchFormat(selectedTournament.teamSize)}
                          </span>
                        </div>
                        {participant.teamMembers.length > 0 && (
                          <p className="text-blue-300 text-sm">
                            Miembros: {participant.teamMembers.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-400">{participant.points}</p>
                        <p className="text-blue-300 text-xs">Puntos</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-400">{participant.wins}</p>
                        <p className="text-blue-300 text-xs">Victorias</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-400">{participant.losses}</p>
                        <p className="text-blue-300 text-xs">Derrotas</p>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                        title="Remover participante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'matches' && selectedTournament && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              Partidas de {selectedTournament.name} ({matches.length}) - {getMatchFormat(selectedTournament.teamSize)}
            </h3>
            <button
              onClick={() => setShowCreateMatchModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Partida</span>
            </button>
          </div>
          
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Sin partidas</h3>
              <p className="text-blue-300">Crea partidas para comenzar el torneo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-blue-400 font-bold">R{match.round}</p>
                        <p className="text-blue-300 text-xs">M{match.matchNumber}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-white font-medium">
                            {match.participant1?.name || 'TBD'}
                          </p>
                          <p className="text-blue-300 text-xs">{getMatchFormat(selectedTournament.teamSize)}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-blue-400 font-bold">VS</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-white font-medium">
                            {match.participant2?.name || 'TBD'}
                          </p>
                          <p className="text-blue-300 text-xs">{getMatchFormat(selectedTournament.teamSize)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{match.score1} - {match.score2}</p>
                        <p className={`text-xs px-2 py-1 rounded ${
                          match.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          match.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {match.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bracket' && selectedTournament && (
        <TournamentBracket
          tournamentId={selectedTournament.id}
          tournamentType={selectedTournament.type}
          teamSize={selectedTournament.teamSize}
          participants={participants.map(p => ({
            id: p.id,
            participantType: p.participantType,
            participantId: p.participantId,
            participantName: p.participantName,
            participantAvatar: p.participantAvatar,
            clanTag: p.clanTag,
            teamName: p.teamName,
            teamMembers: p.teamMembers
          }))}
          matches={matches.map(m => ({
            id: m.id,
            round: m.round,
            matchNumber: m.matchNumber,
            participant1: m.participant1 ? {
              id: m.participant1.id,
              participantType: m.participant1.type as 'user' | 'clan' | 'team',
              participantId: m.participant1.id,
              participantName: m.participant1.name,
              participantAvatar: m.participant1.avatar,
              clanTag: m.participant1.clanTag,
              teamName: m.participant1.teamName
            } : undefined,
            participant2: m.participant2 ? {
              id: m.participant2.id,
              participantType: m.participant2.type as 'user' | 'clan' | 'team',
              participantId: m.participant2.id,
              participantName: m.participant2.name,
              participantAvatar: m.participant2.avatar,
              clanTag: m.participant2.clanTag,
              teamName: m.participant2.teamName
            } : undefined,
            winnerId: m.winnerId,
            score1: m.score1,
            score2: m.score2,
            status: m.status,
            scheduledAt: m.scheduledAt,
            completedAt: m.completedAt,
            mapPlayed: m.mapPlayed,
            notes: m.notes,
            position: { x: 0, y: 0 }
          }))}
          bracketType={selectedTournament.bracketType}
          isAdmin={true}
          onMatchUpdate={(matchId, updates) => {
            setMatches(prev => prev.map(match => 
              match.id === matchId ? { ...match, ...updates } : match
            ));
          }}
          onBracketRegenerate={() => {
            if (selectedTournament) {
              loadMatches(selectedTournament.id);
            }
          }}
          onRefreshData={() => {
            if (selectedTournament) {
              Promise.all([
                loadParticipants(selectedTournament.id),
                loadMatches(selectedTournament.id)
              ]);
            }
          }}
        />
      )}

      {/* Modal de crear torneo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Crear Nuevo Torneo</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Torneo</label>
                <input
                  type="text"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
                  placeholder="Nombre del torneo"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Descripción del torneo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Torneo</label>
                  <select
                    value={newTournament.type}
                    onChange={(e) => setNewTournament({ 
                      ...newTournament, 
                      type: e.target.value as 'individual' | 'clan' | 'team',
                      teamSize: e.target.value === 'individual' ? 1 : newTournament.teamSize
                    })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="individual">Individual</option>
                    <option value="clan">Por Clanes</option>
                    <option value="team">Por Equipos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Tamaño de Equipo {newTournament.type !== 'individual' && '(Jugadores por equipo)'}
                  </label>
                  <select
                    value={newTournament.teamSize}
                    onChange={(e) => setNewTournament({ ...newTournament, teamSize: parseInt(e.target.value) })}
                    disabled={newTournament.type === 'individual'}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value={1}>1v1</option>
                    <option value={2}>2v2</option>
                    <option value={3}>3v3</option>
                    <option value={4}>4v4</option>
                    <option value={5}>5v5</option>
                    <option value={6}>6v6</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Máximo Participantes</label>
                  <input
                    type="number"
                    min="2"
                    max="64"
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Bracket</label>
                  <select
                    value={newTournament.bracketType}
                    onChange={(e) => setNewTournament({ ...newTournament, bracketType: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="single_elimination">Eliminación Simple</option>
                    <option value="double_elimination">Eliminación Doble</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Premio (Opcional)</label>
                <input
                  type="text"
                  value={newTournament.prizePool}
                  onChange={(e) => setNewTournament({ ...newTournament, prizePool: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
                  placeholder="Ej: $100.000 CLP"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateTournament}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  Crear Torneo
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de agregar participante */}
      {showAddParticipantModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Agregar Participante - {getMatchFormat(selectedTournament.teamSize)}
              </h3>
              <button
                onClick={() => setShowAddParticipantModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de modo de creación de equipos */}
            {selectedTournament.type === 'team' && (
              <div className="mb-6">
                <label className="block text-blue-300 text-sm font-medium mb-2">Modo de Creación</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTeamCreationMode('single')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      teamCreationMode === 'single'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/40 text-blue-300 hover:bg-slate-700/60'
                    }`}
                  >
                    Equipo Individual
                  </button>
                  <button
                    onClick={() => setTeamCreationMode('multiple')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      teamCreationMode === 'multiple'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/40 text-blue-300 hover:bg-slate-700/60'
                    }`}
                  >
                    Múltiples Equipos
                  </button>
                </div>
              </div>
            )}

            {teamCreationMode === 'single' || selectedTournament.type !== 'team' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Participante</label>
                  <select
                    value={newParticipant.participantType}
                    onChange={(e) => setNewParticipant({ 
                      ...newParticipant, 
                      participantType: e.target.value as 'user' | 'clan' | 'team',
                      participantId: '',
                      teamMembers: []
                    })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="user">Usuario Individual</option>
                    <option value="clan">Clan</option>
                    <option value="team">Equipo Personalizado</option>
                  </select>
                </div>

                {newParticipant.participantType === 'user' && (
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Usuario</label>
                    <select
                      value={newParticipant.participantId}
                      onChange={(e) => setNewParticipant({ ...newParticipant, participantId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar usuario</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newParticipant.participantType === 'clan' && (
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Clan</label>
                    <select
                      value={newParticipant.participantId}
                      onChange={(e) => setNewParticipant({ ...newParticipant, participantId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar clan</option>
                      {clans.map((clan) => (
                        <option key={clan.id} value={clan.id}>
                          [{clan.tag}] {clan.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newParticipant.participantType === 'team' && (
                  <>
                    <div>
                      <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Equipo</label>
                      <input
                        type="text"
                        value={newParticipant.teamName}
                        onChange={(e) => setNewParticipant({ ...newParticipant, teamName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
                        placeholder="Nombre del equipo"
                      />
                    </div>

                    <div>
                      <label className="block text-blue-300 text-sm font-medium mb-2">
                        Miembros del Equipo ({selectedTournament.teamSize} jugadores)
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {users.map((user) => (
                          <label key={user.id} className="flex items-center space-x-3 p-2 bg-slate-700/40 rounded-lg cursor-pointer hover:bg-slate-700/60">
                            <input
                              type="checkbox"
                              checked={newParticipant.teamMembers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (newParticipant.teamMembers.length < selectedTournament.teamSize) {
                                    setNewParticipant({
                                      ...newParticipant,
                                      teamMembers: [...newParticipant.teamMembers, user.id]
                                    });
                                  }
                                } else {
                                  setNewParticipant({
                                    ...newParticipant,
                                    teamMembers: newParticipant.teamMembers.filter(id => id !== user.id)
                                  });
                                }
                              }}
                              disabled={!newParticipant.teamMembers.includes(user.id) && newParticipant.teamMembers.length >= selectedTournament.teamSize}
                              className="rounded border-blue-600/30"
                            />
                            <div className="flex items-center space-x-2">
                              {user.avatar && (
                                <img
                                  src={user.avatar}
                                  alt={user.username}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <span className="text-white">{user.username}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-blue-400 text-sm mt-2">
                        Seleccionados: {newParticipant.teamMembers.length}/{selectedTournament.teamSize}
                      </p>
                    </div>
                  </>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleAddParticipant}
                    disabled={
                      !newParticipant.participantId && newParticipant.participantType !== 'team' ||
                      (newParticipant.participantType === 'team' && (!newParticipant.teamName || newParticipant.teamMembers.length !== selectedTournament.teamSize))
                    }
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                  >
                    Agregar Participante
                  </button>
                  <button
                    onClick={() => setShowAddParticipantModal(false)}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Número de Equipos</label>
                    <input
                      type="number"
                      min="2"
                      max="16"
                      value={multipleTeamsData.numberOfTeams}
                      onChange={(e) => {
                        const numberOfTeams = parseInt(e.target.value);
                        setMultipleTeamsData({
                          ...multipleTeamsData,
                          numberOfTeams,
                          teamNames: Array.from({ length: numberOfTeams }, (_, i) => `Equipo ${i + 1}`)
                        });
                      }}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Jugadores por Equipo</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={multipleTeamsData.teamSize}
                      onChange={(e) => setMultipleTeamsData({ ...multipleTeamsData, teamSize: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Nombres de Equipos</label>
                  <div className="grid grid-cols-2 gap-2">
                    {multipleTeamsData.teamNames.map((name, index) => (
                      <input
                        key={index}
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const newNames = [...multipleTeamsData.teamNames];
                          newNames[index] = e.target.value;
                          setMultipleTeamsData({ ...multipleTeamsData, teamNames: newNames });
                        }}
                        className="px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder={`Equipo ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Seleccionar Jugadores ({multipleTeamsData.selectedUsers.length}/{multipleTeamsData.numberOfTeams * multipleTeamsData.teamSize} necesarios)
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center space-x-3 p-2 bg-slate-700/40 rounded-lg cursor-pointer hover:bg-slate-700/60">
                        <input
                          type="checkbox"
                          checked={multipleTeamsData.selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (multipleTeamsData.selectedUsers.length < multipleTeamsData.numberOfTeams * multipleTeamsData.teamSize) {
                                setMultipleTeamsData({
                                  ...multipleTeamsData,
                                  selectedUsers: [...multipleTeamsData.selectedUsers, user.id]
                                });
                              }
                            } else {
                              setMultipleTeamsData({
                                ...multipleTeamsData,
                                selectedUsers: multipleTeamsData.selectedUsers.filter(id => id !== user.id)
                              });
                            }
                          }}
                          disabled={!multipleTeamsData.selectedUsers.includes(user.id) && multipleTeamsData.selectedUsers.length >= multipleTeamsData.numberOfTeams * multipleTeamsData.teamSize}
                          className="rounded border-blue-600/30"
                        />
                        <div className="flex items-center space-x-2">
                          {user.avatar && (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="text-white">{user.username}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="text-blue-300 font-medium mb-2">Vista Previa de Equipos:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {multipleTeamsData.teamNames.map((teamName, index) => {
                      const teamMembers = multipleTeamsData.selectedUsers.slice(
                        index * multipleTeamsData.teamSize, 
                        (index + 1) * multipleTeamsData.teamSize
                      );
                      
                      return (
                        <div key={index} className="bg-slate-700/40 rounded-lg p-3">
                          <p className="text-white font-medium">{teamName}</p>
                          <div className="text-blue-300 text-sm">
                            {teamMembers.map(userId => {
                              const user = users.find(u => u.id === userId);
                              return user?.username;
                            }).filter(Boolean).join(', ') || 'Sin miembros'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateMultipleTeams}
                    disabled={multipleTeamsData.selectedUsers.length < multipleTeamsData.numberOfTeams * multipleTeamsData.teamSize}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                  >
                    Crear {multipleTeamsData.numberOfTeams} Equipos
                  </button>
                  <button
                    onClick={() => setShowAddParticipantModal(false)}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de crear partida */}
      {showCreateMatchModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Crear Partida - {getMatchFormat(selectedTournament.teamSize)}
              </h3>
              <button
                onClick={() => setShowCreateMatchModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Ronda</label>
                  <input
                    type="number"
                    min="1"
                    value={newMatch.round}
                    onChange={(e) => setNewMatch({ ...newMatch, round: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Número de Partida</label>
                  <input
                    type="number"
                    min="1"
                    value={newMatch.matchNumber}
                    onChange={(e) => setNewMatch({ ...newMatch, matchNumber: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {selectedTournament.teamSize > 1 ? (
                <>
                  {renderParticipantSelector(
                    newMatch.team1Participants,
                    (value) => setNewMatch({ ...newMatch, team1Participants: value as string[] }),
                    `Equipo 1 (${getMatchFormat(selectedTournament.teamSize)})`,
                    true
                  )}

                  {renderParticipantSelector(
                    newMatch.team2Participants,
                    (value) => setNewMatch({ ...newMatch, team2Participants: value as string[] }),
                    `Equipo 2 (${getMatchFormat(selectedTournament.teamSize)})`,
                    true
                  )}
                </>
              ) : (
                <>
                  {renderParticipantSelector(
                    newMatch.participant1Id,
                    (value) => setNewMatch({ ...newMatch, participant1Id: value as string }),
                    'Participante 1'
                  )}

                  {renderParticipantSelector(
                    newMatch.participant2Id,
                    (value) => setNewMatch({ ...newMatch, participant2Id: value as string }),
                    'Participante 2'
                  )}
                </>
              )}

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Mapa (Opcional)</label>
                <select
                  value={newMatch.mapPlayed}
                  onChange={(e) => setNewMatch({ ...newMatch, mapPlayed: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar mapa</option>
                  {maps.map((map) => (
                    <option key={map.id} value={map.displayName}>
                      {map.displayName} - {map.gameMode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Fecha Programada (Opcional)</label>
                <input
                  type="datetime-local"
                  value={newMatch.scheduledAt}
                  onChange={(e) => setNewMatch({ ...newMatch, scheduledAt: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Notas (Opcional)</label>
                <textarea
                  value={newMatch.notes}
                  onChange={(e) => setNewMatch({ ...newMatch, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Notas adicionales sobre la partida"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateMatch}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  Crear Partida
                </button>
                <button
                  onClick={() => setShowCreateMatchModal(false)}
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

export default TournamentManager;