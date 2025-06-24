import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2, Users, Target, Calendar, MapPin, Save, X, Play, Settings, Award, Crown, Shield, Star, Zap, Eye, UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [availableMaps, setAvailableMaps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'participants' | 'matches'>('list');
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  
  // Estados de formularios
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    type: 'individual' as 'individual' | 'clan',
    teamSize: 1,
    maxParticipants: 16,
    status: 'draft' as 'draft' | 'registration' | 'active' | 'completed' | 'cancelled',
    startDate: '',
    endDate: '',
    prizePool: '',
    rules: '',
    maps: [] as string[],
    bracketType: 'single_elimination' as 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss'
  });

  const [newParticipant, setNewParticipant] = useState({
    participantType: 'user' as 'user' | 'clan',
    participantId: '',
    teamName: ''
  });

  const [newMatch, setNewMatch] = useState({
    round: 1,
    matchNumber: 1,
    participant1Id: '',
    participant2Id: '',
    mapPlayed: '',
    scheduledAt: '',
    notes: ''
  });

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    loadTournaments();
    loadAvailableMaps();
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

  const loadAvailableMaps = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/maps/get-all.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const mapNames = data.maps.map((map: any) => map.displayName || map.name);
        setAvailableMaps(mapNames);
      }
    } catch (error) {
      console.error('Error loading maps:', error);
      // Mapas por defecto si no se pueden cargar
      setAvailableMaps(['TO-DUST2', 'TO-INFERNO', 'TO-NUKE', 'TO-TRAIN', 'TO-MIRAGE']);
    }
  };

  const handleCreateTournament = async () => {
    if (!newTournament.name.trim()) return;
    
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
          maxParticipants: 16,
          status: 'draft',
          startDate: '',
          endDate: '',
          prizePool: '',
          rules: '',
          maps: [],
          bracketType: 'single_elimination'
        });
        loadTournaments();
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
        body: JSON.stringify({ id: selectedTournament.id, ...newTournament })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        setSelectedTournament(null);
        loadTournaments();
      } else {
        alert(data.message || 'Error al actualizar el torneo');
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      alert('Error al actualizar el torneo');
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este torneo? Esta acción no se puede deshacer.')) return;
    
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
        loadTournaments();
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
    if (!selectedTournament || !newParticipant.participantId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/add-participant.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          ...newParticipant
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowAddParticipantModal(false);
        setNewParticipant({
          participantType: 'user',
          participantId: '',
          teamName: ''
        });
        loadParticipants(selectedTournament.id);
        loadTournaments(); // Para actualizar el contador
      } else {
        alert(data.message || 'Error al agregar participante');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Error al agregar participante');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover este participante?')) return;
    
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
          loadParticipants(selectedTournament.id);
          loadTournaments(); // Para actualizar el contador
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
      const response = await fetch(`${API_BASE_URL}/tournaments/create-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          ...newMatch
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateMatchModal(false);
        setNewMatch({
          round: 1,
          matchNumber: 1,
          participant1Id: '',
          participant2Id: '',
          mapPlayed: '',
          scheduledAt: '',
          notes: ''
        });
        loadMatches(selectedTournament.id);
      } else {
        alert(data.message || 'Error al crear la partida');
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error al crear la partida');
    }
  };

  const handleUpdateMatch = async () => {
    if (!selectedMatch) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/update-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          matchId: selectedMatch.id,
          winnerId: newMatch.participant1Id, // Esto debería ser el ID del ganador
          score1: parseInt(newMatch.round.toString()) || 0, // Reutilizando campos para score
          score2: parseInt(newMatch.matchNumber.toString()) || 0,
          mapPlayed: newMatch.mapPlayed,
          status: 'completed',
          notes: newMatch.notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEditMatchModal(false);
        setSelectedMatch(null);
        if (selectedTournament) {
          loadMatches(selectedTournament.id);
          loadParticipants(selectedTournament.id); // Para actualizar estadísticas
        }
      } else {
        alert(data.message || 'Error al actualizar la partida');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Error al actualizar la partida');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta partida?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/delete-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ matchId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (selectedTournament) {
          loadMatches(selectedTournament.id);
        }
      } else {
        alert(data.message || 'Error al eliminar la partida');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error al eliminar la partida');
    }
  };

  const openEditModal = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setNewTournament({
      name: tournament.name,
      description: tournament.description,
      type: tournament.type,
      teamSize: tournament.teamSize,
      maxParticipants: tournament.maxParticipants,
      status: tournament.status,
      startDate: tournament.startDate || '',
      endDate: tournament.endDate || '',
      prizePool: tournament.prizePool || '',
      rules: tournament.rules || '',
      maps: tournament.maps || [],
      bracketType: tournament.bracketType
    });
    setShowEditModal(true);
  };

  const openEditMatchModal = (match: Match) => {
    setSelectedMatch(match);
    setNewMatch({
      round: match.score1, // Reutilizando para mostrar score actual
      matchNumber: match.score2,
      participant1Id: match.winnerId || '',
      participant2Id: '',
      mapPlayed: match.mapPlayed || '',
      scheduledAt: match.scheduledAt || '',
      notes: match.notes || ''
    });
    setShowEditMatchModal(true);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
        <p className="text-red-300">No tienes permisos para gestionar torneos</p>
      </div>
    );
  }

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
          
          {activeTab === 'list' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Torneo</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedTournament(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Lista de Torneos</span>
          </button>
          
          {selectedTournament && (
            <>
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'participants'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Participantes ({participants.length})</span>
              </button>
              
              <button
                onClick={() => setActiveTab('matches')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'matches'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Partidas ({matches.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Torneos Disponibles</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No hay torneos</h3>
              <p className="text-blue-300">Crea el primer torneo para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-bold text-white">{tournament.name}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                          {tournament.status === 'draft' ? 'Borrador' :
                           tournament.status === 'registration' ? 'Registro Abierto' :
                           tournament.status === 'active' ? 'En Progreso' :
                           tournament.status === 'completed' ? 'Finalizado' :
                           'Cancelado'}
                        </div>
                      </div>
                      
                      {tournament.description && (
                        <p className="text-blue-200 text-sm mb-3">{tournament.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-blue-400">
                        <span>Participantes: {tournament.participantCount}/{tournament.maxParticipants}</span>
                        <span>Tipo: {tournament.type === 'individual' ? 'Individual' : 'Por Clanes'}</span>
                        <span>Creado: {formatDate(tournament.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setActiveTab('participants');
                        }}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => openEditModal(tournament)}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'participants' && selectedTournament && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              Participantes de "{selectedTournament.name}"
            </h3>
            <button
              onClick={() => setShowAddParticipantModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
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
                  <div key={participant.id} className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
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
                            <span className="font-bold text-white">{participant.participantName}</span>
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
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-400">{participant.points}</p>
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
                        
                        <button
                          onClick={() => handleRemoveParticipant(participant.id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                          title="Remover participante"
                        >
                          <UserMinus className="w-4 h-4" />
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

      {activeTab === 'matches' && selectedTournament && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              Partidas de "{selectedTournament.name}"
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
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-orange-400" />
                    <span>{round}</span>
                  </h4>
                  
                  <div className="space-y-4">
                    {roundMatches.map((match) => (
                      <div key={match.id} className="bg-slate-600/40 rounded-lg p-4 border border-blue-600/20">
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
                          
                          {/* Acciones */}
                          <div className="flex items-center space-x-2 ml-6">
                            <button
                              onClick={() => openEditMatchModal(match)}
                              className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                              title="Editar partida"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                              title="Eliminar partida"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                            
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                          
                          {match.scheduledAt && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-300">
                                {formatDate(match.scheduledAt)}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Torneo</label>
                  <input
                    type="text"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Nombre del torneo"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Máximo de Participantes</label>
                  <input
                    type="number"
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) || 16 })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                    min="2"
                    max="64"
                  />
                </div>
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
                    onChange={(e) => setNewTournament({ ...newTournament, type: e.target.value as 'individual' | 'clan' })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="individual">Individual</option>
                    <option value="clan">Por Clanes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Estado</label>
                  <select
                    value={newTournament.status}
                    onChange={(e) => setNewTournament({ ...newTournament, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="draft">Borrador</option>
                    <option value="registration">Registro Abierto</option>
                    <option value="active">En Progreso</option>
                    <option value="completed">Finalizado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Torneo</label>
                  <input
                    type="text"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Máximo de Participantes</label>
                  <input
                    type="number"
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) || 16 })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                    min="2"
                    max="64"
                  />
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Torneo</label>
                  <select
                    value={newTournament.type}
                    onChange={(e) => setNewTournament({ ...newTournament, type: e.target.value as 'individual' | 'clan' })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="individual">Individual</option>
                    <option value="clan">Por Clanes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Estado</label>
                  <select
                    value={newTournament.status}
                    onChange={(e) => setNewTournament({ ...newTournament, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="draft">Borrador</option>
                    <option value="registration">Registro Abierto</option>
                    <option value="active">En Progreso</option>
                    <option value="completed">Finalizado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
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
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-md w-full">
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
                  onChange={(e) => setNewParticipant({ ...newParticipant, participantType: e.target.value as 'user' | 'clan', participantId: '' })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="user">Usuario</option>
                  <option value="clan">Clan</option>
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  {newParticipant.participantType === 'user' ? 'Usuario' : 'Clan'}
                </label>
                <select
                  value={newParticipant.participantId}
                  onChange={(e) => setNewParticipant({ ...newParticipant, participantId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar...</option>
                  {newParticipant.participantType === 'user' 
                    ? users.filter(u => u.isActive).map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))
                    : clans.map(clan => (
                        <option key={clan.id} value={clan.id}>
                          [{clan.tag}] {clan.name}
                        </option>
                      ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Equipo (Opcional)</label>
                <input
                  type="text"
                  value={newParticipant.teamName}
                  onChange={(e) => setNewParticipant({ ...newParticipant, teamName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Nombre personalizado del equipo"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddParticipant}
                  disabled={!newParticipant.participantId}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Agregar</span>
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
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Crear Partida</h3>
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
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Número de Partida</label>
                  <input
                    type="number"
                    value={newMatch.matchNumber}
                    onChange={(e) => setNewMatch({ ...newMatch, matchNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Participante 1</label>
                <select
                  value={newMatch.participant1Id}
                  onChange={(e) => setNewMatch({ ...newMatch, participant1Id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar participante...</option>
                  {participants.map(participant => (
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
                  {participants.filter(p => p.id !== newMatch.participant1Id).map(participant => (
                    <option key={participant.id} value={participant.id}>
                      {participant.participantName}
                      {participant.clanTag && ` [${participant.clanTag}]`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Mapa</label>
                <select
                  value={newMatch.mapPlayed}
                  onChange={(e) => setNewMatch({ ...newMatch, mapPlayed: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar mapa...</option>
                  {availableMaps.map(map => (
                    <option key={map} value={map}>{map}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Fecha Programada (Opcional)</label>
                <input
                  type="datetime-local"
                  value={newMatch.scheduledAt}
                  onChange={(e) => setNewMatch({ ...newMatch, scheduledAt: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Notas (Opcional)</label>
                <textarea
                  value={newMatch.notes}
                  onChange={(e) => setNewMatch({ ...newMatch, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Notas adicionales sobre la partida..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateMatch}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
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

      {/* Modal de editar partida */}
      {showEditMatchModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Resultado</h3>
              <button
                onClick={() => setShowEditMatchModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Ganador</label>
                <select
                  value={newMatch.participant1Id}
                  onChange={(e) => setNewMatch({ ...newMatch, participant1Id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar ganador...</option>
                  {selectedMatch.participant1 && (
                    <option value={selectedMatch.participant1.id}>
                      {selectedMatch.participant1.name}
                      {selectedMatch.participant1.clanTag && ` [${selectedMatch.participant1.clanTag}]`}
                    </option>
                  )}
                  {selectedMatch.participant2 && (
                    <option value={selectedMatch.participant2.id}>
                      {selectedMatch.participant2.name}
                      {selectedMatch.participant2.clanTag && ` [${selectedMatch.participant2.clanTag}]`}
                    </option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Score {selectedMatch.participant1?.name || 'Jugador 1'}
                  </label>
                  <input
                    type="number"
                    value={newMatch.round}
                    onChange={(e) => setNewMatch({ ...newMatch, round: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Score {selectedMatch.participant2?.name || 'Jugador 2'}
                  </label>
                  <input
                    type="number"
                    value={newMatch.matchNumber}
                    onChange={(e) => setNewMatch({ ...newMatch, matchNumber: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Mapa Jugado</label>
                <select
                  value={newMatch.mapPlayed}
                  onChange={(e) => setNewMatch({ ...newMatch, mapPlayed: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar mapa...</option>
                  {availableMaps.map(map => (
                    <option key={map} value={map}>{map}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Notas</label>
                <textarea
                  value={newMatch.notes}
                  onChange={(e) => setNewMatch({ ...newMatch, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Notas sobre el resultado..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdateMatch}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Resultado</span>
                </button>
                
                <button
                  onClick={() => setShowEditMatchModal(false)}
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