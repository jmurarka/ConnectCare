import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/notifications');
      setNotifications(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.post(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E5E2] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#F7F7F5] border-b border-[#E5E5E2]">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-[#174A7E]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors flex items-start space-x-3 ${
                    n.is_read ? 'bg-white text-gray-600' : 'bg-blue-50/50 text-gray-900 font-medium'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'assignment_graded' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : n.type === 'at_risk_alert' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Info className="w-4 h-4 text-[#174A7E]" />
                    )}
                  </div>

                  <div className="flex-1 text-xs">
                    <p className="leading-snug">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                    </p>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="shrink-0 text-[10px] font-semibold text-[#174A7E] hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
