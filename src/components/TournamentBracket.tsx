import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Calendar, Crown, Target, Play, CheckCircle, Clock, ArrowRight, Zap, Award, Medal, Edit, Save, X, Plus, Trash2, Shuffle, RotateCcw, User, Shield } from 'lucide-react';

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
  onRefreshData?: () => void;
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
  onBracketRegenerate,
  onRefreshData
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
    teamName1: string;
    teamName2: string;
  }>({
    participant1Id: '',
    participant2Id: '',
    winnerId: '',
    score1: 0,
    score2: 0,
    mapPlayed: '',
    notes: '',
    teamName1: '',
    teamName2: ''
  });

  // Referencias para el scroll automático
  const bracketContainerRef = useRef<HTMLDivElement>(null);
  const [bracketDimensions, setBracketDimensions] = useState({ width: 0, height: 0 });

  // Regenerar bracket cada vez que cambien las partidas o participantes
  useEffect(() => {
    console.log('🔄 Regenerando bracket - Partidas:', matches.length, 'Participantes:', participants.length);
    if (matches.length > 0 || participants.length > 0) {
      generateBracket();
    }
  }, [participants, matches, bracketType]);

  // Auto-refresh cada 30 segundos para mantener sincronizado
  useEffect(() => {
    if (!isAdmin) return; // Solo para admins

    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh del bracket');
      if (onRefreshData) {
        onRefreshData();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isAdmin, onRefreshData]);

  // Ajustar scroll automáticamente cuando cambie el bracket - EMPEZAR DESDE LA IZQUIERDA
  useEffect(() => {
    if (bracketContainerRef.current && bracketData.rounds.length > 0) {
      const container = bracketContainerRef.current;
      
      // SIEMPRE empezar desde la izquierda (scroll horizontal = 0)
      container.scrollLeft = 0;
      
      // Centrar verticalmente
      const scrollTop = Math.max(0, (bracketDimensions.height - container.clientHeight) / 2);
      container.scrollTop = scrollTop;
    }
  }, [bracketData, bracketDimensions]);

  const generateBracket = () => {
    console.log('🏆 Generando bracket:', bracketType);
    if (bracketType === 'single_elimination') {
      generateSingleEliminationBracket();
    } else if (bracketType === 'double_elimination') {
      generateDoubleEliminationBracket();
    } else if (bracketType === 'round_robin') {
      generateRoundRobinBracket();
    }
  };

  const generateSingleEliminationBracket = () => {
    console.log('🎯 Generando bracket de eliminación simple');
    
    if (matches.length === 0) {
      console.log('⚠️ No hay partidas para generar bracket');
      setBracketData({
        rounds: [],
        maxRounds: 0,
        winnersBracket: [],
        losersBracket: []
      });
      return;
    }

    // Agrupar partidas por ronda
    const roundsMap = new Map<number, Match[]>();
    matches.forEach(match => {
      if (!roundsMap.has(match.round)) {
        roundsMap.set(match.round, []);
      }
      roundsMap.get(match.round)!.push(match);
    });

    // Convertir a array y ordenar
    const rounds: Match[][] = [];
    const sortedRounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);
    const maxRounds = Math.max(...sortedRounds);

    console.log('📊 Rondas encontradas:', sortedRounds, 'Max rondas:', maxRounds);

    // Calcular dimensiones del bracket - EMPEZAR DESDE LA IZQUIERDA
    const matchWidth = 350;
    const matchHeight = 200;
    const roundSpacing = 400;
    const baseVerticalSpacing = 140;

    let totalWidth = 0;
    let totalHeight = 0;

    sortedRounds.forEach(roundNumber => {
      const roundMatches = roundsMap.get(roundNumber)!;
      
      // Ordenar partidas por número de partida
      roundMatches.sort((a, b) => a.matchNumber - b.matchNumber);
      
      // Calcular posiciones para las partidas - EMPEZAR DESDE LA IZQUIERDA
      const roundIndex = roundNumber - 1;
      const verticalSpacing = baseVerticalSpacing * Math.pow(2, roundIndex);
      const startY = 100;
      
      roundMatches.forEach((match, index) => {
        // POSICIÓN X: Empezar desde la izquierda (50px de margen)
        const x = roundIndex * roundSpacing + 50;
        const y = startY + (index * verticalSpacing);
        
        match.position = { x, y };
        
        // Actualizar dimensiones totales
        totalWidth = Math.max(totalWidth, x + matchWidth);
        totalHeight = Math.max(totalHeight, y + matchHeight);
      });

      rounds.push(roundMatches);
    });

    // Agregar padding
    totalWidth += 100;
    totalHeight += 200;

    console.log('✅ Bracket generado con', rounds.length, 'rondas');
    console.log('📐 Dimensiones:', totalWidth, 'x', totalHeight);

    setBracketData({
      rounds,
      maxRounds,
      winnersBracket: rounds,
      losersBracket: []
    });

    setBracketDimensions({ width: totalWidth, height: totalHeight });
  };

  const generateDoubleEliminationBracket = () => {
    console.log('🎯 Generando bracket de eliminación doble');
    // Por ahora, usar la misma lógica que eliminación simple
    // TODO: Implementar lógica específica para doble eliminación
    generateSingleEliminationBracket();
  };

  const generateRoundRobinBracket = () => {
    console.log('🎯 Generando bracket round robin');
    
    if (matches.length === 0) {
      setBracketData({
        rounds: [],
        maxRounds: 0,
        winnersBracket: [],
        losersBracket: []
      });
      return;
    }

    // Para round robin, todas las partidas están en la "ronda 1" o se organizan por grupos
    const roundRobinMatches = [...matches];
    
    // Organizar en una cuadrícula más compacta - EMPEZAR DESDE LA IZQUIERDA
    const matchesPerRow = Math.ceil(Math.sqrt(roundRobinMatches.length));
    const matchWidth = 350;
    const matchHeight = 200;
    const horizontalSpacing = 370;
    const verticalSpacing = 220;
    
    let totalWidth = 0;
    let totalHeight = 0;
    
    roundRobinMatches.forEach((match, index) => {
      const row = Math.floor(index / matchesPerRow);
      const col = index % matchesPerRow;
      
      // EMPEZAR DESDE LA IZQUIERDA
      const x = col * horizontalSpacing + 50;
      const y = row * verticalSpacing + 100;
      
      match.position = { x, y };
      
      totalWidth = Math.max(totalWidth, x + matchWidth);
      totalHeight = Math.max(totalHeight, y + matchHeight);
    });

    // Agregar padding
    totalWidth += 100;
    totalHeight += 200;

    setBracketData({
      rounds: [roundRobinMatches],
      maxRounds: 1,
      winnersBracket: [roundRobinMatches],
      losersBracket: []
    });

    setBracketDimensions({ width: totalWidth, height: totalHeight });
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
        notes: match.notes || '',
        teamName1: getTeamDisplayName(match.participant1, [], { teamSize } as any) || '',
        teamName2: getTeamDisplayName(match.participant2, [], { teamSize } as any) || ''
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
        
        // Refrescar datos para regenerar bracket
        if (onRefreshData) {
          setTimeout(() => onRefreshData(), 500);
        }
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
        
        // Refrescar datos
        if (onRefreshData) {
          setTimeout(() => onRefreshData(), 500);
        }
      }
    } catch (error) {
      console.error('Error swapping participants:', error);
    }
  };

  const handleBracketRegenerate = () => {
    console.log('🔄 Regenerando bracket manualmente');
    if (onBracketRegenerate) {
      onBracketRegenerate();
    }
    // También refrescar datos
    if (onRefreshData) {
      setTimeout(() => onRefreshData(), 1000);
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

  // Función mejorada para obtener nombres de equipos
  const getTeamDisplayName = (participant: Participant | undefined, teamParticipants?: any[], tournament?: any) => {
    if (!participant) {
      return `Equipo TBD`;
    }

    if (participant.participantType === 'team') {
      return participant.teamName || `Equipo ${participant.participantName}`;
    } else if (participant.participantType === 'clan') {
      return `[${participant.clanTag}] ${participant.participantName}`;
    } else {
      if (teamSize > 1) {
        return `Equipo ${participant.participantName}`;
      }
      return participant.participantName;
    }
  };

  const getTeamMembers = (participant: Participant | undefined) => {
    if (!participant) return null;
    
    if (participant.participantType === 'team' && participant.teamMembers) {
      return participant.teamMembers.join(', ');
    } else if (participant.participantType === 'clan' && teamSize > 1) {
      return `Equipo ${teamSize}v${teamSize}`;
    } else if (participant.participantType === 'user' && teamSize > 1) {
      return `Jugador individual en ${teamSize}v${teamSize}`;
    }
    return null;
  };

  const getMatchFormat = () => {
    if (teamSize === 1) {
      return '1v1';
    }
    return `${teamSize}v${teamSize}`;
  };

  const renderMatch = (match: Match, roundIndex: number) => {
    const StatusIcon = getStatusIcon(match.status);
    const isWinner1 = match.winnerId === match.participant1?.id;
    const isWinner2 = match.winnerId === match.participant2?.id;

    // Generar nombres de equipos mejorados
    const team1Name = getTeamDisplayName(match.participant1) || `Equipo ${match.matchNumber * 2 - 1}`;
    const team2Name = getTeamDisplayName(match.participant2) || `Equipo ${match.matchNumber * 2}`;

    return (
      <div
        key={match.id}
        className={`
          relative bg-slate-800/60 backdrop-blur-sm rounded-lg border-2 p-4 min-w-[330px] cursor-pointer
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <StatusIcon className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">
              {bracketType === 'round_robin' ? `Partida ${match.matchNumber}` : `R${match.round} - M${match.matchNumber}`}
            </span>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/20 px-2 py-1 rounded">
              {getMatchFormat()}
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
        <div className="space-y-3">
          {/* Participant 1 */}
          <div className={`
            flex items-center justify-between p-3 rounded border cursor-pointer
            ${isWinner1 ? 'border-green-400 bg-green-400/20' : 'border-slate-600 bg-slate-700/40'}
            ${isAdmin ? 'hover:bg-slate-600/60' : ''}
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (match.participant1) handleParticipantClick(match.participant1);
          }}>
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {match.participant1?.participantAvatar && (
                <img
                  src={match.participant1.participantAvatar}
                  alt={match.participant1.participantName}
                  className="w-8 h-8 rounded-full border border-blue-500/30"
                />
              )}
              {match.participant1?.participantType === 'clan' && (
                <Shield className="w-6 h-6 text-purple-400" />
              )}
              {match.participant1?.participantType === 'user' && (
                <User className="w-6 h-6 text-blue-400" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium truncate block ${
                  isWinner1 ? 'text-green-200' : 'text-white'
                }`}>
                  {team1Name}
                </span>
                {match.participant1 && getTeamMembers(match.participant1) && (
                  <span className="text-xs text-blue-300 truncate block">
                    {getTeamMembers(match.participant1)}
                  </span>
                )}
                {match.participant1?.clanTag && (
                  <span className="text-xs text-purple-300 font-mono">
                    [{match.participant1.clanTag}]
                  </span>
                )}
              </div>
            </div>
            <div className={`
              px-3 py-1 rounded text-sm font-bold min-w-[32px] text-center
              ${isWinner1 ? 'bg-green-500 text-white' : 'bg-slate-600 text-gray-300'}
            `}>
              {match.score1}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
            <span className="px-3 text-xs font-bold text-blue-400 bg-slate-800 rounded">
              VS
            </span>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          </div>

          {/* Participant 2 */}
          <div className={`
            flex items-center justify-between p-3 rounded border cursor-pointer
            ${isWinner2 ? 'border-green-400 bg-green-400/20' : 'border-slate-600 bg-slate-700/40'}
            ${isAdmin ? 'hover:bg-slate-600/60' : ''}
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (match.participant2) handleParticipantClick(match.participant2);
          }}>
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {match.participant2?.participantAvatar && (
                <img
                  src={match.participant2.participantAvatar}
                  alt={match.participant2.participantName}
                  className="w-8 h-8 rounded-full border border-blue-500/30"
                />
              )}
              {match.participant2?.participantType === 'clan' && (
                <Shield className="w-6 h-6 text-purple-400" />
              )}
              {match.participant2?.participantType === 'user' && (
                <User className="w-6 h-6 text-blue-400" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium truncate block ${
                  isWinner2 ? 'text-green-200' : 'text-white'
                }`}>
                  {team2Name}
                </span>
                {match.participant2 && getTeamMembers(match.participant2) && (
                  <span className="text-xs text-blue-300 truncate block">
                    {getTeamMembers(match.participant2)}
                  </span>
                )}
                {match.participant2?.clanTag && (
                  <span className="text-xs text-purple-300 font-mono">
                    [{match.participant2.clanTag}]
                  </span>
                )}
              </div>
            </div>
            <div className={`
              px-3 py-1 rounded text-sm font-bold min-w-[32px] text-center
              ${isWinner2 ? 'bg-green-500 text-white' : 'bg-slate-600 text-gray-300'}
            `}>
              {match.score2}
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div className="mt-3 space-y-1">
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
            const startX = match.position.x + 330;
            const startY = match.position.y + 80;
            const endX = nextMatch.position.x;
            const endY = nextMatch.position.y + 80;
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
          Round Robin - Todos vs Todos ({getMatchFormat()})
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
            left: index * 400 + 50,
            top: 10,
            zIndex: 10
          }}
        >
          {roundName} ({getMatchFormat()})
        </div>
      );
    });
  };

  if (participants.length === 0 && matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">Sin Participantes ni Partidas</h3>
        <p className="text-blue-300">Agrega participantes y crea partidas para generar el bracket</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">Sin Partidas Creadas</h3>
        <p className="text-blue-300">Crea partidas desde la sección de administración para generar el bracket</p>
        {isAdmin && (
          <button
            onClick={handleBracketRegenerate}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Partidas</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bracket Header */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Bracket {getMatchFormat()} - {
                  bracketType === 'single_elimination' ? 'Eliminación Simple' :
                  bracketType === 'double_elimination' ? 'Eliminación Doble' :
                  'Round Robin'
                }
              </h3>
              <p className="text-blue-300 text-sm">
                {participants.length} participantes • {matches.length} partidas
                {teamSize > 1 && ` • Formato ${getMatchFormat()}`}
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
                onClick={() => onRefreshData && onRefreshData()}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-green-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Actualizar Datos</span>
              </button>
              <button
                onClick={handleBracketRegenerate}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Regenerar Bracket</span>
              </button>
            </div>
          </div>
          <p className="text-blue-400 text-sm mt-2">
            El bracket se actualiza automáticamente cuando se crean o modifican partidas.
            Haz clic en las partidas para editarlas, en los participantes para cambiarlos, o usa los controles para regenerar el bracket.
            {teamSize > 1 && ` Todas las partidas son en formato ${getMatchFormat()}.`}
          </p>
        </div>
      )}

      {/* Bracket Visualization */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-6">
        <div 
          ref={bracketContainerRef}
          className="relative overflow-auto"
          style={{ 
            height: '600px',
            maxHeight: '80vh'
          }}
        >
          <div 
            className="relative"
            style={{ 
              width: bracketDimensions.width || 'auto', 
              height: bracketDimensions.height || 'auto',
              minWidth: '100%',
              minHeight: '100%'
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
                  left: (bracketData.maxRounds - 1) * 400 + 400,
                  top: 100,
                  minWidth: 250
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
                        <div className="text-xs text-yellow-400">
                          Campeón {getMatchFormat()}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Update Modal */}
      {showMatchModal && selectedMatch && (
        <MatchUpdateModal
          match={selectedMatch}
          editingMatch={editingMatch}
          setEditingMatch={setEditingMatch}
          participants={participants}
          teamSize={teamSize}
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
  teamSize: number;
  onClose: () => void;
  onUpdate: () => void;
}

const MatchUpdateModal: React.FC<MatchUpdateModalProps> = ({ 
  match, 
  editingMatch, 
  setEditingMatch, 
  participants, 
  teamSize,
  onClose, 
  onUpdate 
}) => {
  const handleSubmit = () => {
    onUpdate();
  };

  const getMatchFormat = () => {
    if (teamSize === 1) {
      return '1v1';
    }
    return `${teamSize}v${teamSize}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            Actualizar Resultado ({getMatchFormat()})
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Equipo 1 */}
          <div className="space-y-3">
            <label className="block text-blue-300 text-sm font-medium">
              Equipo 1: {match.participant1?.participantName || 'Equipo 1'}
              {teamSize > 1 && <span className="text-orange-400 ml-2">({getMatchFormat()})</span>}
            </label>
            
            {/* Nombre personalizado del equipo */}
            <div>
              <label className="block text-blue-400 text-xs mb-1">Nombre del Equipo (Personalizado)</label>
              <input
                type="text"
                value={editingMatch.teamName1}
                onChange={(e) => setEditingMatch({ ...editingMatch, teamName1: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
                placeholder="Nombre personalizado del equipo 1"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                value={editingMatch.score1}
                onChange={(e) => setEditingMatch({ ...editingMatch, score1: parseInt(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white"
                placeholder="Puntuación"
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
            
            {/* Información del participante */}
            {match.participant1 && (
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  {match.participant1.participantAvatar && (
                    <img
                      src={match.participant1.participantAvatar}
                      alt={match.participant1.participantName}
                      className="w-8 h-8 rounded-full border border-blue-500/30"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">{match.participant1.participantName}</p>
                    {match.participant1.clanTag && (
                      <p className="text-purple-300 text-sm font-mono">[{match.participant1.clanTag}]</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Equipo 2 */}
          <div className="space-y-3">
            <label className="block text-blue-300 text-sm font-medium">
              Equipo 2: {match.participant2?.participantName || 'Equipo 2'}
              {teamSize > 1 && <span className="text-orange-400 ml-2">({getMatchFormat()})</span>}
            </label>
            
            {/* Nombre personalizado del equipo */}
            <div>
              <label className="block text-blue-400 text-xs mb-1">Nombre del Equipo (Personalizado)</label>
              <input
                type="text"
                value={editingMatch.teamName2}
                onChange={(e) => setEditingMatch({ ...editingMatch, teamName2: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
                placeholder="Nombre personalizado del equipo 2"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                value={editingMatch.score2}
                onChange={(e) => setEditingMatch({ ...editingMatch, score2: parseInt(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white"
                placeholder="Puntuación"
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
            
            {/* Información del participante */}
            {match.participant2 && (
              <div className="bg-slate-700/40 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  {match.participant2.participantAvatar && (
                    <img
                      src={match.participant2.participantAvatar}
                      alt={match.participant2.participantName}
                      className="w-8 h-8 rounded-full border border-blue-500/30"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">{match.participant2.participantName}</p>
                    {match.participant2.clanTag && (
                      <p className="text-purple-300 text-sm font-mono">[{match.participant2.clanTag}]</p>
                    )}
                  </div>
                </div>
              </div>
            )}
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