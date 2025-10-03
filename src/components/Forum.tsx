import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Pin, Lock, Eye, MessageCircle, User, Calendar, ArrowLeft, Send, Shield, Star, Users, Search, Filter, Clock, TrendingUp, ChevronRight, AlertCircle, LogIn, Trash2, Edit2, Quote, History, Unlock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from './RichTextEditor';

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  repliesCount: number;
  author: {
    id: string;
    username: string;
    avatar: string;
    role?: string;
  };
  lastReply?: {
    username: string;
    avatar: string;
    at: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ForumReply {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string;
    role: string;
    clan?: string;
  };
  createdAt: string;
  updatedAt: string;
  editCount?: number;
  lastEditedAt?: string;
  quotedReplyId?: string;
}

interface TopicDetail extends ForumTopic {
  replies: ForumReply[];
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

const Forum: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'list' | 'topic' | 'create'>('list');
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Estados para crear tema
  const [newTopic, setNewTopic] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para responder
  const [newReply, setNewReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Estados para edición
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Estados para citas
  const [quotedReply, setQuotedReply] = useState<ForumReply | null>(null);

  // Estados para historial de edición
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editHistoryReplyId, setEditHistoryReplyId] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<any[]>([]);

  const categories = [
    { id: 'all', name: 'Todas las categorías', icon: MessageSquare, color: 'text-blue-400' },
    { id: 'general', name: 'Discusión General', icon: MessageCircle, color: 'text-green-400' },
    { id: 'gameplay', name: 'Gameplay y Estrategias', icon: TrendingUp, color: 'text-purple-400' },
    { id: 'technical', name: 'Soporte Técnico', icon: AlertCircle, color: 'text-red-400' },
    { id: 'clans', name: 'Clanes y Reclutamiento', icon: Users, color: 'text-yellow-400' },
    { id: 'suggestions', name: 'Sugerencias', icon: Plus, color: 'text-cyan-400' }
  ];

  useEffect(() => {
    loadTopics();
  }, [selectedCategory]);

