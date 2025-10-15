import React from 'react';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description: string;
  type: string;
  teamSize: number;
  maxParticipants: number;
  participantCount: number;
  status: string;
  startDate: string;
  endDate: string;
  prizePool?: string;
  rules?: string;
  maps: string[];
  bracketType: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TournamentsWidgetProps {
  tournaments: Tournament[];
  onViewTournament: (id: string) => void;
}

const TournamentsWidget: React.FC<TournamentsWidgetProps> = ({ tournaments, onViewTournament }) => {
  // Filtrar torneos: borrador, activos y en registro
  const displayedTournaments = tournaments.filter(t =>
    t.status === 'draft' || t.status === 'active' || t.status === 'registration'
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Borrador',
          classes: 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
        };
      case 'active':
        return {
          label: 'Activo',
          classes: 'bg-green-500/20 text-green-300 border border-green-500/30'
        };
      case 'registration':
        return {
          label: 'Registro Abierto',
          classes: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        };
      default:
        return {
          label: status,
          classes: 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
        };
    }
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-bold text-white">Torneos</h3>
      </div>

      {displayedTournaments.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-50" />
          <p className="text-blue-300 text-sm">No hay torneos activos</p>
          <p className="text-blue-400 text-xs mt-1">Próximamente habrá nuevos torneos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedTournaments.map((tournament) => {
            const statusBadge = getStatusBadge(tournament.status);

            return (
              <div
                key={tournament.id}
                className="bg-slate-700/40 rounded-xl p-4 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300 group"
              >
                <div className="mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.classes}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <h4 className="text-white font-bold mb-3 group-hover:text-blue-300 transition-colors">
                  {tournament.name}
                </h4>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center space-x-2 text-blue-300">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(tournament.startDate)}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-blue-300">
                    <Users className="w-4 h-4" />
                    <span>{tournament.participantCount} participantes</span>
                  </div>
                </div>

                <button
                  onClick={() => onViewTournament(tournament.id)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-400/50 rounded-lg text-blue-300 hover:text-blue-200 text-sm font-medium transition-all duration-300 group-hover:scale-105"
                >
                  <span>Más detalles</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TournamentsWidget;
