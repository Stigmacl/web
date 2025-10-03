import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  avatar: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedAt?: string;
  deletionReason?: string;
}

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

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image: string;
  author: string;
  date: string;
  isPinned: boolean;
  views: number;
  comments: Comment[];
  likes: number;
  likedBy: string[];
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'player';
  avatar?: string;
  status?: string;
  isOnline: boolean;
  clan?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  hideEmail?: boolean;
}

interface Clan {
  id: string;
  name: string;
  tag: string;
  icon: string;
  description: string;
  members: number;
  createdAt: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  type: string;
  teamSize: number;
  maxParticipants: number;
  participantCount: number;
  status: string;
  startDate: string;
  endDate: string;
  prizePool?: string;
  rules?: string;
  maps: string[];
  bracketType: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionInfo {
  isActive: boolean;
  expiresAt: number;
  lastExtended: number;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  sessionInfo: SessionInfo;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  extendSession: () => Promise<boolean>;
  users: User[];
  updateUser: (userId: string, updates: Partial<User>) => Promise<boolean>;
  changeUserPassword: (userId: string, newPassword: string) => boolean;
  toggleUserStatus: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  news: NewsItem[];
  createNews: (newsData: Omit<NewsItem, 'id' | 'views' | 'comments' | 'likes' | 'likedBy'>) => Promise<boolean>;
  updateNews: (newsId: string, updates: Partial<NewsItem>) => Promise<boolean>;
  deleteNews: (newsId: string) => Promise<boolean>;
  likeNews: (newsId: string) => void;
  addComment: (newsId: string, content: string) => Promise<void>;
  incrementNewsViews: (newsId: string) => void;
  deleteComment: (newsId: string, commentId: string, reason?: string) => Promise<boolean>;
  restoreComment: (newsId: string, commentId: string) => Promise<boolean>;
  getDeletedComments: () => Promise<DeletedComment[]>;
  clans: Clan[];
  createClan: (clanData: Omit<Clan, 'id' | 'members' | 'createdAt'>) => Promise<boolean>;
  updateClan: (clanId: string, updates: Partial<Clan>) => Promise<boolean>;
  deleteClan: (clanId: string) => Promise<boolean>;
  tournaments: Tournament[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
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

// Constantes de sesión - Aumentadas para evitar cierres automáticos
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
const AUTO_EXTEND_INTERVAL = 5 * 60 * 1000; // Auto-extender cada 5 minutos
const SESSION_WARNING_TIME = 10 * 60 * 1000; // Advertir 10 minutos antes de expirar
const HEARTBEAT_INTERVAL = 3 * 60 * 1000; // Heartbeat cada 3 minutos
const USERS_REFRESH_INTERVAL = 30 * 1000; // Actualizar lista de usuarios cada 30 segundos

// Función helper para manejar respuestas de la API
const handleApiResponse = async (response: Response, endpoint: string) => {
  console.log(`Response status for ${endpoint}:`, response.status, response.statusText);
  
  // Obtener el texto de la respuesta primero
  const responseText = await response.text();
  console.log(`Raw response for ${endpoint}:`, responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
  
  // Verificar si la respuesta está vacía
  if (!responseText.trim()) {
    throw new Error(`El servidor devolvió una respuesta vacía para ${endpoint}`);
  }
  
  // Verificar si la respuesta contiene HTML (errores de PHP)
  if (responseText.trim().startsWith('<') || responseText.includes('<br />') || responseText.includes('<b>')) {
    console.error(`PHP Error detected in ${endpoint}:`, responseText);
    throw new Error(`Error del servidor PHP en ${endpoint}. Revisa los logs del servidor para más detalles.`);
  }
  
  // Intentar parsear como JSON
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error(`JSON Parse Error for ${endpoint}:`, parseError);
    console.error(`Response text:`, responseText);
    throw new Error(`Respuesta inválida del servidor para ${endpoint}: ${parseError.message}`);
  }
  
  // Verificar el código de estado HTTP
  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `Error HTTP: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  return data;
};

// Función helper para hacer peticiones a la API
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);
  if (options.body) {
    console.log(`📤 Request body:`, options.body);
  }
  
  try {
    const response = await fetch(url, defaultOptions);
    const data = await handleApiResponse(response, endpoint);
    console.log(`✅ API Response for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Error for ${endpoint}:`, error);
    throw error;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isActive: false,
    expiresAt: 0,
    lastExtended: 0
  });

  // Referencias para los timers
  const autoExtendTimer = React.useRef<NodeJS.Timeout | null>(null);
  const sessionCheckTimer = React.useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = React.useRef<NodeJS.Timeout | null>(null);
  const usersRefreshTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Verificar sesión al cargar la página
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Auto-extender sesión y verificar estado
  useEffect(() => {
    if (user && sessionInfo.isActive) {
      startSessionTimers();
      startHeartbeat();
      startUsersRefresh();
    } else {
      clearAllTimers();
    }

    return () => clearAllTimers();
  }, [user, sessionInfo.isActive]);

  // Cargar datos públicos al inicio (sin necesidad de autenticación)
  useEffect(() => {
    loadPublicData();
  }, []);

  // Detectar cuando el usuario cierra la pestaña/navegador
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        // Usar sendBeacon para enviar la petición de manera confiable
        const data = new FormData();
        data.append('action', 'offline');
        
        navigator.sendBeacon(`${API_BASE_URL}/auth/logout.php`, data);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && user) {
        // La pestaña se ocultó, marcar como offline después de un tiempo
        setTimeout(() => {
          if (document.hidden && user) {
            setUserOffline();
          }
        }, 5 * 60 * 1000); // 5 minutos de inactividad
      } else if (!document.hidden && user) {
        // La pestaña volvió a estar visible, asegurar que esté online
        updateOnlineStatus();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const checkExistingSession = async () => {
    try {
      const data = await apiRequest('/auth/check-session.php');
      
      if (data.success && data.user) {
        setUser(data.user);
        updateSessionInfo(data.sessionTime);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublicData = async () => {
    try {
      await Promise.all([
        loadUsers(),
        loadNews(),
        loadClans(),
        loadTournaments()
      ]);
    } catch (error) {
      console.error('Error loading public data:', error);
    }
  };

  const updateSessionInfo = (sessionTime?: number) => {
    const now = sessionTime ? sessionTime * 1000 : Date.now();
    setSessionInfo({
      isActive: true,
      expiresAt: now + SESSION_DURATION,
      lastExtended: now
    });
  };

  const startSessionTimers = () => {
    clearSessionTimers();

    // Auto-extender cada 15 minutos
    autoExtendTimer.current = setInterval(async () => {
      if (user) {
        await extendSession();
      }
    }, AUTO_EXTEND_INTERVAL);

    // Verificar estado de sesión cada minuto
    sessionCheckTimer.current = setInterval(() => {
      if (sessionInfo.isActive) {
        const timeLeft = sessionInfo.expiresAt - Date.now();
        
        // Si quedan menos de 5 minutos, mostrar advertencia
        if (timeLeft <= SESSION_WARNING_TIME && timeLeft > 0) {
          const minutesLeft = Math.ceil(timeLeft / 60000);
          console.warn(`⚠️ Tu sesión expirará en ${minutesLeft} minuto(s)`);
        }
        
        // Si la sesión expiró, cerrar sesión
        if (timeLeft <= 0) {
          console.warn('🔒 Sesión expirada');
          logout();
        }
      }
    }, 60000); // Cada minuto
  };

  const startHeartbeat = () => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
    }

    heartbeatTimer.current = setInterval(async () => {
      if (user && !document.hidden) {
        await updateOnlineStatus();
      }
    }, HEARTBEAT_INTERVAL);
  };

  const startUsersRefresh = () => {
    if (usersRefreshTimer.current) {
      clearInterval(usersRefreshTimer.current);
    }

    usersRefreshTimer.current = setInterval(async () => {
      await loadUsers();
    }, USERS_REFRESH_INTERVAL);
  };

  const clearSessionTimers = () => {
    if (autoExtendTimer.current) {
      clearInterval(autoExtendTimer.current);
      autoExtendTimer.current = null;
    }
    if (sessionCheckTimer.current) {
      clearInterval(sessionCheckTimer.current);
      sessionCheckTimer.current = null;
    }
  };

  const clearAllTimers = () => {
    clearSessionTimers();
    
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
    
    if (usersRefreshTimer.current) {
      clearInterval(usersRefreshTimer.current);
      usersRefreshTimer.current = null;
    }
  };

  const updateOnlineStatus = async () => {
    try {
      const data = await apiRequest('/auth/extend-session.php', {
        method: 'POST'
      });

      if (data.success) {
        updateSessionInfo(data.sessionTime);
        // Actualizar lista de usuarios para reflejar el estado online
        await loadUsers();
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const setUserOffline = async () => {
    try {
      await apiRequest('/auth/logout.php', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  };

  const extendSession = async (): Promise<boolean> => {
    try {
      const data = await apiRequest('/auth/extend-session.php', {
        method: 'POST'
      });

      if (data.success) {
        updateSessionInfo(data.sessionTime);
        console.log('✅ Sesión extendida automáticamente');
        return true;
      } else {
        console.warn('❌ No se pudo extender la sesión:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiRequest('/users/get-all.php');
      
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadNews = async () => {
    try {
      const data = await apiRequest('/news/get-all.php');
      
      if (data.success) {
        setNews(data.news);
      }
    } catch (error) {
      console.error('Error loading news:', error);
    }
  };

  const loadClans = async () => {
    try {
      const data = await apiRequest('/clans/get-all.php');

      if (data.success) {
        setClans(data.clans);
      }
    } catch (error) {
      console.error('Error loading clans:', error);
    }
  };

  const loadTournaments = async () => {
    try {
      const data = await apiRequest('/tournaments/get-all.php');

      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await apiRequest('/auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (data.success) {
        setUser(data.user);
        updateSessionInfo();
        await loadUsers(); // Actualizar lista de usuarios para mostrar el nuevo estado online
        console.log('✅ Sesión iniciada correctamente');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiRequest('/auth/register.php', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });

      if (data.success) {
        setUser(data.user);
        updateSessionInfo();
        await loadPublicData(); // Recargar datos públicos para incluir el nuevo usuario
        console.log('✅ Usuario registrado y sesión iniciada');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout.php', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSessionInfo({
        isActive: false,
        expiresAt: 0,
        lastExtended: 0
      });
      clearAllTimers();
      // Actualizar lista de usuarios para reflejar el cambio de estado
      await loadUsers();
      console.log('🔒 Sesión cerrada');
    }
  };

  const createNews = async (newsData: Omit<NewsItem, 'id' | 'views' | 'comments' | 'likes' | 'likedBy'>): Promise<boolean> => {
    try {
      const data = await apiRequest('/news/create.php', {
        method: 'POST',
        body: JSON.stringify(newsData)
      });

      if (data.success) {
        await loadNews();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Create news error:', error);
      return false;
    }
  };

  const updateNews = async (newsId: string, updates: Partial<NewsItem>): Promise<boolean> => {
    try {
      const data = await apiRequest('/news/update.php', {
        method: 'POST',
        body: JSON.stringify({ id: newsId, ...updates })
      });

      if (data.success) {
        await loadNews();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update news error:', error);
      return false;
    }
  };

  const deleteNews = async (newsId: string): Promise<boolean> => {
    try {
      const data = await apiRequest('/news/delete.php', {
        method: 'POST',
        body: JSON.stringify({ id: newsId })
      });

      if (data.success) {
        await loadNews();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete news error:', error);
      return false;
    }
  };

  const likeNews = async (newsId: string) => {
    try {
      const data = await apiRequest('/news/like.php', {
        method: 'POST',
        body: JSON.stringify({ newsId })
      });

      if (data.success) {
        await loadNews();
      }
    } catch (error) {
      console.error('Like news error:', error);
    }
  };

  const addComment = async (newsId: string, content: string): Promise<void> => {
    try {
      const data = await apiRequest('/news/comment.php', {
        method: 'POST',
        body: JSON.stringify({ newsId, content })
      });

      if (data.success) {
        // Recargar las noticias para mostrar el nuevo comentario
        await loadNews();
      } else {
        throw new Error(data.message || 'Error al agregar comentario');
      }
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
      const data = await apiRequest('/users/update.php', {
        method: 'POST',
        body: JSON.stringify({ id: userId, ...updates })
      });

      if (data.success) {
        await loadUsers();
        if (userId === user?.id) {
          setUser(prev => prev ? { ...prev, ...updates } : null);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  };

  const toggleUserStatus = async (userId: string): Promise<boolean> => {
    try {
      const data = await apiRequest('/users/toggle-status.php', {
        method: 'POST',
        body: JSON.stringify({ id: userId })
      });

      if (data.success) {
        await loadUsers();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Toggle user status error:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const data = await apiRequest('/users/delete.php', {
        method: 'POST',
        body: JSON.stringify({ id: userId })
      });

      if (data.success) {
        await loadUsers();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete user error:', error);
      return false;
    }
  };

  const createClan = async (clanData: Omit<Clan, 'id' | 'members' | 'createdAt'>): Promise<boolean> => {
    try {
      console.log('🏰 Enviando datos del clan al backend:', clanData);
      
      const data = await apiRequest('/clans/create.php', {
        method: 'POST',
        body: JSON.stringify(clanData)
      });

      console.log('🏰 Respuesta del backend:', data);

      if (data.success) {
        await loadClans();
        return true;
      } else {
        console.error('❌ Error del backend:', data.error || data.message);
        return false;
      }
    } catch (error) {
      console.error('Create clan error:', error);
      return false;
    }
  };

  const updateClan = async (clanId: string, updates: Partial<Clan>): Promise<boolean> => {
    try {
      const data = await apiRequest('/clans/update.php', {
        method: 'POST',
        body: JSON.stringify({ id: clanId, ...updates })
      });

      if (data.success) {
        await Promise.all([loadClans(), loadUsers()]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update clan error:', error);
      return false;
    }
  };

  const deleteClan = async (clanId: string): Promise<boolean> => {
    try {
      const data = await apiRequest('/clans/delete.php', {
        method: 'POST',
        body: JSON.stringify({ id: clanId })
      });

      if (data.success) {
        await Promise.all([loadClans(), loadUsers()]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete clan error:', error);
      return false;
    }
  };

  const deleteComment = async (newsId: string, commentId: string, reason?: string): Promise<boolean> => {
    try {
      console.log('🗑️ Eliminando comentario:', { newsId, commentId, reason });
      
      const data = await apiRequest('/news/delete-comment.php', {
        method: 'POST',
        body: JSON.stringify({ commentId, reason })
      });

      console.log('🗑️ Respuesta del backend:', data);

      if (data.success) {
        await loadNews();
        return true;
      } else {
        console.error('❌ Error del backend:', data.error || data.message);
        return false;
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      return false;
    }
  };

  const restoreComment = async (newsId: string, commentId: string): Promise<boolean> => {
    try {
      const data = await apiRequest('/news/restore-comment.php', {
        method: 'POST',
        body: JSON.stringify({ commentId })
      });

      if (data.success) {
        await loadNews();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Restore comment error:', error);
      return false;
    }
  };

  const getDeletedComments = async (): Promise<DeletedComment[]> => {
    try {
      const data = await apiRequest('/news/get-deleted-comments.php');

      if (data.success) {
        return data.deletedComments;
      }
      return [];
    } catch (error) {
      console.error('Get deleted comments error:', error);
      return [];
    }
  };

  // Funciones temporales para compatibilidad
  const changeUserPassword = (userId: string, newPassword: string): boolean => {
    console.log('Change password:', userId);
    return true;
  };

  const incrementNewsViews = (newsId: string) => {
    console.log('Increment views:', newsId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-blue-200">Cargando contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      sessionInfo,
      login,
      logout,
      register,
      extendSession,
      users,
      updateUser,
      changeUserPassword,
      toggleUserStatus,
      deleteUser,
      news,
      createNews,
      updateNews,
      deleteNews,
      likeNews,
      addComment,
      incrementNewsViews,
      deleteComment,
      restoreComment,
      getDeletedComments,
      clans,
      createClan,
      updateClan,
      deleteClan,
      tournaments
    }}>
      {children}
    </AuthContext.Provider>
  );
};