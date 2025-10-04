import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Target, Edit, Save, X, Plus, Trash2, Settings, Crown, Shield, Star, Zap, AlertTriangle, CheckCircle, MapPin, Calendar, Clock, RefreshCw, Eye, EyeOff, Move, Lock, Unlock, Type, Tag, Award, Medal, UserCheck } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Participant {
  id: string;
  participantType: 'user' | 'clan' | 'team';
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  clanTag?: string;
  teamName?: string;
  teamMembers: string[];
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  participant1?: Participant;
  participant2?: Participant;
  team1Participants?: Participant[];
  team2Participants?: Participant[];
  winnerId?: string;
  winnerTeam?: number;
  score1: number;
  score2: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt?: string;
  completedAt?: string;
  mapPlayed?: string;
  notes?: string;
  position: { x: number; y: number };
  team1CustomName?: string;
  team2CustomName?: string;
}

interface TournamentBracketProps {
  tournamentId: string;
  tournamentType: 'individual' | 'clan' | 'team';
  teamSize: number;
  participants: Participant[];
  matches: Match[];
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  isAdmin: boolean;
  onMatchUpdate: (matchId: string, updates: any) => void;
  onBracketRegenerate: () => void;
  onRefreshData: () => void;
}


const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournamentId,
  tournamentType,
  teamSize,
  participants,
  matches,
  bracketType,
  isAdmin,
  onMatchUpdate,
  onBracketRegenerate,
  onRefreshData
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamNamesModal, setShowTeamNamesModal] = useState(false);
  const [showRoundTitleModal, setShowRoundTitleModal] = useState(false);
  const [showMatchEditModal, setShowMatchEditModal] = useState(false);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingTeamNames, setEditingTeamNames] = useState<{matchId: string, team1Name: string, team2Name: string} | null>(null);
  const [editingRoundTitle, setEditingRoundTitle] = useState<{round: number, title: string} | null>(null);
  const [roundTitles, setRoundTitles] = useState<Record<number, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedMatch, setDraggedMatch] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPositionControls, setShowPositionControls] = useState(false);
  const [manualChampion, setManualChampion] = useState<{
    type: 'individual' | 'team';
    participantId?: string;
    teamParticipants?: string[];
    name: string;
  } | null>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

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

  // Estado para editar partida
  const [editMatchData, setEditMatchData] = useState({
    score1: 0,
    score2: 0,
    winnerId: '',
    winnerTeam: 0,
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    mapPlayed: '',
    notes: '',
    participant1Id: '',
    participant2Id: '',
    team1Participants: [] as string[],
    team2Participants: [] as string[]
  });

  useEffect(() => {
    loadRoundTitles();
    loadManualChampion();
  }, [tournamentId]);

  const loadRoundTitles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/get-round-titles.php?tournamentId=${tournamentId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setRoundTitles(data.roundTitles);
      }
    } catch (error) {
      console.error('Error loading round titles:', error);
    }
  };

  const loadManualChampion = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/get-champion.php?tournamentId=${tournamentId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.champion) {
        setManualChampion(data.champion);
      }
    } catch (error) {
      console.error('Error loading manual champion:', error);
    }
  };

  const handleCreateMatchClick = () => {
    console.log('🎯 Botón Crear Partida Manual clickeado');
    setShowCreateModal(true);
  };

  const createMatch = async () => {
    try {
      setIsUpdating(true);
      
      // Preparar datos según el tipo de torneo
      const matchData: any = {
        tournamentId,
        round: newMatch.round,
        matchNumber: newMatch.matchNumber,
        mapPlayed: newMatch.mapPlayed || null,
        scheduledAt: newMatch.scheduledAt || null,
        notes: newMatch.notes || null
      };

      if (teamSize > 1) {
        // Para equipos múltiples
        matchData.team1Participants = newMatch.team1Participants.length > 0 ? newMatch.team1Participants : null;
        matchData.team2Participants = newMatch.team2Participants.length > 0 ? newMatch.team2Participants : null;
      } else {
        // Para 1v1
        matchData.participant1Id = newMatch.participant1Id || null;
        matchData.participant2Id = newMatch.participant2Id || null;
      }

      console.log('🎯 Enviando datos de partida:', matchData);

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
        // Resetear formulario
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
        
        // Cerrar modal
        setShowCreateModal(false);
        
        // Refrescar datos
        onRefreshData();
        
        alert('Partida creada exitosamente');
      } else {
        alert(data.message || 'Error al crear la partida');
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error al crear la partida');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateMatch = async (matchId: string, updates: any) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`${API_BASE_URL}/tournaments/update-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          matchId,
          ...updates
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar el match localmente
        onMatchUpdate(matchId, updates);
        
        // Refrescar datos
        onRefreshData();
        
        setShowMatchEditModal(false);
        setEditingMatch(null);
        
        return true;
      } else {
        alert(data.message || 'Error al actualizar la partida');
        return false;
      }
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Error al actualizar la partida');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta partida? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsUpdating(true);
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
        // Refrescar datos
        onRefreshData();
        alert('Partida eliminada exitosamente');
      } else {
        alert(data.message || 'Error al eliminar la partida');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error al eliminar la partida');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteRound = async (round: number) => {
    const roundMatches = matches.filter(m => m.round === round);
    
    if (roundMatches.length === 0) {
      alert('No hay partidas en esta ronda para eliminar');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar toda la ronda ${round}? Se eliminarán ${roundMatches.length} partida(s). Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setIsUpdating(true);
      
      // Eliminar todas las partidas de la ronda
      for (const match of roundMatches) {
        const response = await fetch(`${API_BASE_URL}/tournaments/delete-match.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ matchId: match.id })
        });
        
        const data = await response.json();
        if (!data.success) {
          console.error(`Error deleting match ${match.id}:`, data.message);
        }
      }
      
      // Refrescar datos
      onRefreshData();
      alert(`Ronda ${round} eliminada exitosamente`);
    } catch (error) {
      console.error('Error deleting round:', error);
      alert('Error al eliminar la ronda');
    } finally {
      setIsUpdating(false);
    }
  };

  const setManualChampionData = async (championData: any) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`${API_BASE_URL}/tournaments/set-champion.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId,
          ...championData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setManualChampion(championData);
        setShowChampionModal(false);
        onRefreshData();
        alert('Campeón designado exitosamente');
      } else {
        alert(data.message || 'Error al designar campeón');
      }
    } catch (error) {
      console.error('Error setting champion:', error);
      alert('Error al designar campeón');
    } finally {
      setIsUpdating(false);
    }
  };

  const clearManualChampion = async () => {
    if (!confirm('¿Estás seguro de que quieres quitar la designación manual del campeón?')) {
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(`${API_BASE_URL}/tournaments/clear-champion.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ tournamentId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setManualChampion(null);
        onRefreshData();
        alert('Designación de campeón eliminada');
      } else {
        alert(data.message || 'Error al quitar designación de campeón');
      }
    } catch (error) {
      console.error('Error clearing champion:', error);
      alert('Error al quitar designación de campeón');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTeamNames = async (matchId: string, team1Name: string, team2Name: string) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`${API_BASE_URL}/tournaments/update-match-teams.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          matchId,
          team1Name,
          team2Name
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar el match localmente
        onMatchUpdate(matchId, {
          team1CustomName: team1Name,
          team2CustomName: team2Name
        });
        
        // Refrescar datos
        onRefreshData();
        
        setShowTeamNamesModal(false);
        setEditingTeamNames(null);
      } else {
        alert(data.message || 'Error al actualizar nombres de equipos');
      }
    } catch (error) {
      console.error('Error updating team names:', error);
      alert('Error al actualizar nombres de equipos');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateRoundTitle = async (round: number, title: string) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`${API_BASE_URL}/tournaments/update-round-title.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId,
          round,
          title
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar títulos localmente
        setRoundTitles(prev => ({
          ...prev,
          [round]: title
        }));
        
        setShowRoundTitleModal(false);
        setEditingRoundTitle(null);
      } else {
        alert(data.message || 'Error al actualizar título de ronda');
      }
    } catch (error) {
      console.error('Error updating round title:', error);
      alert('Error al actualizar título de ronda');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    
    // Preparar datos para edición
    setEditMatchData({
      score1: match.score1,
      score2: match.score2,
      winnerId: match.winnerId || '',
      winnerTeam: match.winnerTeam || 0,
      status: match.status,
      mapPlayed: match.mapPlayed || '',
      notes: match.notes || '',
      participant1Id: match.participant1?.id || '',
      participant2Id: match.participant2?.id || '',
      team1Participants: match.team1Participants?.map(p => p.id) || [],
      team2Participants: match.team2Participants?.map(p => p.id) || []
    });
    
    setShowMatchEditModal(true);
  };

  const handleEditTeamNames = (match: Match) => {
    setEditingTeamNames({
      matchId: match.id,
      team1Name: match.team1CustomName || getTeamDisplayName(match, 1),
      team2Name: match.team2CustomName || getTeamDisplayName(match, 2)
    });
    setShowTeamNamesModal(true);
  };

  const handleEditRoundTitle = (round: number) => {
    setEditingRoundTitle({
      round,
      title: roundTitles[round] || `Ronda ${round}`
    });
    setShowRoundTitleModal(true);
  };

  const handleSaveMatch = async () => {
    if (!editingMatch) return;

    const updates: any = {
      score1: editMatchData.score1,
      score2: editMatchData.score2,
      status: editMatchData.status,
      mapPlayed: editMatchData.mapPlayed,
      notes: editMatchData.notes
    };

    // Determinar ganador basado en el puntaje y tipo de torneo
    if (editMatchData.status === 'completed') {
      if (teamSize > 1) {
        // Para equipos múltiples, usar winnerTeam
        if (editMatchData.score1 > editMatchData.score2) {
          updates.winnerTeam = 1;
        } else if (editMatchData.score2 > editMatchData.score1) {
          updates.winnerTeam = 2;
        } else {
          updates.winnerTeam = null; // Empate
        }
        updates.winnerId = null; // Limpiar winnerId para equipos
      } else {
        // Para 1v1, usar winnerId
        if (editMatchData.score1 > editMatchData.score2) {
          updates.winnerId = editingMatch.participant1?.id || null;
        } else if (editMatchData.score2 > editMatchData.score1) {
          updates.winnerId = editingMatch.participant2?.id || null;
        } else {
          updates.winnerId = null; // Empate
        }
        updates.winnerTeam = null; // Limpiar winnerTeam para 1v1
      }
    } else {
      // Si no está completada, limpiar ganadores
      updates.winnerId = null;
      updates.winnerTeam = null;
    }

    // Actualizar participantes si es necesario
    if (teamSize > 1) {
      if (editMatchData.team1Participants.length > 0) {
        updates.team1Participants = editMatchData.team1Participants;
      }
      if (editMatchData.team2Participants.length > 0) {
        updates.team2Participants = editMatchData.team2Participants;
      }
    } else {
      if (editMatchData.participant1Id) {
        updates.participant1Id = editMatchData.participant1Id;
      }
      if (editMatchData.participant2Id) {
        updates.participant2Id = editMatchData.participant2Id;
      }
    }

    await updateMatch(editingMatch.id, updates);
  };

  const getTeamDisplayName = (match: Match, teamNumber: 1 | 2) => {
    if (teamNumber === 1) {
      if (match.team1CustomName) return match.team1CustomName;
      
      if (teamSize > 1 && match.team1Participants && match.team1Participants.length > 0) {
        const firstParticipant = match.team1Participants[0];
        if (tournamentType === 'clan' && firstParticipant.clanTag) {
          return `Equipo [${firstParticipant.clanTag}]`;
        }
        return firstParticipant.teamName || `Equipo ${firstParticipant.participantName}`;
      }
      
      if (match.participant1) {
        if (match.participant1.clanTag) {
          return `[${match.participant1.clanTag}] ${match.participant1.participantName}`;
        }
        return match.participant1.teamName || match.participant1.participantName;
      }
      
      return 'Equipo 1';
    } else {
      if (match.team2CustomName) return match.team2CustomName;
      
      if (teamSize > 1 && match.team2Participants && match.team2Participants.length > 0) {
        const firstParticipant = match.team2Participants[0];
        if (tournamentType === 'clan' && firstParticipant.clanTag) {
          return `Equipo [${firstParticipant.clanTag}]`;
        }
        return firstParticipant.teamName || `Equipo ${firstParticipant.participantName}`;
      }
      
      if (match.participant2) {
        if (match.participant2.clanTag) {
          return `[${match.participant2.clanTag}] ${match.participant2.participantName}`;
        }
        return match.participant2.teamName || match.participant2.participantName;
      }
      
      return 'Equipo 2';
    }
  };

  const getTeamMembers = (match: Match, teamNumber: 1 | 2) => {
    if (teamSize === 1) return null;
    
    if (teamNumber === 1 && match.team1Participants && match.team1Participants.length > 0) {
      return match.team1Participants.map(p => p.participantName).join(', ');
    } else if (teamNumber === 2 && match.team2Participants && match.team2Participants.length > 0) {
      return match.team2Participants.map(p => p.participantName).join(', ');
    }
    
    return null;
  };

  const getMatchFormat = () => {
    return teamSize === 1 ? '1v1' : `${teamSize}v${teamSize}`;
  };

  const getRoundTitle = (round: number) => {
    return roundTitles[round] || `Ronda ${round}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'cancelled': return AlertTriangle;
      default: return Target;
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

  // Organizar matches por rondas
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  // Determinar si hay un campeón (manual o automático)
  const getChampion = () => {
    // Priorizar campeón manual
    if (manualChampion) {
      return {
        ...manualChampion,
        isManual: true
      };
    }

    // Campeón automático basado en resultados
    if (bracketType === 'single_elimination' && rounds.length > 0) {
      const finalRound = Math.max(...rounds);
      const finalMatches = matchesByRound[finalRound];
      const finalMatch = finalMatches?.find(m => m.status === 'completed');
      
      if (finalMatch) {
        if (teamSize > 1) {
          // Para equipos múltiples
          if (finalMatch.winnerTeam === 1) {
            return {
              type: 'team',
              name: getTeamDisplayName(finalMatch, 1),
              participants: finalMatch.team1Participants || [],
              score: `${finalMatch.score1} - ${finalMatch.score2}`,
              isManual: false
            };
          } else if (finalMatch.winnerTeam === 2) {
            return {
              type: 'team',
              name: getTeamDisplayName(finalMatch, 2),
              participants: finalMatch.team2Participants || [],
              score: `${finalMatch.score1} - ${finalMatch.score2}`,
              isManual: false
            };
          }
        } else {
          // Para 1v1
          if (finalMatch.winnerId === finalMatch.participant1?.id) {
            return {
              type: 'individual',
              name: getTeamDisplayName(finalMatch, 1),
              participant: finalMatch.participant1,
              score: `${finalMatch.score1} - ${finalMatch.score2}`,
              isManual: false
            };
          } else if (finalMatch.winnerId === finalMatch.participant2?.id) {
            return {
              type: 'individual',
              name: getTeamDisplayName(finalMatch, 2),
              participant: finalMatch.participant2,
              score: `${finalMatch.score1} - ${finalMatch.score2}`,
              isManual: false
            };
          }
        }
      }
    }
    return null;
  };

  const champion = getChampion();

  if (matches.length === 0) {
    return (
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl">
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">Bracket no generado</h3>
          <p className="text-blue-300 mb-6">
            {bracketType === 'round_robin' 
              ? 'Las partidas se generarán automáticamente cuando haya suficientes participantes'
              : 'El bracket se generará automáticamente cuando comience el torneo'
            }
          </p>
          
          {isAdmin && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={onBracketRegenerate}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Generar Bracket</span>
              </button>
              
              <button
                onClick={handleCreateMatchClick}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Crear Partida Manual</span>
              </button>

              <button
                onClick={() => setShowChampionModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-white font-medium transition-colors"
              >
                <Crown className="w-5 h-5" />
                <span>Designar Campeón</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Campeón */}
      {champion && (
        <div className="bg-gradient-to-r from-yellow-600/20 via-yellow-500/20 to-yellow-600/20 backdrop-blur-lg rounded-2xl border border-yellow-500/30 p-8 shadow-2xl">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Crown className="w-12 h-12 text-yellow-400" />
              <h2 className="text-3xl font-bold text-yellow-300">
                ¡CAMPEÓN{champion.isManual ? ' (DESIGNADO)' : ''}!
              </h2>
              <Crown className="w-12 h-12 text-yellow-400" />
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-2">{champion.name}</h3>
              
              {champion.type === 'team' && champion.participants && champion.participants.length > 0 && (
                <div className="mb-3">
                  <p className="text-yellow-300 text-sm mb-2">Miembros del equipo:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {champion.participants.map((participant, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-yellow-600/20 text-yellow-200 rounded-lg text-sm"
                      >
                        {participant.participantName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center space-x-4">
                <Medal className="w-8 h-8 text-yellow-400" />
                {champion.score && (
                  <span className="text-xl font-bold text-yellow-300">
                    Resultado Final: {champion.score}
                  </span>
                )}
                <Medal className="w-8 h-8 text-yellow-400" />
              </div>

              {champion.isManual && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <UserCheck className="w-4 h-4 inline mr-2" />
                    Campeón designado manualmente por un administrador
                  </p>
                </div>
              )}
            </div>

            {/* Controles de administrador para el campeón */}
            {isAdmin && (
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={() => setShowChampionModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Cambiar Campeón</span>
                </button>
                
                {champion.isManual && (
                  <button
                    onClick={clearManualChampion}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-300 hover:text-red-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Quitar Designación</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controles de administrador */}
      {isAdmin && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-orange-400" />
              <h3 className="text-xl font-bold text-white">Controles de Administrador</h3>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPositionControls(!showPositionControls)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  showPositionControls 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-orange-600/20 text-orange-300 hover:bg-orange-600/30'
                }`}
              >
                {showPositionControls ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                <span>{showPositionControls ? 'Bloquear Posiciones' : 'Editar Posiciones'}</span>
              </button>
              
              <button
                onClick={onRefreshData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <button
              onClick={handleCreateMatchClick}
              className="flex items-center space-x-3 p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl text-green-300 hover:text-green-200 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Partida</span>
            </button>
            
            <button
              onClick={onBracketRegenerate}
              className="flex items-center space-x-3 p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-300 hover:text-blue-200 transition-all duration-300"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Regenerar Bracket</span>
            </button>
            
            <button
              onClick={() => setShowChampionModal(true)}
              className="flex items-center space-x-3 p-4 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-xl text-yellow-300 hover:text-yellow-200 transition-all duration-300"
            >
              <Crown className="w-5 h-5" />
              <span>Designar Campeón</span>
            </button>
            
            <div className="flex items-center space-x-2 p-4 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-300">
              <Trophy className="w-5 h-5" />
              <span>Formato: {getMatchFormat()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bracket */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Bracket del Torneo</h2>
              <p className="text-blue-300">Formato: {getMatchFormat()} • {matches.length} partidas</p>
            </div>
          </div>
        </div>

        <div ref={bracketRef} className="relative overflow-x-auto">
          <div className="flex space-x-12 min-w-max py-8">
            {rounds.map((round) => (
              <div key={round} className="flex flex-col space-y-6 min-w-[300px]">
                {/* Título de la ronda */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <h3 className="text-xl font-bold text-white">
                      {getRoundTitle(round)}
                    </h3>
                    <span className="px-2 py-1 bg-orange-600/20 text-orange-300 rounded text-sm font-bold">
                      {getMatchFormat()}
                    </span>
                    {isAdmin && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditRoundTitle(round)}
                          className="p-1 bg-blue-600/20 hover:bg-blue-600/40 rounded text-blue-300 hover:text-blue-200 transition-colors"
                          title="Editar título de ronda"
                        >
                          <Type className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRound(round)}
                          className="p-1 bg-red-600/20 hover:bg-red-600/40 rounded text-red-300 hover:text-red-200 transition-colors"
                          title="Eliminar toda la ronda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded"></div>
                </div>

                {/* Partidas de la ronda */}
                <div className="space-y-6">
                  {matchesByRound[round]
                    .sort((a, b) => a.matchNumber - b.matchNumber)
                    .map((match) => {
                      const StatusIcon = getStatusIcon(match.status);
                      const team1Name = getTeamDisplayName(match, 1);
                      const team2Name = getTeamDisplayName(match, 2);
                      const team1Members = getTeamMembers(match, 1);
                      const team2Members = getTeamMembers(match, 2);
                      
                      return (
                        <div
                          key={match.id}
                          className={`bg-slate-700/40 rounded-xl border border-blue-600/30 p-4 transition-all duration-300 hover:border-blue-500/50 ${
                            showPositionControls ? 'cursor-move' : 'cursor-pointer'
                          } ${
                            draggedMatch === match.id ? 'opacity-50 scale-95' : ''
                          }`}
                          onClick={() => !showPositionControls && setSelectedMatch(match)}
                          draggable={showPositionControls}
                          onDragStart={(e) => {
                            setDraggedMatch(match.id);
                            setIsDragging(true);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedMatch(null);
                            setIsDragging(false);
                          }}
                        >
                          {/* Header de la partida */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400 font-medium">
                                Partida #{match.matchNumber}
                              </span>
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
                                <StatusIcon className="w-3 h-3" />
                                <span>
                                  {match.status === 'completed' ? 'Completada' :
                                   match.status === 'in_progress' ? 'En Progreso' :
                                   match.status === 'cancelled' ? 'Cancelada' :
                                   'Pendiente'}
                                </span>
                              </div>
                            </div>
                            
                            {isAdmin && (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMatch(match);
                                  }}
                                  className="p-1 bg-green-600/20 hover:bg-green-600/40 rounded text-green-300 hover:text-green-200 transition-colors"
                                  title="Editar partida completa"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTeamNames(match);
                                  }}
                                  className="p-1 bg-purple-600/20 hover:bg-purple-600/40 rounded text-purple-300 hover:text-purple-200 transition-colors"
                                  title="Editar nombres de equipos"
                                >
                                  <Tag className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMatch(match.id);
                                  }}
                                  className="p-1 bg-red-600/20 hover:bg-red-600/40 rounded text-red-300 hover:text-red-200 transition-colors"
                                  title="Eliminar partida"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Equipos */}
                          <div className="space-y-3">
                            {/* Equipo 1 */}
                            <div className={`flex items-center justify-between p-3 rounded-lg ${
                              match.winnerId === match.participant1?.id || match.winnerTeam === 1
                                ? 'bg-green-500/20 border border-green-500/30'
                                : 'bg-slate-600/40'
                            }`}>
                              <div className="flex-1">
                                <div className="font-medium text-white">
                                  {team1Name}
                                </div>
                                {team1Members && (
                                  <div className="text-blue-300 text-sm mt-1">
                                    {team1Members}
                                  </div>
                                )}
                              </div>
                              <div className={`text-2xl font-bold ${
                                match.winnerId === match.participant1?.id || match.winnerTeam === 1
                                  ? 'text-green-400'
                                  : 'text-white'
                              }`}>
                                {match.score1}
                              </div>
                            </div>

                            {/* VS */}
                            <div className="text-center">
                              <span className="text-blue-400 font-bold text-lg">
                                {getMatchFormat()}
                              </span>
                            </div>

                            {/* Equipo 2 */}
                            <div className={`flex items-center justify-between p-3 rounded-lg ${
                              match.winnerId === match.participant2?.id || match.winnerTeam === 2
                                ? 'bg-green-500/20 border border-green-500/30'
                                : 'bg-slate-600/40'
                            }`}>
                              <div className="flex-1">
                                <div className="font-medium text-white">
                                  {team2Name}
                                </div>
                                {team2Members && (
                                  <div className="text-blue-300 text-sm mt-1">
                                    {team2Members}
                                  </div>
                                )}
                              </div>
                              <div className={`text-2xl font-bold ${
                                match.winnerId === match.participant2?.id || match.winnerTeam === 2
                                  ? 'text-green-400'
                                  : 'text-white'
                              }`}>
                                {match.score2}
                              </div>
                            </div>
                          </div>

                          {/* Información adicional */}
                          {(match.mapPlayed || match.scheduledAt) && (
                            <div className="mt-3 pt-3 border-t border-blue-700/30">
                              <div className="flex items-center justify-between text-sm">
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
                                      {formatDate(match.scheduledAt)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para crear partida */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Plus className="w-6 h-6 text-green-400" />
                <span>Crear Nueva Partida</span>
              </h3>
              <button
                onClick={() => {
                  console.log('🎯 Cerrando modal de crear partida');
                  setShowCreateModal(false);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Ronda
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMatch.round}
                    onChange={(e) => setNewMatch({
                      ...newMatch,
                      round: parseInt(e.target.value) || 1
                    })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Número de Partida
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMatch.matchNumber}
                    onChange={(e) => setNewMatch({
                      ...newMatch,
                      matchNumber: parseInt(e.target.value) || 1
                    })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Selección de participantes */}
              {teamSize === 1 ? (
                /* Para torneos 1v1 */
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">
                      Participante 1 (Opcional)
                    </label>
                    <select
                      value={newMatch.participant1Id}
                      onChange={(e) => setNewMatch({
                        ...newMatch,
                        participant1Id: e.target.value
                      })}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Sin participante asignado</option>
                      {participants.map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {participant.participantName}
                          {participant.clanTag && ` [${participant.clanTag}]`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">
                      Participante 2 (Opcional)
                    </label>
                    <select
                      value={newMatch.participant2Id}
                      onChange={(e) => setNewMatch({
                        ...newMatch,
                        participant2Id: e.target.value
                      })}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Sin participante asignado</option>
                      {participants.map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {participant.participantName}
                          {participant.clanTag && ` [${participant.clanTag}]`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* Para torneos de equipos */
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">
                      Equipo 1 (Opcional - Máximo {teamSize} participantes)
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-blue-600/30 rounded-xl p-3 bg-slate-700/20">
                      {participants.map((participant) => (
                        <label key={participant.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newMatch.team1Participants.includes(participant.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (newMatch.team1Participants.length < teamSize) {
                                  setNewMatch({
                                    ...newMatch,
                                    team1Participants: [...newMatch.team1Participants, participant.id]
                                  });
                                }
                              } else {
                                setNewMatch({
                                  ...newMatch,
                                  team1Participants: newMatch.team1Participants.filter(id => id !== participant.id)
                                });
                              }
                            }}
                            disabled={!newMatch.team1Participants.includes(participant.id) && newMatch.team1Participants.length >= teamSize}
                            className="rounded border-blue-600/30"
                          />
                          <span className="text-white text-sm">
                            {participant.participantName}
                            {participant.clanTag && ` [${participant.clanTag}]`}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-blue-400 text-xs mt-1">
                      Seleccionados: {newMatch.team1Participants.length}/{teamSize}
                    </p>
                  </div>

                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">
                      Equipo 2 (Opcional - Máximo {teamSize} participantes)
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-blue-600/30 rounded-xl p-3 bg-slate-700/20">
                      {participants.map((participant) => (
                        <label key={participant.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newMatch.team2Participants.includes(participant.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (newMatch.team2Participants.length < teamSize) {
                                  setNewMatch({
                                    ...newMatch,
                                    team2Participants: [...newMatch.team2Participants, participant.id]
                                  });
                                }
                              } else {
                                setNewMatch({
                                  ...newMatch,
                                  team2Participants: newMatch.team2Participants.filter(id => id !== participant.id)
                                });
                              }
                            }}
                            disabled={!newMatch.team2Participants.includes(participant.id) && newMatch.team2Participants.length >= teamSize}
                            className="rounded border-blue-600/30"
                          />
                          <span className="text-white text-sm">
                            {participant.participantName}
                            {participant.clanTag && ` [${participant.clanTag}]`}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-blue-400 text-xs mt-1">
                      Seleccionados: {newMatch.team2Participants.length}/{teamSize}
                    </p>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Mapa (Opcional)
                </label>
                <input
                  type="text"
                  value={newMatch.mapPlayed}
                  onChange={(e) => setNewMatch({
                    ...newMatch,
                    mapPlayed: e.target.value
                  })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej: de_dust2"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Fecha Programada (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={newMatch.scheduledAt}
                  onChange={(e) => setNewMatch({
                    ...newMatch,
                    scheduledAt: e.target.value
                  })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={newMatch.notes}
                  onChange={(e) => setNewMatch({
                    ...newMatch,
                    notes: e.target.value
                  })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Notas adicionales sobre la partida..."
                />
              </div>

              {/* Información del formato */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <p className="text-orange-300 text-sm">
                  <Target className="w-4 h-4 inline mr-2" />
                  Esta partida se jugará en formato <strong>{getMatchFormat()}</strong>
                  {teamSize > 1 && ` (${teamSize} jugadores por equipo)`}
                </p>
              </div>

              {/* Información sobre participantes opcionales */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 text-sm">
                  <Users className="w-4 h-4 inline mr-2" />
                  <strong>Nota:</strong> Los participantes son opcionales. Puedes crear la partida sin asignar participantes y agregarlos después.
                </p>
              </div>

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    console.log('🎯 Botón Crear Partida clickeado');
                    createMatch();
                  }}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isUpdating ? 'Creando...' : 'Crear Partida'}</span>
                </button>
                
                <button
                  onClick={() => {
                    console.log('🎯 Botón Cancelar clickeado');
                    setShowCreateModal(false);
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

      {/* Modal para designar campeón */}
      {showChampionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <span>Designar Campeón</span>
              </h3>
              <button
                onClick={() => setShowChampionModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-300 text-sm">
                  <Crown className="w-4 h-4 inline mr-2" />
                  Designa manualmente el campeón del torneo. Esta designación tendrá prioridad sobre los resultados automáticos.
                </p>
              </div>

              {teamSize === 1 ? (
                /* Selección individual */
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-3">
                    Seleccionar Campeón Individual
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {participants.map((participant) => (
                      <button
                        key={participant.id}
                        onClick={() => setManualChampion({
                          type: 'individual',
                          participantId: participant.id,
                          name: participant.participantName
                        })}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                          manualChampion?.participantId === participant.id
                            ? 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300'
                            : 'bg-slate-700/40 border-slate-600/30 text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        {participant.participantAvatar ? (
                          <img
                            src={participant.participantAvatar}
                            alt={participant.participantName}
                            className="w-10 h-10 rounded-full border border-blue-500/30"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full border border-blue-500/30 bg-slate-600/40 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium">{participant.participantName}</div>
                          {participant.clanTag && (
                            <div className="text-sm opacity-75">[{participant.clanTag}]</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Selección por equipos */
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-3">
                    Seleccionar Equipo Campeón
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {participants.map((participant) => (
                      <button
                        key={participant.id}
                        onClick={() => setManualChampion({
                          type: 'team',
                          teamParticipants: [participant.id],
                          name: participant.teamName || participant.participantName
                        })}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                          manualChampion?.teamParticipants?.includes(participant.id)
                            ? 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300'
                            : 'bg-slate-700/40 border-slate-600/30 text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        {participant.participantAvatar ? (
                          <img
                            src={participant.participantAvatar}
                            alt={participant.participantName}
                            className="w-10 h-10 rounded-full border border-blue-500/30"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full border border-blue-500/30 bg-slate-600/40 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium">
                            {participant.teamName || participant.participantName}
                          </div>
                          {participant.teamMembers.length > 0 && (
                            <div className="text-sm opacity-75">
                              {participant.teamMembers.join(', ')}
                            </div>
                          )}
                          {participant.clanTag && (
                            <div className="text-sm opacity-75">[{participant.clanTag}]</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vista previa del campeón seleccionado */}
              {manualChampion && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h4 className="text-green-300 font-medium mb-2 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Campeón Seleccionado</span>
                  </h4>
                  <p className="text-green-200 font-bold text-lg">{manualChampion.name}</p>
                </div>
              )}

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => manualChampion && setManualChampionData(manualChampion)}
                  disabled={!manualChampion || isUpdating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  <span>{isUpdating ? 'Designando...' : 'Designar Campeón'}</span>
                </button>
                
                <button
                  onClick={() => setShowChampionModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar partida completa */}
      {showMatchEditModal && editingMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Editar Partida #{editingMatch.matchNumber}
              </h3>
              <button
                onClick={() => setShowMatchEditModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Equipos y Puntajes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-blue-300 text-sm font-medium">
                    {getTeamDisplayName(editingMatch, 1)} - Puntaje
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editMatchData.score1}
                    onChange={(e) => setEditMatchData({
                      ...editMatchData,
                      score1: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white text-center text-2xl font-bold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-blue-300 text-sm font-medium">
                    {getTeamDisplayName(editingMatch, 2)} - Puntaje
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editMatchData.score2}
                    onChange={(e) => setEditMatchData({
                      ...editMatchData,
                      score2: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white text-center text-2xl font-bold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Estado de la partida */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Estado de la Partida
                </label>
                <select
                  value={editMatchData.status}
                  onChange={(e) => setEditMatchData({
                    ...editMatchData,
                    status: e.target.value as any
                  })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              {/* Mapa jugado */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Mapa Jugado
                </label>
                <input
                  type="text"
                  value={editMatchData.mapPlayed}
                  onChange={(e) => setEditMatchData({
                    ...editMatchData,
                    mapPlayed: e.target.value
                  })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej: de_dust2"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Notas
                </label>
                <textarea
                  value={editMatchData.notes}
                  onChange={(e) => setEditMatchData({
                    ...editMatchData,
                    notes: e.target.value
                  })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Notas adicionales sobre la partida..."
                />
              </div>

              {/* Información del ganador */}
              {editMatchData.status === 'completed' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h4 className="text-green-300 font-medium mb-2">Ganador Automático</h4>
                  <p className="text-green-200 text-sm">
                    {editMatchData.score1 > editMatchData.score2 
                      ? `${getTeamDisplayName(editingMatch, 1)} gana con ${editMatchData.score1} - ${editMatchData.score2}`
                      : editMatchData.score2 > editMatchData.score1
                        ? `${getTeamDisplayName(editingMatch, 2)} gana con ${editMatchData.score2} - ${editMatchData.score1}`
                        : `Empate ${editMatchData.score1} - ${editMatchData.score2}`
                    }
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveMatch}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdating ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
                
                <button
                  onClick={() => setShowMatchEditModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar nombres de equipos */}
      {showTeamNamesModal && editingTeamNames && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Nombres de Equipos</h3>
              <button
                onClick={() => setShowTeamNamesModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Nombre del Equipo 1
                </label>
                <input
                  type="text"
                  value={editingTeamNames.team1Name}
                  onChange={(e) => setEditingTeamNames({
                    ...editingTeamNames,
                    team1Name: e.target.value
                  })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej: Equipo Alpha"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Nombre del Equipo 2
                </label>
                <input
                  type="text"
                  value={editingTeamNames.team2Name}
                  onChange={(e) => setEditingTeamNames({
                    ...editingTeamNames,
                    team2Name: e.target.value
                  })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej: Equipo Beta"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => updateTeamNames(
                    editingTeamNames.matchId,
                    editingTeamNames.team1Name,
                    editingTeamNames.team2Name
                  )}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdating ? 'Guardando...' : 'Guardar'}</span>
                </button>
                
                <button
                  onClick={() => setShowTeamNamesModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar título de ronda */}
      {showRoundTitleModal && editingRoundTitle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Título de Ronda</h3>
              <button
                onClick={() => setShowRoundTitleModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Título de la Ronda {editingRoundTitle.round}
                </label>
                <input
                  type="text"
                  value={editingRoundTitle.title}
                  onChange={(e) => setEditingRoundTitle({
                    ...editingRoundTitle,
                    title: e.target.value
                  })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej: Final, Semifinal, Cuartos de Final"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Ejemplos de títulos:</strong><br />
                  • Final ({getMatchFormat()})<br />
                  • Semifinal ({getMatchFormat()})<br />
                  • Cuartos de Final ({getMatchFormat()})<br />
                  • Octavos de Final ({getMatchFormat()})
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => updateRoundTitle(
                    editingRoundTitle.round,
                    editingRoundTitle.title
                  )}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdating ? 'Guardando...' : 'Guardar'}</span>
                </button>
                
                <button
                  onClick={() => setShowRoundTitleModal(false)}
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

export default TournamentBracket;