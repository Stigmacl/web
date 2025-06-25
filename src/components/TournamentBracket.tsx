import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Crown, Target, Play, CheckCircle, Clock, ArrowRight, Zap, Award, Medal, Edit, Save, X, Plus, Trash2, Shuffle, RotateCcw } from 'lucide-react';

interface Participant {
  id: string;
  participantType: 'user' | 'clan' | 'team';
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  clanTag?: string;
  teamName?: string;
  teamMembers?: string[];
  seed?: number;
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  participant1?: Participant;
  participant2?: Participant;
  winnerId?: string;
  score1: number;
  score2: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt?: string;
  completedAt?: string;
  mapPlayed?: string;
  notes?: string;
  position: {
    x: number;
    y: number;
  };
}

interface TournamentBracketProps {
  tournamentId: string;
  tournamentType: 'individual' | 'clan' | 'team';
  teamSize: number;
  participants: Participant[];
  matches: Match[];
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin';
  isAdmin?: boolean;
  onMatchUpdate?: (matchId: string, updates: any) => void;
  onParticipantUpdate?: (participantId: string, updates: any) => void;
  onBracketRegenerate?: () => void;
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

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournamentId,
  tournamentType,
  teamSize,
  participants,
  matches,
  bracketType,
  isAdmin = false,
  onMatchUpdate,
  onParticipantUpdate,
  onBracketRegenerate
}) => {
  const [bracketData, setBracketData] = useState<{
    rounds: Match[][];
    maxRounds: number;
    winnersBracket: Match[][];
    losersBracket: Match[][];
  }>({
    rounds: [],
    maxRounds: 0,
    winnersBracket: [],
    losersBracket: []
  });

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showEditParticipantModal, setShowEditParticipantModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [editingMatch, setEditingMatch] = useState<{
    participant1Id: string;
    participant2Id: string;
    winnerId: string;
    score1: number;
    score2: number;
    mapPlayed: string;
    notes: string;
  }>({
    participant1Id: '',
    participant2Id: '',
    winnerId: '',
    score1: 0,
    score2: 0,
    mapPlayed: '',
    notes: ''
  });

  useEffect(() => {
    if (participants.length > 0) {
      generateBracket();
    }
  }, [participants, matches, bracketType]);

  const generateBracket = () => {
    if (bracketType === 'single_elimination') {
      generateSingleEliminationBracket();
    } else if (bracketType === 'double_elimination') {
      generateDoubleEliminationBracket();
    } else if (bracketType === 'round_robin') {
      generateRoundRobinBracket();
    }
  };

  const generateSingleEliminationBracket = () => {
    const participantCount = participants.length;
    const maxRounds = Math.ceil(Math.log2(participantCount));
    const rounds: Match[][] = [];

    // Crear estructura de rondas basada en las partidas existentes
    for (let round = 1; round <= maxRounds; round++) {
      const roundMatches = matches.filter(m => m.round === round);
      
      // Calcular posiciones para las partidas
      const matchesInRound = Math.pow(2, maxRounds - round);
      const spacing = 120;
      const startY = 50;
      
      roundMatches.forEach((match, index) => {
        match.position = {
          x: (round - 1) * 300 + 50,
          y: startY + (index * spacing * Math.pow(2, round - 1))
        };
      });

      rounds.push(roundMatches);
    }

    setBracketData({
      rounds,
      maxRounds,
      winnersBracket: rounds,
      losersBracket: []
    });
  };

  const generateDoubleEliminationBracket = () => {
    // Implementación básica - se puede expandir
    generateSingleEliminationBracket();
  };

  const generateRoundRobinBracket = () => {
    // Para round robin, todas las partidas están en la "ronda 1"
    const roundRobinMatches = matches.filter(m => m.round === 1);
    
    // Organizar en una cuadrícula
    const matchesPerRow = Math.ceil(Math.sqrt(roundRobinMatches.length));
    roundRobinMatches.forEach((match, index) => {
      const row = Math.floor(index / matchesPerRow);
      const col = index % matchesPerRow;
      
      match.position = {
        x: col * 280 + 50,
        y: row * 150 + 50
      };
    });

    setBracketData({
      rounds: [roundRobinMatches],
      maxRounds: 1,
      winnersBracket: [roundRobinMatches],
      losersBracket: []
    });
  };

  const handleMatchClick = (match: Match) => {
    if (isAdmin) {
      setSelectedMatch(match);
      setEditingMatch({
        participant1Id: match.participant1?.id || '',
        participant2Id: match.participant2?.id || '',
        winnerId: match.winnerId || '',
        score1: match.score1,
        score2: match.score2,
        mapPlayed: match.mapPlayed || '',
        notes: match.notes || ''
      });
      setShowMatchModal(true);
    }
  };

  const handleParticipantClick = (participant: Participant) => {
    if (isAdmin) {
      setSelectedParticipant(participant);
      setShowEditParticipantModal(true);
    }
  };

  const updateMatchResult = async () => {
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
          winnerId: editingMatch.winnerId || null,
          score1: editingMatch.score1,
          score2: editingMatch.score2,
          mapPlayed: editingMatch.mapPlayed || null,
          status: editingMatch.winnerId ? 'completed' : selectedMatch.status,
          notes: editingMatch.notes || null
        })
      });

      const data = await response.json();
      
      if (data.success && onMatchUpdate) {
        onMatchUpdate(selectedMatch.id, {
          winnerId: editingMatch.winnerId,
          score1: editingMatch.score1,
          score2: editingMatch.score2,
          mapPlayed: editingMatch.mapPlayed,
          status: editingMatch.winnerId ? 'completed' : selectedMatch.status,
          notes: editingMatch.notes
        });
        setShowMatchModal(false);
        setSelectedMatch(null);
      }
    } catch (error) {
      console.error('Error updating match:', error);
    }
  };

  const swapParticipants = async (match: Match) => {
    if (!isAdmin || !match.participant1 || !match.participant2) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/update-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          matchId: match.id,
          participant1Id: match.participant2.id,
          participant2Id: match.participant1.id
        })
      });

      const data = await response.json();
      
      if (data.success && onMatchUpdate) {
        onMatchUpdate(match.id, {
          participant1: match.participant2,
          participant2: match.participant1
        });
      }
    } catch (error) {
      console.error('Error swapping participants:', error);
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-500/10';
      case 'in_progress': return 'border-yellow-500 bg-yellow-500/10';
      case 'pending': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      case 'pending': return Clock;
      default: return Target;
    }
  };

  const getTeamDisplayName = (participant: Participant) => {
    if (participant.participantType === 'team') {
      return participant.teamName || 'Equipo';
    } else if (participant.participantType === 'clan') {
      return `[${participant.clanTag}] ${participant.participantName}`;
    } else {
      return participant.participantName;
    }
  };

  const getTeamMembers = (participant: Participant) => {
    if (participant.participantType === 'team' && participant.teamMembers) {
      return participant.teamMembers.join(', ');
    } else if (participant.participantType === 'clan' && teamSize > 1) {
      return `Equipo ${teamSize}v${teamSize}`;
    }
    return null;
  };

  const renderMatch = (match: Match, roundIndex: number) => {
    const StatusIcon = getStatusIcon(match.status);
    const isWinner1 = match.winnerId === match.participant1?.id;
    const isWinner2 = match.winnerId === match.participant2?.id;

    return (
      <div
        key={match.id}
        className={`
          relative bg-slate-800/60 backdrop-blur-sm rounded-lg border-2 p-3 min-w-[280px] cursor-pointer
          transition-all duration-300 hover:scale-105 hover:shadow-lg
          ${getMatchStatusColor(match.status)}
          ${isAdmin ? 'hover:border-blue-400' : ''}
        `}
        onClick={() => handleMatchClick(match)}
        style={{
          position: 'absolute',
          left: match.position.x,
          top: match.position.y
        }}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <StatusIcon className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">
              {bracketType === 'round_robin' ? `Partida ${match.matchNumber}` : `R${match.round} - M${match.matchNumber}`}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {match.status === 'completed' && (
              <Trophy className="w-4 h-4 text-yellow-400" />
            )}
            {isAdmin && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    swapParticipants(match);
                  }}
                  className="p-1 hover:bg-blue-600/20 rounded text-blue-400 transition-colors"
                  title="Intercambiar participantes"
                >
                  <Shuffle className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMatchClick(match);
                  }}
                  className="p-1 hover:bg-green-600/20 rounded text-green-400 transition-colors"
                  title="Editar partida"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-2">
          {/* Participant 1 */}
          <div className={`
            flex items-center justify-between p-2 rounded border cursor-pointer
            ${isWinner1 ? 'border-green-400 bg-green-400/20' : 'border-slate-600 bg-slate-700/40'}
            ${isAdmin ? 'hover:bg-slate-600/60' : ''}
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (match.participant1) handleParticipantClick(match.participant1);
          }}>
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {match.participant1 ? (
                <>
                  {match.participant1.participantAvatar && (
                    <img
                      src={match.participant1.participantAvatar}
                      alt={match.participant1.participantName}
                      className="w-6 h-6 rounded-full border border-blue-500/30"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate block ${
                      isWinner1 ? 'text-green-200' : 'text-white'
                    }`}>
                      {getTeamDisplayName(match.participant1)}
                    </span>
                    {getTeamMembers(match.participant1) && (
                      <span className="text-xs text-blue-300 truncate block">
                        {getTeamMembers(match.participant1)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-gray-400 text-sm">TBD</span>
              )}
            </div>
            <div className={`
              px-2 py-1 rounded text-sm font-bold min-w-[24px] text-center
              ${isWinner1 ? 'bg-green-500 text-white' : 'bg-slate-600 text-gray-300'}
            `}>
              {match.score1}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
            <span className="px-2 text-xs font-bold text-blue-400 bg-slate-800 rounded">
              {tournamentType === 'team' && teamSize > 1 ? `${teamSize}v${teamSize}` : 'VS'}
            </span>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          </div>

          {/* Participant 2 */}
          <div className={`
            flex items-center justify-between p-2 rounded border cursor-pointer
            ${isWinner2 ? 'border-green-400 bg-green-400/20' : 'border-slate-600 bg-slate-700/40'}
            ${isAdmin ? 'hover:bg-slate-600/60' : ''}
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (match.participant2) handleParticipantClick(match.participant2);
          }}>
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {match.participant2 ? (
                <>
                  {match.participant2.participantAvatar && (
                    <img
                      src={match.participant2.participantAvatar}
                      alt={match.participant2.participantName}
                      className="w-6 h-6 rounded-full border border-blue-500/30"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate block ${
                      isWinner2 ? 'text-green-200' : 'text-white'
                    }`}>
                      {getTeamDisplayName(match.participant2)}
                    </span>
                    {getTeamMembers(match.participant2) && (
                      <span className="text-xs text-blue-300 truncate block">
                        {getTeamMembers(match.participant2)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-gray-400 text-sm">TBD</span>
              )}
            </div>
            <div className={`
              px-2 py-1 rounded text-sm font-bold min-w-[24px] text-center
              ${isWinner2 ? 'bg-green-500 text-white' : 'bg-slate-600 text-gray-300'}
            `}>
              {match.score2}
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div className="mt-2 space-y-1">
          {match.mapPlayed && (
            <div className="text-xs text-orange-300">
              Mapa: {match.mapPlayed}
            </div>
          )}
          {(match.scheduledAt || match.completedAt) && (
            <div className="flex items-center space-x-2 text-xs text-blue-400">
              <Calendar className="w-3 h-3" />
              <span>
                {match.completedAt 
                  ? `Finalizado: ${new Date(match.completedAt).toLocaleDateString()}`
                  : match.scheduledAt 
                    ? `Programado: ${new Date(match.scheduledAt).toLocaleDateString()}`
                    : 'Sin programar'
                }
              </span>
            </div>
          )}
          {match.notes && (
            <div className="text-xs text-gray-400 italic truncate">
              {match.notes}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConnectors = () => {
    if (bracketType === 'round_robin') return null;
    
    const connectors: JSX.Element[] = [];
    
    bracketData.rounds.forEach((round, roundIndex) => {
      if (roundIndex < bracketData.rounds.length - 1) {
        const nextRound = bracketData.rounds[roundIndex + 1];
        
        round.forEach((match, matchIndex) => {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const nextMatch = nextRound[nextMatchIndex];
          
          if (nextMatch) {
            const startX = match.position.x + 280;
            const startY = match.position.y + 60;
            const endX = nextMatch.position.x;
            const endY = nextMatch.position.y + 60;
            const midX = startX + (endX - startX) / 2;
            
            connectors.push(
              <svg
                key={`connector-${match.id}-${nextMatch.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}
              >
                <path
                  d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
                  stroke="rgba(59, 130, 246, 0.5)"
                  strokeWidth="2"
                  fill="none"
                  className="transition-all duration-300"
                />
                <circle
                  cx={midX}
                  cy={startY}
                  r="3"
                  fill="rgba(59, 130, 246, 0.7)"
                />
                <circle
                  cx={midX}
                  cy={endY}
                  r="3"
                  fill="rgba(59, 130, 246, 0.7)"
                />
              </svg>
            );
          }
        });
      }
    });
    
    return connectors;
  };

  const renderRoundHeaders = () => {
    if (bracketType === 'round_robin') {
      return (
        <div
          className="absolute bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg"
          style={{
            left: 50,
            top: 10,
            zIndex: 10
          }}
        >
          Round Robin - Todos vs Todos
        </div>
      );
    }

    return bracketData.rounds.map((round, index) => {
      const roundNames = {
        [bracketData.maxRounds]: 'Final',
        [bracketData.maxRounds - 1]: 'Semifinal',
        [bracketData.maxRounds - 2]: 'Cuartos de Final',
        [bracketData.maxRounds - 3]: 'Octavos de Final'
      };
      
      const roundName = roundNames[index + 1] || `Ronda ${index + 1}`;
      
      return (
        <div
          key={`round-header-${index}`}
          className="absolute bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg"
          style={{
            left: index * 300 + 50,
            top: 10,
            zIndex: 10
          }}
        >
          {roundName}
        </div>
      );
    });
  };

  if (participants.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">Sin Participantes</h3>
        <p className="text-blue-300">Agrega participantes para generar el bracket</p>
      </div>
    );
  }

  const bracketWidth = bracketType === 'round_robin' 
    ? Math.ceil(Math.sqrt(matches.length)) * 280 + 100
    : bracketData.maxRounds * 300 + 100;
  const bracketHeight = bracketType === 'round_robin'
    ? Math.ceil(matches.length / Math.ceil(Math.sqrt(matches.length))) * 150 + 100
    : Math.max(600, bracketData.rounds[0]?.length * 120 + 100);

  return (
    <div className="space-y-6">
      {/* Bracket Header */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Bracket {tournamentType === 'team' && teamSize > 1 ? `${teamSize}v${teamSize}` : ''} - {
                  bracketType === 'single_elimination' ? 'Eliminación Simple' :
                  bracketType === 'double_elimination' ? 'Eliminación Doble' :
                  'Round Robin'
                }
              </h3>
              <p className="text-blue-300 text-sm">
                {participants.length} participantes • {matches.length} partidas
                {tournamentType === 'team' && teamSize > 1 && ` • Equipos de ${teamSize} jugadores`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-300">Completado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-300">En Progreso</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-blue-300">Pendiente</span>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Edit className="w-3 h-3 text-purple-400" />
                <span className="text-purple-300">Editable</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-white">Controles de Administrador</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={onBracketRegenerate}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Regenerar Bracket</span>
              </button>
            </div>
          </div>
          <p className="text-blue-400 text-sm mt-2">
            Haz clic en las partidas para editarlas, en los participantes para cambiarlos, o usa los controles para reorganizar el bracket.
          </p>
        </div>
      )}

      {/* Bracket Visualization */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-6 overflow-auto">
        <div 
          className="relative"
          style={{ 
            width: bracketWidth, 
            height: bracketHeight,
            minWidth: '100%'
          }}
        >
          {/* Round Headers */}
          {renderRoundHeaders()}
          
          {/* Connectors */}
          {renderConnectors()}
          
          {/* Matches */}
          {bracketData.rounds.map((round, roundIndex) =>
            round.map((match) => renderMatch(match, roundIndex))
          )}
          
          {/* Winner Podium */}
          {bracketType !== 'round_robin' && bracketData.rounds.length > 0 && bracketData.rounds[bracketData.rounds.length - 1][0]?.winnerId && (
            <div
              className="absolute bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 border-2 border-yellow-400"
              style={{
                left: (bracketData.maxRounds - 1) * 300 + 320,
                top: 50,
                minWidth: 200
              }}
            >
              <div className="text-center">
                <Crown className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <h4 className="text-lg font-bold text-white mb-2">🏆 CAMPEÓN</h4>
                {(() => {
                  const finalMatch = bracketData.rounds[bracketData.rounds.length - 1][0];
                  const winner = finalMatch.winnerId === finalMatch.participant1?.id 
                    ? finalMatch.participant1 
                    : finalMatch.participant2;
                  
                  return winner ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-3">
                        {winner.participantAvatar && (
                          <img
                            src={winner.participantAvatar}
                            alt={winner.participantName}
                            className="w-12 h-12 rounded-full border-2 border-yellow-400"
                          />
                        )}
                        <div>
                          <p className="font-bold text-yellow-200">{getTeamDisplayName(winner)}</p>
                          {getTeamMembers(winner) && (
                            <p className="text-sm text-yellow-300">{getTeamMembers(winner)}</p>
                          )}
                        </div>
                      </div>
                      {tournamentType === 'team' && teamSize > 1 && (
                        <div className="text-xs text-yellow-400">
                          Equipo {teamSize}v{teamSize}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Match Update Modal */}
      {showMatchModal && selectedMatch && (
        <MatchUpdateModal
          match={selectedMatch}
          editingMatch={editingMatch}
          setEditingMatch={setEditingMatch}
          participants={participants}
          onClose={() => {
            setShowMatchModal(false);
            setSelectedMatch(null);
          }}
          onUpdate={updateMatchResult}
        />
      )}
    </div>
  );
};

// Modal para actualizar resultados de matches
interface MatchUpdateModalProps {
  match: Match;
  editingMatch: any;
  setEditingMatch: (data: any) => void;
  participants: Participant[];
  onClose: () => void;
  onUpdate: () => void;
}

const MatchUpdateModal: React.FC<MatchUpdateModalProps> = ({ 
  match, 
  editingMatch, 
  setEditingMatch, 
  participants, 
  onClose, 
  onUpdate 
}) => {
  const handleSubmit = () => {
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Actualizar Resultado</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Participant 1 */}
          <div className="space-y-2">
            <label className="block text-blue-300 text-sm font-medium">
              {match.participant1?.participantName || 'Participante 1'}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                value={editingMatch.score1}
                onChange={(e) => setEditingMatch({ ...editingMatch, score1: parseInt(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white"
              />
              <button
                onClick={() => setEditingMatch({ ...editingMatch, winnerId: match.participant1?.id || '' })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  editingMatch.winnerId === match.participant1?.id
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                }`}
              >
                Ganador
              </button>
            </div>
          </div>

          {/* Participant 2 */}
          <div className="space-y-2">
            <label className="block text-blue-300 text-sm font-medium">
              {match.participant2?.participantName || 'Participante 2'}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                value={editingMatch.score2}
                onChange={(e) => setEditingMatch({ ...editingMatch, score2: parseInt(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white"
              />
              <button
                onClick={() => setEditingMatch({ ...editingMatch, winnerId: match.participant2?.id || '' })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  editingMatch.winnerId === match.participant2?.id
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                }`}
              >
                Ganador
              </button>
            </div>
          </div>

          {/* Map Played */}
          <div>
            <label className="block text-blue-300 text-sm font-medium mb-2">Mapa Jugado</label>
            <input
              type="text"
              value={editingMatch.mapPlayed}
              onChange={(e) => setEditingMatch({ ...editingMatch, mapPlayed: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white placeholder-blue-300"
              placeholder="Nombre del mapa"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-blue-300 text-sm font-medium mb-2">Notas</label>
            <textarea
              value={editingMatch.notes}
              onChange={(e) => setEditingMatch({ ...editingMatch, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white placeholder-blue-300 resize-none"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              Guardar Resultado
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;