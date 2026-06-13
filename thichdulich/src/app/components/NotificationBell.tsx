import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  tone?: 'dark' | 'light';
}

export function NotificationBell({ tone = 'light' }: NotificationBellProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!isAuthenticated || !user || document.hidden) return;
    try {
      const [items, count] = await Promise.all([
        api.getNotifications(10),
        api.getNotificationUnreadCount(),
      ]);
      setNotifications(items || []);
      setUnreadCount(count || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 20000);
    const onVisibilityChange = () => {
      if (!document.hidden) loadNotifications();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, user?.id]);

  const notificationTime = (value: string) => {
    const date = new Date(value);
    const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const openNotification = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await api.markNotificationRead(item.id);
      } catch {
        // Navigation should still happen if the read request fails.
      }
      setNotifications(prev => prev.map(current => current.id === item.id ? { ...current, read: true } : current));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (item.link) navigate(item.link);
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(item => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      // Keep current state if the request fails.
    }
  };

  const isDark = tone === 'dark';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200"
          style={{
            background: isDark ? 'rgba(255,255,255,0.1)' : 'white',
            border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid #E5E7EB',
            boxShadow: isDark ? 'none' : '0 1px 2px rgba(15,23,42,0.06)',
          }}
          aria-label="Thông báo"
        >
          <Bell className="h-4 w-4" style={{ color: isDark ? 'white' : '#374151' }} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-[18px] text-white shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[360px] rounded-2xl border-0 p-0 shadow-2xl z-[9999]"
        style={{ background: 'white' }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-sm font-black text-gray-900">Thông báo</p>
            <p className="text-xs text-gray-500">{unreadCount} chưa đọc</p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-40"
            disabled={unreadCount === 0}
          >
            Đánh dấu đã đọc
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-3 h-9 w-9 text-gray-200" />
              <p className="text-sm font-bold text-gray-600">Chưa có thông báo</p>
              <p className="mt-1 text-xs text-gray-400">Các cập nhật quan trọng sẽ xuất hiện ở đây.</p>
            </div>
          ) : notifications.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => openNotification(item)}
              className="flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-all hover:bg-gray-50"
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: item.read ? '#E5E7EB' : '#0064D2' }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-gray-900">{item.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-gray-500">{item.message}</span>
                <span className="mt-1 block text-[11px] font-semibold text-gray-400">{notificationTime(item.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
