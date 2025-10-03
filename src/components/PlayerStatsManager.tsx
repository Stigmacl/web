import React, { useState, useEffect } from 'react';
import { User, Trophy, Star, Target, Award, Crown, Plus, Save, X, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PlayerStatsManager: React.FC = () => {
  const { users } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [playerTitles, setPlayerTitles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [editingStats, setEditingStats] = useState<any>(null);
  const [newTitle, setNewTitle] = useState({ title: '', tournament_name: '' });

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setIsLoading(true);
    try {
      const statsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/player_stats`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      const stats = await statsResponse.json();
      setPlayerStats(stats || []);

      const titlesResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/player_titles?order=awarded_date.desc`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      const titles = await titlesResponse.json();
      setPlayerTitles(titles || []);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserStats = (userId: string) => {
    return playerStats.find(s => s.user_id === userId);
  };

  const getUserTitles = (userId: string) => {
    return playerTitles.filter(t => t.user_id === userId);
  };

  const handleEditStats = (user: any) => {
    const stats = getUserStats(user.id);
    setSelectedUser(user);
    setEditingStats(stats || {
      user_id: user.id,
      best_streak: 0,
      total_kills: 0,
      total_deaths: 0,
      is_champion: false
    });
    setShowStatsModal(true);
  };

  const handleSaveStats = async () => {
    try {
      const existingStats = getUserStats(editingStats.user_id);
      const method = existingStats ? 'PATCH' : 'POST';
      const url = existingStats
        ? `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/player_stats?user_id=eq.${editingStats.user_id}`
        : `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/player_stats`;

      const response = await fetch(url, {
        method,
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(editingStats)
      });

      if (response.ok) {
        await loadAllStats();
        setShowStatsModal(false);
        setEditingStats(null);
        setSelectedUser(null);
      } else {
        alert('Error al guardar estadísticas');
      }
    } catch (error) {
      console.error('Error saving stats:', error);
      alert('Error al guardar estadísticas');
    }
  };

  const handleAddTitle = (user: any) => {
    setSelectedUser(user);
    setNewTitle({ title: '', tournament_name: '' });
    setShowTitleModal(true);
  };

  const handleSaveTitle = async () => {
    if (!newTitle.title.trim() || !newTitle.tournament_name.trim()) {
      alert('Completa todos los campos');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/player_titles`, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          title: newTitle.title,
          tournament_name: newTitle.tournament_name
        })
      });

      if (response.ok) {
        await loadAllStats();
        setShowTitleModal(false);
        setNewTitle({ title: '', tournament_name: '' });
        setSelectedUser(null);
      } else {
        alert('Error al agregar título');
      }
    } catch (error) {
      console.error('Error adding title:', error);
      alert('Error al agregar título');
    }
  };

  const handleDeleteTitle = async (titleId: string) => {
    if (!confirm('¿Estás seguro de eliminar este título?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/player_titles?id=eq.${titleId}`, {
        method: 'DELETE',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (response.ok) {
        await loadAllStats();
      } else {
        alert('Error al eliminar título');
      }
    } catch (error) {
      console.error('Error deleting title:', error);
      alert('Error al eliminar título');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <span>Gestión de Estadísticas de Jugadores</span>
        </h3>

        <div className="space-y-4">
          {users.map((user) => {
            const stats = getUserStats(user.id);
            const titles = getUserTitles(user.id);

            return (
              <div key={user.id} className="bg-slate-700/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=48&h=48&fit=crop'}
                      alt={user.username}
                      className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                    />
                    <div>
                      <h4 className="font-bold text-white flex items-center space-x-2">
                        <span>{user.username}</span>
                        {stats?.is_champion && (
                          <Crown className="w-4 h-4 text-yellow-400" title="Campeón" />
                        )}
                      </h4>
                      <p className="text-sm text-blue-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditStats(user)}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                      title="Editar estadísticas"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAddTitle(user)}
                      className="p-2 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-lg text-yellow-300 transition-colors"
                      title="Agregar título"
                    >
                      <Award className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-blue-300">Estadísticas</h5>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-slate-600/40 rounded-lg p-2 text-center">
                        <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                        <p className="text-white font-bold">{stats?.best_streak || 0}</p>
                        <p className="text-blue-300 text-xs">Racha</p>
                      </div>
                      <div className="bg-slate-600/40 rounded-lg p-2 text-center">
                        <Trophy className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <p className="text-white font-bold">{stats?.total_kills || 0}</p>
                        <p className="text-blue-300 text-xs">Kills</p>
                      </div>
                      <div className="bg-slate-600/40 rounded-lg p-2 text-center">
                        <Target className="w-4 h-4 text-red-400 mx-auto mb-1" />
                        <p className="text-white font-bold">{stats?.total_deaths || 0}</p>
                        <p className="text-blue-300 text-xs">Muertes</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-blue-300">Títulos ({titles.length})</h5>
                    {titles.length > 0 ? (
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {titles.map((title) => (
                          <div key={title.id} className="flex items-center justify-between bg-yellow-500/10 rounded-lg p-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-yellow-300 text-xs font-semibold truncate">{title.title}</p>
                              <p className="text-yellow-400 text-xs truncate">{title.tournament_name}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteTitle(title.id)}
                              className="ml-2 p-1 hover:bg-red-600/40 rounded text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs">Sin títulos</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showStatsModal && editingStats && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Estadísticas</h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Jugador</label>
                <p className="text-white font-bold">{selectedUser?.username}</p>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Mejor Racha</label>
                <input
                  type="number"
                  min="0"
                  value={editingStats.best_streak}
                  onChange={(e) => setEditingStats({ ...editingStats, best_streak: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Total Kills</label>
                <input
                  type="number"
                  min="0"
                  value={editingStats.total_kills}
                  onChange={(e) => setEditingStats({ ...editingStats, total_kills: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Total Muertes</label>
                <input
                  type="number"
                  min="0"
                  value={editingStats.total_deaths}
                  onChange={(e) => setEditingStats({ ...editingStats, total_deaths: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_champion"
                  checked={editingStats.is_champion}
                  onChange={(e) => setEditingStats({ ...editingStats, is_champion: e.target.checked })}
                  className="rounded border-blue-600/30"
                />
                <label htmlFor="is_champion" className="text-blue-300 flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span>Es Campeón</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveStats}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTitleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Agregar Título</h3>
              <button
                onClick={() => setShowTitleModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Jugador</label>
                <p className="text-white font-bold">{selectedUser?.username}</p>
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Título</label>
                <input
                  type="text"
                  value={newTitle.title}
                  onChange={(e) => setNewTitle({ ...newTitle, title: e.target.value })}
                  placeholder="Ej: Campeón, Subcampeón, 3er Lugar"
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">Torneo</label>
                <input
                  type="text"
                  value={newTitle.tournament_name}
                  onChange={(e) => setNewTitle({ ...newTitle, tournament_name: e.target.value })}
                  placeholder="Nombre del torneo"
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveTitle}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
                <button
                  onClick={() => setShowTitleModal(false)}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStatsManager;
