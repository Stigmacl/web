import React from 'react';
import { Radio } from 'lucide-react';

interface StreamPlayerProps {
  streamUrl: string;
  isActive: boolean;
  descriptiveText?: string;
  offlineUrl?: string;
  offlineText?: string;
  showOffline?: boolean;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ streamUrl, isActive, descriptiveText = 'Vuelve pronto para ver contenido en vivo', offlineUrl = '', offlineText = '', showOffline = false }) => {
  const getEmbedUrl = (url: string): string => {
    if (!url) return '';

    if (url.includes('twitch.tv')) {
      const channelMatch = url.match(/twitch\.tv\/([^\/\?]+)/);
      if (channelMatch) {
        return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${window.location.hostname}`;
      }
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([^\/\?&]+)/);
      if (videoIdMatch) {
        return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1`;
      }
    }

    if (url.includes('kick.com')) {
      const channelMatch = url.match(/kick\.com\/([^\/\?]+)/);
      if (channelMatch) {
        return `https://player.kick.com/${channelMatch[1]}`;
      }
    }

    return url;
  };

  if (showOffline && offlineUrl && offlineUrl.trim() !== '') {
    const embedUrl = getEmbedUrl(offlineUrl);
    return (
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center space-x-2">
          <Radio className="w-5 h-5 text-white" />
          <span className="text-white font-medium">{offlineText || 'Contenido Offline'}</span>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        </div>
      </div>
    );
  }

  if (isActive && streamUrl && streamUrl.trim() !== '') {
    const embedUrl = getEmbedUrl(streamUrl);
    return (
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center space-x-2">
          <Radio className="w-5 h-5 text-white animate-pulse" />
          <span className="text-white font-bold">EN VIVO</span>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        </div>
      </div>
    );
  }

  return null;
};

export default StreamPlayer;
