import React from 'react';
import { Bell, Mail, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { organization } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications(organization?.id);

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-primary mr-2" />
          <h3 className="font-medium text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Mail className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((msg) => (
            <div
              key={msg.id}
              className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!msg.is_read ? 'bg-blue-50' : ''}`}
              onClick={() => {
                if (!msg.is_read) markRead(msg.id);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{msg.subject}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{msg.message}</p>
                </div>
                {!msg.is_read && (
                  <span className="h-2 w-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0 ml-2" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
