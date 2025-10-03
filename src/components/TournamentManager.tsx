import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2, Save, X, Users, Calendar, Target, Award, Eye, Play, Pause, CheckCircle, AlertTriangle, UserPlus, UserMinus, Settings, Crown, Shield, Star, Zap, MapPin, Clock, TrendingUp, Activity, Medal, Swords, RefreshCw, Image, Upload, Camera } from 'lucide-react';
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

interface MatchImage {
  id: string;
  matchId: string;
  imageType: 'ida' | 'vuelta' | 'general';
  imageUrl: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface Champion {
  type: 'individual' | 'team';
  name: string;
  participantId?: string;
  teamParticipants?: string[];
  designatedBy: string;
  designatedAt: string;
}

interface MapData {
  id: string;
  name: string;
  displayName: string;
  description: string;
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
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [champion, setChampion] = useState<Champion | null>(null);
  const [availableMaps, setAvailableMaps] = useState<MapData[]>([]);
  const [matchImages, setMatchImages] = useState<Record<string, MatchImage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'participants' | 'matches' | 'bracket' | 'champion'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showSetChampionModal, setShowSetChampionModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [showUploadImageModal, setShowUploadImageModal] = useState(false);
  const [selectedMatchForImages, setSelectedMatchForImages] = useState<Match | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<MatchImage | null>(null);

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

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedClan, setSelectedClan] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  const [newChampion, setNewChampion] = useState({
    type: 'individual' as 'individual' | 'team',
    name: '',
    participantId: '',
    teamParticipants: [] as string[]
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

  const [newImage, setNewImage] = useState({
    imageType: 'ida' as 'ida' | 'vuelta' | 'general',
    imageUrl: '',
    description: ''
  });

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

  useEffect(() => {
    loadTournaments();
    loadMaps();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentData(selectedTournament.id);
    }
  }, [selectedTournament]);

  // Manejar tecla Escape para cerrar modales e imágenes ampliadas
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (enlargedImage) {
          setEnlargedImage(null);
        } else if (showUploadImageModal) {
          setShowUploadImageModal(false);
        } else if (showCreateMatchModal) {
          setShowCreateMatchModal(false);
        } else if (showSetChampionModal) {
          setShowSetChampionModal(false);
        } else if (showAddParticipantModal) {
          setShowAddParticipantModal(false);
        } else if (showEditModal) {
          setShowEditModal(false);
        } else if (showCreateModal) {
          setShowCreateModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [enlargedImage, showUploadImageModal, showCreateMatchModal, showSetChampionModal, showAddParticipantModal, showEditModal, showCreateModal]);

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

  const loadMaps = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/maps/get-all.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setAvailableMaps(data.maps.filter((map: MapData) => map.isActive));
      }
    } catch (error) {
      console.error('Error loading maps:', error);
    }
  };

  const loadTournamentData = async (tournamentId: string) => {
    try {
      await Promise.all([
        loadParticipants(tournamentId),
        loadMatches(tournamentId),
        loadChampion(tournamentId)
      ]);
    } catch (error) {
      console.error('Error loading tournament data:', error);
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
        // Cargar imágenes para cada partida
        await loadAllMatchImages(data.matches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const loadAllMatchImages = async (matchList: Match[]) => {
    try {
      const imagePromises = matchList.map(match => loadMatchImages(match.id));
      const imageResults = await Promise.all(imagePromises);
      
      const imagesMap: Record<string, MatchImage[]> = {};
      matchList.forEach((match, index) => {
        imagesMap[match.id] = imageResults[index];
      });
      
      setMatchImages(imagesMap);
    } catch (error) {
      console.error('Error loading match images:', error);
    }
  };

  const loadMatchImages = async (matchId: string): Promise<MatchImage[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/get-match-images.php?matchId=${matchId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        return data.images;
      }
      return [];
    } catch (error) {
      console.error('Error loading match images:', error);
      return [];
    }
  };

  const loadChampion = async (tournamentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/get-champion.php?tournamentId=${tournamentId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setChampion(data.champion);
      }
    } catch (error) {
      console.error('Error loading champion:', error);
    }
  };

  const refreshTournamentData = async () => {
    if (!selectedTournament) return;
    
    try {
      setIsRefreshing(true);
      await Promise.all([
        loadTournaments(),
        loadTournamentData(selectedTournament.id)
      ]);
      
      // Actualizar el torneo seleccionado con los nuevos datos
      const updatedTournaments = await fetch(`${API_BASE_URL}/tournaments/get-all.php`, {
        credentials: 'include'
      }).then(res => res.json());
      
      if (updatedTournaments.success) {
        const updatedTournament = updatedTournaments.tournaments.find((t: Tournament) => t.id === selectedTournament.id);
        if (updatedTournament) {
          setSelectedTournament(updatedTournament);
        }
      }
    } catch (error) {
      console.error('Error refreshing tournament data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Función para obtener el nombre de visualización del participante
  const getParticipantDisplayName = (participant: Participant) => {
    // Si es un equipo personalizado y tiene nombre de equipo, usarlo
    if (participant.participantType === 'team' && participant.teamName) {
      return participant.teamName;
    }
    
    // Si es un clan y tiene tag, mostrar el tag del clan
    if (participant.participantType === 'clan' && participant.clanTag) {
      return `[${participant.clanTag}] ${participant.participantName}`;
    }
    
    // Para torneos con equipos múltiples (teamSize > 1), crear un nombre descriptivo
    if (selectedTournament && selectedTournament.teamSize > 1) {
      if (participant.participantType === 'clan') {
        return participant.clanTag ? `Equipo [${participant.clanTag}]` : `Equipo ${participant.participantName}`;
      } else if (participant.participantType === 'user') {
        return `Equipo ${participant.participantName}`;
      } else {
        return participant.teamName || `Equipo ${participant.participantName}`;
      }
    }
    
    // Para 1v1, usar el nombre del participante
    return participant.participantName;
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
        if (selectedTournament?.id === tournamentId) {
          setSelectedTournament(null);
          setActiveTab('list');
        }
        await loadTournaments();
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
    
    let participantData: any = {
      tournamentId: selectedTournament.id,
      participantType: newParticipant.participantType
    };

    if (newParticipant.participantType === 'user') {
      if (!selectedUser) {
        alert('Selecciona un usuario');
        return;
      }
      participantData.participantId = selectedUser;
    } else if (newParticipant.participantType === 'clan') {
      if (!selectedClan) {
        alert('Selecciona un clan');
        return;
      }
      participantData.participantId = selectedClan;
      
      // Para clanes con teamSize > 1, agregar miembros del equipo
      if (selectedTournament.teamSize > 1) {
        if (selectedTeamMembers.length !== selectedTournament.teamSize) {
          alert(`Debes seleccionar exactamente ${selectedTournament.teamSize} miembros para el equipo`);
          return;
        }
        participantData.teamMembers = selectedTeamMembers;
      }
    } else if (newParticipant.participantType === 'team') {
      if (!newParticipant.teamName.trim()) {
        alert('El nombre del equipo es requerido');
        return;
      }
      if (selectedTeamMembers.length !== selectedTournament.teamSize) {
        alert(`Debes seleccionar exactamente ${selectedTournament.teamSize} miembros para el equipo`);
        return;
      }
      participantData.teamName = newParticipant.teamName;
      participantData.teamMembers = selectedTeamMembers;
    }
    
    try {
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
        setSelectedUser('');
        setSelectedClan('');
        setSelectedTeamMembers([]);
        await refreshTournamentData();
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
        await refreshTournamentData();
      } else {
        alert(data.message || 'Error al remover participante');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Error al remover participante');
    }
  };

  const handleSetChampion = async () => {
    if (!selectedTournament || !newChampion.name.trim()) {
      alert('Nombre del campeón es requerido');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/set-champion.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          ...newChampion
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowSetChampionModal(false);
        setNewChampion({
          type: 'individual',
          name: '',
          participantId: '',
          teamParticipants: []
        });
        await loadChampion(selectedTournament.id);
      } else {
        alert(data.message || 'Error al designar campeón');
      }
    } catch (error) {
      console.error('Error setting champion:', error);
      alert('Error al designar campeón');
    }
  };

  const handleClearChampion = async () => {
    if (!selectedTournament || !confirm('¿Estás seguro de que quieres quitar la designación de campeón?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/clear-champion.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ tournamentId: selectedTournament.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setChampion(null);
      } else {
        alert(data.message || 'Error al quitar designación de campeón');
      }
    } catch (error) {
      console.error('Error clearing champion:', error);
      alert('Error al quitar designación de campeón');
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedTournament) return;
    
    let matchData: any = {
      tournamentId: selectedTournament.id,
      round: newMatch.round,
      matchNumber: newMatch.matchNumber,
      mapPlayed: newMatch.mapPlayed,
      scheduledAt: newMatch.scheduledAt,
      notes: newMatch.notes
    };

    // Manejar participantes según el tamaño del equipo
    if (selectedTournament.teamSize > 1) {
      // Para equipos múltiples
      if (newMatch.team1Participants.length > 0) {
        matchData.team1Participants = newMatch.team1Participants;
      }
      if (newMatch.team2Participants.length > 0) {
        matchData.team2Participants = newMatch.team2Participants;
      }
    } else {
      // Para 1v1
      if (newMatch.participant1Id) {
        matchData.participant1Id = newMatch.participant1Id;
      }
      if (newMatch.participant2Id) {
        matchData.participant2Id = newMatch.participant2Id;
      }
    }
    
    try {
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
        await refreshTournamentData();
      } else {
        alert(data.message || 'Error al crear la partida');
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error al crear la partida');
    }
  };

  const handleUploadImage = async () => {
    if (!selectedMatchForImages || !newImage.imageUrl.trim()) {
      alert('URL de imagen es requerida');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/upload-match-images.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          matchId: selectedMatchForImages.id,
          ...newImage
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowUploadImageModal(false);
        setNewImage({
          imageType: 'ida',
          imageUrl: '',
          description: ''
        });
        // Recargar imágenes de la partida
        const updatedImages = await loadMatchImages(selectedMatchForImages.id);
        setMatchImages(prev => ({
          ...prev,
          [selectedMatchForImages.id]: updatedImages
        }));
      } else {
        alert(data.message || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    }
  };

  const handleDeleteImage = async (imageId: string, matchId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/delete-match-image.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ imageId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recargar imágenes de la partida
        const updatedImages = await loadMatchImages(matchId);
        setMatchImages(prev => ({
          ...prev,
          [matchId]: updatedImages
        }));
      } else {
        alert(data.message || 'Error al eliminar la imagen');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error al eliminar la imagen');
    }
  };

  const handleMatchUpdate = (matchId: string, updates: any) => {
    setMatches(prev => prev.map(match => 
      match.id === matchId ? { ...match, ...updates } : match
    ));
    
    // Refrescar datos después de un breve delay
    setTimeout(() => {
      refreshTournamentData();
    }, 1000);
  };

  const handleBracketRegenerate = () => {
    console.log('🔄 Regenerando bracket del torneo');
    refreshTournamentData();
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

  const getMatchFormat = (teamSize: number) => {
    return teamSize === 1 ? '1v1' : `${teamSize}v${teamSize}`;
  };

  const getImageTypeText = (type: string) => {
    switch (type) {
      case 'ida': return 'Ida';
      case 'vuelta': return 'Vuelta';
      case 'general': return 'General';
      default: return type;
    }
  };

  const getImageTypeColor = (type: string) => {
    switch (type) {
      case 'ida': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'vuelta': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'general': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Convertir participantes al formato esperado por TournamentBracket
  const bracketParticipants = participants.map(p => ({
    id: p.id,
    participantType: p.participantType,
    participantId: p.participantId,
    participantName: p.participantName,
    participantAvatar: p.participantAvatar,
    clanTag: p.clanTag,
    teamName: p.teamName,
    teamMembers: p.teamMembers
  }));

  // Convertir matches al formato esperado por TournamentBracket
  const bracketMatches = matches.map(m => ({
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
    position: { x: 0, y: 0 } // Se calculará en el componente TournamentBracket
  }));

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
            <div className="p-3 bg-orange-600/20 rounded-xl">
              <Trophy className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Gestión de Torneos</h3>
              <p className="text-orange-300">Administra torneos, participantes y brackets</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedTournament && (
              <button
                onClick={refreshTournamentData}
                disabled={isRefreshing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isRefreshing 
                    ? 'bg-blue-600/20 text-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            )}
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Torneo</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'list', label: 'Lista de Torneos', icon: Trophy },
            ...(selectedTournament ? [
              { id: 'participants', label: `Participantes (${participants.length})`, icon: Users },
              { id: 'bracket', label: 'Bracket', icon: Target },
              { id: 'matches', label: `Partidas (${matches.length})`, icon: Swords },
              { id: 'champion', label: 'Campeón', icon: Crown }
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
                {tab.id === 'bracket' && isRefreshing && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
              <div className="flex items-center space-x-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{tournaments.length}</p>
                  <p className="text-yellow-300 text-sm">Total Torneos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
              <div className="flex items-center space-x-3">
                <Activity className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{tournaments.filter(t => t.status === 'active').length}</p>
                  <p className="text-green-300 text-sm">Activos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{tournaments.filter(t => t.status === 'registration').length}</p>
                  <p className="text-blue-300 text-sm">En Registro</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
              <div className="flex items-center space-x-3">
                <Medal className="w-8 h-8 text-purple-400" />
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => {
                const StatusIcon = getStatusIcon(tournament.status);
                
                return (
                  <div
                    key={tournament.id}
                    className={`bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer ${
                      selectedTournament?.id === tournament.id ? 'ring-2 ring-blue-500/50' : ''
                    }`}
                    onClick={() => {
                      setSelectedTournament(tournament);
                      setActiveTab('participants');
                    }}
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
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTournament(tournament);
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                          title="Editar torneo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTournament(tournament.id);
                          }}
                          className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                          title="Eliminar torneo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
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
                      
                      {tournament.startDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-400">Inicio:</span>
                          <span className="text-white font-medium">{formatDate(tournament.startDate)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-blue-700/30 mt-3">
                      <div className="flex items-center justify-between text-xs text-blue-400">
                        <span>Por: {tournament.createdBy}</span>
                        <span>{formatDate(tournament.createdAt)}</span>
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
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Participantes de {selectedTournament.name}
              </h2>
              <p className="text-blue-300">
                {participants.length}/{selectedTournament.maxParticipants} participantes registrados
                {selectedTournament.teamSize > 1 && (
                  <span className="ml-2 px-2 py-1 bg-orange-600/20 text-orange-300 rounded text-sm font-bold">
                    Formato: {getMatchFormat(selectedTournament.teamSize)}
                  </span>
                )}
              </p>
            </div>
            
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
              {participants
                .sort((a, b) => b.points - a.points || b.wins - a.wins)
                .map((participant, index) => {
                  const IconComponent = participant.clanIcon ? getClanIcon(participant.clanIcon).icon : Users;
                  const iconColor = participant.clanIcon ? getClanIcon(participant.clanIcon).color : 'text-blue-400';
                  
                  return (
                    <div
                      key={participant.id}
                      className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400 font-bold text-xl">#{index + 1}</span>
                              {index < 3 && (
                                <Medal className={`w-6 h-6 ${
                                  index === 0 ? 'text-yellow-400' : 
                                  index === 1 ? 'text-gray-300' : 'text-amber-600'
                                }`} />
                              )}
                            </div>
                            
                            {participant.participantAvatar ? (
                              <img
                                src={participant.participantAvatar}
                                alt={getParticipantDisplayName(participant)}
                                className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 bg-slate-600/40 flex items-center justify-center">
                                <IconComponent className={`w-6 h-6 ${iconColor}`} />
                              </div>
                            )}
                            
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-white text-lg">
                                  {getParticipantDisplayName(participant)}
                                </span>
                                
                                {participant.clanTag && (
                                  <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-sm font-mono">
                                    [{participant.clanTag}]
                                  </span>
                                )}
                                
                                {selectedTournament.teamSize > 1 && (
                                  <span className="px-2 py-1 bg-orange-600/20 text-orange-300 rounded text-sm font-bold">
                                    {getMatchFormat(selectedTournament.teamSize)}
                                  </span>
                                )}
                                
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  participant.status === 'winner' ? 'bg-yellow-500/20 text-yellow-300' :
                                  participant.status === 'eliminated' ? 'bg-red-500/20 text-red-300' :
                                  participant.status === 'active' ? 'bg-green-500/20 text-green-300' :
                                  'bg-blue-500/20 text-blue-300'
                                }`}>
                                  {participant.status === 'winner' ? 'Ganador' :
                                   participant.status === 'eliminated' ? 'Eliminado' :
                                   participant.status === 'active' ? 'Activo' :
                                   'Registrado'}
                                </span>
                              </div>
                              
                              {participant.teamMembers.length > 0 && (
                                <p className="text-blue-300 text-sm mt-1">
                                  <span className="text-blue-400 font-medium">Miembros:</span> {participant.teamMembers.join(', ')}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 text-xs text-blue-400 mt-1">
                                <span>Registrado: {formatDate(participant.registeredAt)}</span>
                                {participant.participantType === 'user' && (
                                  <span>Jugador Individual</span>
                                )}
                                {participant.participantType === 'clan' && (
                                  <span>Clan</span>
                                )}
                                {participant.participantType === 'team' && (
                                  <span>Equipo Personalizado</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-8">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-blue-400">{participant.points}</p>
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

      {activeTab === 'bracket' && selectedTournament && (
        <TournamentBracket
          tournamentId={selectedTournament.id}
          tournamentType={selectedTournament.type}
          teamSize={selectedTournament.teamSize}
          participants={bracketParticipants}
          matches={bracketMatches}
          bracketType={selectedTournament.bracketType}
          isAdmin={true}
          onMatchUpdate={handleMatchUpdate}
          onBracketRegenerate={handleBracketRegenerate}
          onRefreshData={refreshTournamentData}
        />
      )}

      {activeTab === 'matches' && selectedTournament && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Partidas de {selectedTournament.name} - Formato {getMatchFormat(selectedTournament.teamSize)}
            </h2>
            
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
              <Swords className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Sin partidas</h3>
              <p className="text-blue-300">Las partidas se generarán automáticamente cuando haya suficientes participantes</p>
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
                <div key={round} className="bg-slate-700/40 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-orange-400" />
                    <span>{round}</span>
                    <span className="text-orange-400 text-sm">({getMatchFormat(selectedTournament.teamSize)})</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {roundMatches.map((match) => {
                      const images = matchImages[match.id] || [];
                      
                      return (
                        <div
                          key={match.id}
                          className="bg-slate-600/40 rounded-lg p-4 border border-blue-600/20"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4 flex-1">
                              {/* Participante 1 */}
                              <div className="flex items-center space-x-3 flex-1">
                                {match.participant1?.avatar && (
                                  <img
                                    src={match.participant1.avatar}
                                    alt={match.participant1.name}
                                    className="w-10 h-10 rounded-full border border-blue-500/30"
                                  />
                                )}
                                <span className="text-white font-medium">
                                  {match.participant1?.name || 'Por definir'}
                                </span>
                              </div>
                              
                              {/* Marcador */}
                              <div className="flex items-center space-x-3 px-4">
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${
                                    match.winnerId === match.participant1?.id || match.winnerTeam === 1 ? 'text-green-400' : 'text-white'
                                  }`}>
                                    {match.score1}
                                  </div>
                                </div>
                                
                                <div className="text-blue-400 text-xl font-bold">
                                  {getMatchFormat(selectedTournament.teamSize)}
                                </div>
                                
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${
                                    match.winnerId === match.participant2?.id || match.winnerTeam === 2 ? 'text-green-400' : 'text-white'
                                  }`}>
                                    {match.score2}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Participante 2 */}
                              <div className="flex items-center space-x-3 flex-1 justify-end">
                                <span className="text-white font-medium">
                                  {match.participant2?.name || 'Por definir'}
                                </span>
                                {match.participant2?.avatar && (
                                  <img
                                    src={match.participant2.avatar}
                                    alt={match.participant2.name}
                                    className="w-10 h-10 rounded-full border border-blue-500/30"
                                  />
                                )}
                              </div>
                            </div>
                            
                            {/* Acciones */}
                            <div className="flex items-center space-x-2 ml-6">
                              <button
                                onClick={() => {
                                  setSelectedMatchForImages(match);
                                  setShowUploadImageModal(true);
                                }}
                                className="p-2 bg-green-600/20 hover:bg-green-600/40 rounded-lg text-green-300 transition-colors"
                                title="Subir imagen de resultado"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                              
                              {/* Estado de la partida */}
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
                          </div>
                          
                          {/* Imágenes de la partida */}
                          {images.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center space-x-2">
                                <Image className="w-4 h-4" />
                                <span>Imágenes de Resultados</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {images.map((image) => (
                                  <div key={image.id} className="bg-slate-500/20 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className={`px-2 py-1 rounded text-xs font-medium border ${getImageTypeColor(image.imageType)}`}>
                                        {getImageTypeText(image.imageType)}
                                      </div>
                                      <button
                                        onClick={() => handleDeleteImage(image.id, match.id)}
                                        className="p-1 bg-red-600/20 hover:bg-red-600/40 rounded text-red-300 transition-colors"
                                        title="Eliminar imagen"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <img
                                      src={image.imageUrl}
                                      alt={`Resultado ${getImageTypeText(image.imageType)}`}
                                      className="w-full h-32 object-cover rounded border border-blue-600/20 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setEnlargedImage(image)}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                    {image.description && (
                                      <p className="text-blue-200 text-xs mt-2">{image.description}</p>
                                    )}
                                    <div className="text-xs text-blue-400 mt-1">
                                      Por: {image.uploadedBy} • {formatDate(image.uploadedAt)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Información adicional */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
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
                                    Programada: {formatDate(match.scheduledAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {match.completedAt && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-green-300">
                                  Finalizada: {formatDate(match.completedAt)}
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
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'champion' && selectedTournament && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Campeón de {selectedTournament.name}
            </h2>
            
            <div className="flex items-center space-x-3">
              {champion && (
                <button
                  onClick={handleClearChampion}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-300 hover:text-red-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Quitar Designación</span>
                </button>
              )}
              
              <button
                onClick={() => setShowSetChampionModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-medium transition-colors"
              >
                <Crown className="w-4 h-4" />
                <span>Designar Campeón</span>
              </button>
            </div>
          </div>
          
          {champion ? (
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-8">
              <div className="text-center">
                <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-yellow-300 mb-2">{champion.name}</h3>
                <p className="text-yellow-400 text-lg mb-4">
                  🏆 Campeón del Torneo {selectedTournament.name}
                </p>
                
                <div className="bg-slate-700/40 rounded-lg p-4 max-w-md mx-auto">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-400">Tipo:</span>
                      <span className="text-white font-medium">
                        {champion.type === 'individual' ? 'Individual' : 'Equipo'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-blue-400">Designado por:</span>
                      <span className="text-white font-medium">{champion.designatedBy}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-blue-400">Fecha:</span>
                      <span className="text-white font-medium">{formatDate(champion.designatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Crown className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Sin campeón designado</h3>
              <p className="text-blue-300">Designa manualmente al campeón del torneo</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de imagen ampliada */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Botón de cerrar reposicionado */}
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 z-10 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Imagen */}
            <img
              src={enlargedImage.imageUrl}
              alt={`Resultado ${getImageTypeText(enlargedImage.imageType)}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Información de la imagen */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getImageTypeColor(enlargedImage.imageType)}`}>
                    {getImageTypeText(enlargedImage.imageType)}
                  </div>
                  {enlargedImage.description && (
                    <span className="text-white text-sm">{enlargedImage.description}</span>
                  )}
                </div>
                <div className="text-blue-300 text-sm">
                  Por: {enlargedImage.uploadedBy} • {formatDate(enlargedImage.uploadedAt)}
                </div>
              </div>
            </div>
            
            {/* Indicador de tecla Escape */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
              <span className="text-white text-sm">Presiona <kbd className="px-2 py-1 bg-white/20 rounded text-xs">Esc</kbd> para cerrar</span>
            </div>
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
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-blue-300 text-sm font-medium mb-2">Máximo Participantes *</label>
                  <input
                    type="number"
                    value={newTournament.maxParticipants}
                    onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) || 8 })}
                    min="2"
                    max="64"
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

              <div className="grid grid-cols-3 gap-4">
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
                  placeholder="Ej: $100.000 CLP, Trofeo, etc."
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

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Mapas del Torneo</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                  {availableMaps.map((map) => (
                    <label key={map.id} className="flex items-center space-x-2 p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTournament.maps.includes(map.displayName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTournament({
                              ...newTournament,
                              maps: [...newTournament.maps, map.displayName]
                            });
                          } else {
                            setNewTournament({
                              ...newTournament,
                              maps: newTournament.maps.filter(m => m !== map.displayName)
                            });
                          }
                        }}
                        className="rounded border-blue-600/30"
                      />
                      <span className="text-white text-sm">{map.displayName}</span>
                    </label>
                  ))}
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
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Torneo</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-blue-300 text-sm font-medium mb-2">Fecha de Inicio</label>
                  <input
                    type="datetime-local"
                    value={selectedTournament.startDate || ''}
                    onChange={(e) => setSelectedTournament({ ...selectedTournament, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Fecha de Fin</label>
                  <input
                    type="datetime-local"
                    value={selectedTournament.endDate || ''}
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
                  placeholder="Ej: $100.000 CLP, Trofeo, etc."
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

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Mapas del Torneo</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                  {availableMaps.map((map) => (
                    <label key={map.id} className="flex items-center space-x-2 p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTournament.maps.includes(map.displayName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTournament({
                              ...selectedTournament,
                              maps: [...selectedTournament.maps, map.displayName]
                            });
                          } else {
                            setSelectedTournament({
                              ...selectedTournament,
                              maps: selectedTournament.maps.filter(m => m !== map.displayName)
                            });
                          }
                        }}
                        className="rounded border-blue-600/30"
                      />
                      <span className="text-white text-sm">{map.displayName}</span>
                    </label>
                  ))}
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

            <div className="space-y-6">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Participante</label>
                <select
                  value={newParticipant.participantType}
                  onChange={(e) => {
                    const type = e.target.value as 'user' | 'clan' | 'team';
                    setNewParticipant({ ...newParticipant, participantType: type });
                    setSelectedUser('');
                    setSelectedClan('');
                    setSelectedTeamMembers([]);
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
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Selecciona un usuario</option>
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
                    value={selectedClan}
                    onChange={(e) => setSelectedClan(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Selecciona un clan</option>
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
                    placeholder="Nombre del equipo"
                  />
                </div>
              )}

              {((newParticipant.participantType === 'clan' && selectedTournament.teamSize > 1) || 
                newParticipant.participantType === 'team') && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Miembros del Equipo ({selectedTeamMembers.length}/{selectedTournament.teamSize})
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {users.filter(u => u.isActive).map((user) => (
                      <label key={user.id} className="flex items-center space-x-2 p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTeamMembers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedTeamMembers.length < selectedTournament.teamSize) {
                                setSelectedTeamMembers([...selectedTeamMembers, user.id]);
                              }
                            } else {
                              setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== user.id));
                            }
                          }}
                          disabled={!selectedTeamMembers.includes(user.id) && selectedTeamMembers.length >= selectedTournament.teamSize}
                          className="rounded border-blue-600/30"
                        />
                        <img
                          src={user.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
                          alt={user.username}
                          className="w-8 h-8 rounded-full border border-blue-500/30"
                        />
                        <span className="text-white">{user.username}</span>
                        {user.clan && (
                          <span className="text-purple-300 text-sm">({user.clan})</span>
                        )}
                      </label>
                    ))}
                  </div>
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

      {/* Modal de designar campeón */}
      {showSetChampionModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Designar Campeón</h3>
              <button
                onClick={() => setShowSetChampionModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Campeón</label>
                <select
                  value={newChampion.type}
                  onChange={(e) => setNewChampion({ ...newChampion, type: e.target.value as 'individual' | 'team' })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="individual">Individual</option>
                  <option value="team">Equipo</option>
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Campeón *</label>
                <input
                  type="text"
                  value={newChampion.name}
                  onChange={(e) => setNewChampion({ ...newChampion, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Nombre del campeón o equipo"
                />
              </div>

              {newChampion.type === 'individual' && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Participante (Opcional)</label>
                  <select
                    value={newChampion.participantId}
                    onChange={(e) => setNewChampion({ ...newChampion, participantId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Selecciona un participante</option>
                    {participants.filter(p => p.participantType === 'user').map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {getParticipantDisplayName(participant)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newChampion.type === 'team' && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Miembros del Equipo</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {participants.map((participant) => (
                      <label key={participant.id} className="flex items-center space-x-2 p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newChampion.teamParticipants.includes(participant.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewChampion({
                                ...newChampion,
                                teamParticipants: [...newChampion.teamParticipants, participant.id]
                              });
                            } else {
                              setNewChampion({
                                ...newChampion,
                                teamParticipants: newChampion.teamParticipants.filter(id => id !== participant.id)
                              });
                            }
                          }}
                          className="rounded border-blue-600/30"
                        />
                        <span className="text-white">{getParticipantDisplayName(participant)}</span>
                        {participant.clanTag && (
                          <span className="text-purple-300 text-sm">({participant.clanTag})</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSetChampion}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  <span>Designar Campeón</span>
                </button>
                
                <button
                  onClick={() => setShowSetChampionModal(false)}
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
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Crear Nueva Partida</h3>
              <button
                onClick={() => setShowCreateMatchModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
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
                      <option value="">Seleccionar participante</option>
                      {participants.map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {getParticipantDisplayName(participant)}
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
                          {getParticipantDisplayName(participant)}
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
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {participants.map((participant) => (
                        <label key={participant.id} className="flex items-center space-x-2 p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newMatch.team1Participants.includes(participant.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewMatch({
                                  ...newMatch,
                                  team1Participants: [...newMatch.team1Participants, participant.id]
                                });
                              } else {
                                setNewMatch({
                                  ...newMatch,
                                  team1Participants: newMatch.team1Participants.filter(id => id !== participant.id)
                                });
                              }
                            }}
                            className="rounded border-blue-600/30"
                          />
                          <span className="text-white">{getParticipantDisplayName(participant)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Equipo 2</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {participants.map((participant) => (
                        <label key={participant.id} className="flex items-center space-x-2 p-3 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newMatch.team2Participants.includes(participant.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewMatch({
                                  ...newMatch,
                                  team2Participants: [...newMatch.team2Participants, participant.id]
                                });
                              } else {
                                setNewMatch({
                                  ...newMatch,
                                  team2Participants: newMatch.team2Participants.filter(id => id !== participant.id)
                                });
                              }
                            }}
                            className="rounded border-blue-600/30"
                          />
                          <span className="text-white">{getParticipantDisplayName(participant)}</span>
                        </label>
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
                  <option value="">Seleccionar mapa</option>
                  {selectedTournament.maps.map((map) => (
                    <option key={map} value={map}>
                      {map}
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
                  placeholder="Notas adicionales sobre la partida..."
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

      {/* Modal de subir imagen */}
      {showUploadImageModal && selectedMatchForImages && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Subir Imagen de Resultado</h3>
              <button
                onClick={() => setShowUploadImageModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-700/40 rounded-xl p-4 mb-4">
                <h4 className="text-white font-medium mb-2">Partida Seleccionada</h4>
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-blue-300">{selectedMatchForImages.participant1?.name || 'Equipo 1'}</span>
                  <span className="text-orange-400 font-bold">VS</span>
                  <span className="text-blue-300">{selectedMatchForImages.participant2?.name || 'Equipo 2'}</span>
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Tipo de Imagen</label>
                <select
                  value={newImage.imageType}
                  onChange={(e) => setNewImage({ ...newImage, imageType: e.target.value as 'ida' | 'vuelta' | 'general' })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ida">Ida</option>
                  <option value="vuelta">Vuelta</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">URL de la Imagen *</label>
                <input
                  type="url"
                  value={newImage.imageUrl}
                  onChange={(e) => setNewImage({ ...newImage, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://ejemplo.com/imagen-resultado.jpg"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción (Opcional)</label>
                <textarea
                  value={newImage.description}
                  onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Descripción adicional de la imagen..."
                />
              </div>

              {newImage.imageUrl && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Vista Previa</label>
                  <img
                    src={newImage.imageUrl}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-xl border border-blue-600/20"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUploadImage}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Imagen</span>
                </button>
                
                <button
                  onClick={() => setShowUploadImageModal(false)}
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