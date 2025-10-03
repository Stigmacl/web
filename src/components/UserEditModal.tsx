import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Shield, Star, Crown, Target, Zap, Eye, EyeOff, Key, Users, Image, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserEditModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
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

const UserEditModal: React.FC<UserEditModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const { clans, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'security' | 'clan'>('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'player' as 'admin' | 'player',
    avatar: '',
    status: '',
    hideEmail: false,
    isActive: true
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [clanData, setClanData] = useState({
    clanTag: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'player',
        avatar: user.avatar || '',
        status: user.status || '',
        hideEmail: user.hideEmail || false,
        isActive: user.isActive !== false
      });
      setClanData({
        clanTag: user.clan || ''
      });
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      setSuccessMessage('');
      setActiveTab('basic');
    }
  }, [user, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleClanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClanData({
      clanTag: e.target.value
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    return newErrors;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (passwordData.newPassword) {
      if (passwordData.newPassword.length < 6) {
        newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    return newErrors;
  };

  const handleSaveBasic = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const success = await updateUser(user.id, formData);
      
      if (success) {
        setSuccessMessage('Información básica actualizada exitosamente');
        setTimeout(() => {
          onSave();
          onClose();
        }, 1500);
      } else {
        setErrors({ general: 'Error al actualizar la información. Verifica que el username y email no estén en uso.' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors({ general: 'Error interno del servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const passwordErrors = validatePassword();
    if (Object.keys(passwordErrors).length > 0) {
      setErrors(passwordErrors);
      return;
    }

    if (!passwordData.newPassword) {
      setErrors({ newPassword: 'Ingresa una nueva contraseña' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/users/change-password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Contraseña actualizada exitosamente');
        setPasswordData({ newPassword: '', confirmPassword: '' });
      } else {
        setErrors({ general: data.message || 'Error al cambiar la contraseña' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({ general: 'Error interno del servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignClan = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/users/assign-clan.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          clanTag: clanData.clanTag
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message);
        // Actualizar también en el contexto
        await updateUser(user.id, { clan: clanData.clanTag || null });
        setTimeout(() => {
          onSave();
        }, 1000);
      } else {
        setErrors({ general: data.message || 'Error al asignar clan' });
      }
    } catch (error) {
      console.error('Error assigning clan:', error);
      setErrors({ general: 'Error interno del servidor' });
    } finally {
      setIsLoading(false);
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

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic' as const, label: 'Perfil', icon: User },
    { id: 'security' as const, label: 'Contraseña', icon: Key },
    { id: 'clan' as const, label: 'Clan', icon: Users }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <User className="w-6 h-6 text-blue-400" />
            <span>Editar Usuario: {user?.username}</span>
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes de estado */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-600/10 border border-green-500/30 rounded-xl flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-300">{successMessage}</span>
          </div>
        )}

        {errors.general && (
          <div className="mb-6 p-4 bg-red-600/10 border border-red-500/30 rounded-xl flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{errors.general}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 bg-slate-700/40 rounded-xl p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={isLoading}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-300 hover:bg-blue-600/20 hover:text-blue-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido de tabs */}
        <div className="space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-white mb-4">Información Personal</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-slate-700/40 border rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 ${
                      errors.username ? 'border-red-500/50' : 'border-blue-600/30'
                    }`}
                    placeholder="Nombre de usuario"
                  />
                  {errors.username && (
                    <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-slate-700/40 border rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 ${
                      errors.email ? 'border-red-500/50' : 'border-blue-600/30'
                    }`}
                    placeholder="email@ejemplo.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Rol del Usuario
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={isLoading || user?.id === '1'} // No permitir cambiar rol del admin principal
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  >
                    <option value="player">Jugador</option>
                    <option value="admin">Administrador</option>
                  </select>
                  {user?.id === '1' && (
                    <p className="text-yellow-400 text-sm mt-1">No se puede cambiar el rol del administrador principal</p>
                  )}
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Estado de la Cuenta
                  </label>
                  <select
                    name="isActive"
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    disabled={isLoading || user?.id === '1'} // No permitir suspender al admin principal
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Suspendido</option>
                  </select>
                  {user?.id === '1' && (
                    <p className="text-yellow-400 text-sm mt-1">No se puede suspender al administrador principal</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  URL del Avatar
                </label>
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  placeholder="https://ejemplo.com/avatar.jpg"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Estado Personalizado
                </label>
                <textarea
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none disabled:opacity-50"
                  placeholder="Estado personalizado del usuario..."
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-slate-700/40 rounded-xl">
                <input
                  type="checkbox"
                  id="hideEmail"
                  name="hideEmail"
                  checked={formData.hideEmail}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="rounded border-blue-600/30 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50"
                />
                <div className="flex-1">
                  <label htmlFor="hideEmail" className="text-blue-300 font-medium cursor-pointer">
                    Ocultar email del usuario
                  </label>
                  <p className="text-blue-400 text-sm mt-1">
                    Otros jugadores no podrán ver la dirección de correo electrónico
                  </p>
                </div>
                <Eye className="w-5 h-5 text-blue-400" />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveBasic}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-white mb-4">Cambiar Contraseña</h4>
              
              <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h5 className="text-yellow-300 font-medium">Cambio de Contraseña</h5>
                    <p className="text-yellow-400 text-sm mt-1">
                      Esta acción cambiará la contraseña del usuario. El usuario deberá usar la nueva contraseña para iniciar sesión.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-3 bg-slate-700/40 border rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors pr-12 disabled:opacity-50 ${
                        errors.newPassword ? 'border-red-500/50' : 'border-blue-600/30'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      disabled={isLoading}
                      className={`w-full px-4 py-3 bg-slate-700/40 border rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors pr-12 disabled:opacity-50 ${
                        errors.confirmPassword ? 'border-red-500/50' : 'border-blue-600/30'
                      }`}
                      placeholder="Repite la nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 disabled:opacity-50"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading || !passwordData.newPassword}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Cambiando...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Cambiar Contraseña</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'clan' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-white mb-4">Gestión de Clan</h4>
              
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <h5 className="text-blue-300 font-medium">Asignación de Clan</h5>
                    <p className="text-blue-400 text-sm mt-1">
                      Puedes asignar o remover al usuario de un clan. El usuario aparecerá como miembro del clan seleccionado.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Clan Actual
                </label>
                {user?.clan ? (
                  <div className="flex items-center space-x-3 p-4 bg-slate-700/40 rounded-xl">
                    {(() => {
                      const clan = clans.find(c => c.tag === user.clan);
                      if (clan) {
                        const IconComponent = getClanIcon(clan.icon).icon;
                        const iconColor = getClanIcon(clan.icon).color;
                        return (
                          <>
                            <IconComponent className={`w-6 h-6 ${iconColor}`} />
                            <div>
                              <span className="text-white font-medium">{clan.name}</span>
                              <span className="text-blue-300 ml-2 font-mono">[{clan.tag}]</span>
                            </div>
                          </>
                        );
                      }
                      return (
                        <>
                          <Shield className="w-6 h-6 text-gray-400" />
                          <span className="text-gray-300 font-mono">[{user.clan}] (Clan no encontrado)</span>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-4 bg-slate-700/40 rounded-xl">
                    <Users className="w-6 h-6 text-gray-400" />
                    <span className="text-gray-300">Sin clan asignado</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Asignar Nuevo Clan
                </label>
                <select
                  value={clanData.clanTag}
                  onChange={handleClanChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Sin clan</option>
                  {clans.map((clan) => {
                    const IconComponent = getClanIcon(clan.icon).icon;
                    return (
                      <option key={clan.id} value={clan.tag}>
                        [{clan.tag}] {clan.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {clans.length > 0 && (
                <div>
                  <h5 className="text-blue-300 font-medium mb-3">Clanes Disponibles</h5>
                  <div className="grid md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {clans.map((clan) => {
                      const IconComponent = getClanIcon(clan.icon).icon;
                      const iconColor = getClanIcon(clan.icon).color;
                      
                      return (
                        <div
                          key={clan.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            clanData.clanTag === clan.tag
                              ? 'bg-blue-600/20 border-blue-500/50'
                              : 'bg-slate-700/40 border-slate-600/30 hover:bg-slate-700/60'
                          }`}
                          onClick={() => setClanData({ clanTag: clan.tag })}
                        >
                          <IconComponent className={`w-5 h-5 ${iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium truncate">{clan.name}</span>
                              <span className="text-blue-300 font-mono text-sm">[{clan.tag}]</span>
                            </div>
                            <p className="text-blue-400 text-xs">{clan.members} miembros</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignClan}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Asignando...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>{clanData.clanTag ? 'Asignar Clan' : 'Remover de Clan'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;