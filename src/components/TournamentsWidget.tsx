import React from 'react';
import { Trophy, Calendar, Users } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  date: string;
  participants: number;
  status: string;
}

interface TournamentsWidgetProps {
  tournaments: Tournament[];
  onViewTournament: (id: string) => void;
}

const TournamentsWidget: React.FC<TournamentsWidgetProps> = ({ tournaments, onViewTournament }) => {
  const activeTournaments = tournaments.filter(t => t.status === 'active' || t.status === 'in_progress');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-bold text-white">Torneos Activos</h3>
      </div>

      {activeTournaments.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-50" />
          <p className="text-blue-300 text-sm">No hay torneos activos</p>
          <p className="text-blue-400 text-xs mt-1">Próximamente habrá nuevos torneos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTournaments.map((tournament) => (
            <div
              key={tournament.id}
              onClick={() => onViewTournament(tournament.id)}
              className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300 cursor-pointer group"
            >
              <h4 className="text-white font-bold mb-3 group-hover:text-blue-300 transition-colors">
                {tournament.name}
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-blue-300">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(tournament.date)}</span>
                </div>

                <div className="flex items-center space-x-2 text-blue-300">
                  <Users className="w-4 h-4" />
                  <span>{tournament.participants} participantes</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-700/30">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  tournament.status === 'active'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                }`}>
                  {tournament.status === 'active' ? 'Inscripciones Abiertas' : 'En Progreso'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentsWidget;
