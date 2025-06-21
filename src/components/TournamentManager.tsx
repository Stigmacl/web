import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2, Save, X, Users, Calendar, MapPin, Award, Crown, Shield, Star, Clock, Target, Zap, Settings, Eye, Play, CheckCircle, AlertCircle, Medal, TrendingUp } from 'lucide-react';
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
  const { user, clans } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'participants' | 'matches'>('info');

  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    type: 'individual' as 'individual' | 'clan',
    teamSize: 1,
    maxParticipants: 16,
    startDate: '',
    endDate: '',
    prizePool: '',
    rules: '',
    maps: [''],
    bracketType: 'single_elimination' as 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss'
  });

  // Verificar permisos de administrador
  if (!user || user.role !== 'admin') {
    return null;
  }

  useEffect(() => {
    loadTournaments();
  }, []);

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
          maps: newTournament.maps.filter(map => map.trim() !== '')
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
          maxParticipants: 16,
          startDate: '',
          endDate: '',
          prizePool: '',
          rules: '',
          maps: [''],
          bracketType: 'single_elimination'
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
        loadTournaments();
      } else {
        alert(data.message || 'Error al eliminar el torneo');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Error al eliminar el torneo');
    }
  };

  const handleUpdateParticipant = async (participantId: string, updates: Partial<Participant>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/update-participant.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ participantId, ...updates })
      });
      
      const data = await response.json();
      
      if (data.success && selectedTournament) {
        loadParticipants(selectedTournament.id);
      } else {
        alert(data.message || 'Error al actualizar participante');
      }
    } catch (error) {
      console.error('Error updating participant:', error);
      alert('Error al actualizar participante');
    }
  };

  const handleUpdateMatch = async (matchId: string, updates: Partial<Match>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/update-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ matchId, ...updates })
      });
      
      const data = await response.json();
      
      if (data.success && selectedTournament) {
        loadMatches(selectedTournament.id);
        loadParticipants(selectedTournament.id); // Recargar participantes para actualizar puntos
      } else {
        alert(data.message || 'Error al actualizar partida');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Error al actualizar partida');
    }
  };

  const addMapField = () => {
    setNewTournament({
      ...newTournament,
      maps: [...newTournament.maps, '']
    });
  };

  const removeMapField = (index: number) => {
    const newMaps = newTournament.maps.filter((_, i) => i !== index);
    setNewTournament({
      ...newTournament,
      maps: newMaps.length > 0 ? newMaps : ['']
    });
  };

  const updateMapField = (index: number, value: string) => {
    const newMaps = [...newTournament.maps];
    newMaps[index] = value;
    setNewTournament({
      ...newTournament,
      maps: newMaps
    });
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
      case 'cancelled': return AlertCircle;
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

  const handleViewTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setActiveTab('info');
    setShowViewModal(true);
    loadParticipants(tournament.id);
    loadMatches(tournament.id);
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-yellow-600/20 rounded-xl">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Gestión de Torneos</h3>
            <p className="text-blue-300">Administra torneos individuales y por clanes</p>
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

      {/* Lista de torneos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No hay torneos creados</h3>
          <p className="text-blue-300">Crea el primer torneo para comenzar</p>
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-lg font-bold text-white">{tournament.name}</h4>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{tournament.status}</span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tournament.type === 'individual' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {tournament.type === 'individual' ? 'Individual' : 'Por Clanes'}
                      </div>
                    </div>
                    
                    {tournament.description && (
                      <p className="text-blue-200 text-sm mb-3">{tournament.description}</p>
                    )}
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300">
                          {tournament.participantCount}/{tournament.maxParticipants} participantes
                        </span>
                      </div>
                      
                      {tournament.type === 'clan' && tournament.teamSize > 1 && (
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-purple-400" />
                          <span className="text-blue-300">Equipos de {tournament.teamSize}</span>
                        </div>
                      )}
                      
                      {tournament.startDate && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-green-400" />
                          <span className="text-blue-300">{formatDate(tournament.startDate)}</span>
                        </div>
                      )}
                      
                      {tournament.prizePool && (
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-yellow-400" />
                          <span className="text-blue-300">{tournament.prizePool}</span>
                        </div>
                      )}
                    </div>
                    
                    {tournament.maps.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-orange-400" />
                          <span className="text-blue-300 text-sm font-medium">Mapas:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tournament.maps.map((map, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs"
                            >
                              {map}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewTournament(tournament)}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedTournament(tournament);
                        setShowEditModal(true);
                      }}
                      className="p-2 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-lg text-yellow-300 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTournament(tournament.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                      title="Eliminar"
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

      {/* Modal de crear torneo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Crear Nuevo Torneo</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Información básica */}
              <div className="space-y-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Torneo</label>
                  <input
                    type="text"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ej: Torneo de Primavera 2025"
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
                      onChange={(e) => setNewTournament({ 
                        ...newTournament, 
                        type: e.target.value as 'individual' | 'clan',
                        teamSize: e.target.value === 'individual' ? 1 : newTournament.teamSize
                      })}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="individual">Individual</option>
                      <option value="clan">Por Clanes</option>
                    </select>
                  </div>

                  {newTournament.type === 'clan' && (
                    <div>
                      <label className="block text-blue-300 text-sm font-medium mb-2">Tamaño de Equipo</label>
                      <select
                        value={newTournament.teamSize}
                        onChange={(e) => setNewTournament({ ...newTournament, teamSize: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        {[2, 3, 4, 5, 6].map(size => (
                          <option key={size} value={size}>{size} jugadores</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Máximo de Participantes</label>
                  <select
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {[8, 16, 32, 64].map(size => (
                      <option key={size} value={size}>{size} participantes</option>
                    ))}
                  </select>
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

              {/* Configuración adicional */}
              <div className="space-y-4">
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
                  <label className="block text-blue-300 text-sm font-medium mb-2">Premio (Opcional)</label>
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
                    placeholder="Reglas específicas del torneo..."
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Mapas</label>
                  <div className="space-y-2">
                    {newTournament.maps.map((map, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={map}
                          onChange={(e) => updateMapField(index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder={`Mapa ${index + 1}`}
                        />
                        {newTournament.maps.length > 1 && (
                          <button
                            onClick={() => removeMapField(index)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addMapField}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Mapa</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-3 pt-6 mt-6 border-t border-blue-700/30">
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
      )}

      {/* Modal de ver torneo */}
      {showViewModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{selectedTournament.name}</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 bg-slate-700/40 rounded-xl p-2">
              {[
                { id: 'info', label: 'Información', icon: Trophy },
                { id: 'participants', label: 'Participantes', icon: Users },
                { id: 'matches', label: 'Partidas', icon: Target }
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

            {/* Contenido de tabs */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-blue-300 font-medium mb-2">Descripción</h4>
                      <p className="text-white">{selectedTournament.description || 'Sin descripción'}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-blue-300 font-medium mb-2">Tipo</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTournament.type === 'individual' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {selectedTournament.type === 'individual' ? 'Individual' : 'Por Clanes'}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-blue-300 font-medium mb-2">Participantes</h4>
                      <p className="text-white">{selectedTournament.participantCount}/{selectedTournament.maxParticipants}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedTournament.prizePool && (
                      <div>
                        <h4 className="text-blue-300 font-medium mb-2">Premio</h4>
                        <p className="text-white">{selectedTournament.prizePool}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-blue-300 font-medium mb-2">Formato</h4>
                      <p className="text-white">{selectedTournament.bracketType.replace('_', ' ')}</p>
                    </div>
                    
                    {selectedTournament.startDate && (
                      <div>
                        <h4 className="text-blue-300 font-medium mb-2">Fecha de Inicio</h4>
                        <p className="text-white">{formatDate(selectedTournament.startDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedTournament.maps.length > 0 && (
                  <div>
                    <h4 className="text-blue-300 font-medium mb-3">Mapas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTournament.maps.map((map, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg"
                        >
                          {map}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedTournament.rules && (
                  <div>
                    <h4 className="text-blue-300 font-medium mb-3">Reglas</h4>
                    <div className="bg-slate-700/40 rounded-xl p-4">
                      <p className="text-white whitespace-pre-wrap">{selectedTournament.rules}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-white">
                    Participantes ({participants.length})
                  </h4>
                </div>
                
                {participants.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Sin participantes</h3>
                    <p className="text-blue-300">Aún no hay participantes registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant, index) => {
                      const IconComponent = participant.clanIcon ? getClanIcon(participant.clanIcon).icon : Users;
                      const iconColor = participant.clanIcon ? getClanIcon(participant.clanIcon).color : 'text-blue-400';
                      
                      return (
                        <div
                          key={participant.id}
                          className="bg-slate-700/40 rounded-xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400 font-bold text-lg">#{index + 1}</span>
                              {index < 3 && (
                                <Medal className={`w-5 h-5 ${
                                  index === 0 ? 'text-yellow-400' : 
                                  index === 1 ? 'text-gray-300' : 'text-amber-600'
                                }`} />
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {participant.participantAvatar ? (
                                <img
                                  src={participant.participantAvatar}
                                  alt={participant.participantName}
                                  className="w-10 h-10 rounded-full border-2 border-blue-500/30"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 bg-slate-600/40 flex items-center justify-center">
                                  <IconComponent className={`w-5 h-5 ${iconColor}`} />
                                </div>
                              )}
                              
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-white">{participant.participantName}</span>
                                  {participant.clanTag && (
                                    <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-xs font-mono">
                                      [{participant.clanTag}]
                                    </span>
                                  )}
                                </div>
                                {participant.teamName && (
                                  <p className="text-blue-300 text-sm">{participant.teamName}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-white">{participant.points}</p>
                              <p className="text-blue-400 text-xs">Puntos</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-400">{participant.wins}</p>
                              <p className="text-blue-400 text-xs">Victorias</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-lg font-bold text-red-400">{participant.losses}</p>
                              <p className="text-blue-400 text-xs">Derrotas</p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={participant.points}
                                onChange={(e) => handleUpdateParticipant(participant.id, { points: parseInt(e.target.value) || 0 })}
                                className="w-16 px-2 py-1 bg-slate-600/40 border border-blue-600/30 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                                title="Actualizar puntos"
                              />
                              <TrendingUp className="w-4 h-4 text-blue-400" />
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-white">
                    Partidas ({matches.length})
                  </h4>
                </div>
                
                {matches.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Sin partidas</h3>
                    <p className="text-blue-300">Las partidas se generarán automáticamente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(
                      matches.reduce((acc, match) => {
                        const round = `Ronda ${match.round}`;
                        if (!acc[round]) acc[round] = [];
                        acc[round].push(match);
                        return acc;
                      }, {} as Record<string, Match[]>)
                    ).map(([round, roundMatches]) => (
                      <div key={round} className="bg-slate-700/40 rounded-xl p-4">
                        <h5 className="text-lg font-bold text-white mb-4">{round}</h5>
                        <div className="space-y-3">
                          {roundMatches.map((match) => (
                            <div
                              key={match.id}
                              className="bg-slate-600/40 rounded-lg p-4 border border-blue-600/20"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                  {/* Participante 1 */}
                                  <div className="flex items-center space-x-2 flex-1">
                                    {match.participant1 ? (
                                      <>
                                        {match.participant1.avatar && (
                                          <img
                                            src={match.participant1.avatar}
                                            alt={match.participant1.name}
                                            className="w-8 h-8 rounded-full border border-blue-500/30"
                                          />
                                        )}
                                        <span className="text-white font-medium">
                                          {match.participant1.name}
                                          {match.participant1.clanTag && (
                                            <span className="text-purple-300 ml-1">[{match.participant1.clanTag}]</span>
                                          )}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-gray-400">TBD</span>
                                    )}
                                  </div>
                                  
                                  {/* Marcador */}
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      value={match.score1}
                                      onChange={(e) => handleUpdateMatch(match.id, { score1: parseInt(e.target.value) || 0 })}
                                      className="w-12 px-2 py-1 bg-slate-700/40 border border-blue-600/30 rounded text-white text-center text-sm focus:outline-none focus:border-blue-500"
                                    />
                                    <span className="text-blue-400">-</span>
                                    <input
                                      type="number"
                                      value={match.score2}
                                      onChange={(e) => handleUpdateMatch(match.id, { score2: parseInt(e.target.value) || 0 })}
                                      className="w-12 px-2 py-1 bg-slate-700/40 border border-blue-600/30 rounded text-white text-center text-sm focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  
                                  {/* Participante 2 */}
                                  <div className="flex items-center space-x-2 flex-1 justify-end">
                                    {match.participant2 ? (
                                      <>
                                        <span className="text-white font-medium">
                                          {match.participant2.name}
                                          {match.participant2.clanTag && (
                                            <span className="text-purple-300 ml-1">[{match.participant2.clanTag}]</span>
                                          )}
                                        </span>
                                        {match.participant2.avatar && (
                                          <img
                                            src={match.participant2.avatar}
                                            alt={match.participant2.name}
                                            className="w-8 h-8 rounded-full border border-blue-500/30"
                                          />
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-gray-400">TBD</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Controles */}
                                <div className="flex items-center space-x-2 ml-4">
                                  <select
                                    value={match.mapPlayed || ''}
                                    onChange={(e) => handleUpdateMatch(match.id, { mapPlayed: e.target.value })}
                                    className="px-2 py-1 bg-slate-700/40 border border-blue-600/30 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                                  >
                                    <option value="">Seleccionar mapa</option>
                                    {selectedTournament.maps.map((map) => (
                                      <option key={map} value={map}>{map}</option>
                                    ))}
                                  </select>
                                  
                                  <select
                                    value={match.status}
                                    onChange={(e) => handleUpdateMatch(match.id, { status: e.target.value as any })}
                                    className="px-2 py-1 bg-slate-700/40 border border-blue-600/30 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                                  >
                                    <option value="pending">Pendiente</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="completed">Completada</option>
                                    <option value="cancelled">Cancelada</option>
                                  </select>
                                </div>
                              </div>
                              
                              {match.mapPlayed && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <MapPin className="w-4 h-4 text-orange-400" />
                                  <span className="text-orange-300 text-sm">{match.mapPlayed}</span>
                                </div>
                              )}
                              
                              {match.completedAt && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-green-400" />
                                  <span className="text-green-300 text-sm">
                                    Completada: {formatDate(match.completedAt)}
                                  </span>
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
        </div>
      )}
    </div>
  );
};

export default TournamentManager;