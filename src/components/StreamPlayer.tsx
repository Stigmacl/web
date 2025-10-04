import React from 'react';
import { Radio } from 'lucide-react';

interface StreamPlayerProps {
  streamUrl: string;
  isActive: boolean;
  descriptiveText?: string;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ streamUrl, isActive, descriptiveText = 'Vuelve pronto para ver contenido en vivo' }) => {
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

  if (!streamUrl) {
    return (
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 text-center">
        <Radio className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">No hay transmisión en vivo</h3>
        <p className="text-blue-300">
          Vuelve pronto para ver contenido en vivo
        </p>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(streamUrl);

  return (
    <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 overflow-hidden">
      {isActive ? (
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center space-x-2">
          <Radio className="w-5 h-5 text-white animate-pulse" />
          <span className="text-white font-bold">EN VIVO</span>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center space-x-2">
          <Radio className="w-5 h-5 text-white" />
          <span className="text-white font-medium">{descriptiveText}</span>
        </div>
      )}
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
};

export default StreamPlayer;
