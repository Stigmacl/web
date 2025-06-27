import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, MapPin, Award, Crown, Shield, Star, Clock, Target, Zap, Settings, Eye, Play, CheckCircle, AlertTriangle, Medal, TrendingUp, User, Activity, RefreshCw, Plus, Edit, Trash2, Save, X, Search, Filter } from 'lucide-react';
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
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selectedTournamentTab, setSelectedTournamentTab] = useState<'bracket' | 'participants' | 'matches' | 'info'>('bracket');
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);

  // Estados para crear torneo
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

  // Estados para crear partida
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
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentData(selectedTournament.id);
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

  const loadTournamentData = async (tournamentId: string) => {
    try {
      setIsLoading(true);
      
      // Cargar participantes y partidas en paralelo
      const [participantsResponse, matchesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/tournaments/get-participants.php?tournamentId=${tournamentId}`, {
          credentials: 'include'
        }),
        fetch(`${API_BASE_URL}/tournaments/get-matches.php?tournamentId=${tournamentId}`, {
          credentials: 'include'
        })
      ]);

      const participantsData = await participantsResponse.json();
      const matchesData = await matchesResponse.json();
      
      if (participantsData.success) {
        setParticipants(participantsData.participants);
      }
      
      if (matchesData.success) {
        setMatches(matchesData.matches);
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTournament = async () => {
    try {
      setIsLoading(true);
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
        await loadTournaments();
        setActiveTab('list');
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
        alert('Torneo creado exitosamente');
      } else {
        alert('Error al crear torneo: ' + (data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Error al crear torneo');
    } finally {
      setIsLoading(false);
    }
  };

  const createMatch = async () => {
    if (!selectedTournament) return;

    try {
      setIsCreatingMatch(true);
      
      // Preparar datos según el tipo de torneo
      const matchData: any = {
        tournamentId: selectedTournament.id,
        round: newMatch.round,
        matchNumber: newMatch.matchNumber,
        mapPlayed: newMatch.mapPlayed,
        scheduledAt: newMatch.scheduledAt,
        notes: newMatch.notes
      };

      // Para torneos con equipos múltiples
      if (selectedTournament.teamSize > 1) {
        matchData.team1Participants = newMatch.team1Participants;
        matchData.team2Participants = newMatch.team2Participants;
      } else {
        // Para 1v1
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
        await loadTournamentData(selectedTournament.id);
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
        alert('Partida creada exitosamente');
      } else {
        alert('Error al crear partida: ' + (data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error al crear partida');
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const deleteTournament = async (tournamentId: string) => {
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
        alert('Torneo eliminado exitosamente');
      } else {
        alert('Error al eliminar torneo: ' + (data.message || 'Error desconocido'));
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-yellow-600/20 rounded-xl">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Gestión de Torneos</h2>
            <p className="text-blue-300">Administra torneos, participantes y partidas</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
              ${activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
              }
            `}
          >
            <Trophy className="w-4 h-4" />
            <span>Lista de Torneos</span>
          </button>
          
          <button
            onClick={() => setActiveTab('create')}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
              ${activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
              }
            `}
          >
            <Plus className="w-4 h-4" />
            <span>Crear Torneo</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Torneos Existentes</h3>
            <button
              onClick={loadTournaments}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
          
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
                  <div key={tournament.id} className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/20">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-white">{tournament.name}</h4>
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{getStatusText(tournament.status)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-blue-300 mb-2">
                          <span>{getTypeText(tournament.type, tournament.teamSize)}</span>
                          <span>{getBracketTypeText(tournament.bracketType)}</span>
                          <span>{tournament.participantCount}/{tournament.maxParticipants} participantes</span>
                        </div>
                        
                        {tournament.description && (
                          <p className="text-blue-200 text-sm mb-2">{tournament.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-blue-400">
                          <span>Creado por: {tournament.createdBy}</span>
                          <span>{formatDate(tournament.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedTournament(tournament);
                            setActiveTab('view');
                          }}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteTournament(tournament.id)}
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

      {activeTab === 'create' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Crear Nuevo Torneo</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
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
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Descripción del torneo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tipo</label>
                  <select
                    value={newTournament.type}
                    onChange={(e) => setNewTournament({ 
                      ...newTournament, 
                      type: e.target.value as 'individual' | 'clan' | 'team',
                      teamSize: e.target.value === 'individual' ? 1 : newTournament.teamSize
                    })}
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
                    min="2"
                    max="64"
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) })}
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
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Estado</label>
                <select
                  value={newTournament.status}
                  onChange={(e) => setNewTournament({ ...newTournament, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="draft">Borrador</option>
                  <option value="registration">Registro Abierto</option>
                  <option value="active">Activo</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
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
            </div>
          </div>

          <div className="flex space-x-4 mt-8">
            <button
              onClick={createTournament}
              disabled={isLoading || !newTournament.name.trim()}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isLoading ? 'Creando...' : 'Crear Torneo'}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('list')}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {activeTab === 'view' && selectedTournament && (
        <div className="space-y-6">
          {/* Tournament Header */}
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedTournament.name}</h3>
                  <p className="text-blue-300">{getTypeText(selectedTournament.type, selectedTournament.teamSize)} - {getBracketTypeText(selectedTournament.bracketType)}</p>
                </div>
              </div>
              
              <button
                onClick={() => setActiveTab('list')}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg text-white transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cerrar</span>
              </button>
            </div>

            {/* Tournament Tabs */}
            <div className="flex space-x-2 bg-slate-700/40 rounded-xl p-2">
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
                    onClick={() => setSelectedTournamentTab(tab.id as any)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                      ${selectedTournamentTab === tab.id
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

          {/* Tournament Content */}
          {selectedTournamentTab === 'bracket' && (
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
              onMatchUpdate={(matchId, updates) => {
                setMatches(prev => prev.map(match => 
                  match.id === matchId ? { ...match, ...updates } : match
                ));
              }}
              onBracketRegenerate={() => {
                loadTournamentData(selectedTournament.id);
              }}
              onRefreshData={() => {
                loadTournamentData(selectedTournament.id);
              }}
            />
          )}

          {selectedTournamentTab === 'participants' && (
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
              <h4 className="text-xl font-bold text-white mb-6">Participantes ({participants.length})</h4>
              
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-white mb-2">Sin participantes</h3>
                  <p className="text-blue-300">Aún no hay participantes registrados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="bg-slate-700/40 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-blue-400 font-bold">#{index + 1}</span>
                          <div>
                            <h5 className="font-bold text-white">{participant.participantName}</h5>
                            <div className="flex items-center space-x-4 text-sm text-blue-400">
                              <span>Tipo: {participant.participantType}</span>
                              <span>Puntos: {participant.points}</span>
                              <span>V: {participant.wins} - D: {participant.losses}</span>
                            </div>
                          </div>
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
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTournamentTab === 'matches' && (
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-white">
                  Partidas ({matches.length}) - Formato {getMatchFormat(selectedTournament.teamSize)}
                </h4>
                
                {/* Botón para crear partida */}
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
                  <p className="text-blue-300">Crea la primera partida para comenzar el torneo</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(
                    matches.reduce((acc, match) => {
                      const round = selectedTournament.bracketType === 'round_robin' 
                        ? 'Round Robin' 
                        : `Ronda ${match.round}`;
                      if (!acc[round]) acc[round] = [];
                      acc[round].push(match);
                      return acc;
                    }, {} as Record<string, Match[]>)
                  ).map(([round, roundMatches]) => (
                    <div key={round} className="bg-slate-700/40 rounded-xl p-4">
                      <h5 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                        <Target className="w-5 h-5 text-orange-400" />
                        <span>{round}</span>
                        <span className="text-orange-400 text-sm">({getMatchFormat(selectedTournament.teamSize)})</span>
                      </h5>
                      
                      <div className="space-y-3">
                        {roundMatches.map((match) => (
                          <div key={match.id} className="bg-slate-600/40 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <span className="text-blue-400 font-medium">#{match.matchNumber}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-white">
                                    {match.participant1?.name || 'TBD'}
                                  </span>
                                  <span className="text-blue-400">{match.score1}</span>
                                  <span className="text-blue-400">-</span>
                                  <span className="text-blue-400">{match.score2}</span>
                                  <span className="text-white">
                                    {match.participant2?.name || 'TBD'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
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
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTournamentTab === 'info' && (
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
              <h4 className="text-xl font-bold text-white mb-6">Información del Torneo</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-blue-400 text-sm font-medium">Nombre</label>
                    <p className="text-white font-medium">{selectedTournament.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-blue-400 text-sm font-medium">Tipo</label>
                    <p className="text-white font-medium">{getTypeText(selectedTournament.type, selectedTournament.teamSize)}</p>
                  </div>
                  
                  <div>
                    <label className="text-blue-400 text-sm font-medium">Bracket</label>
                    <p className="text-white font-medium">{getBracketTypeText(selectedTournament.bracketType)}</p>
                  </div>
                  
                  <div>
                    <label className="text-blue-400 text-sm font-medium">Participantes</label>
                    <p className="text-white font-medium">{selectedTournament.participantCount} / {selectedTournament.maxParticipants}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-blue-400 text-sm font-medium">Estado</label>
                    <p className="text-white font-medium">{getStatusText(selectedTournament.status)}</p>
                  </div>
                  
                  <div>
                    <label className="text-blue-400 text-sm font-medium">Creado por</label>
                    <p className="text-white font-medium">{selectedTournament.createdBy}</p>
                  </div>
                  
                  <div>
                    <label className="text-blue-400 text-sm font-medium">Fecha de creación</label>
                    <p className="text-white font-medium">{formatDate(selectedTournament.createdAt)}</p>
                  </div>
                  
                  {selectedTournament.prizePool && (
                    <div>
                      <label className="text-blue-400 text-sm font-medium">Premio</label>
                      <p className="text-yellow-300 font-medium">{selectedTournament.prizePool}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedTournament.description && (
                <div className="mt-6">
                  <label className="text-blue-400 text-sm font-medium">Descripción</label>
                  <p className="text-blue-200 mt-2">{selectedTournament.description}</p>
                </div>
              )}
              
              {selectedTournament.rules && (
                <div className="mt-6">
                  <label className="text-blue-400 text-sm font-medium">Reglas</label>
                  <div className="bg-slate-700/40 rounded-xl p-4 mt-2">
                    <p className="text-blue-100 whitespace-pre-wrap">{selectedTournament.rules}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal para crear partida */}
      {showCreateMatchModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Crear Nueva Partida - {getMatchFormat(selectedTournament.teamSize)}
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
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Número de Partida</label>
                  <input
                    type="number"
                    min="1"
                    value={newMatch.matchNumber}
                    onChange={(e) => setNewMatch({ ...newMatch, matchNumber: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Participantes según el tipo de torneo */}
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
                      <option value="">Seleccionar participante</option>
                      {participants.map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {participant.participantName}
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
                      <option value="">Seleccionar participante</option>
                      {participants.map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {participant.participantName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                // Para equipos múltiples
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Equipo 1</label>
                    <div className="space-y-2">
                      {Array.from({ length: selectedTournament.teamSize }, (_, i) => (
                        <select
                          key={i}
                          value={newMatch.team1Participants[i] || ''}
                          onChange={(e) => {
                            const newTeam1 = [...newMatch.team1Participants];
                            newTeam1[i] = e.target.value;
                            setNewMatch({ ...newMatch, team1Participants: newTeam1 });
                          }}
                          className="w-full px-4 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="">Jugador {i + 1}</option>
                          {participants.map((participant) => (
                            <option key={participant.id} value={participant.id}>
                              {participant.participantName}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Equipo 2</label>
                    <div className="space-y-2">
                      {Array.from({ length: selectedTournament.teamSize }, (_, i) => (
                        <select
                          key={i}
                          value={newMatch.team2Participants[i] || ''}
                          onChange={(e) => {
                            const newTeam2 = [...newMatch.team2Participants];
                            newTeam2[i] = e.target.value;
                            setNewMatch({ ...newMatch, team2Participants: newTeam2 });
                          }}
                          className="w-full px-4 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="">Jugador {i + 1}</option>
                          {participants.map((participant) => (
                            <option key={participant.id} value={participant.id}>
                              {participant.participantName}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Mapa (Opcional)</label>
                <input
                  type="text"
                  value={newMatch.mapPlayed}
                  onChange={(e) => setNewMatch({ ...newMatch, mapPlayed: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Nombre del mapa"
                />
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
                  placeholder="Notas adicionales sobre la partida"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={createMatch}
                  disabled={isCreatingMatch}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
                >
                  {isCreatingMatch ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isCreatingMatch ? 'Creando...' : 'Crear Partida'}</span>
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