import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2, Save, X, Users, Calendar, Target, Play, CheckCircle, AlertTriangle, Settings, Crown, Shield, Star, Zap, MapPin, Award, Clock, Eye, EyeOff, UserPlus, UserMinus, Shuffle, RotateCcw, Copy, Download, Upload } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'bracket' | 'participants' | 'matches'>('list');
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  
  // Estados para formularios
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

  const [newTeam, setNewTeam] = useState({
    teamName: '',
    members: [] as string[]
  });

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchForm, setMatchForm] = useState({
    participant1Id: '',
    participant2Id: '',
    winnerId: '',
    score1: 0,
    score2: 0,
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
      // Cargar participantes
      const participantsResponse = await fetch(`${API_BASE_URL}/tournaments/get-participants.php?tournamentId=${tournamentId}`, {
        credentials: 'include'
      });
      const participantsData = await participantsResponse.json();
      
      if (participantsData.success) {
        setParticipants(participantsData.participants);
      }

      // Cargar partidas
      const matchesResponse = await fetch(`${API_BASE_URL}/tournaments/get-matches.php?tournamentId=${tournamentId}`, {
        credentials: 'include'
      });
      const matchesData = await matchesResponse.json();
      
      if (matchesData.success) {
        setMatches(matchesData.matches);
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
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
    if (!selectedTournament || !newParticipant.participantId) {
      alert('Selecciona un participante');
      return;
    }

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
          teamName: newParticipant.teamName || undefined,
          teamMembers: newParticipant.teamMembers.length > 0 ? newParticipant.teamMembers : undefined
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
        await loadTournamentData(selectedTournament.id);
        await loadTournaments();
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
        await loadTournamentData(selectedTournament!.id);
        await loadTournaments();
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

    const round = Math.max(...matches.map(m => m.round), 0) + 1;
    const matchNumber = matches.filter(m => m.round === round).length + 1;

    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/create-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          round,
          matchNumber,
          participant1Id: matchForm.participant1Id || null,
          participant2Id: matchForm.participant2Id || null,
          mapPlayed: matchForm.mapPlayed || null,
          scheduledAt: matchForm.scheduledAt || null,
          notes: matchForm.notes || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowMatchModal(false);
        setMatchForm({
          participant1Id: '',
          participant2Id: '',
          winnerId: '',
          score1: 0,
          score2: 0,
          mapPlayed: '',
          scheduledAt: '',
          notes: ''
        });
        await loadTournamentData(selectedTournament.id);
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
          winnerId: matchForm.winnerId || null,
          score1: matchForm.score1,
          score2: matchForm.score2,
          mapPlayed: matchForm.mapPlayed || null,
          status: matchForm.winnerId ? 'completed' : selectedMatch.status,
          notes: matchForm.notes || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSelectedMatch(null);
        setMatchForm({
          participant1Id: '',
          participant2Id: '',
          winnerId: '',
          score1: 0,
          score2: 0,
          mapPlayed: '',
          scheduledAt: '',
          notes: ''
        });
        await loadTournamentData(selectedTournament!.id);
      } else {
        alert(data.message || 'Error al actualizar la partida');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Error al actualizar la partida');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta partida?')) {
      return;
    }

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
        await loadTournamentData(selectedTournament!.id);
      } else {
        alert(data.message || 'Error al eliminar la partida');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error al eliminar la partida');
    }
  };

  const generateBracket = async () => {
    if (!selectedTournament || participants.length < 2) {
      alert('Se necesitan al menos 2 participantes para generar el bracket');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres generar el bracket? Esto eliminará todas las partidas existentes.')) {
      return;
    }

    try {
      // Eliminar partidas existentes
      for (const match of matches) {
        await handleDeleteMatch(match.id);
      }

      // Generar nuevas partidas según el tipo de bracket
      if (selectedTournament.bracketType === 'single_elimination') {
        await generateSingleEliminationBracket();
      } else if (selectedTournament.bracketType === 'double_elimination') {
        await generateDoubleEliminationBracket();
      } else if (selectedTournament.bracketType === 'round_robin') {
        await generateRoundRobinBracket();
      }

      await loadTournamentData(selectedTournament.id);
    } catch (error) {
      console.error('Error generating bracket:', error);
      alert('Error al generar el bracket');
    }
  };

  const generateSingleEliminationBracket = async () => {
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
    const totalRounds = Math.ceil(Math.log2(shuffledParticipants.length));
    
    // Primera ronda
    for (let i = 0; i < shuffledParticipants.length; i += 2) {
      const participant1 = shuffledParticipants[i];
      const participant2 = shuffledParticipants[i + 1];
      
      await fetch(`${API_BASE_URL}/tournaments/create-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId: selectedTournament!.id,
          round: 1,
          matchNumber: Math.floor(i / 2) + 1,
          participant1Id: participant1.id,
          participant2Id: participant2?.id || null
        })
      });
    }

    // Rondas siguientes (vacías, se llenarán con los ganadores)
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      for (let match = 1; match <= matchesInRound; match++) {
        await fetch(`${API_BASE_URL}/tournaments/create-match.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            tournamentId: selectedTournament!.id,
            round,
            matchNumber: match,
            participant1Id: null,
            participant2Id: null
          })
        });
      }
    }
  };

  const generateDoubleEliminationBracket = async () => {
    // Implementación básica de doble eliminación
    await generateSingleEliminationBracket();
    // TODO: Agregar bracket de perdedores
  };

  const generateRoundRobinBracket = async () => {
    // Todos contra todos
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        await fetch(`${API_BASE_URL}/tournaments/create-match.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            tournamentId: selectedTournament!.id,
            round: 1,
            matchNumber: (i * participants.length + j),
            participant1Id: participants[i].id,
            participant2Id: participants[j].id
          })
        });
      }
    }
  };

  const shuffleParticipants = async () => {
    if (!confirm('¿Estás seguro de que quieres reorganizar aleatoriamente los participantes en el bracket?')) {
      return;
    }

    await generateBracket();
  };

  const resetBracket = async () => {
    if (!confirm('¿Estás seguro de que quieres resetear completamente el bracket? Esto eliminará todas las partidas.')) {
      return;
    }

    try {
      for (const match of matches) {
        await handleDeleteMatch(match.id);
      }
      await loadTournamentData(selectedTournament!.id);
    } catch (error) {
      console.error('Error resetting bracket:', error);
      alert('Error al resetear el bracket');
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

  const getTeamSizeOptions = (type: string) => {
    switch (type) {
      case 'individual': return [{ value: 1, label: '1v1 (Individual)' }];
      case 'clan': return [
        { value: 1, label: '1v1 (Representantes)' },
        { value: 3, label: '3v3 (Equipos)' },
        { value: 5, label: '5v5 (Equipos)' }
      ];
      case 'team': return [
        { value: 2, label: '2v2 (Duplas)' },
        { value: 3, label: '3v3 (Tríos)' },
        { value: 4, label: '4v4 (Cuartetos)' },
        { value: 5, label: '5v5 (Quintetos)' }
      ];
      default: return [{ value: 1, label: '1v1' }];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-yellow-600/20 rounded-xl">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Gestión de Torneos</h3>
            <p className="text-yellow-300">Administra torneos individuales, por clanes y equipos</p>
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

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-2 bg-slate-700/40 rounded-xl p-2">
          {[
            { id: 'list', label: 'Lista de Torneos', icon: Trophy },
            ...(selectedTournament ? [
              { id: 'bracket', label: 'Bracket', icon: Target },
              { id: 'participants', label: `Participantes (${participants.length})`, icon: Users },
              { id: 'matches', label: `Partidas (${matches.length})`, icon: Play },
              { id: 'edit', label: 'Editar', icon: Settings }
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

      {/* Contenido */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-slate-700/40 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{tournaments.length}</p>
                  <p className="text-yellow-300 text-sm">Total Torneos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-700/40 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Play className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{tournaments.filter(t => t.status === 'active').length}</p>
                  <p className="text-green-300 text-sm">Activos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-700/40 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{tournaments.filter(t => t.status === 'registration').length}</p>
                  <p className="text-blue-300 text-sm">En Registro</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-700/40 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{tournaments.filter(t => t.status === 'completed').length}</p>
                  <p className="text-purple-300 text-sm">Completados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de torneos */}
          {tournaments.length === 0 ? (
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
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-white">{tournament.name}</h4>
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>
                              {tournament.status === 'draft' ? 'Borrador' :
                               tournament.status === 'registration' ? 'Registro' :
                               tournament.status === 'active' ? 'Activo' :
                               tournament.status === 'completed' ? 'Completado' : 'Cancelado'}
                            </span>
                          </div>
                          
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tournament.type === 'individual' ? 'bg-blue-500/20 text-blue-300' :
                            tournament.type === 'clan' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {tournament.type === 'individual' ? 'Individual' :
                             tournament.type === 'clan' ? 'Por Clanes' : 'Por Equipos'}
                            {tournament.teamSize > 1 && ` (${tournament.teamSize}v${tournament.teamSize})`}
                          </div>
                        </div>
                        
                        {tournament.description && (
                          <p className="text-blue-200 text-sm mb-3">{tournament.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm text-blue-400">
                          <span>Participantes: {tournament.participantCount}/{tournament.maxParticipants}</span>
                          <span>Formato: {
                            tournament.bracketType === 'single_elimination' ? 'Eliminación Simple' :
                            tournament.bracketType === 'double_elimination' ? 'Eliminación Doble' :
                            tournament.bracketType === 'round_robin' ? 'Round Robin' : 'Sistema Suizo'
                          }</span>
                          <span>Creado: {formatDate(tournament.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTournament(tournament);
                            setActiveTab('bracket');
                          }}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                          title="Ver bracket"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedTournament(tournament);
                            setActiveTab('edit');
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bracket' && selectedTournament && (
        <div className="space-y-6">
          {/* Controles del bracket */}
          <div className="bg-slate-700/40 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-orange-400" />
                <div>
                  <h4 className="text-lg font-bold text-white">Bracket - {selectedTournament.name}</h4>
                  <p className="text-orange-300 text-sm">
                    {participants.length} participantes • {matches.length} partidas
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMatchModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-green-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Partida</span>
                </button>
                
                <button
                  onClick={generateBracket}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300 transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Generar Bracket</span>
                </button>
                
                <button
                  onClick={shuffleParticipants}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-300 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reorganizar</span>
                </button>
                
                <button
                  onClick={resetBracket}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Resetear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bracket visual */}
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No hay partidas creadas</h3>
              <p className="text-blue-300">Genera el bracket o crea partidas manualmente</p>
            </div>
          ) : (
            <div className="bg-slate-700/40 rounded-xl p-6">
              {/* Organizar partidas por rondas */}
              {Object.entries(
                matches.reduce((acc, match) => {
                  const round = `Ronda ${match.round}`;
                  if (!acc[round]) acc[round] = [];
                  acc[round].push(match);
                  return acc;
                }, {} as Record<string, Match[]>)
              ).map(([round, roundMatches]) => (
                <div key={round} className="mb-8">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-orange-400" />
                    <span>{round}</span>
                  </h4>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roundMatches.map((match) => (
                      <div
                        key={match.id}
                        className={`bg-slate-600/40 rounded-lg p-4 border-2 transition-all cursor-pointer hover:scale-105 ${
                          match.status === 'completed' ? 'border-green-500/50' :
                          match.status === 'in_progress' ? 'border-yellow-500/50' :
                          'border-blue-500/50'
                        }`}
                        onClick={() => {
                          setSelectedMatch(match);
                          setMatchForm({
                            participant1Id: match.participant1?.id || '',
                            participant2Id: match.participant2?.id || '',
                            winnerId: match.winnerId || '',
                            score1: match.score1,
                            score2: match.score2,
                            mapPlayed: match.mapPlayed || '',
                            scheduledAt: match.scheduledAt || '',
                            notes: match.notes || ''
                          });
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-blue-300">
                            Partida {match.matchNumber}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              match.status === 'completed' ? 'bg-green-500' :
                              match.status === 'in_progress' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMatch(match.id);
                              }}
                              className="p-1 hover:bg-red-600/20 rounded text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Participante 1 */}
                        <div className={`flex items-center justify-between p-2 rounded border mb-2 ${
                          match.winnerId === match.participant1?.id ? 'border-green-400 bg-green-400/20' : 'border-slate-500 bg-slate-700/40'
                        }`}>
                          <span className="text-white text-sm">
                            {match.participant1?.name || 'TBD'}
                          </span>
                          <span className="font-bold text-white">{match.score1}</span>
                        </div>
                        
                        {/* VS */}
                        <div className="text-center text-blue-400 text-xs mb-2">VS</div>
                        
                        {/* Participante 2 */}
                        <div className={`flex items-center justify-between p-2 rounded border ${
                          match.winnerId === match.participant2?.id ? 'border-green-400 bg-green-400/20' : 'border-slate-500 bg-slate-700/40'
                        }`}>
                          <span className="text-white text-sm">
                            {match.participant2?.name || 'TBD'}
                          </span>
                          <span className="font-bold text-white">{match.score2}</span>
                        </div>
                        
                        {match.mapPlayed && (
                          <div className="mt-2 text-xs text-orange-300">
                            Mapa: {match.mapPlayed}
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

      {activeTab === 'participants' && selectedTournament && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-white">
              Participantes ({participants.length}/{selectedTournament.maxParticipants})
            </h4>
            <div className="flex items-center space-x-2">
              {selectedTournament.type === 'team' && (
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-300 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Crear Equipo</span>
                </button>
              )}
              <button
                onClick={() => setShowAddParticipantModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-green-300 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Agregar Participante</span>
              </button>
            </div>
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
                          <span className="font-bold text-white">{participant.participantName}</span>
                          {participant.clanTag && (
                            <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-sm font-mono">
                              [{participant.clanTag}]
                            </span>
                          )}
                          {participant.teamName && (
                            <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-sm">
                              {participant.teamName}
                            </span>
                          )}
                        </div>
                        
                        {participant.teamMembers.length > 0 && (
                          <div className="text-sm text-blue-400 mt-1">
                            Miembros: {participant.teamMembers.join(', ')}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-blue-400 mt-1">
                          <span>Puntos: {participant.points}</span>
                          <span>V: {participant.wins}</span>
                          <span>D: {participant.losses}</span>
                          <span>Estado: {
                            participant.status === 'winner' ? 'Ganador' :
                            participant.status === 'eliminated' ? 'Eliminado' :
                            participant.status === 'active' ? 'Activo' : 'Registrado'
                          }</span>
                        </div>
                      </div>
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
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'matches' && selectedTournament && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-white">Partidas ({matches.length})</h4>
            <button
              onClick={() => setShowMatchModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-green-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Partida</span>
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Sin partidas</h3>
              <p className="text-blue-300">Crea partidas manualmente o genera el bracket</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-blue-400 font-medium">
                          R{match.round} - M{match.matchNumber}
                        </span>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          match.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          match.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {match.status === 'completed' ? 'Completada' :
                           match.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className="text-white">
                          {match.participant1?.name || 'TBD'}
                        </span>
                        <span className="text-blue-400">vs</span>
                        <span className="text-white">
                          {match.participant2?.name || 'TBD'}
                        </span>
                        {match.status === 'completed' && (
                          <span className="text-green-400 font-bold">
                            {match.score1} - {match.score2}
                          </span>
                        )}
                      </div>
                      
                      {match.mapPlayed && (
                        <div className="text-sm text-orange-300 mt-1">
                          Mapa: {match.mapPlayed}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMatch(match);
                          setMatchForm({
                            participant1Id: match.participant1?.id || '',
                            participant2Id: match.participant2?.id || '',
                            winnerId: match.winnerId || '',
                            score1: match.score1,
                            score2: match.score2,
                            mapPlayed: match.mapPlayed || '',
                            scheduledAt: match.scheduledAt || '',
                            notes: match.notes || ''
                          });
                        }}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'edit' && selectedTournament && (
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-white">Editar Torneo</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Torneo *</label>
              <input
                type="text"
                value={selectedTournament.name}
                onChange={(e) => setSelectedTournament({ ...selectedTournament, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Nombre del torneo"
              />
            </div>

            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Torneo</label>
              <select
                value={selectedTournament.type}
                onChange={(e) => setSelectedTournament({ 
                  ...selectedTournament, 
                  type: e.target.value as any,
                  teamSize: e.target.value === 'individual' ? 1 : selectedTournament.teamSize
                })}
                className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="individual">Individual</option>
                <option value="clan">Por Clanes</option>
                <option value="team">Por Equipos</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2">Tamaño de Equipo</label>
              <select
                value={selectedTournament.teamSize}
                onChange={(e) => setSelectedTournament({ ...selectedTournament, teamSize: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {getTeamSizeOptions(selectedTournament.type).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2">Máximo Participantes</label>
              <select
                value={selectedTournament.maxParticipants}
                onChange={(e) => setSelectedTournament({ ...selectedTournament, maxParticipants: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {[4, 8, 16, 32, 64].map((num) => (
                  <option key={num} value={num}>{num} participantes</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
            <textarea
              value={selectedTournament.description}
              onChange={(e) => setSelectedTournament({ ...selectedTournament, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Descripción del torneo..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setActiveTab('list')}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateTournament}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
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

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
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
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Torneo</label>
                  <select
                    value={newTournament.type}
                    onChange={(e) => setNewTournament({ 
                      ...newTournament, 
                      type: e.target.value as any,
                      teamSize: e.target.value === 'individual' ? 1 : newTournament.teamSize
                    })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="individual">Individual (1v1)</option>
                    <option value="clan">Por Clanes</option>
                    <option value="team">Por Equipos</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tamaño de Equipo</label>
                  <select
                    value={newTournament.teamSize}
                    onChange={(e) => setNewTournament({ ...newTournament, teamSize: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {getTeamSizeOptions(newTournament.type).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Máximo Participantes</label>
                  <select
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {[4, 8, 16, 32, 64].map((num) => (
                      <option key={num} value={num}>{num} participantes</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Formato del Bracket</label>
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

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Estado Inicial</label>
                  <select
                    value={newTournament.status}
                    onChange={(e) => setNewTournament({ ...newTournament, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="draft">Borrador</option>
                    <option value="registration">Registro Abierto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Descripción del torneo..."
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

      {/* Modal de agregar participante */}
      {showAddParticipantModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
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
                  onChange={(e) => setNewParticipant({ 
                    ...newParticipant, 
                    participantType: e.target.value as any,
                    participantId: '',
                    teamMembers: []
                  })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="user">Usuario Individual</option>
                  {selectedTournament.type === 'clan' && <option value="clan">Clan</option>}
                  {selectedTournament.type === 'team' && <option value="team">Equipo Personalizado</option>}
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
                    {users.filter(u => u.isActive && !participants.some(p => p.participantId === u.id)).map((user) => (
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
                    {clans.filter(c => !participants.some(p => p.participantId === c.id)).map((clan) => (
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
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Nombre del equipo"
                    />
                  </div>

                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">
                      Miembros del Equipo ({newParticipant.teamMembers.length}/{selectedTournament.teamSize})
                    </label>
                    <div className="space-y-2">
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
                          <option value="">Seleccionar miembro {index + 1}...</option>
                          {users.filter(u => 
                            u.isActive && 
                            !newParticipant.teamMembers.includes(u.id) &&
                            !participants.some(p => p.teamMembers.includes(u.id))
                          ).map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.username}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddParticipant}
                  disabled={!newParticipant.participantId && newParticipant.participantType !== 'team'}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
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

      {/* Modal de crear/editar partida */}
      {(showMatchModal || selectedMatch) && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {selectedMatch ? 'Editar Partida' : 'Crear Nueva Partida'}
              </h3>
              <button
                onClick={() => {
                  setShowMatchModal(false);
                  setSelectedMatch(null);
                  setMatchForm({
                    participant1Id: '',
                    participant2Id: '',
                    winnerId: '',
                    score1: 0,
                    score2: 0,
                    mapPlayed: '',
                    scheduledAt: '',
                    notes: ''
                  });
                }}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Participante 1</label>
                  <select
                    value={matchForm.participant1Id}
                    onChange={(e) => setMatchForm({ ...matchForm, participant1Id: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Seleccionar participante...</option>
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
                    value={matchForm.participant2Id}
                    onChange={(e) => setMatchForm({ ...matchForm, participant2Id: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Seleccionar participante...</option>
                    {participants.filter(p => p.id !== matchForm.participant1Id).map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.participantName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedMatch && (
                <>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-blue-300 text-sm font-medium mb-2">Puntuación 1</label>
                      <input
                        type="number"
                        min="0"
                        value={matchForm.score1}
                        onChange={(e) => setMatchForm({ ...matchForm, score1: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-blue-300 text-sm font-medium mb-2">Puntuación 2</label>
                      <input
                        type="number"
                        min="0"
                        value={matchForm.score2}
                        onChange={(e) => setMatchForm({ ...matchForm, score2: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-blue-300 text-sm font-medium mb-2">Ganador</label>
                      <select
                        value={matchForm.winnerId}
                        onChange={(e) => setMatchForm({ ...matchForm, winnerId: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="">Sin ganador</option>
                        {matchForm.participant1Id && (
                          <option value={matchForm.participant1Id}>
                            {participants.find(p => p.id === matchForm.participant1Id)?.participantName}
                          </option>
                        )}
                        {matchForm.participant2Id && (
                          <option value={matchForm.participant2Id}>
                            {participants.find(p => p.id === matchForm.participant2Id)?.participantName}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Mapa Jugado</label>
                <input
                  type="text"
                  value={matchForm.mapPlayed}
                  onChange={(e) => setMatchForm({ ...matchForm, mapPlayed: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Nombre del mapa"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Notas</label>
                <textarea
                  value={matchForm.notes}
                  onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Notas adicionales sobre la partida..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={selectedMatch ? handleUpdateMatch : handleCreateMatch}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{selectedMatch ? 'Actualizar Partida' : 'Crear Partida'}</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowMatchModal(false);
                    setSelectedMatch(null);
                    setMatchForm({
                      participant1Id: '',
                      participant2Id: '',
                      winnerId: '',
                      score1: 0,
                      score2: 0,
                      mapPlayed: '',
                      scheduledAt: '',
                      notes: ''
                    });
                  }}
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