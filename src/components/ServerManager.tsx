import React, { useState, useEffect } from 'react';
import { Server, Plus, Edit, Trash2, Save, X, AlertCircle, Eye, EyeOff, Award } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface ServerData {
  id: number;
  name: string;
  ip: string;
  port: number;
  is_active: boolean;
  display_order: number;
  show_in_ranking: boolean;
  created_at: string;
  updated_at: string;
}

const ServerManager: React.FC = () => {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    port: '',
    is_active: true,
    show_in_ranking: true
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/servers/get-all.php?include_inactive=true`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setServers(data.servers);
      } else {
        setError(data.message || 'Error al cargar servidores');
      }
    } catch (err) {
      setError('Error de conexión al cargar servidores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.ip.trim() || !formData.port) {
      setError('Todos los campos son requeridos');
      return;
    }

    const port = parseInt(formData.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      setError('Puerto inválido (debe estar entre 1 y 65535)');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/servers/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          ip: formData.ip.trim(),
          port: port,
          is_active: formData.is_active ? 1 : 0,
          show_in_ranking: formData.show_in_ranking ? 1 : 0
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setFormData({ name: '', ip: '', port: '', is_active: true, show_in_ranking: true });
        setError('');
        await loadServers();
      } else {
        setError(data.message || 'Error al crear servidor');
      }
    } catch (err) {
      setError('Error de conexión al crear servidor');
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!selectedServer) return;

    if (!formData.name.trim() || !formData.ip.trim() || !formData.port) {
      setError('Todos los campos son requeridos');
      return;
    }

    const port = parseInt(formData.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      setError('Puerto inválido (debe estar entre 1 y 65535)');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/servers/update.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          id: selectedServer.id,
          name: formData.name.trim(),
          ip: formData.ip.trim(),
          port: port,
          is_active: formData.is_active ? 1 : 0,
          show_in_ranking: formData.show_in_ranking ? 1 : 0
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setSelectedServer(null);
        setFormData({ name: '', ip: '', port: '', is_active: true, show_in_ranking: true });
        setError('');
        await loadServers();
      } else {
        setError(data.message || 'Error al actualizar servidor');
      }
    } catch (err) {
      setError('Error de conexión al actualizar servidor');
      console.error(err);
    }
  };

  const handleDelete = async (serverId: number, serverName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el servidor "${serverName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/servers/delete.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id: serverId })
      });

      const data = await response.json();

      if (data.success) {
        await loadServers();
      } else {
        alert(data.message || 'Error al eliminar servidor');
      }
    } catch (err) {
      alert('Error de conexión al eliminar servidor');
      console.error(err);
    }
  };

  const openEditModal = (server: ServerData) => {
    setSelectedServer(server);
    setFormData({
      name: server.name,
      ip: server.ip,
      port: server.port.toString(),
      is_active: server.is_active,
      show_in_ranking: server.show_in_ranking
    });
    setError('');
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedServer(null);
    setFormData({ name: '', ip: '', port: '', is_active: true, show_in_ranking: true });
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <Server className="w-6 h-6 text-blue-400" />
          <span>Gestión de Servidores</span>
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Servidor</span>
        </button>
      </div>

      <div className="space-y-4">
        {servers.length === 0 ? (
          <div className="text-center py-8 text-blue-300">
            No hay servidores configurados
          </div>
        ) : (
          servers.map((server) => (
            <div key={server.id} className="bg-slate-700/40 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <Server className={`w-6 h-6 ${server.is_active ? 'text-blue-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-white">{server.name}</h4>
                      {!server.is_active && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">
                          Inactivo
                        </span>
                      )}
                      {server.show_in_ranking && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs flex items-center space-x-1">
                          <Award className="w-3 h-3" />
                          <span>Ranking</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-blue-400">
                      <code className="bg-slate-800/60 px-2 py-1 rounded font-mono">
                        {server.ip}:{server.port}
                      </code>
                      <span>Orden: {server.display_order}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(server)}
                    className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                    title="Editar servidor"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(server.id, server.name)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-300 transition-colors"
                    title="Eliminar servidor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {showCreateModal ? 'Agregar Servidor' : 'Editar Servidor'}
              </h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Nombre del Servidor
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Servidor Principal"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Dirección IP
                </label>
                <input
                  type="text"
                  value={formData.ip}
                  onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  placeholder="192.168.1.100"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Puerto
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  placeholder="7777"
                  min="1"
                  max="65535"
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-700/40 rounded-xl">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-blue-600/30 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-blue-300 flex items-center space-x-2 cursor-pointer">
                  {formData.is_active ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Servidor activo</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Servidor inactivo</span>
                    </>
                  )}
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-700/40 rounded-xl">
                <input
                  type="checkbox"
                  id="show_in_ranking"
                  checked={formData.show_in_ranking}
                  onChange={(e) => setFormData({ ...formData, show_in_ranking: e.target.checked })}
                  className="rounded border-blue-600/30 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="show_in_ranking" className="text-blue-300 flex items-center space-x-2 cursor-pointer">
                  <Award className="w-4 h-4" />
                  <span>Mostrar en ranking</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={showCreateModal ? handleCreate : handleUpdate}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{showCreateModal ? 'Crear Servidor' : 'Guardar Cambios'}</span>
                </button>

                <button
                  onClick={closeModals}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
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

export default ServerManager;
