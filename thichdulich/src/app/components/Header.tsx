import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  User, LogOut, Menu, X, ChevronDown,
  Map, Home, Star, BookOpen, Building2, Shield,
  Ticket, Bell
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { getHomePathForRole } from './ProtectedRoute';
import api from '@/services/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const LOGO_SVG = (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="url(#logoGrad)" />
    <path d="M16 7 L19.5 13.5 H24.5 L20.5 17.5 L22 24 L16 20.5 L10 24 L11.5 17.5 L7.5 13.5 H12.5 Z" fill="white" opacity="0.95" />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0064D2" />
        <stop offset="100%" stopColor="#0091FF" />
      </linearGradient>
    </defs>
  </svg>
);

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => { logout(); navigate('/'); };
  const logoTarget = user ? getHomePathForRole(user.role) : '/';

  const loadNotifications = async () => {
    if (!isAuthenticated || !user || document.hidden) return;
    try {
      const [items, count] = await Promise.all([
        api.getNotifications(10),
        api.getNotificationUnreadCount(),
      ]);
      setNotifications(items || []);
      setNotificationCount(count || 0);
    } catch {
      setNotifications([]);
      setNotificationCount(0);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setNotificationCount(0);
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

  const openNotification = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await api.markNotificationRead(item.id);
      } catch {
        // Ignore; navigation should still work.
      }
      setNotifications(prev => prev.map(current => current.id === item.id ? { ...current, read: true } : current));
      setNotificationCount(prev => Math.max(0, prev - 1));
    }
    if (item.link) navigate(item.link);
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(item => ({ ...item, read: true })));
      setNotificationCount(0);
    } catch {
      // Keep current state if the request fails.
    }
  };

  const notificationTime = (value: string) => {
    const date = new Date(value);
    const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const navItems = [
    { to: '/', label: 'Trang chủ', icon: Home },
    { to: '/destinations', label: 'Điểm đến', icon: Map },
    { to: '/about', label: 'Giới thiệu', icon: Star },
    { to: '/contact', label: 'Liên hệ', icon: BookOpen },
  ];

  const showPublicNav = !user || user.role === 'user';

  const roleColors: Record<string, string> = {
    admin: '#EF4444',
    provider: '#8B5CF6',
    user: '#0064D2',
  };

  return (
    <>
      {/* ── Top accent strip ── */}
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #0064D2 0%, #0091FF 40%, #FF6000 100%)' }} />

      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #0A2540 0%, #1E3A5F 100%)',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.28)' : '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between" style={{ height: 58 }}>

            {/* ── Logo ── */}
            <Link to={logoTarget} className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-8 h-8 flex-shrink-0 drop-shadow-lg transition-transform duration-200 group-hover:scale-105">
                {LOGO_SVG}
              </div>
              <div className="flex flex-col gap-0.5 leading-tight">
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: 'white',
                  letterSpacing: '-0.5px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  Thích Du Lịch
                </span>
                <span style={{ fontSize: '0.6rem', lineHeight: 1.25, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Du lịch Việt Nam
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden lg:flex items-center">
              {showPublicNav && navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative px-4 py-2 text-sm transition-all duration-150 rounded-lg mx-0.5 group"
                  style={{
                    color: isActive(item.to) ? 'white' : 'rgba(255,255,255,0.72)',
                    fontWeight: isActive(item.to) ? 700 : 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-lg transition-opacity duration-150 opacity-0 group-hover:opacity-100"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  />
                  <span className="relative">{item.label}</span>
                  {isActive(item.to) && (
                    <span
                      className="absolute bottom-0 left-4 right-4 rounded-full"
                      style={{ height: 2, background: 'linear-gradient(90deg, #60C8FF, #0091FF)' }}
                    />
                  )}
                </Link>
              ))}
              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  to="/admin/overview"
                  className="relative flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg mx-0.5 transition-all duration-150 group"
                  style={{ color: isActive('/admin') ? '#FCA5A5' : 'rgba(252,165,165,0.8)', fontWeight: 600 }}
                >
                  <span className="absolute inset-0 rounded-lg transition-opacity duration-150 opacity-0 group-hover:opacity-100" style={{ background: 'rgba(239,68,68,0.12)' }} />
                  <Shield className="w-3.5 h-3.5 relative" />
                  <span className="relative">Quản trị</span>
                </Link>
              )}
              {isAuthenticated && user?.role === 'provider' && (
                <Link
                  to="/provider/overview"
                  className="relative flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg mx-0.5 transition-all duration-150 group"
                  style={{ color: isActive('/provider') ? '#C4B5FD' : 'rgba(196,181,253,0.8)', fontWeight: 600 }}
                >
                  <span className="absolute inset-0 rounded-lg transition-opacity duration-150 opacity-0 group-hover:opacity-100" style={{ background: 'rgba(139,92,246,0.12)' }} />
                  <Building2 className="w-3.5 h-3.5 relative" />
                  <span className="relative">Dashboard</span>
                </Link>
              )}
            </nav>

            {/* ── Right side ── */}
            <div className="flex items-center gap-1.5">

              {isAuthenticated && user ? (
                <>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-white/15"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.18)',
                      }}
                      aria-label="Thông báo"
                    >
                      <Bell className="h-4 w-4 text-white" />
                      {notificationCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-[18px] text-white shadow-lg">
                          {notificationCount > 9 ? '9+' : notificationCount}
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
                        <p className="text-xs text-gray-500">{notificationCount} chưa đọc</p>
                      </div>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-40"
                        disabled={notificationCount === 0}
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

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/15"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.18)',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${roleColors[user.role] || '#0064D2'}, ${roleColors[user.role] || '#0064D2'}99)`,
                          color: 'white',
                          boxShadow: `0 0 0 2px rgba(255,255,255,0.2)`,
                        }}
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span
                        className="hidden md:block text-sm max-w-[88px] truncate text-white"
                        style={{ fontWeight: 600, fontSize: '0.8125rem' }}
                      >
                        {user.name}
                      </span>
                      <ChevronDown className="w-3 h-3 text-white/60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="min-w-[220px] rounded-2xl border-0 p-2 shadow-2xl z-[9999]"
                    style={{ background: 'white' }}
                  >
                    {/* User info card */}
                    <div className="px-3 py-2.5 mb-1 rounded-xl" style={{ background: '#F8FAFF' }}>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${roleColors[user.role] || '#0064D2'}, ${roleColors[user.role] || '#0064D2'}80)`, color: 'white' }}
                        >
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${roleColors[user.role] || '#0064D2'}18`,
                            color: roleColors[user.role] || '#0064D2',
                          }}
                        >
                          {user.role === 'admin' ? '⚙️ Admin' : user.role === 'provider' ? '🏢 Provider' : '👤 Khách hàng'}
                        </span>
                      </div>
                    </div>

                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2.5 rounded-xl cursor-pointer text-sm py-2.5 px-3 text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4 text-gray-400" />
                        Hồ sơ của tôi
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'user' && (
                      <DropdownMenuItem asChild>
                        <Link to="/my-bookings" className="flex items-center gap-2.5 rounded-xl cursor-pointer text-sm py-2.5 px-3 text-gray-700 hover:bg-gray-50">
                          <Ticket className="w-4 h-4 text-gray-400" />
                          Tour đã đặt
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {user.role === 'provider' && (
                      <DropdownMenuItem asChild>
                        <Link to="/provider/overview" className="flex items-center gap-2.5 rounded-xl cursor-pointer text-sm py-2.5 px-3 hover:bg-purple-50" style={{ color: '#7C3AED' }}>
                          <Building2 className="w-4 h-4" />
                          Dashboard Provider
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/overview" className="flex items-center gap-2.5 rounded-xl cursor-pointer text-sm py-2.5 px-3 hover:bg-red-50" style={{ color: '#DC2626' }}>
                          <Shield className="w-4 h-4" />
                          Quản trị hệ thống
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="my-1.5 bg-gray-100" />
                    <DropdownMenuItem
                      onClick={() => setShowLogoutModal(true)}
                      className="flex items-center gap-2.5 rounded-xl text-red-500 cursor-pointer text-sm py-2.5 px-3 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link to="/login">
                    <button
                      className="px-4 py-2 text-sm rounded-xl transition-all duration-150 hover:bg-white/12"
                      style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: '-0.01em' }}
                    >
                      Đăng nhập
                    </button>
                  </Link>
                  <Link to="/register">
                    <button
                      className="px-5 py-2 text-sm rounded-xl text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-px active:translate-y-0"
                      style={{
                        background: 'linear-gradient(135deg, #FF6000, #FF8C00)',
                        fontWeight: 700,
                        boxShadow: '0 2px 10px rgba(255,96,0,0.35)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Đăng ký miễn phí
                    </button>
                  </Link>
                </div>
              )}

              {/* Mobile toggle */}
              <button
                className="lg:hidden p-2 rounded-xl transition-all duration-150 hover:bg-white/10 text-white ml-1"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ── Mobile Menu ── */}
          {mobileMenuOpen && (
            <div
              className="lg:hidden pb-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
            >
              <nav className="flex flex-col gap-0.5 pt-2">
                {showPublicNav && navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all"
                    style={{
                      color: isActive(item.to) ? 'white' : 'rgba(255,255,255,0.75)',
                      fontWeight: isActive(item.to) ? 700 : 500,
                      background: isActive(item.to) ? 'rgba(255,255,255,0.12)' : 'transparent',
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
                {isAuthenticated && user?.role === 'admin' && (
                  <Link to="/admin/overview" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-red-500/20" style={{ color: '#FCA5A5' }}>
                    <Shield className="w-4 h-4" /> Quản trị
                  </Link>
                )}
                {isAuthenticated && user?.role === 'provider' && (
                  <Link to="/provider/overview" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-purple-500/20" style={{ color: '#C4B5FD' }}>
                    <Building2 className="w-4 h-4" /> Dashboard
                  </Link>
                )}

                <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

                {!isAuthenticated ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to="/login">
                      <button className="w-full py-3 text-sm font-semibold rounded-xl text-white transition-all hover:bg-white/15" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                        Đăng nhập
                      </button>
                    </Link>
                    <Link to="/register">
                      <button className="w-full py-3 text-sm font-bold rounded-xl text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #FF6000, #FF8C00)' }}>
                        Đăng ký
                      </button>
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ color: '#FCA5A5', background: 'rgba(239,68,68,0.12)' }}
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
