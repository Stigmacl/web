import React, { useState, useEffect } from 'react';
import { Plus, Image, Youtube, Heart, Trash2, Upload, ExternalLink, Play, Calendar, User, X, Save, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  description: string;
  username: string;
  userAvatar: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

interface UserWallProps {
  userId: string;
  isOwnProfile?: boolean;
}

// Detectar automáticamente la URL base de la API
const getApiBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Si estamos en desarrollo local (puerto 5173 de Vite)
  if (hostname === 'localhost' && port === '5173') {
    return 'http://localhost/api';
  }
  
  // Si estamos en producción o en el servidor real
  if (port && port !== '80' && port !== '443') {
    return `${protocol}//${hostname}:${port}/api`;
  }
  
  // Para dominios normales (como www.tacticalops.cl)
  return `${protocol}//${hostname}/api`;
};

const API_BASE_URL = getApiBaseUrl();

const UserWall: React.FC<UserWallProps> = ({ userId, isOwnProfile = false }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'image' as 'image' | 'video',
    url: '',
    title: '',
    description: ''
  });

  useEffect(() => {
    loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/get-user-posts.php?userId=${userId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.url.trim()) return;
    
    setIsCreating(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/posts/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newPost)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setNewPost({ type: 'image', url: '', title: '', description: '' });
        loadPosts();
      } else {
        alert(data.message || 'Error al crear la publicación');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error al crear la publicación');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/posts/like.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ postId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? {
                ...post,
                likes: data.likes,
                likedBy: data.action === 'liked' 
                  ? [...post.likedBy, user.id]
                  : post.likedBy.filter(id => id !== user.id)
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/posts/delete.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ postId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPosts(prev => prev.filter(post => post.id !== postId));
      } else {
        alert(data.message || 'Error al eliminar la publicación');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error al eliminar la publicación');
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
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

  const validateYouTubeUrl = (url: string): boolean => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return !!(match && match[2].length === 11);
  };

  const validateImageUrl = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('pexels.com') || url.includes('unsplash.com');
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
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <Image className="w-6 h-6 text-blue-400" />
          <span>Muro de Publicaciones</span>
        </h3>
        
        {isOwnProfile && user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Publicación</span>
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">
            {isOwnProfile ? 'No has subido publicaciones aún' : 'No hay publicaciones'}
          </h3>
          <p className="text-blue-300">
            {isOwnProfile 
              ? 'Comparte tus mejores jugadas con la comunidad' 
              : 'Este jugador no ha compartido publicaciones aún'
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post) => {
            const isLikedByUser = user && post.likedBy.includes(user.id);
            
            return (
              <div key={post.id} className="bg-slate-700/40 rounded-xl overflow-hidden border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300">
                {/* Media Content */}
                <div className="relative">
                  {post.type === 'image' ? (
                    <div className="aspect-video bg-slate-900/50 overflow-hidden">
                      <img
                        src={post.url}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-900/50 relative overflow-hidden group cursor-pointer">
                      <img
                        src={getYouTubeThumbnail(post.url)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Youtube className="w-6 h-6 text-red-500" />
                      </div>
                    </div>
                  )}
                  
                  {/* Delete button for own posts or admins */}
                  {user && (isOwnProfile || user.role === 'admin') && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="absolute top-3 left-3 p-2 bg-red-600/80 hover:bg-red-600 rounded-full text-white transition-colors"
                      title="Eliminar publicación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {post.title && (
                    <h4 className="font-bold text-white mb-2">{post.title}</h4>
                  )}
                  
                  {post.description && (
                    <p className="text-blue-200 text-sm mb-3">{post.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        disabled={!user}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                          isLikedByUser
                            ? 'bg-red-500/30 text-red-200 border border-red-400/30'
                            : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200'
                        } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={!user ? 'Inicia sesión para dar like' : ''}
                      >
                        <Heart className={`w-4 h-4 ${isLikedByUser ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      
                      {post.type === 'video' && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Ver en YouTube</span>
                        </a>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-blue-400 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Nueva Publicación</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-3">Tipo de Contenido</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewPost({ ...newPost, type: 'image' })}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                      newPost.type === 'image'
                        ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                        : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                    }`}
                  >
                    <Image className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Imagen</div>
                      <div className="text-xs opacity-75">JPG, PNG, GIF</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setNewPost({ ...newPost, type: 'video' })}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                      newPost.type === 'video'
                        ? 'bg-red-600/20 border-red-500/30 text-red-300'
                        : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                    }`}
                  >
                    <Youtube className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Video</div>
                      <div className="text-xs opacity-75">YouTube</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  {newPost.type === 'image' ? 'URL de la Imagen' : 'URL del Video de YouTube'}
                </label>
                <input
                  type="url"
                  value={newPost.url}
                  onChange={(e) => setNewPost({ ...newPost, url: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder={
                    newPost.type === 'image' 
                      ? 'https://ejemplo.com/imagen.jpg' 
                      : 'https://www.youtube.com/watch?v=...'
                  }
                />
                {newPost.url && newPost.type === 'video' && !validateYouTubeUrl(newPost.url) && (
                  <p className="text-red-400 text-sm mt-1">URL de YouTube inválida</p>
                )}
                {newPost.url && newPost.type === 'image' && !validateImageUrl(newPost.url) && (
                  <p className="text-yellow-400 text-sm mt-1">Asegúrate de que sea una URL de imagen válida</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Título (Opcional)</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Título de tu publicación"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Descripción (Opcional)</label>
                <textarea
                  value={newPost.description}
                  onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Describe tu jugada o imagen..."
                />
              </div>

              {/* Preview */}
              {newPost.url && (
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Vista Previa</label>
                  <div className="w-full h-32 bg-slate-700/40 rounded-xl overflow-hidden">
                    {newPost.type === 'image' ? (
                      <img
                        src={newPost.url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative">
                        {validateYouTubeUrl(newPost.url) ? (
                          <>
                            <img
                              src={getYouTubeThumbnail(newPost.url)}
                              alt="YouTube Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Youtube className="w-8 h-8 text-red-400" />
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <Youtube className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            <span className="text-red-300 text-sm">URL de YouTube inválida</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.url || isCreating || (newPost.type === 'video' && !validateYouTubeUrl(newPost.url))}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Publicar</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-xl text-white font-medium transition-colors"
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

export default UserWall;