import React, { useState, useEffect } from 'react';
import { Users, Plus, UserMinus, Clock, CheckCircle, XCircle, AlertTriangle, User, Shield, MessageSquare, Calendar, Eye, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface MemberRequest {
  id: string;
  clanId: string;
  clanName: string;
  clanTag: string;
  requestedBy: {
    id: string;
    username: string;
    avatar: string;
  };
  targetUser: {
    id: string;
    username: string;
    avatar: string;
  };
  action: 'add' | 'remove';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

interface ClanMemberManagerProps {
  clanId: string;
  clanTag: string;
  isLeader: boolean;
}


const ClanMemberManager: React.FC<ClanMemberManagerProps> = ({ clanId, clanTag, isLeader }) => {
  const { user, users } = useAuth();
  const [requests, setRequests] = useState<MemberRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MemberRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newRequest, setNewRequest] = useState({
    action: 'add' as 'add' | 'remove',
    targetUserId: '',
    reason: ''
  });

  const [reviewData, setReviewData] = useState({
    decision: 'approved' as 'approved' | 'rejected',
    adminNotes: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/clans/get-member-requests.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.targetUserId) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/clans/request-member-action.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          clanId,
          action: newRequest.action,
          targetUserId: newRequest.targetUserId,
          reason: newRequest.reason
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowRequestModal(false);
        setNewRequest({ action: 'add', targetUserId: '', reason: '' });
        loadRequests();
        alert(data.message);
      } else {
        alert(data.message || 'Error al enviar la solicitud');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewRequest = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/clans/review-member-request.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          requestId: selectedRequest.id,
          decision: reviewData.decision,
          adminNotes: reviewData.adminNotes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowReviewModal(false);
        setSelectedRequest(null);
        setReviewData({ decision: 'approved', adminNotes: '' });
        loadRequests();
        alert(data.message);
      } else {
        alert(data.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error reviewing request:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getActionText = (action: string) => {
    return action === 'add' ? 'Agregar' : 'Expulsar';
  };

  const getActionColor = (action: string) => {
    return action === 'add' ? 'text-green-400' : 'text-red-400';
  };

  const getActionIcon = (action: string) => {
    return action === 'add' ? Plus : UserMinus;
  };

  // Filtrar usuarios según la acción
  const getAvailableUsers = () => {
    if (newRequest.action === 'add') {
      // Para agregar: usuarios sin clan
      return users.filter(u => !u.clan && u.isActive && u.id !== user?.id);
    } else {
      // Para expulsar: usuarios del clan actual (excepto el líder)
      return users.filter(u => u.clan === clanTag && u.isActive && u.id !== user?.id);
    }
  };

  const canManageMembers = isLeader || user?.role === 'admin';

  if (!canManageMembers) {
    return null;
  }

  return (
    <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-blue-700/30 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-xl font-bold text-white">Gestión de Miembros</h3>
            <p className="text-blue-300">Solicitudes para agregar o expulsar miembros del clan</p>
          </div>
        </div>
        
        {isLeader && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Solicitud</span>
          </button>
        )}
      </div>

      {/* Lista de solicitudes */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No hay solicitudes</h3>
          <p className="text-blue-300">
            {isLeader ? 'Puedes crear una nueva solicitud para gestionar miembros' : 'No hay solicitudes pendientes de revisión'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            const ActionIcon = getActionIcon(request.action);
            
            return (
              <div
                key={request.id}
                className="bg-slate-700/40 rounded-xl p-6 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar del usuario objetivo */}
                    <img
                      src={request.targetUser.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=48&h=48&fit=crop'}
                      alt={request.targetUser.username}
                      className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <ActionIcon className={`w-5 h-5 ${getActionColor(request.action)}`} />
                        <h4 className="text-lg font-bold text-white">
                          {getActionText(request.action)} a {request.targetUser.username}
                        </h4>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{request.status === 'pending' ? 'Pendiente' : request.status === 'approved' ? 'Aprobada' : 'Rechazada'}</span>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400">Solicitado por:</span>
                            <span className="text-white font-medium">{request.requestedBy.username}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-4 h-4 text-purple-400" />
                            <span className="text-blue-400">Clan:</span>
                            <span className="text-purple-300 font-mono">[{request.clanTag}] {request.clanName}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-green-400" />
                            <span className="text-blue-400">Fecha:</span>
                            <span className="text-white">{formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div>
                          {request.reason && (
                            <div className="mb-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-yellow-400" />
                                <span className="text-blue-400">Razón:</span>
                              </div>
                              <p className="text-blue-200 text-sm bg-slate-600/40 p-2 rounded">{request.reason}</p>
                            </div>
                          )}
                          
                          {request.reviewedBy && (
                            <div className="mb-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <Shield className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-400">Revisado por:</span>
                                <span className="text-white font-medium">{request.reviewedBy}</span>
                              </div>
                              {request.reviewedAt && (
                                <p className="text-blue-400 text-xs">{formatDate(request.reviewedAt)}</p>
                              )}
                            </div>
                          )}
                          
                          {request.adminNotes && (
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <FileText className="w-4 h-4 text-orange-400" />
                                <span className="text-blue-400">Notas del admin:</span>
                              </div>
                              <p className="text-blue-200 text-sm bg-slate-600/40 p-2 rounded">{request.adminNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex items-center space-x-2 ml-4">
                    {user?.role === 'admin' && request.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowReviewModal(true);
                        }}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 transition-colors"
                        title="Revisar solicitud"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para nueva solicitud */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Nueva Solicitud de Gestión</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tipo de acción */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-3">Acción a Realizar</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewRequest({ ...newRequest, action: 'add', targetUserId: '' })}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                      newRequest.action === 'add'
                        ? 'bg-green-600/20 border-green-500/30 text-green-300'
                        : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                    }`}
                  >
                    <Plus className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Agregar Miembro</div>
                      <div className="text-xs opacity-75">Invitar usuario al clan</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setNewRequest({ ...newRequest, action: 'remove', targetUserId: '' })}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                      newRequest.action === 'remove'
                        ? 'bg-red-600/20 border-red-500/30 text-red-300'
                        : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                    }`}
                  >
                    <UserMinus className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Expulsar Miembro</div>
                      <div className="text-xs opacity-75">Remover usuario del clan</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Selección de usuario */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Usuario {newRequest.action === 'add' ? 'a Agregar' : 'a Expulsar'}
                </label>
                <select
                  value={newRequest.targetUserId}
                  onChange={(e) => setNewRequest({ ...newRequest, targetUserId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar usuario</option>
                  {getAvailableUsers().map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
                {getAvailableUsers().length === 0 && (
                  <p className="text-yellow-400 text-sm mt-2">
                    {newRequest.action === 'add' 
                      ? 'No hay usuarios disponibles para agregar (sin clan)' 
                      : 'No hay miembros del clan para expulsar'
                    }
                  </p>
                )}
              </div>

              {/* Razón */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Razón (Opcional)
                </label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Explica la razón de esta solicitud..."
                />
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSubmitRequest}
                  disabled={!newRequest.targetUserId || isSubmitting}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Enviar Solicitud</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowRequestModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para revisar solicitud (solo admins) */}
      {showReviewModal && selectedRequest && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-700/30 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Revisar Solicitud</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-blue-300 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información de la solicitud */}
              <div className="bg-slate-700/40 rounded-xl p-4">
                <h4 className="text-lg font-bold text-white mb-3">Detalles de la Solicitud</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-400">Acción: <span className="text-white font-medium">{getActionText(selectedRequest.action)}</span></p>
                    <p className="text-blue-400">Usuario objetivo: <span className="text-white font-medium">{selectedRequest.targetUser.username}</span></p>
                    <p className="text-blue-400">Clan: <span className="text-purple-300 font-mono">[{selectedRequest.clanTag}] {selectedRequest.clanName}</span></p>
                  </div>
                  <div>
                    <p className="text-blue-400">Solicitado por: <span className="text-white font-medium">{selectedRequest.requestedBy.username}</span></p>
                    <p className="text-blue-400">Fecha: <span className="text-white">{formatDate(selectedRequest.createdAt)}</span></p>
                  </div>
                </div>
                {selectedRequest.reason && (
                  <div className="mt-3">
                    <p className="text-blue-400 mb-1">Razón:</p>
                    <p className="text-blue-200 bg-slate-600/40 p-2 rounded">{selectedRequest.reason}</p>
                  </div>
                )}
              </div>

              {/* Decisión */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-3">Decisión</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReviewData({ ...reviewData, decision: 'approved' })}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                      reviewData.decision === 'approved'
                        ? 'bg-green-600/20 border-green-500/30 text-green-300'
                        : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                    }`}
                  >
                    <CheckCircle className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Aprobar</div>
                      <div className="text-xs opacity-75">Ejecutar la acción</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setReviewData({ ...reviewData, decision: 'rejected' })}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                      reviewData.decision === 'rejected'
                        ? 'bg-red-600/20 border-red-500/30 text-red-300'
                        : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-700/60'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Rechazar</div>
                      <div className="text-xs opacity-75">Denegar la solicitud</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Notas del administrador */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  Notas del Administrador (Opcional)
                </label>
                <textarea
                  value={reviewData.adminNotes}
                  onChange={(e) => setReviewData({ ...reviewData, adminNotes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Comentarios adicionales sobre la decisión..."
                />
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleReviewRequest}
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-white font-medium transition-colors ${
                    reviewData.decision === 'approved'
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-600/50'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-red-600/50'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      {reviewData.decision === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{reviewData.decision === 'approved' ? 'Aprobar' : 'Rechazar'} Solicitud</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowReviewModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600/50 rounded-xl text-white font-medium transition-colors"
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

export default ClanMemberManager;