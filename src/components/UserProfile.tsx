import React, { useState, useEffect } from 'react';
import { User, Shield, Star, Trophy, Clock, MapPin, Calendar, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserWall from './UserWall';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onBack }) => {
  const { users, user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const foundUser = users.find(u => u.id === userId);
    setProfileUser(foundUser);
    setIsLoading(false);
  }, [userId, users]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastLogin = (lastLogin: string | undefined) => {
    if (!lastLogin) return 'Nunca';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return date.toLocaleDateString('es-CL');
  };

  const getStatusColor = (isOnline: boolean, isActive: boolean) => {
    if (!isActive) return 'bg-red-500 shadow-lg shadow-red-500/30';
    if (isOnline) return 'bg-green-500 shadow-lg shadow-green-500/30';
    return 'bg-gray-500';
  };

  const getStatusText = (isOnline: boolean, isActive: boolean) => {
    if (!isActive) return 'Suspendido';
    if (isOnline) return 'En línea';
    return 'Desconectado';
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

  const stats = [
    { label: 'Partidas Jugadas', value: '0', icon: Trophy, color: 'text-blue-400' },
    { label: 'Horas Jugadas', value: '0h', icon: Clock, color: 'text-green-400' },
    { label: 'Mejor Racha', value: '0', icon: Star, color: 'text-yellow-400' },
    { label: 'K/D Ratio', value: '0.00', icon: Shield, color: 'text-red-400' }
  ];

  const achievements = [
    { name: 'Primera Conexión', description: 'Se ha registrado en la comunidad', unlocked: true },
    { name: 'Primera Victoria', description: 'Ganar la primera partida', unlocked: false },
    { name: 'Francotirador', description: 'Conseguir 50 eliminaciones con sniper', unlocked: false },
    { name: 'Veterano', description: 'Jugar 100 partidas', unlocked: false },
    { name: 'Leyenda', description: 'Alcanzar el top 10 del ranking', unlocked: false }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
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
          <User className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-2">Usuario no encontrado</h2>
          <p className="text-blue-300">El perfil que buscas no existe o no está disponible</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 mb-6 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Jugadores</span>
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <img
                  src={profileUser.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                  alt={profileUser.username}
                  className={`w-24 h-24 rounded-full border-4 mx-auto ${
                    profileUser.isActive ? 'border-blue-500/30' : 'border-red-500/30'
                  }`}
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getStatusColor(profileUser.isOnline, profileUser.isActive)} border-2 border-slate-800`}></div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mt-4">{profileUser.username}</h2>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <p className="text-blue-300">
                  {profileUser.hideEmail ? '••••••@••••••.com' : profileUser.email}
                </p>
                {profileUser.hideEmail && (
                  <EyeOff className="w-4 h-4 text-blue-400" title="Email oculto" />
                )}
              </div>
              
              {profileUser.clan && (
                <div className="mt-2">
                  <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm font-medium">
                    [{profileUser.clan}]
                  </span>
                </div>
              )}
              
              <div className="mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center justify-center space-x-1 ${getRoleBadgeColor(profileUser.role)}`}>
                  {getRoleIcon(profileUser.role)}
                  <span>{profileUser.role === 'admin' ? 'Administrador' : 'Jugador'}</span>
                </span>
              </div>

              <div className="mt-4 p-3 bg-slate-700/40 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <span className={`font-medium ${
                    !profileUser.isActive ? 'text-red-300' :
                    profileUser.isOnline ? 'text-green-300' : 'text-gray-300'
                  }`}>
                    {getStatusText(profileUser.isOnline, profileUser.isActive)}
                  </span>
                </div>
              </div>

              {profileUser.status && (
                <div className="mt-4 p-3 bg-slate-700/40 rounded-lg">
                  <p className="text-blue-200 italic text-sm">"{profileUser.status}"</p>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-400">Último acceso:</span>
                <span className="text-white">{formatLastLogin(profileUser.lastLogin)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-400">Miembro desde:</span>
                <span className="text-white">{formatDate(profileUser.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-400">Ubicación:</span>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span className="text-white">Chile</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* User Wall */}
          <UserWall userId={userId} isOwnProfile={isOwnProfile} />

          {/* Statistics */}
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Estadísticas de Juego</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-slate-700/40 rounded-xl p-4">
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
          </div>

          {/* Achievements */}
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Logros</h3>
            
            <div className="grid gap-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-4 p-4 rounded-xl border ${
                    achievement.unlocked
                      ? 'bg-green-600/10 border-green-500/30'
                      : 'bg-slate-700/40 border-slate-600/30'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    achievement.unlocked ? 'bg-green-600/20' : 'bg-slate-600/40'
                  }`}>
                    <Trophy className={`w-6 h-6 ${
                      achievement.unlocked ? 'text-green-400' : 'text-slate-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-bold ${
                      achievement.unlocked ? 'text-green-300' : 'text-slate-400'
                    }`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-sm ${
                      achievement.unlocked ? 'text-green-400' : 'text-slate-500'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                  
                  {achievement.unlocked && (
                    <div className="text-green-400 font-bold text-sm">
                      ✓ Desbloqueado
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;