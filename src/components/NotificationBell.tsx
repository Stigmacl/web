import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  userId: string;
  type: 'forum_reply' | 'forum_quote' | 'post_reply';
  referenceId: string;
  referenceType: string;
  fromUserId: string;
  fromUsername: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

const getApiBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  if (hostname === 'localhost' && port === '5173') {
    return 'http://localhost/api';
  }

  if (port && port !== '80' && port !== '443') {
    return `${protocol}//${hostname}:${port}/api`;
  }

  return `${protocol}//${hostname}/api`;
};

const API_BASE_URL = getApiBaseUrl();

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/get-all.php`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-read.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ notificationId })
      });

      const data = await response.json();

      if (data.success) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-read.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ markAll: true })
      });

      const data = await response.json();

      if (data.success) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.referenceType === 'forum_topic') {
      const event = new CustomEvent('navigate-to-section', { detail: 'forum' });
      window.dispatchEvent(event);
    }

    setShowDropdown(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    if (diffInMinutes < 10080) return `Hace ${Math.floor(diffInMinutes / 1440)} d`;

    return date.toLocaleDateString('es-CL', {
      month: 'short',
      day: 'numeric'
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 transition-colors"
      >
        <Bell className="w-6 h-6 text-blue-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-slate-800 rounded-xl border border-blue-700/30 shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-blue-700/30 flex items-center justify-between bg-slate-700/40">
            <div>
              <h3 className="text-lg font-bold text-white">Notificaciones</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-blue-300">{unreadCount} sin leer</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition-colors disabled:opacity-50"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="p-2 rounded-lg bg-slate-600/40 hover:bg-slate-600/60 text-blue-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-50" />
                <p className="text-blue-300">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-blue-700/20">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors ${
                      notification.isRead
                        ? 'bg-slate-800/40 hover:bg-slate-800/60'
                        : 'bg-blue-900/20 hover:bg-blue-900/30'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          )}
                          <p className="font-semibold text-white text-sm truncate">
                            {notification.title}
                          </p>
                        </div>
                        <p className="text-blue-200 text-sm mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-blue-400 text-xs">
                            {formatDate(notification.createdAt)}
                          </p>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Marcar leída</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
