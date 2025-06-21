import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BannerItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  link?: string;
  title?: string;
  description?: string;
  autoplay?: boolean;
  muted?: boolean;
  duration?: number; // Para imágenes, tiempo en segundos
  imageSettings?: {
    objectFit: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
    objectPosition: string;
    scale: number;
    brightness: number;
    contrast: number;
    blur: number;
  };
}

interface DynamicBannerProps {
  bannerItems: BannerItem[];
}

const DynamicBanner: React.FC<DynamicBannerProps> = ({ bannerItems }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentItem = bannerItems[currentIndex];

  // Función para extraer ID de video de YouTube
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Función para obtener URL de embed de YouTube
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return '';
    
    const params = new URLSearchParams({
      autoplay: currentItem?.autoplay ? '1' : '0',
      mute: isMuted ? '1' : '0',
      controls: '0',
      showinfo: '0',
      rel: '0',
      loop: '1',
      playlist: videoId,
      modestbranding: '1',
      iv_load_policy: '3'
    });
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  // Función para obtener estilos de imagen
  const getImageStyle = (settings?: BannerItem['imageSettings']) => {
    if (!settings) {
      return {
        objectFit: 'cover' as const,
        objectPosition: 'center center',
        transform: 'scale(1)',
        filter: 'brightness(100%) contrast(100%) blur(0px)'
      };
    }
    
    return {
      objectFit: settings.objectFit,
      objectPosition: settings.objectPosition,
      transform: `scale(${settings.scale / 100})`,
      filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%) blur(${settings.blur}px)`
    };
  };

  // Navegar al siguiente item
  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
    setProgress(0);
  };

  // Navegar al item anterior
  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + bannerItems.length) % bannerItems.length);
    setProgress(0);
  };

  // Manejar reproducción automática
  useEffect(() => {
    if (!isPlaying || bannerItems.length <= 1) return;

    const duration = currentItem?.type === 'image' 
      ? (currentItem.duration || 5) * 1000 
      : 30000; // 30 segundos para videos

    intervalRef.current = setInterval(nextItem, duration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentIndex, isPlaying, bannerItems.length, currentItem]);

  // Manejar barra de progreso
  useEffect(() => {
    if (!isPlaying || bannerItems.length <= 1) return;

    const duration = currentItem?.type === 'image' 
      ? (currentItem.duration || 5) * 1000 
      : 30000;

    const interval = 50; // Actualizar cada 50ms
    const increment = (interval / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentIndex, isPlaying, bannerItems.length, currentItem]);

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Reset progress cuando cambia el item
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  if (!bannerItems || bannerItems.length === 0) {
    return null;
  }

  const handleItemClick = () => {
    if (currentItem?.link) {
      window.open(currentItem.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden bg-slate-900 border-b border-blue-700/30">
      {/* Contenido del Banner */}
      <div className="relative w-full h-full">
        {currentItem?.type === 'image' ? (
          <div 
            className={`w-full h-full transition-all duration-1000 overflow-hidden ${
              currentItem.link ? 'cursor-pointer group' : ''
            }`}
            onClick={handleItemClick}
          >
            <img
              src={currentItem.url}
              alt={currentItem.title || 'Banner image'}
              className="w-full h-full transition-all duration-500 group-hover:scale-105"
              style={getImageStyle(currentItem.imageSettings)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSI2MDAiIHZpZXdCb3g9IjAgMCAxOTIwIDYwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik05NjAgMzAwSDEwNDBWMzYwSDk2MFYzMDBaIiBmaWxsPSIjNjM3NDhCIi8+Cjx0ZXh0IHg9Ijk2MCIgeT0iNDIwIiBmaWxsPSIjOTQ5NEE0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4=';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <iframe
              src={getYouTubeEmbedUrl(currentItem.url)}
              className="w-full h-full object-cover"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={currentItem.title || 'Video Banner'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
            
            {/* Overlay para click en link */}
            {currentItem.link && (
              <div 
                className="absolute inset-0 cursor-pointer hover:bg-black/10 transition-colors flex items-center justify-center group"
                onClick={handleItemClick}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 rounded-full p-3">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información del Item */}
        {(currentItem?.title || currentItem?.description) && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            {currentItem.title && (
              <h3 className="text-2xl font-bold text-white mb-2">{currentItem.title}</h3>
            )}
            {currentItem.description && (
              <p className="text-blue-200 text-lg">{currentItem.description}</p>
            )}
          </div>
        )}

        {/* Controles de Navegación */}
        {bannerItems.length > 1 && (
          <>
            <button
              onClick={prevItem}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={nextItem}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Controles de Reproducción */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {bannerItems.length > 1 && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-300"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
          
          {currentItem?.type === 'video' && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-300"
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Indicadores de Posición */}
        {bannerItems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {bannerItems.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setProgress(0);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}

        {/* Barra de Progreso */}
        {bannerItems.length > 1 && isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div 
              className="h-full bg-blue-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicBanner;