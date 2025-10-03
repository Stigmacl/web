import React, { useState } from 'react';
import { Mail, MessageSquare, Send, ExternalLink, Users, Globe, Download, Shield, Monitor, Gamepad2, Settings, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ContactSection = 'main' | 'installation' | 'rules' | 'forum';

const Contact: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<ContactSection>('main');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      alert('¡Mensaje enviado correctamente! Te responderemos pronto.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  const navigateToForum = () => {
    // Trigger navigation to forum
    const event = new CustomEvent('navigate-to-section', { detail: 'forum' });
    window.dispatchEvent(event);
  };

  const contactMethods = [
    {
      icon: MessageSquare,
      title: 'Discord Oficial',
      description: 'Únete a nuestro servidor',
      action: 'https://discord.gg/vhbYGXy2yZ',
      actionText: 'Unirse a Discord',
      color: 'text-purple-400'
    },
    {
      icon: Users,
      title: 'Foro de la Comunidad',
      description: 'Discusiones y ayuda',
      action: navigateToForum,
      actionText: 'Visitar Foro',
      color: 'text-green-400',
      isInternal: true
    }
  ];

  const utilityLinks = [
    {
      id: 'installation' as ContactSection,
      title: 'Guía de Instalación',
      description: 'Instrucciones paso a paso para instalar el juego',
      icon: Download,
      color: 'text-green-400'
    },
    {
      id: 'rules' as ContactSection,
      title: 'Reglas del Servidor',
      description: 'Normas y código de conducta de la comunidad',
      icon: Shield,
      color: 'text-yellow-400'
    },
    {
      id: 'forum' as ContactSection,
      title: 'Foro de la Comunidad',
      description: 'Participa en discusiones con otros jugadores',
      icon: MessageSquare,
      color: 'text-purple-400'
    }
  ];

  const installationSteps = [
    {
      step: 1,
      title: 'Descarga el Juego',
      description: 'Descarga Tactical Ops  desde el enlace oficial',
      details: [
        'Haz clic en el botón de descarga para obtener el TO-Fixed-Pack',
        'El archivo es aproximadamente 800MB',
        'Asegúrate de descargar desde fuentes oficiales para evitar malware'
      ],
      icon: Download,
      downloadLink: 'https://mirror.tactical-ops.eu/client-patches/custom-clients/TO-Fixed-Pack-v469d.zip'
    },
    {
      step: 2,
      title: 'Instalación Base',
      description: 'Extrae e instala el juego en tu sistema',
      details: [
        'Extrae la carpeta TacticalOps de la descarga a un directorio como "C:/" o "C:/Juegos/"',
        'Evita las carpetas "Archivos de programa"',
        'En "Unirse rápidamente a TO" puedes unirte directamente a un servidor o iniciar TO desde:',
        '• Menú -> Iniciar Tactical Ops  3.4',
        '• Menú -> Iniciar Tactical Ops ',
        'El "Lanzador de TO" requiere que primero configures las rutas correctamente en la configuración',
        'Inicia manualmente cualquier versión de TO directamente desde "/TO3#0/System/TacticalOps.exe"'
      ],
      icon: Settings
    }
  ];

  const serverRules = [
    {
      category: 'Reglas Generales',
      icon: Shield,
      color: 'text-blue-400',
      rules: [
        'Respeta a todos los jugadores sin excepción',
        'No uses lenguaje ofensivo, racista o discriminatorio',
        'Prohibido el spam en chat de voz o texto',
        'No hagas publicidad de otros servidores',
        'Sigue las instrucciones de los administradores'
      ]
    },
    {
      category: 'Gameplay',
      icon: Gamepad2,
      color: 'text-green-400',
      rules: [
        'Prohibido el uso de cheats, hacks o exploits',
        'No hagas teamkill intencional',
        'Prohibido el camping excesivo',
        'No bloquees a tus compañeros de equipo',
        'Juega de manera deportiva y fair play'
      ]
    },
    {
      category: 'Comunicación',
      icon: MessageSquare,
      color: 'text-purple-400',
      rules: [
        'Usa el chat de equipo para estrategias',
        'No reveles posiciones enemigas si estás muerto',
        'Prohibido el mic spam o ruidos molestos',
        'Comunícate en español o inglés',
        'No discutas decisiones de administradores en público'
      ]
    },
    {
      category: 'Sanciones',
      icon: AlertCircle,
      color: 'text-red-400',
      rules: [
        'Primera infracción: Advertencia verbal',
        'Segunda infracción: Kick temporal',
        'Tercera infracción: Ban temporal (1-7 días)',
        'Infracciones graves: Ban permanente',
        'Puedes apelar sanciones contactando administradores'
      ]
    }
  ];

  if (currentSection === 'forum') {
    // Trigger navigation to forum component
    navigateToForum();
    return null;
  }

  if (currentSection !== 'main') {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => setCurrentSection('main')}
          className="flex items-center space-x-2 mb-6 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-blue-300 hover:text-blue-200 transition-colors"
        >
          <span>← Volver a Contacto</span>
        </button>

        {currentSection === 'installation' && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Guía de Instalación</h1>
              <p className="text-blue-200 text-lg">Instrucciones paso a paso para instalar Tactical Ops </p>
            </div>

            <div className="space-y-6">
              {installationSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.step} className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                          <Icon className="w-6 h-6 text-blue-400" />
                          <span>{step.title}</span>
                        </h3>
                        <p className="text-blue-300">{step.description}</p>
                      </div>
                    </div>
                    
                    <div className="ml-16">
                      {step.downloadLink && (
                        <div className="mb-4">
                          <a
                            href={step.downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                          >
                            <Download className="w-5 h-5" />
                            <span>Haz clic aquí para descargar</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                      
                      <ul className="space-y-2">
                        {step.details.map((detail, index) => (
                          <li key={index} className="flex items-start space-x-2 text-blue-200">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>¿Necesitas ayuda?</span>
              </h3>
              <p className="text-blue-200 mb-4">
                Si tienes problemas durante la instalación, no dudes en contactarnos a través de Discord o bien visita la web oficial que da soporte al Tactical Ops .
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setCurrentSection('main')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                  Ir a Contacto
                </button>
                <a
                  href="https://www.tactical-ops.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Web Oficial</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {currentSection === 'rules' && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Reglas del Servidor</h1>
              <p className="text-blue-200 text-lg">Normas y código de conducta para mantener una comunidad sana</p>
            </div>

            <div className="mb-8 bg-gradient-to-r from-yellow-600/10 to-red-600/10 border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Importante</h2>
              </div>
              <p className="text-yellow-200">
                El incumplimiento de estas reglas puede resultar en sanciones que van desde advertencias hasta bans permanentes. 
                Todos los jugadores deben conocer y respetar estas normas.
              </p>
            </div>

            <div className="space-y-6">
              {serverRules.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div key={index} className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${category.color}`} />
                      <span>{category.category}</span>
                    </h2>
                    
                    <div className="space-y-3">
                      {category.rules.map((rule, ruleIndex) => (
                        <div key={ruleIndex} className="flex items-start space-x-3 p-3 bg-slate-700/40 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-200">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <span>¿Cómo reportar infracciones?</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">En el juego</h4>
                  <p className="text-blue-200 text-sm">Usa el comando !report [jugador] [motivo] o contacta a un admin presente</p>
                </div>
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">Fuera del juego</h4>
                  <p className="text-blue-200 text-sm">Envía evidencia (screenshots, demos) a través de Discord</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Contacto y Soporte</h1>
        <p className="text-blue-200 text-lg">¿Necesitas ayuda? Estamos aquí para apoyarte</p>
      </div>

      {/* Enlaces Útiles - Primera Sección */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Enlaces Útiles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {utilityLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => {
                  if (link.id === 'forum') {
                    navigateToForum();
                  } else {
                    setCurrentSection(link.id);
                  }
                }}
                className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:transform hover:scale-105 text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-slate-700/40 rounded-xl">
                    <Icon className={`w-8 h-8 ${link.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{link.title}</h3>
                    <p className="text-blue-300 text-sm">{link.description}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-blue-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <Send className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Envíanos un Mensaje</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-blue-300 text-sm font-medium mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Tu nombre"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-blue-300 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-blue-300 text-sm font-medium mb-2">
                Asunto
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Selecciona un asunto</option>
                <option value="problemas-servidor">Problemas con Servidor</option>
                <option value="ban-appeal">Apelación de Sanción</option>
                <option value="sugerencias">Sugerencias</option>
                <option value="reportar-jugador">Reportar Jugador</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-blue-300 text-sm font-medium mb-2">
                Mensaje
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Describe tu consulta o problema en detalle..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-xl text-white font-bold text-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Enviar Mensaje</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contact Methods */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Canales de Contacto</h3>
            
            <div className="space-y-4">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-700/40 rounded-xl hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg bg-slate-600/40`}>
                        <Icon className={`w-5 h-5 ${method.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{method.title}</h4>
                        <p className="text-blue-300 text-sm">{method.description}</p>
                      </div>
                    </div>
                    
                    {method.isInternal ? (
                      <button
                        onClick={method.action as () => void}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 text-sm font-medium transition-all duration-300"
                      >
                        <span>{method.actionText}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <a
                        href={method.action as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 text-sm font-medium transition-all duration-300"
                      >
                        <span>{method.actionText}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Community Info */}
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold text-white">Información de la Comunidad</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Ubicación</span>
                <span className="text-white font-medium">Chile</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Idioma Principal</span>
                <span className="text-white font-medium">Español</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Versión del Juego</span>
                <span className="text-white font-medium">Tactical Ops </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;