  const loadTopics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/forum/get-topics.php?category=${selectedCategory}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTopics(data.topics);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopic = async (topicId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/forum/get-topic.php?id=${topicId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedTopic(data.topic);
        setCurrentView('topic');
      }
    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/forum/create-topic.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newTopic)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewTopic({ title: '', content: '', category: 'general' });
        setCurrentView('list');
        loadTopics();
      } else {
        alert(data.message || 'Error al crear el tema');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Error al crear el tema');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tema? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/forum/delete-topic.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ topicId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (currentView === 'topic') {
          setCurrentView('list');
          setSelectedTopic(null);
        }
        loadTopics();
      } else {
        alert(data.message || 'Error al eliminar el tema');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Error al eliminar el tema');
    }
  };

  const handleReply = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!newReply.trim() || !selectedTopic) return;

    setIsReplying(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forum/reply-topic.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          topicId: selectedTopic.id,
          content: newReply,
          quotedReplyId: quotedReply?.id || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewReply('');
        setQuotedReply(null);
        loadTopic(selectedTopic.id);
      } else {
        alert(data.message || 'Error al enviar la respuesta');
      }
    } catch (error) {
      console.error('Error replying:', error);
      alert('Error al enviar la respuesta');
    } finally {
      setIsReplying(false);
    }
  };

  const handleEditReply = async () => {
    if (!editingReplyId || !editContent.trim()) return;

    setIsEditing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forum/edit-reply.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          replyId: editingReplyId,
          content: editContent
        })
      });

      const data = await response.json();

      if (data.success) {
        setEditingReplyId(null);
        setEditContent('');
        if (selectedTopic) {
          loadTopic(selectedTopic.id);
        }
      } else {
        alert(data.message || 'Error al editar la respuesta');
      }
    } catch (error) {
      console.error('Error editing reply:', error);
      alert('Error al editar la respuesta');
    } finally {
      setIsEditing(false);
    }
  };

  const handleToggleLock = async () => {
    if (!selectedTopic) return;

    try {
      const response = await fetch(`${API_BASE_URL}/forum/toggle-lock.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          topicId: selectedTopic.id
        })
      });

      const data = await response.json();

      if (data.success) {
        loadTopic(selectedTopic.id);
      } else {
        alert(data.message || 'Error al cambiar el estado del tema');
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
      alert('Error al cambiar el estado del tema');
    }
  };

  const handleQuoteReply = (reply: ForumReply) => {
    setQuotedReply(reply);
    const quoteText = `<blockquote><strong>${reply.author.username}:</strong><br/>${reply.content}</blockquote><p><br/></p>`;
    setNewReply(quoteText);

    // Scroll al formulario de respuesta
    setTimeout(() => {
      const replyForm = document.getElementById('reply-form');
      if (replyForm) {
        replyForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const loadEditHistory = async (replyId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forum/get-edit-history.php?replyId=${replyId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setEditHistory(data.history);
        setEditHistoryReplyId(replyId);
        setShowEditHistory(true);
      }
    } catch (error) {
      console.error('Error loading edit history:', error);
    }
  };

  const canEditReply = (reply: ForumReply) => {
    if (!user) return false;
    return user.id === reply.author.id;
  };

  const isTopicAuthor = () => {
    if (!user || !selectedTopic) return false;
    return user.id === selectedTopic.author.id;
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    if (diffInMinutes < 10080) return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
    return formatDate(dateString);
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[1];
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? (
      <Shield className="w-4 h-4 text-yellow-400" />
    ) : (
      <Star className="w-4 h-4 text-blue-400" />
    );
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
      : 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  const canDeleteTopic = (topic: ForumTopic) => {
    if (!user) return false;
    return user.role === 'admin' || user.id === topic.author.id;
  };

  const navigateToLogin = () => {
    setShowLoginPrompt(false);
    // Trigger navigation to user panel
    const event = new CustomEvent('navigate-to-section', { detail: 'user-panel' });
    window.dispatchEvent(event);
  };

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Vista de lista de temas
  if (currentView === 'list') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Foro de la Comunidad</h1>
          <p className="text-blue-200 text-lg">Discute, comparte y conecta con otros jugadores</p>
          {!user && (
            <div className="mt-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
              <p className="text-blue-300 text-sm">
                💡 <strong>¿Quieres participar?</strong> Inicia sesión para crear temas y responder en las discusiones
              </p>
            </div>
          )}
        </div>

        {/* Estadísticas del foro */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{topics.length}</p>
                <p className="text-blue-300 text-sm">Temas Totales</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {topics.reduce((sum, topic) => sum + topic.repliesCount, 0)}
                </p>
                <p className="text-green-300 text-sm">Respuestas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Eye className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {topics.reduce((sum, topic) => sum + topic.views, 0)}
                </p>
                <p className="text-purple-300 text-sm">Visualizaciones</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-blue-700/30 p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {new Set(topics.map(topic => topic.author.id)).size}
                </p>
                <p className="text-yellow-300 text-sm">Participantes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="mb-8 bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Búsqueda */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="text"
                  placeholder="Buscar en el foro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              {/* Filtro de categorías */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Botón crear tema */}
            <button
              onClick={() => {
                if (!user) {
                  setShowLoginPrompt(true);
                  return;
                }
                setCurrentView('create');
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Tema</span>
            </button>
          </div>
        </div>

        {/* Lista de temas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-24 h-24 text-blue-400 mx-auto mb-6 opacity-50" />
            <h2 className="text-3xl font-bold text-white mb-4">
              {searchTerm ? 'No se encontraron temas' : 'Sé el primero en participar'}
            </h2>
            <p className="text-blue-300 text-lg mb-8">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Inicia una nueva discusión y ayuda a construir nuestra comunidad'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  if (!user) {
                    setShowLoginPrompt(true);
                    return;
                  }
                  setCurrentView('create');
                }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold text-lg transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-6 h-6" />
                <span>Crear Primer Tema</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTopics.map((topic) => {
              const categoryInfo = getCategoryInfo(topic.category);
              const CategoryIcon = categoryInfo.icon;
              
              return (
                <div
                  key={topic.id}
                  className={`
                    bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 
                    hover:bg-slate-700/40 hover:border-blue-500/50 transition-all duration-300
                    ${topic.isPinned ? 'ring-2 ring-yellow-400/50' : ''}
                  `}
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar del autor */}
                    <img
                      src={topic.author.avatar}
                      alt={topic.author.username}
                      className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                    />
                    
                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {topic.isPinned && (
                          <Pin className="w-4 h-4 text-yellow-400" />
                        )}
                        {topic.isLocked && (
                          <Lock className="w-4 h-4 text-red-400" />
                        )}
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${categoryInfo.color} bg-slate-700/40`}>
                          <CategoryIcon className="w-3 h-3" />
                          <span>{categoryInfo.name}</span>
                        </div>
                      </div>
                      
                      <h3 
                        className="text-lg font-bold text-white mb-2 hover:text-blue-300 transition-colors cursor-pointer"
                        onClick={() => loadTopic(topic.id)}
                      >
                        {topic.title}
                      </h3>
                      
                      <p className="text-blue-200 text-sm mb-3 line-clamp-2">
                        {topic.content.substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-blue-400">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{topic.author.username}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatRelativeTime(topic.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Estadísticas y acciones */}
                    <div className="flex flex-col items-center space-y-2 text-center min-w-0">
                      <div className="flex items-center space-x-4 text-blue-400 text-sm">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{topic.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{topic.repliesCount}</span>
                        </div>
                      </div>
                      
                      {topic.lastReply && (
                        <div className="text-xs text-blue-400">
                          <p>Última respuesta:</p>
                          <p className="font-medium">{topic.lastReply.username}</p>
                          <p>{formatRelativeTime(topic.lastReply.at)}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        {canDeleteTopic(topic) && (
                          <button
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                            title="Eliminar tema"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => loadTopic(topic.id)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                          title="Ver tema"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl border border-blue-500/30 p-6 max-w-md w-full">
              <div className="text-center">
                <LogIn className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Inicia Sesión</h3>
                <p className="text-blue-300 mb-6">
                  Para participar en el foro necesitas tener una cuenta
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={navigateToLogin}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Ir a Login</span>
                  </button>
                  
                  <button
                    onClick={() => setShowLoginPrompt(false)}
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
  }

  // Vista de crear tema
  if (currentView === 'create') {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => setCurrentView('list')}
          className="flex items-center space-x-2 mb-6 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Foro</span>
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Crear Nuevo Tema</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Categoría</label>
                <select
                  value={newTopic.category}
                  onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {categories.slice(1).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Título del Tema</label>
                <input
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  placeholder="Escribe un título descriptivo..."
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Contenido</label>
                <RichTextEditor
                  value={newTopic.content}
                  onChange={(value) => setNewTopic({ ...newTopic, content: value })}
                  placeholder="Describe tu tema en detalle..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleCreateTopic}
                  disabled={isCreating || !newTopic.title.trim() || !newTopic.content.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Crear Tema</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setCurrentView('list')}
                  disabled={isCreating}
                  className="px-8 py-4 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de tema individual
  if (currentView === 'topic' && selectedTopic) {
    const categoryInfo = getCategoryInfo(selectedTopic.category);
    const CategoryIcon = categoryInfo.icon;
    
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => setCurrentView('list')}
          className="flex items-center space-x-2 mb-6 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Foro</span>
        </button>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tema principal */}
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {selectedTopic.isPinned && (
                  <Pin className="w-5 h-5 text-yellow-400" />
                )}
                {selectedTopic.isLocked && (
                  <Lock className="w-5 h-5 text-red-400" />
                )}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${categoryInfo.color} bg-slate-700/40`}>
                  <CategoryIcon className="w-4 h-4" />
                  <span>{categoryInfo.name}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isTopicAuthor() && (
                  <button
                    onClick={handleToggleLock}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      selectedTopic.isLocked
                        ? 'bg-green-600/20 hover:bg-green-600/40 text-green-300 hover:text-green-200'
                        : 'bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 hover:text-yellow-200'
                    }`}
                    title={selectedTopic.isLocked ? 'Desbloquear tema' : 'Bloquear tema'}
                  >
                    {selectedTopic.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>{selectedTopic.isLocked ? 'Desbloquear' : 'Bloquear'}</span>
                  </button>
                )}

                {canDeleteTopic(selectedTopic) && (
                  <button
                    onClick={() => handleDeleteTopic(selectedTopic.id)}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 hover:text-red-200 transition-colors"
                    title="Eliminar tema"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-6">{selectedTopic.title}</h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={selectedTopic.author.avatar}
                alt={selectedTopic.author.username}
                className="w-12 h-12 rounded-full border-2 border-blue-500/30"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">{selectedTopic.author.username}</span>
                  {selectedTopic.author.role && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getRoleBadgeColor(selectedTopic.author.role)}`}>
                      {getRoleIcon(selectedTopic.author.role)}
                      <span>{selectedTopic.author.role === 'admin' ? 'Admin' : 'Jugador'}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-blue-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(selectedTopic.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{selectedTopic.views} vistas</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <RichTextEditor
                value={selectedTopic.content}
                onChange={() => {}}
                readOnly={true}
              />
            </div>
          </div>

          {/* Respuestas */}
          {selectedTopic.replies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">
                Respuestas ({selectedTopic.replies.length})
              </h3>
              
              {selectedTopic.replies.map((reply) => (
                <div key={reply.id} className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
                  {editingReplyId === reply.id ? (
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Editando respuesta:</h4>
                      <RichTextEditor
                        value={editContent}
                        onChange={setEditContent}
                        placeholder="Edita tu respuesta..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleEditReply}
                          disabled={isEditing || !editContent.trim()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg text-white transition-colors"
                        >
                          {isEditing ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingReplyId(null);
                            setEditContent('');
                          }}
                          disabled={isEditing}
                          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-lg text-white transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start space-x-4">
                        <img
                          src={reply.author.avatar}
                          alt={reply.author.username}
                          className="w-10 h-10 rounded-full border-2 border-blue-500/30"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2 flex-wrap">
                            <span className="font-bold text-white">{reply.author.username}</span>
                            {reply.author.role && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getRoleBadgeColor(reply.author.role)}`}>
                                {getRoleIcon(reply.author.role)}
                                <span>{reply.author.role === 'admin' ? 'Admin' : 'Jugador'}</span>
                              </span>
                            )}
                            {reply.author.clan && (
                              <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs font-mono">
                                [{reply.author.clan}]
                              </span>
                            )}
                            <span className="text-blue-400 text-sm">{formatDate(reply.createdAt)}</span>
                            {reply.editCount && reply.editCount > 0 && (
                              <span className="text-yellow-400 text-xs italic">
                                (editado {reply.editCount} {reply.editCount === 1 ? 'vez' : 'veces'})
                              </span>
                            )}
                          </div>

                          <div className="mb-3">
                            <RichTextEditor
                              value={reply.content}
                              onChange={() => {}}
                              readOnly={true}
                            />
                          </div>

                          <div className="flex items-center space-x-2 flex-wrap">
                            {user && !selectedTopic.isLocked && (
                              <button
                                onClick={() => handleQuoteReply(reply)}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 text-sm transition-colors"
                              >
                                <Quote className="w-3 h-3" />
                                <span>Citar</span>
                              </button>
                            )}

                            {canEditReply(reply) && !selectedTopic.isLocked && (
                              <button
                                onClick={() => {
                                  setEditingReplyId(reply.id);
                                  setEditContent(reply.content);
                                }}
                                className="flex items-center space-x-1 px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-lg text-yellow-300 text-sm transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                            )}

                            {reply.editCount && reply.editCount > 0 && (
                              <button
                                onClick={() => loadEditHistory(reply.id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg text-purple-300 text-sm transition-colors"
                              >
                                <History className="w-3 h-3" />
                                <span>Historial</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulario de respuesta */}
          {!selectedTopic.isLocked && (
            <div id="reply-form" className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Responder al tema</h3>

              {user ? (
                <div className="space-y-4">
                  {quotedReply && (
                    <div className="flex items-center justify-between bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Quote className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300 text-sm">
                          Citando a <strong>{quotedReply.author.username}</strong>
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setQuotedReply(null);
                          setNewReply('');
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Cancelar cita
                      </button>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <img
                      src={user.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop'}
                      alt={user.username}
                      className="w-10 h-10 rounded-full border-2 border-blue-500/30"
                    />
                    <div className="flex-1">
                      <RichTextEditor
                        value={newReply}
                        onChange={setNewReply}
                        placeholder="Escribe tu respuesta..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleReply}
                      disabled={!newReply.trim() || isReplying}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-xl text-white font-medium transition-colors"
                    >
                      {isReplying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Responder</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <LogIn className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-300 mb-4">Inicia sesión para responder a este tema</p>
                  <button
                    onClick={navigateToLogin}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedTopic.isLocked && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-300 mb-2">Tema Bloqueado</h3>
              <p className="text-red-400">Este tema ha sido bloqueado y no acepta nuevas respuestas.</p>
            </div>
          )}

          {/* Modal de Historial de Edición */}
          {showEditHistory && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 rounded-2xl border border-blue-500/30 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <History className="w-5 h-5 text-purple-400" />
                    <span>Historial de Ediciones</span>
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditHistory(false);
                      setEditHistoryReplyId(null);
                      setEditHistory([]);
                    }}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                {editHistory.length === 0 ? (
                  <p className="text-blue-300 text-center py-8">No hay historial de ediciones</p>
                ) : (
                  <div className="space-y-4">
                    {editHistory.map((edit, index) => (
                      <div key={edit.id} className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/30">
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={edit.editor.avatar}
                            alt={edit.editor.username}
                            className="w-8 h-8 rounded-full border-2 border-blue-500/30"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium">{edit.editor.username}</p>
                            <p className="text-blue-400 text-sm">{formatDate(edit.editedAt)}</p>
                          </div>
                          <span className="text-purple-400 text-sm font-medium">
                            Edición #{editHistory.length - index}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-red-300 text-sm font-medium mb-2">Contenido Anterior:</h4>
                            <div className="bg-slate-900/40 rounded-lg p-3 border border-red-500/20">
                              <RichTextEditor
                                value={edit.oldContent}
                                onChange={() => {}}
                                readOnly={true}
                              />
                            </div>
                          </div>

                          <div>
                            <h4 className="text-green-300 text-sm font-medium mb-2">Contenido Nuevo:</h4>
                            <div className="bg-slate-900/40 rounded-lg p-3 border border-green-500/20">
                              <RichTextEditor
                                value={edit.newContent}
                                onChange={() => {}}
                                readOnly={true}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default Forum;