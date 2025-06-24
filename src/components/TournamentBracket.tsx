import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Crown, Target, Play, CheckCircle, Clock, ArrowRight, Zap, Award, Medal } from 'lucide-react';

interface Participant {
  id: string;
  participantType: 'user' | 'clan';
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  clanTag?: string;
  teamName?: string;
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
  position: {
    x: number;
    y: number;
  };
}

interface TournamentBracketProps {
  tournamentId: string;
  participants: Participant[];
  matches: Match[];
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin';
  isAdmin?: boolean;
  onMatchUpdate?: (matchId: string, updates: any) => void;
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
  participants,
  matches,
  bracketType,
  isAdmin = false,
  onMatchUpdate
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
    }
  };

  const generateSingleEliminationBracket = () => {
    const participantCount = participants.length;
    const maxRounds = Math.ceil(Math.log2(participantCount));
    const rounds: Match[][] = [];

    // Crear estructura de rondas
    for (let round = 1; round <= maxRounds; round++) {
      const matchesInRound = Math.pow(2, maxRounds - round);
      const roundMatches: Match[] = [];

      for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
        const existingMatch = matches.find(m => m.round === round && m.matchNumber === matchNum);
        
        if (existingMatch) {
          roundMatches.push({
            ...existingMatch,
            position: {
              x: (round - 1) * 300 + 50,
              y: (matchNum - 1) * 120 + 50
            }
          });
        } else {
          // Crear match placeholder
          roundMatches.push({
            id: `placeholder-${round}-${matchNum}`,
            round,
            matchNumber: matchNum,
            score1: 0,
            score2: 0,
            status: 'pending',
            position: {
              x: (round - 1) * 300 + 50,
              y: (matchNum - 1) * 120 + 50
            }
          });
        }
      }

      rounds.push(roundMatches);
    }

    // Asignar participantes a la primera ronda
    if (rounds.length > 0) {
      const firstRound = rounds[0];
      const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
      
      firstRound.forEach((match, index) => {
        const participant1 = shuffledParticipants[index * 2];
        const participant2 = shuffledParticipants[index * 2 + 1];
        
        if (participant1) match.participant1 = participant1;
        if (participant2) match.participant2 = participant2;
      });
    }

    setBracketData({
      rounds,
      maxRounds,
      winnersBracket: rounds,
      losersBracket: []
    });
  };

  const generateDoubleEliminationBracket = () => {
    const participantCount = participants.length;
    const winnersRounds = Math.ceil(Math.log2(participantCount));
    const losersRounds = (winnersRounds - 1) * 2;
    
    const winnersBracket: Match[][] = [];
    const losersBracket: Match[][] = [];

    // Generar Winners Bracket
    for (let round = 1; round <= winnersRounds; round++) {
      const matchesInRound = Math.pow(2, winnersRounds - round);
      const roundMatches: Match[] = [];

      for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
        const existingMatch = matches.find(m => m.round === round && m.matchNumber === matchNum);
        
        roundMatches.push(existingMatch || {
          id: `winners-${round}-${matchNum}`,
          round,
          matchNumber: matchNum,
          score1: 0,
          score2: 0,
          status: 'pending',
          position: {
            x: (round - 1) * 280 + 50,
            y: (matchNum - 1) * 100 + 50
          }
        });
      }

      winnersBracket.push(roundMatches);
    }

    // Generar Losers Bracket
    for (let round = 1; round <= losersRounds; round++) {
      const roundMatches: Match[] = [];
      // Lógica más compleja para losers bracket
      losersBracket.push(roundMatches);
    }

    setBracketData({
      rounds: winnersBracket,
      maxRounds: winnersRounds,
      winnersBracket,
      losersBracket
    });
  };

  const handleMatchClick = (match: Match) => {
    if (isAdmin && match.participant1 && match.participant2) {
      setSelectedMatch(match);
      setShowMatchModal(true);
    }
  };

  const updateMatchResult = async (matchId: string, winnerId: string, score1: number, score2: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/update-match.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          matchId,
          winnerId,
          score1,
          score2,
          status: 'completed'
        })
      });

      const data = await response.json();
      
      if (data.success && onMatchUpdate) {
        onMatchUpdate(matchId, { winnerId, score1, score2, status: 'completed' });
        setShowMatchModal(false);
        setSelectedMatch(null);
      }
    } catch (error) {
      console.error('Error updating match:', error);
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

  const renderMatch = (match: Match, roundIndex: number) => {
    const StatusIcon = getStatusIcon(match.status);
    const isWinner1 = match.winnerId === match.participant1?.id;
    const isWinner2 = match.winnerId === match.participant2?.id;

    return (
      <div
        key={match.id}
        className={`
          relative bg-slate-800/60 backdrop-blur-sm rounded-lg border-2 p-3 min-w-[240px] cursor-pointer
          transition-all duration-300 hover:scale-105 hover:shadow-lg
          ${getMatchStatusColor(match.status)}
          ${isAdmin && match.participant1 && match.participant2 ? 'hover:border-blue-400' : ''}
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
              R{match.round} - M{match.matchNumber}
            </span>
          </div>
          {match.status === 'completed' && (
            <Trophy className="w-4 h-4 text-yellow-400" />
          )}
        </div>

        {/* Participants */}
        <div className="space-y-2">
          {/* Participant 1 */}
          <div className={`
            flex items-center justify-between p-2 rounded border
            ${isWinner1 ? 'border-green-400 bg-green-400/20' : 'border-slate-600 bg-slate-700/40'}
          `}>
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
                      {match.participant1.participantName}
                    </span>
                    {match.participant1.clanTag && (
                      <span className="text-xs text-purple-300">
                        [{match.participant1.clanTag}]
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
            <span className="px-2 text-xs font-bold text-blue-400 bg-slate-800 rounded">VS</span>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          </div>

          {/* Participant 2 */}
          <div className={`
            flex items-center justify-between p-2 rounded border
            ${isWinner2 ? 'border-green-400 bg-green-400/20' : 'border-slate-600 bg-slate-700/40'}
          `}>
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
                      {match.participant2.participantName}
                    </span>
                    {match.participant2.clanTag && (
                      <span className="text-xs text-purple-300">
                        [{match.participant2.clanTag}]
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
        {(match.scheduledAt || match.completedAt) && (
          <div className="mt-2 pt-2 border-t border-slate-600">
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
          </div>
        )}
      </div>
    );
  };

  const renderConnectors = () => {
    const connectors: JSX.Element[] = [];
    
    bracketData.rounds.forEach((round, roundIndex) => {
      if (roundIndex < bracketData.rounds.length - 1) {
        const nextRound = bracketData.rounds[roundIndex + 1];
        
        round.forEach((match, matchIndex) => {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const nextMatch = nextRound[nextMatchIndex];
          
          if (nextMatch) {
            const startX = match.position.x + 240;
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

  const bracketWidth = bracketData.maxRounds * 300 + 100;
  const bracketHeight = Math.max(600, bracketData.rounds[0]?.length * 120 + 100);

  return (
    <div className="space-y-6">
      {/* Bracket Header */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Bracket - {bracketType === 'single_elimination' ? 'Eliminación Simple' : 'Eliminación Doble'}
              </h3>
              <p className="text-blue-300 text-sm">
                {participants.length} participantes • {bracketData.maxRounds} rondas
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
          </div>
        </div>
      </div>

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
          {bracketData.rounds.length > 0 && bracketData.rounds[bracketData.rounds.length - 1][0]?.winnerId && (
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
                    <div className="flex items-center space-x-3">
                      {winner.participantAvatar && (
                        <img
                          src={winner.participantAvatar}
                          alt={winner.participantName}
                          className="w-12 h-12 rounded-full border-2 border-yellow-400"
                        />
                      )}
                      <div>
                        <p className="font-bold text-yellow-200">{winner.participantName}</p>
                        {winner.clanTag && (
                          <p className="text-sm text-yellow-300">[{winner.clanTag}]</p>
                        )}
                      </div>
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
  onClose: () => void;
  onUpdate: (matchId: string, winnerId: string, score1: number, score2: number) => void;
}

const MatchUpdateModal: React.FC<MatchUpdateModalProps> = ({ match, onClose, onUpdate }) => {
  const [score1, setScore1] = useState(match.score1);
  const [score2, setScore2] = useState(match.score2);
  const [selectedWinner, setSelectedWinner] = useState<string>(match.winnerId || '');

  const handleSubmit = () => {
    if (!selectedWinner) {
      alert('Selecciona un ganador');
      return;
    }
    
    onUpdate(match.id, selectedWinner, score1, score2);
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
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Participant 1 */}
          <div className="space-y-2">
            <label className="block text-blue-300 text-sm font-medium">
              {match.participant1?.participantName}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                value={score1}
                onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white"
              />
              <button
                onClick={() => setSelectedWinner(match.participant1?.id || '')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedWinner === match.participant1?.id
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
              {match.participant2?.participantName}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                value={score2}
                onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white"
              />
              <button
                onClick={() => setSelectedWinner(match.participant2?.id || '')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedWinner === match.participant2?.id
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                }`}
              >
                Ganador
              </button>
            </div>
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