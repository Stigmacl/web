import React, { useState } from 'react';
import { Trophy, Medal, Star, TrendingUp, TrendingDown, Minus, Crown, Award, Target } from 'lucide-react';

const Ranking: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Ranking de Jugadores</h1>
          <p className="text-blue-200 text-lg">Los mejores combatientes de Tactical Ops 3.5</p>
        </div>
        
        <div className="flex space-x-2">
          {(['all', 'weekly', 'monthly'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-300
                ${filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/40 text-blue-300 hover:bg-blue-600/20'
                }
              `}
            >
              {filterType === 'all' ? 'General' : filterType === 'weekly' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="text-center py-20">
        <Trophy className="w-24 h-24 text-blue-400 mx-auto mb-6 opacity-50" />
        <h2 className="text-3xl font-bold text-white mb-4">Ranking en Construcción</h2>
        <p className="text-blue-300 text-lg mb-8 max-w-2xl mx-auto">
          El sistema de ranking se activará cuando los jugadores comiencen a participar en partidas. 
          ¡Sé el primero en aparecer en las tablas de clasificación!
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
            <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Primer Lugar</h3>
            <p className="text-blue-300 text-sm">Esperando al primer campeón</p>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Segundo Lugar</h3>
            <p className="text-blue-300 text-sm">Posición disponible</p>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
            <Medal className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Tercer Lugar</h3>
            <p className="text-blue-300 text-sm">Podio esperando</p>
          </div>
        </div>

        <div className="mt-12 bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">¿Cómo funciona el ranking?</h3>
          <div className="text-left space-y-3 text-blue-200">
            <p>• <strong>Puntuación:</strong> Basada en victorias, K/D ratio y rendimiento general</p>
            <p>• <strong>Actualizaciones:</strong> El ranking se actualiza en tiempo real</p>
            <p>• <strong>Categorías:</strong> Rankings generales, semanales y mensuales</p>
            <p>• <strong>Premios:</strong> Reconocimientos especiales para los mejores jugadores</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranking;