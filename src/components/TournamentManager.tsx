import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2, Users, Calendar, Target, Save, X, Eye, Play, Pause, CheckCircle, AlertTriangle, User, Shield, Crown, Star, Zap, MapPin, Award, Settings, UserPlus, Clock, Activity } from 'lucide-react';
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

interface Map {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  imageUrl?: string;
  gameMode?: string;
  maxPlayers?: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  environment?: string;
  size: 'small' | 'medium' | 'large' | 'extra_large';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
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
  const [maps, setMaps] = useState<Map[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'participants' | 'maps'>('list');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
    bracketType: 'single_elimination' as 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss',
    selectedMaps: [] as string[]
  });

  const [newParticipant, setNewParticipant] = useState({
    participantType: 'user' as 'user' | 'clan' | 'team',
    participantId: '',
    teamName: '',
    teamMembers: [] as string[]
  });

  useEffect(() => {
    loadTournaments();
    loadMaps();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadParticipants(selectedTournament.id);
    }
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
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

  const loadMaps = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/maps/get-all.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setMaps(data.maps);
      }
    } catch (error) {
      console.error('Error loading maps:', error);
    }
  };

  const handleCreateTournament = async () => {
    if (!newTournament.name.trim()) return;
    
    setIsCreating(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...newTournament,
          maps: newTournament.selectedMaps
        })
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
          bracketType: 'single_elimination',
          selectedMaps: []
        });
        loadTournaments();
      } else {
        alert(data.message || 'Error al crear el torneo');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Error al crear el torneo');
    } finally {
      setIsCreating(false);
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
      alert('Debe ingresar un nombre para el equipo');
      return;
    }

    // Validar miembros del equipo para torneos con teamSize > 1
    if (selectedTournament.teamSize > 1 && newParticipant.teamMembers.length !== selectedTournament.teamSize) {
      alert(`El equipo debe tener exactamente ${selectedTournament.teamSize} miembros`);
      return;
    }
    
    try {
      const participantData: any = {
        tournamentId: selectedTournament.id,
        participantType: newParticipant.participantType
      };

      if (newParticipant.participantType === 'user') {
        participantData.participantId = newParticipant.participantId;
      } else if (newParticipant.participantType === 'clan') {
        participantData.participantId = newParticipant.participantId;
        if (selectedTournament.teamSize > 1) {
          participantData.teamMembers = newParticipant.teamMembers;
        }
      } else if (newParticipant.participantType === 'team') {
        participantData.teamName = newParticipant.teamName;
        participantData.teamMembers = newParticipant.teamMembers;
      }

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
        loadParticipants(selectedTournament.id);
        loadTournaments(); // Actualizar contador de participantes
      } else {
        alert(data.message || 'Error al agregar participante');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Error al agregar participante');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este participante?')) return;
    
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
          loadTournaments(); // Actualizar contador de participantes
        }
      } else {
        alert(data.message || 'Error al eliminar participante');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Error al eliminar participante');
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
        alert(data.message || 'Error al eliminar torneo');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Error al eliminar torneo');
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

  const getTypeText = (type: string, teamSize: number) => {
    switch (type) {
      case 'individual': return teamSize > 1 ? `Individual (${teamSize}v${teamSize})` : 'Individual (1v1)';
      case 'clan': return teamSize > 1 ? `Por Clanes (${teamSize}v${teamSize})` : 'Por Clanes (1v1)';
      case 'team': return `Por Equipos (${teamSize}v${teamSize})`;
      default: return type;
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

  // Verificar permisos de administrador
  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
        <p className="text-red-300">No tienes permisos para acceder a la gestión de torneos</p>
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
              <h2 className="text-2xl font-bold text-white">Gestión de Torneos</h2>
              <p className="text-blue-300">Administra torneos, participantes y brackets</p>
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
        <div className="flex space-x-2">
          {[
            { id: 'list', label: 'Lista de Torneos', icon: Trophy },
            { id: 'participants', label: 'Participantes', icon: Users, disabled: !selectedTournament },
            { id: 'maps', label: 'Mapas', icon: MapPin }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                disabled={tab.disabled}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : tab.disabled
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'participants' && selectedTournament && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {participants.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Torneos Creados</h3>
          
          {tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No hay torneos creados</h3>
              <p className="text-blue-300">Crea tu primer torneo para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => {
                const StatusIcon = getStatusIcon(tournament.status);
                
                return (
                  <div key={tournament.id} className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-xl font-bold text-white">{tournament.name}</h4>
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{getStatusText(tournament.status)}</span>
                          </div>
                        </div>
                        
                        {tournament.description && (
                          <p className="text-blue-200 mb-3">{tournament.description}</p>
                        )}
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-300">
                              {tournament.participantCount}/{tournament.maxParticipants} participantes
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-orange-400" />
                            <span className="text-blue-300">{getTypeText(tournament.type, tournament.teamSize)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4 text-purple-400" />
                            <span className="text-blue-300">{getBracketTypeText(tournament.bracketType)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-green-400" />
                            <span className="text-blue-300">{formatDate(tournament.createdAt)}</span>
                          </div>
                        </div>
                        
                        {tournament.prizePool && (
                          <div className="mt-3 flex items-center space-x-2">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-300 font-medium">{tournament.prizePool}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-6">
                        <button
                          onClick={() => {
                            setSelectedTournament(tournament);
                            setActiveTab('participants');
                          }}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                          title="Ver participantes"
                        >
                          <Users className="w-4 h-4" />
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
            <div>
              <h3 className="text-xl font-bold text-white">Participantes de "{selectedTournament.name}"</h3>
              <p className="text-blue-300">
                {participants.length}/{selectedTournament.maxParticipants} participantes • 
                Formato: {getTypeText(selectedTournament.type, selectedTournament.teamSize)}
              </p>
            </div>
            
            <button
              onClick={() => setShowAddParticipantModal(true)}
              disabled={participants.length >= selectedTournament.maxParticipants}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
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
                const IconComponent = participant.clanIcon ? getClanIcon(participant.clanIcon).icon : User;
                const iconColor = participant.clanIcon ? getClanIcon(participant.clanIcon).color : 'text-blue-400';
                
                return (
                  <div key={participant.id} className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-400 font-bold">#{index + 1}</span>
                          
                          {participant.participantAvatar ? (
                            <img
                              src={participant.participantAvatar}
                              alt={participant.participantName}
                              className="w-10 h-10 rounded-full border border-blue-500/30"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full border border-blue-500/30 bg-slate-600/40 flex items-center justify-center">
                              <IconComponent className={`w-5 h-5 ${iconColor}`} />
                            </div>
                          )}
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white">
                                {participant.teamName || participant.participantName}
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
                              <p className="text-blue-300 text-sm">
                                Miembros: {participant.teamMembers.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-400">{participant.points}</p>
                          <p className="text-blue-300 text-xs">Puntos</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-400">{participant.wins}</p>
                          <p className="text-blue-300 text-xs">Victorias</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm font-bold text-red-400">{participant.losses}</p>
                          <p className="text-blue-300 text-xs">Derrotas</p>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveParticipant(participant.id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                          title="Eliminar participante"
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

            <div className="space-y-6">
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
                    min="2"
                    max="64"
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) || 8 })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
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

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateTournament}
                  disabled={!newTournament.name.trim() || isCreating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Crear Torneo</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-xl text-white font-medium transition-colors"
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

            <div className="space-y-6">
              {/* Tipo de Participante */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-3">Tipo de Participante</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'user', label: 'Usuario Individual', icon: User, color: 'text-blue-400' },
                    { id: 'clan', label: 'Clan', icon: Shield, color: 'text-purple-400' },
                    { id: 'team', label: 'Equipo Personalizado', icon: Users, color: 'text-green-400' }
                  ].map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setNewParticipant({ 
                          ...newParticipant, 
                          participantType: option.id as 'user' | 'clan' | 'team',
                          participantId: '',
                          teamName: '',
                          teamMembers: []
                        })}
                        className={`flex flex-col items-center space-y-2 p-4 rounded-xl border transition-all ${
                          newParticipant.participantType === option.id
                            ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                            : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                        }`}
                      >
                        <IconComponent className={`w-6 h-6 ${option.color}`} />
                        <span className="text-sm font-medium text-center">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selección según tipo */}
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

              {/* Miembros del equipo para torneos con teamSize > 1 */}
              {selectedTournament.teamSize > 1 && newParticipant.participantType !== 'user' && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Miembros del Equipo ({newParticipant.teamMembers.length}/{selectedTournament.teamSize})
                  </label>
                  <div className="space-y-3">
                    {Array.from({ length: selectedTournament.teamSize }).map((_, index) => (
                      <select
                        key={index}
                        value={newParticipant.teamMembers[index] || ''}
                        onChange={(e) => {
                          const newMembers = [...newParticipant.teamMembers];
                          if (e.target.value) {
                            newMembers[index] = e.target.value;
                          } else {
                            newMembers.splice(index, 1);
                          }
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
                    Selecciona exactamente {selectedTournament.teamSize} jugadores para el equipo
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddParticipant}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
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
    </div>
  );
};

export default TournamentManager;