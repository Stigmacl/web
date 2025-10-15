import React, { useState, useEffect } from 'react';
import { Calendar, MessageCircle, Heart, Share2, Pin, Eye, User, Trash2, RotateCcw, AlertTriangle, Shield, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StreamPlayer from './StreamPlayer';
import TournamentsWidget from './TournamentsWidget';
import { API_BASE_URL } from '../config/api';

const Home: React.FC = () => {
  const { news, user, likeNews, addComment, incrementNewsViews, deleteComment, restoreComment, tournaments } = useAuth();
  const [selectedNews, setSelectedNews] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [viewedNews, setViewedNews] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ newsId: string; commentId: string; author: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [streamConfig, setStreamConfig] = useState<{ stream_url: string; is_active: boolean; descriptive_text: string; offline_url: string; offline_text: string; show_offline: boolean }>({
    stream_url: '',
    is_active: false,
    descriptive_text: 'Vuelve pronto para ver contenido en vivo',
    offline_url: '',
    offline_text: '',
    show_offline: false
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleComment = async (newsId: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (newComment.trim() && !isSubmittingComment) {
      setIsSubmittingComment(true);
      try {
        await addComment(newsId, newComment);
        setNewComment('');
      } catch (error) {
        console.error('Error adding comment:', error);
        alert('Error al enviar el comentario. Intenta nuevamente.');
      } finally {
        setIsSubmittingComment(false);
      }
    }
  };

  const handleLike = (newsId: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    likeNews(newsId);
  };

  const handleShare = (newsItem: any) => {
    if (navigator.share) {
      navigator.share({
        title: newsItem.title,
        text: newsItem.content,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${newsItem.title}\n\n${newsItem.content}\n\n${window.location.href}`);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleDeleteComment = (newsId: string, commentId: string, author: string) => {
    setCommentToDelete({ newsId, commentId, author });
    setShowDeleteModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      const success = await deleteComment(
        commentToDelete.newsId, 
        commentToDelete.commentId, 
        deleteReason || 'Moderación administrativa'
      );
      
      if (success) {
        setShowDeleteModal(false);
        setCommentToDelete(null);
        setDeleteReason('');
      } else {
        alert('Error al eliminar el comentario. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error al eliminar el comentario. Intenta nuevamente.');
    }
  };

  const handleRestoreComment = async (newsId: string, commentId: string) => {
    try {
      const success = await restoreComment(newsId, commentId);
      if (!success) {
        alert('Error al restaurar el comentario');
      }
    } catch (error) {
      console.error('Error restoring comment:', error);
      alert('Error al restaurar el comentario');
    }
  };

  const navigateToLogin = () => {
    setShowLoginPrompt(false);
    // Trigger navigation to user panel
    const event = new CustomEvent('navigate-to-section', { detail: 'user-panel' });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const fetchStreamConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/streaming/get-config.php`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.config) {
          setStreamConfig({
            stream_url: data.config.stream_url || '',
            is_active: data.config.is_active || false,
            descriptive_text: data.config.descriptive_text || 'Vuelve pronto para ver contenido en vivo',
            offline_url: data.config.offline_url || '',
            offline_text: data.config.offline_text || '',
            show_offline: data.config.show_offline || false
          });
        }
      } catch (error) {
        console.error('Error fetching stream config:', error);
      }
    };

    fetchStreamConfig();
  }, []);

  useEffect(() => {
    news.forEach(item => {
      if (!viewedNews.has(item.id)) {
        incrementNewsViews(item.id);
        setViewedNews(prev => new Set([...prev, item.id]));
      }
    });
  }, [news, incrementNewsViews, viewedNews]);

  const handleViewTournament = (tournamentId: string) => {
    // Navegar a la sección Comunidad (players)
    const event = new CustomEvent('navigate-to-section', { detail: 'players' });
    window.dispatchEvent(event);

    // Enviar evento para cambiar a la vista de torneos
    setTimeout(() => {
      const viewModeEvent = new CustomEvent('set-players-view-mode', { detail: 'tournaments' });
      window.dispatchEvent(viewModeEvent);

      // Esperar un poco más para el scroll al torneo específico
      setTimeout(() => {
        const element = document.getElementById(`tournament-${tournamentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-yellow-400/50');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-yellow-400/50');
          }, 2000);
        }
      }, 300);
    }, 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Noticias de la Comunidad</h1>
        <p className="text-blue-200 text-lg">Mantente al día con las últimas novedades de Tactical Ops 3.5 Chile</p>
        {!user && (
          <div className="mt-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
            <p className="text-blue-300 text-sm">
              💡 <strong>¿Quieres participar?</strong> Inicia sesión para comentar y dar like a las noticias
            </p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {news.length === 0 ? (
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8">
              <MessageCircle className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold text-white mb-3 text-center">¡Bienvenido a la Comunidad!</h2>
              <p className="text-blue-300 text-center mb-6">
                Aún no hay noticias publicadas. Los administradores pueden crear las primeras noticias
                desde el panel de administración para mantener informada a la comunidad.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-700/40 rounded-xl p-4">
                  <Pin className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-white mb-1 text-center">Noticias Importantes</h3>
                  <p className="text-blue-300 text-xs text-center">
                    Las noticias fijadas aparecerán destacadas para toda la comunidad
                  </p>
                </div>

                <div className="bg-slate-700/40 rounded-xl p-4">
                  <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-white mb-1 text-center">Interacción</h3>
                  <p className="text-blue-300 text-xs text-center">
                    Los usuarios podrán comentar y reaccionar a las publicaciones
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
          {news
            .sort((a, b) => {
              // Sort by pinned first, then by date
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            })
            .map((item) => {
              const isLikedByUser = user && item.likedBy.includes(user.id);
              
              return (
                <article
                  key={item.id}
                  className={`
                    relative bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 
                    overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-blue-500/10
                    ${item.isPinned ? 'ring-2 ring-yellow-400/50' : ''}
                  `}
                >
                  {item.isPinned && (
                    <div className="absolute top-4 right-4 z-10 bg-yellow-500/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                      <Pin className="w-4 h-4 text-yellow-900" />
                      <span className="text-yellow-900 text-sm font-medium">Fijado</span>
                    </div>
                  )}

                  <div className="md:flex">
                    {/* Imagen con aspect ratio fijo y sin recorte */}
                    <div className="md:w-2/5 md:max-w-md">
                      <div className="w-full h-64 md:h-80 bg-slate-700/40 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-contain bg-slate-900/50"
                          style={{ 
                            objectFit: 'contain',
                            objectPosition: 'center'
                          }}
                          onError={(e) => {
                            // Fallback en caso de error de imagen
                            const target = e.target as HTMLImageElement;
                            target.src = '/Logo-Comunidad.png';
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="md:w-3/5 p-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-blue-300">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{item.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(item.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{item.views}</span>
                          </div>
                        </div>
                      </div>

                      <h2 className="text-2xl font-bold text-white mb-4 hover:text-blue-300 transition-colors">
                        {item.title}
                      </h2>
                      
                      <p className="text-blue-100 mb-6 leading-relaxed">
                        {item.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button 
                            onClick={() => handleLike(item.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                              isLikedByUser
                                ? 'bg-red-500/30 text-red-200 border border-red-400/30'
                                : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200'
                            } ${!user ? 'opacity-75' : ''}`}
                            title={!user ? 'Inicia sesión para dar like' : ''}
                          >
                            <Heart className={`w-4 h-4 ${isLikedByUser ? 'fill-current' : ''}`} />
                            <span>{item.likes}</span>
                          </button>
                          
                          <button
                            onClick={() => setSelectedNews(selectedNews === item.id ? null : item.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors text-blue-300 hover:text-blue-200"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{item.comments.filter(c => !c.isDeleted).length}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleShare(item)}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors text-green-300 hover:text-green-200"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Compartir</span>
                          </button>
                        </div>
                      </div>

                      {selectedNews === item.id && (
                        <div className="mt-6 border-t border-blue-700/30 pt-6">
                          <h4 className="text-lg font-semibold text-white mb-4">
                            Comentarios ({item.comments.filter(c => !c.isDeleted).length})
                          </h4>
                          
                          <div className="space-y-4 mb-6">
                            {item.comments.filter(c => !c.isDeleted).length === 0 ? (
                              <div className="text-center py-6">
                                <MessageCircle className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-50" />
                                <p className="text-blue-400">No hay comentarios aún</p>
                                <p className="text-blue-500 text-sm">¡Sé el primero en comentar!</p>
                              </div>
                            ) : (
                              item.comments
                                .filter(c => !c.isDeleted)
                                .map((comment) => (
                                  <div key={comment.id} className="flex space-x-3">
                                    <img
                                      src={comment.avatar}
                                      alt={comment.author}
                                      className="w-8 h-8 rounded-full border border-blue-500/30"
                                    />
                                    <div className="flex-1 bg-slate-700/40 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-blue-300">{comment.author}</span>
                                          <span className="text-xs text-blue-400">{formatDate(comment.date)}</span>
                                        </div>
                                        
                                        {user?.role === 'admin' && (
                                          <div className="flex items-center space-x-1">
                                            <button
                                              onClick={() => handleDeleteComment(item.id, comment.id, comment.author)}
                                              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                                              title="Eliminar comentario"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-blue-100">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                            )}

                            {/* Mostrar comentarios eliminados solo a admins */}
                            {user?.role === 'admin' && item.comments.some(c => c.isDeleted) && (
                              <div className="border-t border-red-700/30 pt-4">
                                <h5 className="text-sm font-medium text-red-300 mb-3 flex items-center space-x-2">
                                  <Shield className="w-4 h-4" />
                                  <span>Comentarios Eliminados (Solo Admins)</span>
                                </h5>
                                {item.comments
                                  .filter(c => c.isDeleted)
                                  .map((comment) => (
                                    <div key={comment.id} className="flex space-x-3 mb-3">
                                      <img
                                        src={comment.avatar}
                                        alt={comment.author}
                                        className="w-8 h-8 rounded-full border border-red-500/30 opacity-50"
                                      />
                                      <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium text-red-300">{comment.author}</span>
                                            <span className="text-xs text-red-400">{formatDate(comment.date)}</span>
                                            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">ELIMINADO</span>
                                          </div>
                                          
                                          <button
                                            onClick={() => handleRestoreComment(item.id, comment.id)}
                                            className="p-1 hover:bg-green-500/20 rounded text-green-400 hover:text-green-300 transition-colors"
                                            title="Restaurar comentario"
                                          >
                                            <RotateCcw className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <p className="text-red-200 opacity-75">{comment.content}</p>
                                        {comment.deletionReason && (
                                          <p className="text-xs text-red-400 mt-2 italic">
                                            Razón: {comment.deletionReason}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>

                          {user ? (
                            <div className="flex space-x-3">
                              <img
                                src={user.avatar || '/Logo-Comunidad.png'}
                                alt={user.username}
                                className="w-8 h-8 rounded-full border border-blue-500/30"
                              />
                              <div className="flex-1 flex space-x-2">
                                <input
                                  type="text"
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Escribe tu comentario..."
                                  className="flex-1 px-4 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                                  onKeyPress={(e) => e.key === 'Enter' && !isSubmittingComment && handleComment(item.id)}
                                  disabled={isSubmittingComment}
                                />
                                <button
                                  onClick={() => handleComment(item.id)}
                                  disabled={!newComment.trim() || isSubmittingComment}
                                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white font-medium transition-colors flex items-center space-x-2"
                                >
                                  {isSubmittingComment ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span>Enviando...</span>
                                    </>
                                  ) : (
                                    <span>Enviar</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                                <LogIn className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                                <p className="text-blue-300 mb-4 font-medium">¿Quieres unirte a la conversación?</p>
                                <p className="text-blue-400 text-sm mb-4">Inicia sesión para comentar y participar en la comunidad</p>
                                <button 
                                  onClick={navigateToLogin}
                                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-all duration-300 flex items-center space-x-2 mx-auto"
                                >
                                  <LogIn className="w-4 h-4" />
                                  <span>Iniciar Sesión</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <StreamPlayer
            streamUrl={streamConfig.stream_url}
            isActive={streamConfig.is_active}
            descriptiveText={streamConfig.descriptive_text}
            offlineUrl={streamConfig.offline_url}
            offlineText={streamConfig.offline_text}
            showOffline={streamConfig.show_offline}
          />
          <TournamentsWidget
            tournaments={tournaments || []}
            onViewTournament={handleViewTournament}
          />
        </div>
      </div>

      {/* Modal de confirmación para eliminar comentario */}
      {showDeleteModal && commentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-red-500/30 p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Eliminar Comentario</h3>
                <p className="text-red-300 text-sm">Esta acción se puede revertir</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-blue-200 mb-4">
                ¿Estás seguro de que quieres eliminar el comentario de <strong>{commentToDelete.author}</strong>?
              </p>
              
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Razón de eliminación (opcional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Ej: Contenido inapropiado, spam, etc."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteComment}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-colors"
              >
                Eliminar Comentario
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCommentToDelete(null);
                  setDeleteReason('');
                }}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prompt para login */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-500/30 p-6 max-w-md w-full">
            <div className="text-center">
              <LogIn className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Inicia Sesión</h3>
              <p className="text-blue-300 mb-6">
                Para interactuar con las noticias necesitas tener una cuenta
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
};

export default Home;