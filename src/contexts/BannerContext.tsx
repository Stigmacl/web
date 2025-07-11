import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  imageSettings?: {
    objectFit: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
    objectPosition: string;
    scale: number;
    brightness: number;
    contrast: number;
    blur: number;
  };
}

interface BannerContextType {
  bannerItems: BannerItem[];
  updateBannerItems: (items: BannerItem[]) => Promise<boolean>;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => Promise<boolean>;
  isLoading: boolean;
  refreshBannerConfig: () => Promise<void>;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const useBanner = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
};

interface BannerProviderProps {
  children: ReactNode;
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

export const BannerProvider: React.FC<BannerProviderProps> = ({ children }) => {
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [isEnabled, setIsEnabledState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración del banner desde la base de datos
  useEffect(() => {
    loadBannerConfig();
  }, []);

  const loadBannerConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/banner/get-config.php`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBannerItems(data.items || []);
        setIsEnabledState(data.isEnabled);
      } else {
        console.error('Error loading banner config:', data.message);
        // Fallback a configuración por defecto
        loadDefaultConfig();
      }
    } catch (error) {
      console.error('Error loading banner config:', error);
      // Fallback a configuración por defecto
      loadDefaultConfig();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultConfig = () => {
    // Configuración por defecto con ajustes de imagen
    const defaultItems: BannerItem[] = [
      {
        id: '1',
        type: 'image',
        url: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop',
        title: '¡Bienvenido a Tactical Ops  Chile!',
        description: 'La comunidad más activa de Tactical Ops en Chile',
        link: '#',
        duration: 6,
        imageSettings: {
          objectFit: 'cover',
          objectPosition: 'center center',
          scale: 100,
          brightness: 100,
          contrast: 100,
          blur: 0
        }
      },
      {
        id: '2',
        type: 'image',
        url: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop',
        title: 'Únete a la Batalla',
        description: 'Servidores activos 24/7 con la mejor experiencia de juego',
        duration: 5,
        imageSettings: {
          objectFit: 'cover',
          objectPosition: 'center center',
          scale: 100,
          brightness: 100,
          contrast: 100,
          blur: 0
        }
      },
      {
        id: '3',
        type: 'image',
        url: 'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop',
        title: 'Comunidad Activa',
        description: 'Más de 1000 jugadores registrados y creciendo',
        duration: 7,
        imageSettings: {
          objectFit: 'cover',
          objectPosition: 'center center',
          scale: 100,
          brightness: 100,
          contrast: 100,
          blur: 0
        }
      }
    ];
    setBannerItems(defaultItems);
    setIsEnabledState(true);
  };

  const updateBannerItems = async (items: BannerItem[]): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/banner/update-config.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBannerItems(items);
        return true;
      } else {
        console.error('Error updating banner items:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating banner items:', error);
      return false;
    }
  };

  const setIsEnabled = async (enabled: boolean): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/banner/update-config.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isEnabled: enabled })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setIsEnabledState(enabled);
        return true;
      } else {
        console.error('Error updating banner enabled state:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating banner enabled state:', error);
      return false;
    }
  };

  const refreshBannerConfig = async () => {
    await loadBannerConfig();
  };

  return (
    <BannerContext.Provider value={{
      bannerItems,
      updateBannerItems,
      isEnabled,
      setIsEnabled,
      isLoading,
      refreshBannerConfig
    }}>
      {children}
    </BannerContext.Provider>
  );
};