import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, Crown, Shield, Star, Edit, Save, X, User, MapPin, Trophy, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ClanMemberManager from './ClanMemberManager';

interface ClanProfileProps {
  clanId: string;
  onBack: () => void;
}

const ClanProfile: React.FC<ClanProfileProps> = ({ clanId, onBack }) => {
  const { clans, users, user: currentUser, updateClan } = useAuth();
  const [clan, setClan] = useState<any>(null);
  const [clanMembers, setClanMembers] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'management'>('info');
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    icon: 'crown',
    logo: ''
  });

  useEffect(() => {
    const foundClan = clans.find(c => c.id === clanId);
    if (foundClan) {
      setClan(foundClan);
      setEditData({
        name: foundClan.name,
        description: foundClan.description || '',
        icon: foundClan.icon || 'crown',
        logo: foundClan.logo || ''
      });
      
      // Obtener miembros del clan
      const members = users.filter(u => u.clan === foundClan.tag && u.isActive);
      setClanMembers(members);
    }
  }, [clanId, clans, users]);

  const handleSave = async () => {
    if (!clan) return;
    
    const success = await updateClan(clan.id, editData);
    if (success) {
      setIsEditing(false);
    } else {
      alert('Error al actualizar el clan');
    }
  };

  const getClanIcon = (iconId: string) => {
    const clanIcons = [
      { id: 'crown', icon: Crown, name: 'Corona', color: 'text-yellow-400' },
      { id: 'sword', icon: Shield, name: 'Espada', color: 'text-red-400' },
      { id: 'shield', icon: Shield, name: 'Escudo', color: 'text-blue-400' },
      { id: 'star', icon: Star, name: 'Estrella', color: 'text-purple-400' },
      { id: 'zap', icon: Shield, name: 'Rayo', color: 'text-green-400' },
      { id: 'target', icon: Shield, name: 'Diana', color: 'text-orange-400' }
    ];
    
    const clanIcon = clanIcons.find(icon => icon.id === iconId);
    return clanIcon || clanIcons[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLeader = () => {
    return clanMembers.find(member => member.id === clan?.leaderId);
  };

  const getOnlineMembers = () => {
    return clanMembers.filter(member => member.isOnline).length;
  };

  const canEdit = () => {
    return currentUser?.role === 'admin' || currentUser?.id === clan?.leaderId;
  };

  const isLeader = () => {
    return currentUser?.id === clan?.leaderId;
  };

  const canManageMembers = () => {
    return currentUser?.role === 'admin' || isLeader();
  };

  if (!clan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 mb-6 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
        
        <div className="text-center py-20">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-2">Clan no encontrado</h2>
          <p className="text-blue-300">El clan que buscas no existe o no está disponible</p>
        </div>
      </div>
    );
  }

  const IconComponent = getClanIcon(clan.icon).icon;
  const iconColor = getClanIcon(clan.icon).color;
  const leader = getLeader();

  // Preparar las pestañas disponibles
  const tabs = [
    { id: 'info' as const, label: 'Información', icon: Shield },
    { id: 'members' as const, label: 'Miembros', icon: Users }
  ];

  // Solo agregar la pestaña de gestión si el usuario puede gestionar miembros
  if (canManageMembers()) {
    tabs.push({ id: 'management' as const, label: 'Gestión', icon: Crown });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 mb-6 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Clanes</span>
      </button>

      {/* Header del Clan */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl mb-8">
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            {clan.logo ? (
              <img
                src={clan.logo}
                alt={`Logo de ${clan.name}`}
                className="w-24 h-24 rounded-full border-4 border-blue-500/30 mx-auto object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-24 h-24 rounded-full border-4 border-blue-500/30 mx-auto bg-slate-700/40 flex items-center justify-center">
                        <svg class="w-12 h-12 ${iconColor}" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-blue-500/30 mx-auto bg-slate-700/40 flex items-center justify-center">
                <IconComponent className={`w-12 h-12 ${iconColor}`} />
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">{clan.name}</h2>
          <div className="flex items-center justify-center space-x-2 mb-3">
            <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-lg font-mono font-bold">
              [{clan.tag}]
            </span>
          </div>
          
          {clan.description && (
            <p className="text-blue-200 text-sm italic mb-4">"{clan.description}"</p>
          )}
        </div>

        {/* Estadísticas del Clan */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/40 rounded-xl p-4 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{clanMembers.length}</p>
            <p className="text-blue-300 text-sm">Miembros</p>
          </div>
          
          <div className="bg-slate-700/40 rounded-xl p-4 text-center">
            <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{getOnlineMembers()}</p>
            <p className="text-green-300 text-sm">En Línea</p>
          </div>
          
          <div className="bg-slate-700/40 rounded-xl p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{formatDate(clan.createdAt)}</p>
            <p className="text-purple-300 text-sm">Fundado</p>
          </div>
          
          <div className="bg-slate-700/40 rounded-xl p-4 text-center">
            <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{leader?.username || 'Sin líder'}</p>
            <p className="text-yellow-300 text-sm">Líder</p>
          </div>
        </div>

        {/* Botón de Editar */}
        {canEdit() && (
          <div className="text-center">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-300 hover:text-blue-200 font-medium transition-all duration-300 mx-auto"
            >
              <Edit className="w-4 h-4" />
              <span>{isEditing ? 'Cancelar Edición' : 'Editar Clan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-2 bg-slate-800/40 backdrop-blur-lg rounded-xl p-2 border border-blue-700/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de tabs */}
      {activeTab === 'info' && (
        <div className="space-y-8">
          {/* Formulario de Edición */}
          {isEditing && (
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <Edit className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Editar Información del Clan</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Clan</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="Descripción del clan..."
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">URL del Logo (Opcional)</label>
                  <input
                    type="url"
                    value={editData.logo}
                    onChange={(e) => setEditData({ ...editData, logo: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </button>
                  
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Estadísticas del Clan */}
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span>Estadísticas del Clan</span>
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-700/40 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">0</div>
                <div className="text-blue-300 text-sm">Partidas Jugadas</div>
              </div>
              
              <div className="bg-slate-700/40 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">0</div>
                <div className="text-blue-300 text-sm">Victorias</div>
              </div>
              
              <div className="bg-slate-700/40 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">0.00</div>
                <div className="text-blue-300 text-sm">K/D Promedio</div>
              </div>
              
              <div className="bg-slate-700/40 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">0h</div>
                <div className="text-blue-300 text-sm">Horas Jugadas</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>Miembros del Clan ({clanMembers.length})</span>
          </h3>

          {clanMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Sin miembros activos</h3>
              <p className="text-blue-300">Este clan no tiene miembros activos en este momento</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {clanMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={member.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=48&h=48&fit=crop'}
                        alt={member.username}
                        className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                        member.isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      {member.id === clan.leaderId && (
                        <div className="absolute -top-1 -left-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                          <Crown className="w-2.5 h-2.5 text-yellow-900" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-white">{member.username}</h4>
                        {member.id === clan.leaderId && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
                            Líder
                          </span>
                        )}
                        {member.role === 'admin' && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span>Admin</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-blue-400 mt-1">
                        <div className="flex items-center space-x-1">
                          <Activity className="w-3 h-3" />
                          <span>{member.isOnline ? 'En línea' : 'Desconectado'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>Chile</span>
                        </div>
                      </div>
                      
                      {member.status && (
                        <p className="text-blue-200 text-xs italic mt-1">"{member.status}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'management' && canManageMembers() && (
        <ClanMemberManager 
          clanId={clan.id}
          clanTag={clan.tag}
          isLeader={isLeader()}
        />
      )}
    </div>
  );
};

export default ClanProfile;