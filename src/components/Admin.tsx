import React, { useState, useEffect } from 'react';
import { Settings, Users, FileText, Monitor, MessageCircle, Trophy, Database, Shield, Crown, Star, Zap, Target, Plus, Edit, Trash2, Save, X, Eye, EyeOff, UserCheck, UserX, RotateCcw, AlertTriangle, CheckCircle, Image, Key, UserCog, Map, Award, Radio } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBanner } from '../contexts/BannerContext';
import BannerManager from './BannerManager';
import TournamentManager from './TournamentManager';
import MapManager from './MapManager';
import UserEditModal from './UserEditModal';
import PlayerStatsManager from './PlayerStatsManager';
import StreamingManager from './StreamingManager';

type AdminSection = 'overview' | 'users' | 'news' | 'clans' | 'banner' | 'tournaments' | 'maps' | 'moderation' | 'player-stats' | 'streaming';

interface DeletedComment {
  id: string;
  newsId: string;
  newsTitle: string;
  content: string;
  author: string;
  authorAvatar: string;
  createdAt: string;
  deletedBy: string;
  deletedAt: string;
  deletionReason: string;
}

const Admin: React.FC = () => {
  const { 
    user, 
    users, 
    news, 
    clans,
    createNews, 
    updateNews, 
    deleteNews,
    updateUser,
    toggleUserStatus,
    deleteUser,
    createClan,
    updateClan,
    deleteClan,
    getDeletedComments,
    restoreComment
  } = useAuth();
  
  const { bannerItems, updateBannerItems, isEnabled, setIsEnabled } = useBanner();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [showCreateNewsModal, setShowCreateNewsModal] = useState(false);
  const [showEditNewsModal, setShowEditNewsModal] = useState(false);
  const [showCreateClanModal, setShowCreateClanModal] = useState(false);
  const [showEditClanModal, setShowEditClanModal] = useState(false);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [selectedClan, setSelectedClan] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deletedComments, setDeletedComments] = useState<DeletedComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [newNews, setNewNews] = useState({
    title: '',
    content: '',
    image: '',
    author: user?.username || '',
    isPinned: false
  });

  const [newClan, setNewClan] = useState({
    name: '',
    tag: '',
    icon: 'crown',
    logo: '',
    leaderId: '',
    description: ''
  });

  // Verificar permisos de administrador
  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
        <p className="text-red-300">No tienes permisos para acceder al panel de administración</p>
      </div>
    );
  }

  useEffect(() => {
    if (activeSection === 'moderation') {
      loadDeletedComments();
    }
  }, [activeSection]);

  const loadDeletedComments = async () => {
    setIsLoadingComments(true);
    try {
      const comments = await getDeletedComments();
      setDeletedComments(comments);
    } catch (error) {
      console.error('Error loading deleted comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCreateNews = async () => {
    if (!newNews.title.trim() || !newNews.content.trim()) return;
    
    const success = await createNews({
      ...newNews,
      date: new Date().toISOString()
    });
    
    if (success) {
      setShowCreateNewsModal(false);
      setNewNews({
        title: '',
        content: '',
        image: '',
        author: user?.username || '',
        isPinned: false
      });
    }
  };

  const handleUpdateNews = async () => {
    if (!selectedNews || !selectedNews.title.trim() || !selectedNews.content.trim()) return;
    
    const success = await updateNews(selectedNews.id, selectedNews);
    
    if (success) {
      setShowEditNewsModal(false);
      setSelectedNews(null);
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      await deleteNews(newsId);
    }
  };

  const handleCreateClan = async () => {
    if (!newClan.name.trim() || !newClan.tag.trim()) return;
    
    console.log('🏰 Creando clan con datos:', newClan);
    
    const success = await createClan(newClan);
    
    if (success) {
      setShowCreateClanModal(false);
      setNewClan({
        name: '',
        tag: '',
        icon: 'crown',
        logo: '',
        leaderId: '',
        description: ''
      });
    } else {
      alert('Error al crear el clan. Verifica que el nombre y tag no estén en uso.');
    }
  };

  const handleUpdateClan = async () => {
    if (!selectedClan || !selectedClan.name.trim() || !selectedClan.tag.trim()) return;
    
    const success = await updateClan(selectedClan.id, selectedClan);
    
    if (success) {
      setShowEditClanModal(false);
      setSelectedClan(null);
    }
  };

  const handleDeleteClan = async (clanId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este clan? Todos los miembros perderán su afiliación.')) {
      await deleteClan(clanId);
    }
  };

  const handleRestoreComment = async (commentId: string) => {
    if (confirm('¿Estás seguro de que quieres restaurar este comentario?')) {
      const success = await restoreComment('', commentId); // newsId no es necesario para restore
      if (success) {
        loadDeletedComments();
      }
    }
  };

  const handleEditUser = (userToEdit: any) => {
    setSelectedUser(userToEdit);
    setShowUserEditModal(true);
  };

  const handleUserEditSave = () => {
    // Refrescar la lista de usuarios después de editar
    setSelectedUser(null);
    setShowUserEditModal(false);
  };

  const getClanIcon = (iconId: string) => {
    const clanIcons = [
      { id: 'crown', icon: Crown, name: 'Corona', color: 'text-yellow-400' },
      { id: 'sword', icon: Shield, name: 'Espada', color: 'text-red-400' },
      { id: 'shield', icon: Shield, name: 'Escudo', color: 'text-blue-400' },
      { id: 'star', icon: Star, name: 'Estrella', color: 'text-purple-400' },
      { id: 'zap', icon: Zap, name: 'Rayo', color: 'text-green-400' },
      { id: 'target', icon: Target, name: 'Diana', color: 'text-orange-400' }
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

  const adminSections = [
    { id: 'overview' as AdminSection, label: 'Resumen', icon: Monitor, color: 'text-blue-400' },
    { id: 'users' as AdminSection, label: 'Usuarios', icon: Users, color: 'text-green-400' },
    { id: 'player-stats' as AdminSection, label: 'Estadísticas', icon: Award, color: 'text-yellow-400' },
    { id: 'news' as AdminSection, label: 'Noticias', icon: FileText, color: 'text-purple-400' },
    { id: 'clans' as AdminSection, label: 'Clanes', icon: Shield, color: 'text-yellow-400' },
    { id: 'tournaments' as AdminSection, label: 'Torneos', icon: Trophy, color: 'text-orange-400' },
    { id: 'maps' as AdminSection, label: 'Mapas', icon: Map, color: 'text-pink-400' },
    { id: 'streaming' as AdminSection, label: 'Streaming', icon: Radio, color: 'text-red-400' },
    { id: 'banner' as AdminSection, label: 'Banner', icon: Image, color: 'text-cyan-400' },
    { id: 'moderation' as AdminSection, label: 'Moderación', icon: AlertTriangle, color: 'text-red-400' }
  ];

  const stats = [
    { label: 'Total Usuarios', value: users.length, icon: Users, color: 'text-blue-400' },
    { label: 'Usuarios Online', value: users.filter(u => u.isOnline && u.isActive).length, icon: UserCheck, color: 'text-green-400' },
    { label: 'Total Noticias', value: news.length, icon: FileText, color: 'text-purple-400' },
    { label: 'Total Clanes', value: clans.length, icon: Shield, color: 'text-yellow-400' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-red-600/20 rounded-xl">
            <Settings className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Panel de Administración</h2>
            <p className="text-blue-300">Gestiona todos los aspectos de la comunidad</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                  ${activeSection === section.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : `text-blue-300 hover:bg-blue-600/20 hover:text-blue-200`
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${activeSection === section.id ? 'text-white' : section.color}`} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-6">
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-blue-300 text-sm">{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
            <h3 className="text-xl font-bold text-white mb-6">Acciones Rápidas</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setShowCreateNewsModal(true)}
                className="flex items-center space-x-3 p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-300 hover:text-purple-200 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>Crear Noticia</span>
              </button>
              
              <button
                onClick={() => setShowCreateClanModal(true)}
                className="flex items-center space-x-3 p-4 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-xl text-yellow-300 hover:text-yellow-200 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>Crear Clan</span>
              </button>
              
              <button
                onClick={() => setActiveSection('maps')}
                className="flex items-center space-x-3 p-4 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 rounded-xl text-pink-300 hover:text-pink-200 transition-all duration-300"
              >
                <Map className="w-5 h-5" />
                <span>Gestionar Mapas</span>
              </button>
              
              <button
                onClick={() => setActiveSection('moderation')}
                className="flex items-center space-x-3 p-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-red-300 hover:text-red-200 transition-all duration-300"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Moderación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'users' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Gestión de Usuarios</h3>
          
          <div className="space-y-4">
            {users.map((userItem) => (
              <div key={userItem.id} className="bg-slate-700/40 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={userItem.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=48&h=48&fit=crop'}
                    alt={userItem.username}
                    className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white">{userItem.username}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userItem.role === 'admin' 
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {userItem.role}
                      </span>
                      {!userItem.isActive && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">
                          Suspendido
                        </span>
                      )}
                      {userItem.clan && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-mono">
                          [{userItem.clan}]
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-blue-400">
                      <span>{userItem.hideEmail ? '••••••@••••••.com' : userItem.email}</span>
                      <span>{userItem.isOnline ? 'En línea' : 'Desconectado'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditUser(userItem)}
                    className="p-2 bg-green-600/20 hover:bg-green-600/40 rounded-lg text-green-300 transition-colors"
                    title="Editar usuario completo"
                  >
                    <UserCog className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => updateUser(userItem.id, { 
                      role: userItem.role === 'admin' ? 'player' : 'admin' 
                    })}
                    disabled={userItem.id === '1'} // No permitir cambiar rol del admin principal
                    className="p-2 bg-blue-600/20 hover:bg-blue-600/40 disabled:bg-gray-600/20 disabled:text-gray-400 rounded-lg text-blue-300 transition-colors"
                    title={userItem.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => toggleUserStatus(userItem.id)}
                    disabled={userItem.id === '1'} // No permitir suspender al admin principal
                    className="p-2 bg-yellow-600/20 hover:bg-yellow-600/40 disabled:bg-gray-600/20 disabled:text-gray-400 rounded-lg text-yellow-300 transition-colors"
                    title={userItem.isActive ? 'Suspender' : 'Activar'}
                  >
                    {userItem.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => deleteUser(userItem.id)}
                    disabled={userItem.id === '1'} // No permitir eliminar al admin principal
                    className="p-2 bg-red-600/20 hover:bg-red-600/40 disabled:bg-gray-600/20 disabled:text-gray-400 rounded-lg text-red-300 transition-colors"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'news' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Gestión de Noticias</h3>
            <button
              onClick={() => setShowCreateNewsModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Noticia</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {news.map((newsItem) => (
              <div key={newsItem.id} className="bg-slate-700/40 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-bold text-white">{newsItem.title}</h4>
                      {newsItem.isPinned && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                          Fijado
                        </span>
                      )}
                    </div>
                    <p className="text-blue-200 text-sm mb-2 line-clamp-2">{newsItem.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-blue-400">
                      <span>Por: {newsItem.author}</span>
                      <span>{formatDate(newsItem.date)}</span>
                      <span>{newsItem.views} vistas</span>
                      <span>{newsItem.likes} likes</span>
                      <span>{newsItem.comments.filter(c => !c.isDeleted).length} comentarios</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedNews(newsItem);
                        setShowEditNewsModal(true);
                      }}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteNews(newsItem.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'clans' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Gestión de Clanes</h3>
            <button
              onClick={() => setShowCreateClanModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Clan</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {clans.map((clan) => {
              const IconComponent = getClanIcon(clan.icon).icon;
              const iconColor = getClanIcon(clan.icon).color;
              const leader = users.find(u => u.id === clan.leaderId);
              
              return (
                <div key={clan.id} className="bg-slate-700/40 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 bg-slate-600/40 flex items-center justify-center">
                        <IconComponent className={`w-6 h-6 ${iconColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white">{clan.name}</h4>
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs font-mono">
                            [{clan.tag}]
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-blue-400">
                          <span>{clan.members} miembros</span>
                          {leader && <span>Líder: {leader.username}</span>}
                          <span>{formatDate(clan.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClan(clan);
                          setShowEditClanModal(true);
                        }}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteClan(clan.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'tournaments' && (
        <TournamentManager />
      )}

      {activeSection === 'maps' && (
        <MapManager />
      )}

      {activeSection === 'banner' && (
        <BannerManager
          bannerItems={bannerItems}
          onUpdateBanner={updateBannerItems}
        />
      )}

      {activeSection === 'streaming' && (
        <StreamingManager />
      )}

      {activeSection === 'player-stats' && (
        <PlayerStatsManager />
      )}

      {activeSection === 'moderation' && (
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span>Moderación de Contenido</span>
          </h3>
          
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : deletedComments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No hay comentarios eliminados</h3>
              <p className="text-green-300">Todos los comentarios están en buen estado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedComments.map((comment) => (
                <div key={comment.id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={comment.authorAvatar}
                          alt={comment.author}
                          className="w-8 h-8 rounded-full border border-red-500/30"
                        />
                        <div>
                          <span className="font-medium text-red-300">{comment.author}</span>
                          <span className="text-red-400 text-sm ml-2">
                            en "{comment.newsTitle}"
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-red-200 mb-3 bg-red-500/10 p-3 rounded-lg">
                        {comment.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-red-400">
                        <span>Eliminado por: {comment.deletedBy}</span>
                        <span>Fecha: {formatDate(comment.deletedAt)}</span>
                        <span>Razón: {comment.deletionReason}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRestoreComment(comment.id)}
                      className="p-2 bg-green-600/20 hover:bg-green-600/40 rounded-lg text-green-300 transition-colors"
                      title="Restaurar comentario"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de editar usuario */}
      <UserEditModal
        user={selectedUser}
        isOpen={showUserEditModal}
        onClose={() => {
          setShowUserEditModal(false);
          setSelectedUser(null);
        }}
        onSave={handleUserEditSave}
      />

      {/* Modal de crear noticia */}
      {showCreateNewsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Crear Nueva Noticia</h3>
              <button
                onClick={() => setShowCreateNewsModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Título</label>
                <input
                  type="text"
                  value={newNews.title}
                  onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Título de la noticia"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Contenido</label>
                <textarea
                  value={newNews.content}
                  onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Contenido de la noticia"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">URL de Imagen</label>
                <input
                  type="url"
                  value={newNews.image}
                  onChange={(e) => setNewNews({ ...newNews, image: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={newNews.isPinned}
                  onChange={(e) => setNewNews({ ...newNews, isPinned: e.target.checked })}
                  className="rounded border-blue-600/30"
                />
                <label htmlFor="isPinned" className="text-blue-300">Fijar noticia</label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateNews}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Crear Noticia</span>
                </button>
                
                <button
                  onClick={() => setShowCreateNewsModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de editar noticia */}
      {showEditNewsModal && selectedNews && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Noticia</h3>
              <button
                onClick={() => setShowEditNewsModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Título</label>
                <input
                  type="text"
                  value={selectedNews.title}
                  onChange={(e) => setSelectedNews({ ...selectedNews, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Contenido</label>
                <textarea
                  value={selectedNews.content}
                  onChange={(e) => setSelectedNews({ ...selectedNews, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">URL de Imagen</label>
                <input
                  type="url"
                  value={selectedNews.image}
                  onChange={(e) => setSelectedNews({ ...selectedNews, image: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="editIsPinned"
                  checked={selectedNews.isPinned}
                  onChange={(e) => setSelectedNews({ ...selectedNews, isPinned: e.target.checked })}
                  className="rounded border-blue-600/30"
                />
                <label htmlFor="editIsPinned" className="text-blue-300">Fijar noticia</label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdateNews}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
                
                <button
                  onClick={() => setShowEditNewsModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear clan */}
      {showCreateClanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Crear Nuevo Clan</h3>
              <button
                onClick={() => setShowCreateClanModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Clan</label>
                  <input
                    type="text"
                    value={newClan.name}
                    onChange={(e) => setNewClan({ ...newClan, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Nombre del clan"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tag del Clan</label>
                  <input
                    type="text"
                    value={newClan.tag}
                    onChange={(e) => setNewClan({ ...newClan, tag: e.target.value.toUpperCase() })}
                    maxLength={8}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="TAG"
                  />
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Icono del Clan</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'crown', icon: Crown, name: 'Corona', color: 'text-yellow-400' },
                    { id: 'sword', icon: Shield, name: 'Espada', color: 'text-red-400' },
                    { id: 'shield', icon: Shield, name: 'Escudo', color: 'text-blue-400' },
                    { id: 'star', icon: Star, name: 'Estrella', color: 'text-purple-400' },
                    { id: 'zap', icon: Zap, name: 'Rayo', color: 'text-green-400' },
                    { id: 'target', icon: Target, name: 'Diana', color: 'text-orange-400' }
                  ].map((iconOption) => {
                    const IconComponent = iconOption.icon;
                    return (
                      <button
                        key={iconOption.id}
                        onClick={() => setNewClan({ ...newClan, icon: iconOption.id })}
                        className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${
                          newClan.icon === iconOption.id
                            ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                            : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${iconOption.color}`} />
                        <span className="text-sm">{iconOption.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Líder del Clan (Opcional)</label>
                <select
                  value={newClan.leaderId}
                  onChange={(e) => setNewClan({ ...newClan, leaderId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Sin líder asignado</option>
                  {users.filter(u => u.isActive).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">URL del Logo (Opcional)</label>
                <input
                  type="url"
                  value={newClan.logo}
                  onChange={(e) => setNewClan({ ...newClan, logo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={newClan.description}
                  onChange={(e) => setNewClan({ ...newClan, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Descripción del clan..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateClan}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Crear Clan</span>
                </button>
                
                <button
                  onClick={() => setShowCreateClanModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de editar clan */}
      {showEditClanModal && selectedClan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Clan</h3>
              <button
                onClick={() => setShowEditClanModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Clan</label>
                  <input
                    type="text"
                    value={selectedClan.name}
                    onChange={(e) => setSelectedClan({ ...selectedClan, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Tag del Clan</label>
                  <input
                    type="text"
                    value={selectedClan.tag}
                    onChange={(e) => setSelectedClan({ ...selectedClan, tag: e.target.value.toUpperCase() })}
                    maxLength={8}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Icono del Clan</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'crown', icon: Crown, name: 'Corona', color: 'text-yellow-400' },
                    { id: 'sword', icon: Shield, name: 'Espada', color: 'text-red-400' },
                    { id: 'shield', icon: Shield, name: 'Escudo', color: 'text-blue-400' },
                    { id: 'star', icon: Star, name: 'Estrella', color: 'text-purple-400' },
                    { id: 'zap', icon: Zap, name: 'Rayo', color: 'text-green-400' },
                    { id: 'target', icon: Target, name: 'Diana', color: 'text-orange-400' }
                  ].map((iconOption) => {
                    const IconComponent = iconOption.icon;
                    return (
                      <button
                        key={iconOption.id}
                        onClick={() => setSelectedClan({ ...selectedClan, icon: iconOption.id })}
                        className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${
                          selectedClan.icon === iconOption.id
                            ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                            : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${iconOption.color}`} />
                        <span className="text-sm">{iconOption.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Líder del Clan</label>
                <select
                  value={selectedClan.leaderId || ''}
                  onChange={(e) => setSelectedClan({ ...selectedClan, leaderId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Sin líder asignado</option>
                  {users.filter(u => u.isActive).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">URL del Logo</label>
                <input
                  type="url"
                  value={selectedClan.logo || ''}
                  onChange={(e) => setSelectedClan({ ...selectedClan, logo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={selectedClan.description || ''}
                  onChange={(e) => setSelectedClan({ ...selectedClan, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Descripción del clan..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdateClan}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
                
                <button
                  onClick={() => setShowEditClanModal(false)}
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

export default Admin;