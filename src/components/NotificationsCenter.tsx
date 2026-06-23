/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Sparkles, 
  Clock, 
  Trophy, 
  DollarSign, 
  Smartphone, 
  CreditCard 
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsCenterProps {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function NotificationsCenter({
  notifications,
  setNotifications,
  isOpen,
  setIsOpen
}: NotificationsCenterProps) {
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'deposit':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal':
        return <CreditCard className="w-4 h-4 text-red-400" />;
      case 'jackpot':
        return <Sparkles className="w-4 h-4 text-[#fbbf24] animate-bounce" />;
      case 'tournament':
        return <Trophy className="w-4 h-4 text-purple-400" />;
      case 'vip':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-purple-305" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-14 w-80 bg-[#120a24]/95 border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_25px_rgba(147,51,234,0.30)] z-50 text-white flex flex-col max-h-[460px] overflow-hidden">
      
      <div className="flex justify-between items-center pb-2 border-b border-purple-900/30 select-none">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-black uppercase tracking-wider">Alert Center ({unreadCount})</span>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[9px] text-[#fbbf24] font-bold hover:underline"
            >
              Mark all read
            </button>
          )}
          <button 
            onClick={() => setIsOpen(false)}
            className="text-[9px] text-gray-500 hover:text-white font-bold"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-purple-900/10 py-1 space-y-1">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            className={`p-2.5 rounded transition-all flex gap-3 ${notif.read ? 'opacity-70 bg-black/10' : 'bg-[#190d34]/60 border-l-2 border-amber-500'}`}
          >
            <div className="w-7 h-7 rounded-full bg-[#27144e] flex items-center justify-center shrink-0">
              {getIconForType(notif.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-1">
                <h5 className={`text-[10px] uppercase font-black truncate ${notif.read ? 'text-gray-400' : 'text-amber-400'}`}>
                  {notif.title}
                </h5>
                <span className="text-[7px] text-gray-500 font-mono shrink-0 pt-0.5">{notif.timestamp}</span>
              </div>
              <p className="text-[10px] text-purple-200 mt-0.5 leading-normal font-sans">
                {notif.message}
              </p>

              <div className="flex items-center justify-between mt-1 text-[7px] text-gray-500 font-mono">
                <span className="uppercase">Channel: {notif.channel}</span>
                <button 
                  onClick={() => deleteNotification(notif.id)}
                  className="hover:text-red-400 transition-colors flex items-center gap-0.5"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-xs font-sans">
            Lobby notification center cleared.
          </div>
        )}
      </div>

    </div>
  );
}
