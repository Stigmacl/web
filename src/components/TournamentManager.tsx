import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2, Save, X, Users, Calendar, Target, Shield, User, Crown, Star, Zap, AlertTriangle, CheckCircle, Eye, Play, Settings, MapPin, Award, Clock, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TournamentBracket from './TournamentBracket';

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
  participant1?: any;
  participant2?: any;
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

interface Map {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageUrl?: string;
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
  const { user, users, clans } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [availableMaps, setAvailableMaps] = useState<Map[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'participants' | 'matches' | 'bracket'>('list');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);

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
    maps: [] as string[],
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

  useEffect(() => {
    loadTournaments();
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

  const loadMaps = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/maps/get-all.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setAvailableMaps(data.maps.filter((map: Map) => map.isActive));
      }
    } catch (error) {
      console.error('Error loading maps:', error);
    }
  };

  const handleCreateTournament = async () => {
    if (!newTournament.name.trim()) {
      alert('El nombre del torneo es requerido');
      return;
    }
    
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
          maps: [],
          bracketType: 'single_elimination'
        });
        await loadTournaments();
      } else {
        alert(data.message || 'Error al crear el torneo');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Error al crear el torneo');
    }
  };

  const handleUpdateTournament = async () => {
    if (!selectedTournament) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/update.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(selectedTournament)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        await loadTournaments();
      } else {
        alert(data.message || 'Error al actualizar el torneo');
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      alert('Error al actualizar el torneo');
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
        alert(data.message || 'Error al eliminar el torneo');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Error al eliminar el torneo');
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedTournament) return;
    
    // Validaciones según el tipo de participante
    if (newParticipant.participantType === 'user' && !newParticipant.participantId) {
      alert('Debe seleccionar un usuario');
      return;
    }
    
    if (newParticipant.participantType === 'clan' && !newParticipant.participantId) {
      alert('Debe seleccionar un clan');
      return;
    }
    
    if (newParticipant.participantType === 'team' && !newParticipant.teamName.trim()) {
      alert('Debe especificar el nombre del equipo');
      return;
    }
    
    // Para equipos con teamSize > 1, validar miembros
    if (selectedTournament.teamSize > 1 && newParticipant.teamMembers.length !== selectedTournament.teamSize) {
      alert(`El equipo debe tener exactamente ${selectedTournament.teamSize} miembros`);
      return;
    }
    
    try {
      const participantData = {
        tournamentId: selectedTournament.id,
        participantType: newParticipant.participantType,
        participantId: newParticipant.participantId,
        teamName: newParticipant.teamName || undefined,
        teamMembers: newParticipant.teamMembers.length > 0 ? newParticipant.teamMembers : undefined
      };
      
      const response = await fetch(`${API_BASE_URL}/tournaments/add-participant.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(participantData)
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
        await loadTournaments(); // Actualizar contador de participantes
      } else {
        alert(data.message || 'Error al agregar participante');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Error al agregar participante');
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
      
      if (data.success) {
        if (selectedTournament) {
          await loadParticipants(selectedTournament.id);
          await loadTournaments(); // Actualizar contador de participantes
        }
      } else {
        alert(data.message || 'Error al remover participante');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Error al remover participante');
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedTournament) return;
    
    try {
      const matchData = {
        tournamentId: selectedTournament.id,
        round: newMatch.round,
        matchNumber: newMatch.matchNumber,
        mapPlayed: newMatch.mapPlayed || undefined,
        scheduledAt: newMatch.scheduledAt || undefined,
        notes: newMatch.notes || undefined
      };
      
      // Agregar participantes según el tipo de torneo
      if (selectedTournament.teamSize === 1) {
        // Para 1v1
        Object.assign(matchData, {
          participant1Id: newMatch.participant1Id || undefined,
          participant2Id: newMatch.participant2Id || undefined
        });
      } else {
        // Para equipos múltiples
        Object.assign(matchData, {
          team1Participants: newMatch.team1Participants.length > 0 ? newMatch.team1Participants : undefined,
          team2Participants: newMatch.team2Participants.length > 0 ? newMatch.team2Participants : undefined
        });
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
        alert(data.message || 'Error al crear la partida');
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error al crear la partida');
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

  const handleMatchUpdate = (matchId: string, updates: any) => {
    setMatches(prev => prev.map(match => 
      match.id === matchId ? { ...match, ...updates } : match
    ));
    
    // Refrescar datos después de un breve delay
    setTimeout(() => {
      if (selectedTournament) {
        loadMatches(selectedTournament.id);
        loadParticipants(selectedTournament.id);
      }
    }, 1000);
  };

  const handleBracketRegenerate = () => {
    if (selectedTournament) {
      loadMatches(selectedTournament.id);
      loadParticipants(selectedTournament.id);
    }
  };

  // Verificar permisos de administrador
  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
        <p className="text-red-300">No tienes permisos para gestionar torneos</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-600/20 rounded-xl">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Gestión de Torneos</h3>
              <p className="text-yellow-300">Administra todos los aspectos de los torneos</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Torneo</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'list', label: 'Lista de Torneos', icon: Trophy },
            ...(selectedTournament ? [
              { id: 'participants', label: `Participantes (${participants.length})`, icon: Users },
              { id: 'matches', label: `Partidas (${matches.length})`, icon: Target },
              { id: 'bracket', label: 'Bracket', icon: Activity }
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
          
          {tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No hay torneos creados</h3>
              <p className="text-blue-300">Crea el primer torneo para comenzar</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => {
                const StatusIcon = getStatusIcon(tournament.status);
                
                return (
                  <div
                    key={tournament.id}
                    className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-lg mb-2">{tournament.name}</h4>
                        <div className="flex items-center space-x-2 mb-3">
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{getStatusText(tournament.status)}</span>
                          </div>
                          
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tournament.type === 'individual' 
                              ? 'bg-blue-500/20 text-blue-300' 
                              : tournament.type === 'clan'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-green-500/20 text-green-300'
                          }`}>
                            {getTypeText(tournament.type, tournament.teamSize)}
                          </div>
                        </div>
                        
                        {tournament.description && (
                          <p className="text-blue-200 text-sm mb-3 line-clamp-2">{tournament.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">Participantes:</span>
                        <span className="text-white font-medium">
                          {tournament.participantCount}/{tournament.maxParticipants}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">Bracket:</span>
                        <span className="text-white font-medium">{getBracketTypeText(tournament.bracketType)}</span>
                      </div>
                      
                      {tournament.prizePool && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-400">Premio:</span>
                          <span className="text-yellow-300 font-medium">{tournament.prizePool}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">Creado:</span>
                        <span className="text-white font-medium">{formatDate(tournament.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setActiveTab('participants');
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300 text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-green-600/20 hover:bg-green-600/40 rounded-lg text-green-300 transition-colors"
                        title="Editar torneo"
                      >
                        <Edit className="w-4 h-4" />
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'participants' && selectedTournament && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                Participantes de "{selectedTournament.name}" ({participants.length})
              </h3>
              <p className="text-blue-300 text-sm mt-1">
                Formato: {getTypeText(selectedTournament.type, selectedTournament.teamSize)}
              </p>
            </div>
            
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
              {participants.map((participant, index) => {
                const IconComponent = participant.clanIcon ? getClanIcon(participant.clanIcon).icon : Users;
                const iconColor = participant.clanIcon ? getClanIcon(participant.clanIcon).color : 'text-blue-400';
                
                return (
                  <div
                    key={participant.id}
                    className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-400 font-bold text-lg">#{index + 1}</span>
                          
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
                              <span className="font-bold text-white">
                                {participant.participantName}
                              </span>
                              
                              {participant.clanTag && (
                                <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-sm font-mono">
                                  [{participant.clanTag}]
                                </span>
                              )}
                              
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                participant.participantType === 'user' ? 'bg-blue-500/20 text-blue-300' :
                                participant.participantType === 'clan' ? 'bg-purple-500/20 text-purple-300' :
                                'bg-green-500/20 text-green-300'
                              }`}>
                                {participant.participantType === 'user' ? 'Usuario' :
                                 participant.participantType === 'clan' ? 'Clan' : 'Equipo'}
                              </span>
                            </div>
                            
                            {participant.teamMembers.length > 0 && (
                              <p className="text-blue-300 text-sm mt-1">
                                Miembros: {participant.teamMembers.join(', ')}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-blue-400 mt-1">
                              <span>Puntos: {participant.points}</span>
                              <span>V: {participant.wins}</span>
                              <span>D: {participant.losses}</span>
                              <span>Registrado: {formatDate(participant.registeredAt)}</span>
                            </div>
                          </div>
                        </div>
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'matches' && selectedTournament && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              Partidas de "{selectedTournament.name}" ({matches.length})
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
              <p className="text-blue-300">Crea partidas para organizar el torneo</p>
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
                  <h4 className="text-lg font-bold text-white mb-4">{round}</h4>
                  
                  <div className="space-y-4">
                    {roundMatches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-slate-600/40 rounded-lg p-4 border border-blue-600/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="text-center">
                              <span className="text-blue-400 text-sm">Partida {match.matchNumber}</span>
                            </div>
                            
                            <div className="flex items-center space-x-3 flex-1">
                              <span className="text-white font-medium">
                                {match.participant1?.name || 'TBD'}
                              </span>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-white">{match.score1}</span>
                                <span className="text-blue-400">-</span>
                                <span className="text-2xl font-bold text-white">{match.score2}</span>
                              </div>
                              
                              <span className="text-white font-medium">
                                {match.participant2?.name || 'TBD'}
                              </span>
                            </div>
                          </div>
                          
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
                        
                        {(match.mapPlayed || match.scheduledAt) && (
                          <div className="mt-3 flex items-center space-x-4 text-sm text-blue-400">
                            {match.mapPlayed && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{match.mapPlayed}</span>
                              </div>
                            )}
                            
                            {match.scheduledAt && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(match.scheduledAt)}</span>
                              </div>
                            )}
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
            participant1: m.participant1,
            participant2: m.participant2,
            team1Participants: m.team1Participants || [],
            team2Participants: m.team2Participants || [],
            winnerId: m.winnerId,
            winnerTeam: m.winnerTeam,
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
          onMatchUpdate={handleMatchUpdate}
          onBracketRegenerate={handleBracketRegenerate}
          onRefreshData={() => {
            if (selectedTournament) {
              loadMatches(selectedTournament.id);
              loadParticipants(selectedTournament.id);
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
                <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Torneo *</label>
                <input
                  type="text"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Nombre del torneo"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Descripción del torneo..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Torneo</label>
                  <select
                    value={newTournament.type}
                    onChange={(e) => {
                      const type = e.target.value as 'individual' | 'clan' | 'team';
                      setNewTournament({ 
                        ...newTournament, 
                        type,
                        teamSize: type === 'individual' ? 1 : newTournament.teamSize
                      });
                    }}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="individual">Individual</option>
                    <option value="clan">Por Clanes</option>
                    <option value="team">Por Equipos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tamaño de Equipo</label>
                  <select
                    value={newTournament.teamSize}
                    onChange={(e) => setNewTournament({ ...newTournament, teamSize: parseInt(e.target.value) })}
                    disabled={newTournament.type === 'individual'}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
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
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) || 8 })}
                    min="2"
                    max="64"
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Bracket</label>
                  <select
                    value={newTournament.bracketType}
                    onChange={(e) => setNewTournament({ ...newTournament, bracketType: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="single_elimination">Eliminación Simple</option>
                    <option value="double_elimination">Eliminación Doble</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="swiss">Sistema Suizo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Fecha de Inicio</label>
                  <input
                    type="datetime-local"
                    value={newTournament.startDate}
                    onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Fecha de Fin</label>
                  <input
                    type="datetime-local"
                    value={newTournament.endDate}
                    onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Premio</label>
                <input
                  type="text"
                  value={newTournament.prizePool}
                  onChange={(e) => setNewTournament({ ...newTournament, prizePool: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej: $100.000 CLP"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Reglas</label>
                <textarea
                  value={newTournament.rules}
                  onChange={(e) => setNewTournament({ ...newTournament, rules: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Reglas del torneo..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateTournament}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Crear Torneo</span>
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

      {/* Modal de editar torneo */}
      {showEditModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Torneo</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Torneo *</label>
                <input
                  type="text"
                  value={selectedTournament.name}
                  onChange={(e) => setSelectedTournament({ ...selectedTournament, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={selectedTournament.description}
                  onChange={(e) => setSelectedTournament({ ...selectedTournament, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Estado</label>
                  <select
                    value={selectedTournament.status}
                    onChange={(e) => setSelectedTournament({ ...selectedTournament, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="draft">Borrador</option>
                    <option value="registration">Registro Abierto</option>
                    <option value="active">En Progreso</option>
                    <option value="completed">Finalizado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Máximo Participantes</label>
                  <input
                    type="number"
                    value={selectedTournament.maxParticipants}
                    onChange={(e) => setSelectedTournament({ ...selectedTournament, maxParticipants: parseInt(e.target.value) || 8 })}
                    min="2"
                    max="64"
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Fecha de Inicio</label>
                  <input
                    type="datetime-local"
                    value={selectedTournament.startDate ? selectedTournament.startDate.slice(0, 16) : ''}
                    onChange={(e) => setSelectedTournament({ ...selectedTournament, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Fecha de Fin</label>
                  <input
                    type="datetime-local"
                    value={selectedTournament.endDate ? selectedTournament.endDate.slice(0, 16) : ''}
                    onChange={(e) => setSelectedTournament({ ...selectedTournament, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Premio</label>
                <input
                  type="text"
                  value={selectedTournament.prizePool || ''}
                  onChange={(e) => setSelectedTournament({ ...selectedTournament, prizePool: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej: $100.000 CLP"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Reglas</label>
                <textarea
                  value={selectedTournament.rules || ''}
                  onChange={(e) => setSelectedTournament({ ...selectedTournament, rules: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Reglas del torneo..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdateTournament}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
                
                <button
                  onClick={() => setShowEditModal(false)}
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
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Agregar Participante</h3>
              <button
                onClick={() => setShowAddParticipantModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Participante</label>
                <select
                  value={newParticipant.participantType}
                  onChange={(e) => {
                    setNewParticipant({ 
                      ...newParticipant, 
                      participantType: e.target.value as 'user' | 'clan' | 'team',
                      participantId: '',
                      teamName: '',
                      teamMembers: []
                    });
                  }}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="user">Usuario Individual</option>
                  <option value="clan">Clan</option>
                  <option value="team">Equipo Personalizado</option>
                </select>
              </div>

              {newParticipant.participantType === 'user' && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Seleccionar Usuario</label>
                  <select
                    value={newParticipant.participantId}
                    onChange={(e) => setNewParticipant({ ...newParticipant, participantId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Seleccionar usuario...</option>
                    {users.filter(u => u.isActive).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newParticipant.participantType === 'clan' && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Seleccionar Clan</label>
                  <select
                    value={newParticipant.participantId}
                    onChange={(e) => setNewParticipant({ ...newParticipant, participantId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Seleccionar clan...</option>
                    {clans.map((clan) => (
                      <option key={clan.id} value={clan.id}>
                        [{clan.tag}] {clan.name}
                      </option>
                    ))}
                  </select>
                  
                  {clans.length === 0 && (
                    <p className="text-yellow-300 text-sm mt-2">
                      ⚠️ No hay clanes disponibles. Crea clanes primero en la sección de administración.
                    </p>
                  )}
                </div>
              )}

              {newParticipant.participantType === 'team' && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Equipo</label>
                  <input
                    type="text"
                    value={newParticipant.teamName}
                    onChange={(e) => setNewParticipant({ ...newParticipant, teamName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Nombre del equipo personalizado"
                  />
                </div>
              )}

              {/* Selección de miembros para equipos múltiples */}
              {selectedTournament.teamSize > 1 && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Miembros del Equipo ({selectedTournament.teamSize} requeridos)
                  </label>
                  
                  <div className="space-y-2">
                    {Array.from({ length: selectedTournament.teamSize }, (_, index) => (
                      <select
                        key={index}
                        value={newParticipant.teamMembers[index] || ''}
                        onChange={(e) => {
                          const newMembers = [...newParticipant.teamMembers];
                          newMembers[index] = e.target.value;
                          setNewParticipant({ ...newParticipant, teamMembers: newMembers });
                        }}
                        className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="">Seleccionar jugador {index + 1}...</option>
                        {users.filter(u => u.isActive && !newParticipant.teamMembers.includes(u.id)).map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.username}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                  
                  <p className="text-blue-400 text-sm mt-2">
                    💡 Selecciona exactamente {selectedTournament.teamSize} jugadores para formar el equipo
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddParticipant}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Participante</span>
                </button>
                
                <button
                  onClick={() => setShowAddParticipantModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear partida */}
      {showCreateMatchModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Crear Nueva Partida</h3>
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
                    value={newMatch.round}
                    onChange={(e) => setNewMatch({ ...newMatch, round: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Número de Partida</label>
                  <input
                    type="number"
                    value={newMatch.matchNumber}
                    onChange={(e) => setNewMatch({ ...newMatch, matchNumber: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {selectedTournament.teamSize === 1 ? (
                // Para 1v1
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Participante 1</label>
                    <select
                      value={newMatch.participant1Id}
                      onChange={(e) => setNewMatch({ ...newMatch, participant1Id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Seleccionar participante...</option>
                      {participants.map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {participant.participantName}
                          {participant.clanTag && ` [${participant.clanTag}]`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Participante 2</label>
                    <select
                      value={newMatch.participant2Id}
                      onChange={(e) => setNewMatch({ ...newMatch, participant2Id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Seleccionar participante...</option>
                      {participants.filter(p => p.id !== newMatch.participant1Id).map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {participant.participantName}
                          {participant.clanTag && ` [${participant.clanTag}]`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                // Para equipos múltiples
                <div className="space-y-4">
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Equipo 1</label>
                    <div className="space-y-2">
                      {Array.from({ length: selectedTournament.teamSize }, (_, index) => (
                        <select
                          key={index}
                          value={newMatch.team1Participants[index] || ''}
                          onChange={(e) => {
                            const newTeam1 = [...newMatch.team1Participants];
                            newTeam1[index] = e.target.value;
                            setNewMatch({ ...newMatch, team1Participants: newTeam1 });
                          }}
                          className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="">Seleccionar jugador {index + 1}...</option>
                          {participants.filter(p => !newMatch.team1Participants.includes(p.id) && !newMatch.team2Participants.includes(p.id)).map((participant) => (
                            <option key={participant.id} value={participant.id}>
                              {participant.participantName}
                              {participant.clanTag && ` [${participant.clanTag}]`}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Equipo 2</label>
                    <div className="space-y-2">
                      {Array.from({ length: selectedTournament.teamSize }, (_, index) => (
                        <select
                          key={index}
                          value={newMatch.team2Participants[index] || ''}
                          onChange={(e) => {
                            const newTeam2 = [...newMatch.team2Participants];
                            newTeam2[index] = e.target.value;
                            setNewMatch({ ...newMatch, team2Participants: newTeam2 });
                          }}
                          className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="">Seleccionar jugador {index + 1}...</option>
                          {participants.filter(p => !newMatch.team1Participants.includes(p.id) && !newMatch.team2Participants.includes(p.id)).map((participant) => (
                            <option key={participant.id} value={participant.id}>
                              {participant.participantName}
                              {participant.clanTag && ` [${participant.clanTag}]`}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Mapa</label>
                <select
                  value={newMatch.mapPlayed}
                  onChange={(e) => setNewMatch({ ...newMatch, mapPlayed: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar mapa...</option>
                  {availableMaps.map((map) => (
                    <option key={map.id} value={map.displayName}>
                      {map.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Fecha Programada</label>
                <input
                  type="datetime-local"
                  value={newMatch.scheduledAt}
                  onChange={(e) => setNewMatch({ ...newMatch, scheduledAt: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Notas</label>
                <textarea
                  value={newMatch.notes}
                  onChange={(e) => setNewMatch({ ...newMatch, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateMatch}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Partida</span>
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