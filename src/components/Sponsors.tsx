import React, { useState, useEffect } from 'react';
import { Globe, MessageCircle, Instagram, Facebook, Youtube, Twitch, Trophy } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Sponsor {
  id: number;
  name: string;
  logo: string;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  twitch?: string;
  kick?: string;
}

const Sponsors: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const { themeConfig } = useTheme();

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const response = await fetch('/api/sponsors/get-all.php');
      const data = await response.json();
      if (data.success) {
        setSponsors(data.data);
      }
    } catch (error) {
      console.error('Error al cargar sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    const iconProps = { className: "w-5 h-5" };
    switch (platform) {
      case 'website': return <Globe {...iconProps} />;
      case 'whatsapp': return <MessageCircle {...iconProps} />;
      case 'instagram': return <Instagram {...iconProps} />;
      case 'facebook': return <Facebook {...iconProps} />;
      case 'youtube': return <Youtube {...iconProps} />;
      case 'twitch': return <Twitch {...iconProps} />;
      case 'kick': return <Trophy {...iconProps} />;
      default: return null;
    }
  };

  const getSocialColor = (platform: string) => {
    switch (platform) {
      case 'website': return '#3b82f6';
      case 'whatsapp': return '#25D366';
      case 'instagram': return '#E4405F';
      case 'facebook': return '#1877F2';
      case 'youtube': return '#FF0000';
      case 'twitch': return '#9146FF';
      case 'kick': return '#53FC18';
      default: return themeConfig.colors.primary;
    }
  };

  const getSocialLinks = (sponsor: Sponsor) => {
    const links: Array<{ platform: string; url: string }> = [];

    if (sponsor.website) links.push({ platform: 'website', url: sponsor.website });
    if (sponsor.whatsapp) links.push({ platform: 'whatsapp', url: sponsor.whatsapp });
    if (sponsor.instagram) links.push({ platform: 'instagram', url: sponsor.instagram });
    if (sponsor.facebook) links.push({ platform: 'facebook', url: sponsor.facebook });
    if (sponsor.youtube) links.push({ platform: 'youtube', url: sponsor.youtube });
    if (sponsor.twitch) links.push({ platform: 'twitch', url: sponsor.twitch });
    if (sponsor.kick) links.push({ platform: 'kick', url: sponsor.kick });

    return links;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: `${themeConfig.colors.primary} transparent transparent transparent` }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: themeConfig.colors.text }}
          >
            Nuestros Sponsors
          </h1>
          <p
            className="text-lg"
            style={{ color: themeConfig.colors.textSecondary }}
          >
            Gracias a nuestros sponsors por hacer posible esta comunidad
          </p>
        </div>

        {sponsors.length === 0 ? (
          <div
            className="text-center p-12 rounded-2xl border"
            style={{
              backgroundColor: `${themeConfig.colors.surface}40`,
              borderColor: themeConfig.colors.border
            }}
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: themeConfig.colors.textSecondary }} />
            <p className="text-lg" style={{ color: themeConfig.colors.textSecondary }}>
              Próximamente tendremos sponsors
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sponsors.map((sponsor) => {
              const socialLinks = getSocialLinks(sponsor);

              return (
                <div
                  key={sponsor.id}
                  className="rounded-2xl border p-6 transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: `${themeConfig.colors.surface}40`,
                    backdropFilter: 'blur(24px)',
                    borderColor: themeConfig.colors.border
                  }}
                >
                  <div className="aspect-video mb-4 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center p-4">
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <h3
                    className="text-xl font-bold mb-4 text-center"
                    style={{ color: themeConfig.colors.text }}
                  >
                    {sponsor.name}
                  </h3>

                  {socialLinks.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {socialLinks.map((link) => (
                        <a
                          key={link.platform}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                          style={{
                            backgroundColor: `${getSocialColor(link.platform)}20`,
                            color: getSocialColor(link.platform)
                          }}
                          title={link.platform}
                        >
                          {getSocialIcon(link.platform)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          className="mt-12 p-8 rounded-2xl border text-center"
          style={{
            backgroundColor: `${themeConfig.colors.surface}40`,
            backdropFilter: 'blur(24px)',
            borderColor: themeConfig.colors.border
          }}
        >
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: themeConfig.colors.text }}
          >
            ¿Quieres ser sponsor?
          </h2>
          <p
            className="text-lg mb-4"
            style={{ color: themeConfig.colors.textSecondary }}
          >
            Contacta con nosotros para formar parte de nuestra comunidad
          </p>
          <p style={{ color: themeConfig.colors.primary }}>
            info@tacticalopschile.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sponsors;
