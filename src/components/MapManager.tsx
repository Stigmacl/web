import React, { useState, useEffect } from 'react';
import { Map, Plus, Edit, Trash2, Save, X, Upload, Image, Eye, EyeOff, MapPin, Users, Target, Mountain, Zap, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface MapData {
  id?: string;
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
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
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

const MapManager: React.FC = () => {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [newMap, setNewMap] = useState<MapData>({
    name: '',
    displayName: '',
    description: '',
    imageUrl: '',
    gameMode: '',
    maxPlayers: 16,
    difficulty: 'medium',
    environment: '',
    size: 'medium',
    isActive: true
  });

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/maps/get-all.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setMaps(data.maps);
      }
    } catch (error) {
      console.error('Error loading maps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMap = async () => {
    if (!newMap.name.trim() || !newMap.displayName.trim()) {
      alert('Nombre y nombre para mostrar son requeridos');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/maps/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newMap)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setNewMap({
          name: '',
          displayName: '',
          description: '',
          imageUrl: '',
          gameMode: '',
          maxPlayers: 16,
          difficulty: 'medium',
          environment: '',
          size: 'medium',
          isActive: true
        });
        await loadMaps();
      } else {
        alert(data.message || 'Error al crear el mapa');
      }
    } catch (error) {
      console.error('Error creating map:', error);
      alert('Error al crear el mapa');
    }
  };

  const handleUpdateMap = async () => {
    if (!selectedMap || !selectedMap.name.trim() || !selectedMap.displayName.trim()) {
      alert('Nombre y nombre para mostrar son requeridos');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/maps/update.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(selectedMap)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        setSelectedMap(null);
        await loadMaps();
      } else {
        alert(data.message || 'Error al actualizar el mapa');
      }
    } catch (error) {
      console.error('Error updating map:', error);
      alert('Error al actualizar el mapa');
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este mapa?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/maps/delete.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id: mapId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadMaps();
      } else {
        alert(data.message || 'Error al eliminar el mapa');
      }
    } catch (error) {
      console.error('Error deleting map:', error);
      alert('Error al eliminar el mapa');
    }
  };

  const handleImageUpload = async (file: File, isEdit: boolean = false) => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/maps/upload-image.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const fullImageUrl = `${API_BASE_URL}${data.imageUrl}`;
        
        if (isEdit && selectedMap) {
          setSelectedMap({ ...selectedMap, imageUrl: fullImageUrl });
        } else {
          setNewMap({ ...newMap, imageUrl: fullImageUrl });
        }
      } else {
        alert(data.message || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'hard': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'expert': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'medium': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'large': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'extra_large': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
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

  const renderMapForm = (mapData: MapData, setMapData: (data: MapData) => void, isEdit: boolean = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">Nombre del Mapa *</label>
          <input
            type="text"
            value={mapData.name}
            onChange={(e) => setMapData({ ...mapData, name: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="de_dust2"
          />
        </div>

        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">Nombre para Mostrar *</label>
          <input
            type="text"
            value={mapData.displayName}
            onChange={(e) => setMapData({ ...mapData, displayName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Dust 2"
          />
        </div>
      </div>

      <div>
        <label className="block text-blue-300 text-sm font-medium mb-2">Descripción</label>
        <textarea
          value={mapData.description}
          onChange={(e) => setMapData({ ...mapData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          placeholder="Descripción del mapa..."
        />
      </div>

      <div>
        <label className="block text-blue-300 text-sm font-medium mb-2">Imagen del Mapa</label>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, isEdit);
              }}
              className="hidden"
              id={`image-upload-${isEdit ? 'edit' : 'create'}`}
            />
            <label
              htmlFor={`image-upload-${isEdit ? 'edit' : 'create'}`}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 transition-colors cursor-pointer ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Subiendo...' : 'Subir Imagen'}</span>
            </label>
            
            <span className="text-blue-400 text-sm">o</span>
            
            <input
              type="url"
              value={mapData.imageUrl || ''}
              onChange={(e) => setMapData({ ...mapData, imageUrl: e.target.value })}
              className="flex-1 px-4 py-2 bg-slate-700/40 border border-blue-600/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>
          
          {mapData.imageUrl && (
            <div className="relative">
              <img
                src={mapData.imageUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-blue-500/30"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">Modo de Juego</label>
          <input
            type="text"
            value={mapData.gameMode || ''}
            onChange={(e) => setMapData({ ...mapData, gameMode: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Bomb Defusal, Hostage Rescue, etc."
          />
        </div>

        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">Máximo Jugadores</label>
          <input
            type="number"
            value={mapData.maxPlayers || ''}
            onChange={(e) => setMapData({ ...mapData, maxPlayers: parseInt(e.target.value) || undefined })}
            min="2"
            max="64"
            className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="16"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">Dificultad</label>
          <select
            value={mapData.difficulty}
            onChange={(e) => setMapData({ ...mapData, difficulty: e.target.value as any })}
            className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Medio</option>
            <option value="hard">Difícil</option>
            <option value="expert">Experto</option>
          </select>
        </div>

        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">Tamaño</label>
          <select
            value={mapData.size}
            onChange={(e) => setMapData({ ...mapData, size: e.target.value as any })}
            className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
            <option value="extra_large">Extra Grande</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-blue-300 text-sm font-medium mb-2">Entorno</label>
        <input
          type="text"
          value={mapData.environment || ''}
          onChange={(e) => setMapData({ ...mapData, environment: e.target.value })}
          className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Desierto, Urbano, Industrial, etc."
        />
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id={`isActive-${isEdit ? 'edit' : 'create'}`}
          checked={mapData.isActive}
          onChange={(e) => setMapData({ ...mapData, isActive: e.target.checked })}
          className="rounded border-blue-600/30"
        />
        <label htmlFor={`isActive-${isEdit ? 'edit' : 'create'}`} className="text-blue-300">
          Mapa activo (disponible para torneos)
        </label>
      </div>
    </div>
  );

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
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-600/20 rounded-xl">
            <Map className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Gestión de Mapas</h3>
            <p className="text-orange-300">Administra los mapas disponibles para torneos</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Mapa</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/40 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Map className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{maps.length}</p>
              <p className="text-blue-300 text-sm">Total Mapas</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-700/40 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{maps.filter(m => m.isActive).length}</p>
              <p className="text-green-300 text-sm">Activos</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-700/40 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <EyeOff className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-2xl font-bold text-white">{maps.filter(m => !m.isActive).length}</p>
              <p className="text-gray-300 text-sm">Inactivos</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-700/40 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Image className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">{maps.filter(m => m.imageUrl).length}</p>
              <p className="text-purple-300 text-sm">Con Imagen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de mapas */}
      {maps.length === 0 ? (
        <div className="text-center py-12">
          <Map className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No hay mapas creados</h3>
          <p className="text-blue-300">Crea el primer mapa para comenzar</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map) => (
            <div
              key={map.id}
              className={`bg-slate-700/40 rounded-xl border transition-all duration-300 hover:transform hover:scale-105 ${
                map.isActive ? 'border-blue-600/30' : 'border-gray-600/30 opacity-75'
              }`}
            >
              {/* Imagen del mapa */}
              <div className="relative h-48 rounded-t-xl overflow-hidden">
                {map.imageUrl ? (
                  <img
                    src={map.imageUrl}
                    alt={map.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full bg-slate-600/40 flex items-center justify-center">
                            <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-600/40 flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {!map.isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-3 py-1">
                      <span className="text-red-300 text-sm font-medium">Inactivo</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white text-lg">{map.displayName}</h4>
                    <p className="text-blue-300 text-sm font-mono">{map.name}</p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedMap(map);
                        setShowEditModal(true);
                      }}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                      title="Editar mapa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteMap(map.id!)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                      title="Eliminar mapa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {map.description && (
                  <p className="text-blue-200 text-sm mb-3 line-clamp-2">{map.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-400">Dificultad:</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(map.difficulty)}`}>
                      {map.difficulty === 'easy' ? 'Fácil' :
                       map.difficulty === 'medium' ? 'Medio' :
                       map.difficulty === 'hard' ? 'Difícil' : 'Experto'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-400">Tamaño:</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSizeColor(map.size)}`}>
                      {map.size === 'small' ? 'Pequeño' :
                       map.size === 'medium' ? 'Mediano' :
                       map.size === 'large' ? 'Grande' : 'Extra Grande'}
                    </div>
                  </div>
                  
                  {map.maxPlayers && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400">Jugadores:</span>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-green-400" />
                        <span className="text-white font-medium">{map.maxPlayers}</span>
                      </div>
                    </div>
                  )}
                  
                  {map.gameMode && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400">Modo:</span>
                      <span className="text-white font-medium">{map.gameMode}</span>
                    </div>
                  )}
                  
                  {map.environment && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400">Entorno:</span>
                      <span className="text-white font-medium">{map.environment}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-blue-700/30 mt-3">
                  <div className="flex items-center justify-between text-xs text-blue-400">
                    <span>Por: {map.createdBy}</span>
                    <span>{formatDate(map.createdAt!)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de crear mapa */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Crear Nuevo Mapa</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderMapForm(newMap, setNewMap)}

            <div className="flex space-x-3 pt-6">
              <button
                onClick={handleCreateMap}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Crear Mapa</span>
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
      )}

      {/* Modal de editar mapa */}
      {showEditModal && selectedMap && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Mapa</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderMapForm(selectedMap, setSelectedMap, true)}

            <div className="flex space-x-3 pt-6">
              <button
                onClick={handleUpdateMap}
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
      )}
    </div>
  );
};

export default MapManager;