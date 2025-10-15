import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload, Youtube, Image as ImageIcon, ExternalLink, Clock, Play, Move, RotateCw, ZoomIn, ZoomOut, Maximize2, Database, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBanner } from '../contexts/BannerContext';

interface BannerItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  link?: string;
  title?: string;
  description?: string;
  autoplay?: boolean;
  muted?: boolean;
  duration?: number;
  // Nuevas propiedades para ajuste de imagen
  imageSettings?: {
    objectFit: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
    objectPosition: string;
    scale: number;
    brightness: number;
    contrast: number;
    blur: number;
  };
}

interface BannerManagerProps {
  bannerItems: BannerItem[];
  onUpdateBanner: (items: BannerItem[]) => Promise<boolean>;
}

const BannerManager: React.FC<BannerManagerProps> = ({ bannerItems, onUpdateBanner }) => {
  const { user } = useAuth();
  const { refreshBannerConfig, isLoading, isEnabled, setIsEnabled } = useBanner();
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<BannerItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Verificar permisos de administrador
  if (!user || user.role !== 'admin') {
    return null;
  }

  const defaultImageSettings = {
    objectFit: 'cover' as const,
    objectPosition: 'center center',
    scale: 100,
    brightness: 100,
    contrast: 100,
    blur: 0
  };

  const handleCreate = () => {
    const newItem: BannerItem = {
      id: Date.now().toString(),
      type: 'image',
      url: '',
      title: '',
      description: '',
      autoplay: true,
      muted: true,
      duration: 5,
      imageSettings: { ...defaultImageSettings }
    };
    
    setEditingItem(newItem);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEdit = (item: BannerItem) => {
    setEditingItem({ 
      ...item,
      imageSettings: item.imageSettings || { ...defaultImageSettings }
    });
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    setIsSaving(true);
    
    try {
      let updatedItems;
      if (isCreating) {
        updatedItems = [...bannerItems, editingItem];
      } else {
        updatedItems = bannerItems.map(item => 
          item.id === editingItem.id ? editingItem : item
        );
      }

      const success = await onUpdateBanner(updatedItems);
      
      if (success) {
        setIsEditing(false);
        setEditingItem(null);
        setIsCreating(false);
        setShowImageEditor(false);
        
        // Refrescar la configuración desde la base de datos
        await refreshBannerConfig();
        
        console.log('✅ Banner actualizado y guardado en la base de datos');
      } else {
        console.error('❌ Error al guardar el banner en la base de datos');
        alert('Error al guardar. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Error al guardar. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este elemento del banner?')) {
      setIsSaving(true);
      
      try {
        const updatedItems = bannerItems.filter(item => item.id !== id);
        const success = await onUpdateBanner(updatedItems);
        
        if (success) {
          await refreshBannerConfig();
          console.log('✅ Elemento eliminado del banner y base de datos');
        } else {
          alert('Error al eliminar. Intenta nuevamente.');
        }
      } catch (error) {
        console.error('Error deleting banner item:', error);
        alert('Error al eliminar. Intenta nuevamente.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingItem(null);
    setIsCreating(false);
    setShowImageEditor(false);
  };

  const handleRefresh = async () => {
    await refreshBannerConfig();
  };

  const handleToggleBanner = async () => {
    setIsSaving(true);
    try {
      const success = await setIsEnabled(!isEnabled);
      if (success) {
        console.log('✅ Estado del banner actualizado');
      } else {
        alert('Error al cambiar el estado del banner. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error toggling banner:', error);
      alert('Error al cambiar el estado del banner.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateImageSettings = (key: string, value: any) => {
    if (!editingItem) return;
    
    setEditingItem({
      ...editingItem,
      imageSettings: {
        ...editingItem.imageSettings!,
        [key]: value
      }
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

  const getImageStyle = (settings: BannerItem['imageSettings']) => {
    if (!settings) return {};
    
    return {
      objectFit: settings.objectFit,
      objectPosition: settings.objectPosition,
      transform: `scale(${settings.scale / 100})`,
      filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%) blur(${settings.blur}px)`
    };
  };

  const objectFitOptions = [
    { value: 'cover', label: 'Cubrir (Cover)', description: 'La imagen cubre todo el contenedor, puede recortarse' },
    { value: 'contain', label: 'Contener (Contain)', description: 'La imagen se ajusta completamente dentro del contenedor' },
    { value: 'fill', label: 'Rellenar (Fill)', description: 'La imagen se estira para llenar el contenedor' },
    { value: 'scale-down', label: 'Reducir (Scale-down)', description: 'Como contain pero nunca más grande que el original' },
    { value: 'none', label: 'Ninguno (None)', description: 'Tamaño original de la imagen' }
  ];

  const positionPresets = [
    { value: 'center center', label: 'Centro' },
    { value: 'top center', label: 'Arriba Centro' },
    { value: 'bottom center', label: 'Abajo Centro' },
    { value: 'left center', label: 'Izquierda Centro' },
    { value: 'right center', label: 'Derecha Centro' },
    { value: 'top left', label: 'Arriba Izquierda' },
    { value: 'top right', label: 'Arriba Derecha' },
    { value: 'bottom left', label: 'Abajo Izquierda' },
    { value: 'bottom right', label: 'Abajo Derecha' }
  ];

  return (
    <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600/20 rounded-xl">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Gestión de Banner</h3>
            <p className="text-blue-300">Administra las imágenes y videos del banner principal (guardado en BD)</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading || isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 font-medium transition-colors disabled:opacity-50"
            title="Refrescar desde base de datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
          
          <button
            onClick={handleCreate}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Elemento</span>
          </button>
        </div>
      </div>

      {/* Control de activación del banner */}
      <div className="mb-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isEnabled ? 'bg-green-600/20' : 'bg-red-600/20'
            }`}>
              {isEnabled ? (
                <Eye className="w-5 h-5 text-green-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h4 className="text-blue-300 font-medium">
                Banner {isEnabled ? 'Activado' : 'Desactivado'}
              </h4>
              <p className="text-blue-400 text-sm">
                {isEnabled
                  ? 'El banner se muestra en la página principal con las imágenes y videos configurados'
                  : 'Solo se muestra el video de fondo. El banner con imágenes está oculto'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleBanner}
            disabled={isSaving}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              isEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </span>
            ) : (
              <span>{isEnabled ? 'Desactivar Banner' : 'Activar Banner'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Indicador de estado de la base de datos */}
      <div className="mb-6 p-4 bg-green-600/10 border border-green-500/30 rounded-xl">
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5 text-green-400" />
          <div>
            <h4 className="text-green-300 font-medium">Sincronizado con Base de Datos</h4>
            <p className="text-green-400 text-sm">
              Todos los cambios se guardan automáticamente en la base de datos MySQL
            </p>
          </div>
        </div>
      </div>

      {/* Lista de elementos del banner */}
      <div className="space-y-4 mb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-blue-300">Cargando desde base de datos...</span>
          </div>
        ) : bannerItems.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-50" />
            <p className="text-blue-300">No hay elementos en el banner</p>
            <p className="text-blue-400 text-sm mt-1">Agrega imágenes o videos para comenzar</p>
          </div>
        ) : (
          bannerItems.map((item) => (
            <div key={item.id} className="bg-slate-700/40 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {item.type === 'image' ? (
                    <div className="w-20 h-12 bg-slate-600 rounded-lg overflow-hidden">
                      <img
                        src={item.url}
                        alt={item.title || 'Banner item'}
                        className="w-full h-full"
                        style={getImageStyle(item.imageSettings)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA4MCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yNCAyMEgzNlYyOEgyNFYyMFoiIGZpbGw9IiM2Mzc0OEIiLz4KPC9zdmc+';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-red-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-white truncate">
                      {item.title || 'Sin título'}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'image' 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {item.type === 'image' ? 'Imagen' : 'Video'}
                    </span>
                  </div>
                  
                  <p className="text-blue-300 text-sm truncate">
                    {item.description || 'Sin descripción'}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-blue-400">
                    {item.link && (
                      <div className="flex items-center space-x-1">
                        <ExternalLink className="w-3 h-3" />
                        <span>Con enlace</span>
                      </div>
                    )}
                    
                    {item.type === 'image' && (
                      <>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.duration || 5}s</span>
                        </div>
                        {item.imageSettings && (
                          <div className="flex items-center space-x-1">
                            <Maximize2 className="w-3 h-3" />
                            <span>{item.imageSettings.objectFit}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {item.type === 'video' && (
                      <div className="flex items-center space-x-1">
                        <Play className="w-3 h-3" />
                        <span>{item.autoplay ? 'Auto' : 'Manual'}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Database className="w-3 h-3" />
                      <span>En BD</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    disabled={isSaving}
                    className="p-2 bg-blue-600/20 hover:bg-blue-600/40 disabled:bg-blue-600/10 rounded-lg text-blue-300 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isSaving}
                    className="p-2 bg-red-600/20 hover:bg-red-600/40 disabled:bg-red-600/10 rounded-lg text-red-300 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de edición */}
      {isEditing && editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-400" />
                <span>{isCreating ? 'Agregar Elemento' : 'Editar Elemento'}</span>
              </h3>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Configuración básica */}
              <div className="space-y-6">
                {/* Tipo de contenido */}
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-3">Tipo de Contenido</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setEditingItem({ ...editingItem, type: 'image' })}
                      disabled={isSaving}
                      className={`flex items-center space-x-3 p-4 rounded-xl border transition-all disabled:opacity-50 ${
                        editingItem.type === 'image'
                          ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                          : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                      }`}
                    >
                      <ImageIcon className="w-6 h-6" />
                      <div className="text-left">
                        <div className="font-medium">Imagen</div>
                        <div className="text-xs opacity-75">JPG, PNG, GIF</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setEditingItem({ ...editingItem, type: 'video' })}
                      disabled={isSaving}
                      className={`flex items-center space-x-3 p-4 rounded-xl border transition-all disabled:opacity-50 ${
                        editingItem.type === 'video'
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
                    {editingItem.type === 'image' ? 'URL de la Imagen' : 'URL del Video de YouTube'}
                  </label>
                  <input
                    type="url"
                    value={editingItem.url}
                    onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    placeholder={
                      editingItem.type === 'image' 
                        ? 'https://ejemplo.com/imagen.jpg' 
                        : 'https://www.youtube.com/watch?v=...'
                    }
                  />
                  {editingItem.url && editingItem.type === 'video' && !validateYouTubeUrl(editingItem.url) && (
                    <p className="text-red-400 text-sm mt-1">URL de YouTube inválida</p>
                  )}
                  {editingItem.url && editingItem.type === 'image' && !validateImageUrl(editingItem.url) && (
                    <p className="text-yellow-400 text-sm mt-1">Asegúrate de que sea una URL de imagen válida</p>
                  )}
                </div>

                {/* Título */}
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Título (Opcional)</label>
                  <input
                    type="text"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    placeholder="Título del elemento"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Descripción (Opcional)</label>
                  <textarea
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    disabled={isSaving}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none disabled:opacity-50"
                    placeholder="Descripción del elemento"
                  />
                </div>

                {/* Enlace */}
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">Enlace (Opcional)</label>
                  <input
                    type="url"
                    value={editingItem.link || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    placeholder="https://ejemplo.com"
                  />
                  <p className="text-blue-400 text-sm mt-1">URL que se abrirá al hacer clic en el elemento</p>
                </div>

                {/* Configuraciones específicas */}
                {editingItem.type === 'image' && (
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Duración (segundos)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={editingItem.duration || 5}
                      onChange={(e) => setEditingItem({ ...editingItem, duration: parseInt(e.target.value) || 5 })}
                      disabled={isSaving}
                      className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                )}

                {editingItem.type === 'video' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoplay"
                        checked={editingItem.autoplay || false}
                        onChange={(e) => setEditingItem({ ...editingItem, autoplay: e.target.checked })}
                        disabled={isSaving}
                        className="rounded border-blue-600/30 disabled:opacity-50"
                      />
                      <label htmlFor="autoplay" className="text-blue-300">Reproducción automática</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="muted"
                        checked={editingItem.muted !== false}
                        onChange={(e) => setEditingItem({ ...editingItem, muted: e.target.checked })}
                        disabled={isSaving}
                        className="rounded border-blue-600/30 disabled:opacity-50"
                      />
                      <label htmlFor="muted" className="text-blue-300">Silenciado por defecto</label>
                    </div>
                  </div>
                )}
              </div>

              {/* Editor de imagen y vista previa */}
              <div className="space-y-6">
                {/* Vista previa */}
                {editingItem.url && (
                  <div>
                    <label className="block text-blue-300 text-sm font-medium mb-2">Vista Previa</label>
                    <div className="w-full h-48 bg-slate-700/40 rounded-xl overflow-hidden border border-blue-600/30">
                      {editingItem.type === 'image' ? (
                        <img
                          src={editingItem.url}
                          alt="Preview"
                          className="w-full h-full transition-all duration-300"
                          style={getImageStyle(editingItem.imageSettings)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Youtube className="w-12 h-12 text-red-400" />
                          <span className="ml-2 text-red-300">Video de YouTube</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Editor de ajustes de imagen */}
                {editingItem.type === 'image' && editingItem.url && editingItem.imageSettings && (
                  <div className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/30">
                    <div className="flex items-center space-x-2 mb-4">
                      <Move className="w-5 h-5 text-blue-400" />
                      <h4 className="text-lg font-bold text-white">Ajustes de Imagen</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Modo de ajuste */}
                      <div>
                        <label className="block text-blue-300 text-sm font-medium mb-2">Modo de Ajuste</label>
                        <select
                          value={editingItem.imageSettings.objectFit}
                          onChange={(e) => updateImageSettings('objectFit', e.target.value)}
                          disabled={isSaving}
                          className="w-full px-4 py-3 bg-slate-600/40 border border-blue-600/30 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                        >
                          {objectFitOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-blue-400 text-xs mt-1">
                          {objectFitOptions.find(o => o.value === editingItem.imageSettings!.objectFit)?.description}
                        </p>
                      </div>

                      {/* Posición */}
                      <div>
                        <label className="block text-blue-300 text-sm font-medium mb-2">Posición</label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {positionPresets.map((preset) => (
                            <button
                              key={preset.value}
                              onClick={() => updateImageSettings('objectPosition', preset.value)}
                              disabled={isSaving}
                              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                                editingItem.imageSettings!.objectPosition === preset.value
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-600/40 text-blue-300 hover:bg-blue-600/20'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={editingItem.imageSettings.objectPosition}
                          onChange={(e) => updateImageSettings('objectPosition', e.target.value)}
                          disabled={isSaving}
                          className="w-full px-3 py-2 bg-slate-600/40 border border-blue-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                          placeholder="ej: 25% 75%"
                        />
                      </div>

                      {/* Escala */}
                      <div>
                        <label className="block text-blue-300 text-sm font-medium mb-2">
                          Escala: {editingItem.imageSettings.scale}%
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="200"
                          value={editingItem.imageSettings.scale}
                          onChange={(e) => updateImageSettings('scale', parseInt(e.target.value))}
                          disabled={isSaving}
                          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
                        />
                      </div>

                      {/* Brillo */}
                      <div>
                        <label className="block text-blue-300 text-sm font-medium mb-2">
                          Brillo: {editingItem.imageSettings.brightness}%
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={editingItem.imageSettings.brightness}
                          onChange={(e) => updateImageSettings('brightness', parseInt(e.target.value))}
                          disabled={isSaving}
                          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
                        />
                      </div>

                      {/* Contraste */}
                      <div>
                        <label className="block text-blue-300 text-sm font-medium mb-2">
                          Contraste: {editingItem.imageSettings.contrast}%
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={editingItem.imageSettings.contrast}
                          onChange={(e) => updateImageSettings('contrast', parseInt(e.target.value))}
                          disabled={isSaving}
                          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
                        />
                      </div>

                      {/* Desenfoque */}
                      <div>
                        <label className="block text-blue-300 text-sm font-medium mb-2">
                          Desenfoque: {editingItem.imageSettings.blur}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={editingItem.imageSettings.blur}
                          onChange={(e) => updateImageSettings('blur', parseInt(e.target.value))}
                          disabled={isSaving}
                          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
                        />
                      </div>

                      {/* Botón de reset */}
                      <button
                        onClick={() => setEditingItem({
                          ...editingItem,
                          imageSettings: { ...defaultImageSettings }
                        })}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600/40 hover:bg-slate-600/60 disabled:bg-slate-600/20 rounded-lg text-blue-300 hover:text-blue-200 transition-colors disabled:opacity-50"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>Restablecer Ajustes</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-3 pt-6 mt-6 border-t border-blue-700/30">
              <button
                onClick={handleSave}
                disabled={!editingItem.url || isSaving}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando en BD...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isCreating ? 'Agregar' : 'Guardar'}</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-xl text-white font-medium transition-colors"
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

export default BannerManager;