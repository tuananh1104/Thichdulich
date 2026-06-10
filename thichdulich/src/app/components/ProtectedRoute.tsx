import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('user' | 'admin' | 'provider')[];
}

export type UserRole = 'user' | 'admin' | 'provider';

export function getHomePathForRole(role: UserRole): string {
  if (role === 'admin') return '/admin/overview';
  if (role === 'provider') return '/provider/overview';
  return '/';
}

export function getPostLoginPathForRole(role: UserRole, returnTo?: string): string {
  if (role === 'admin' || role === 'provider') {
    return getHomePathForRole(role);
  }

  return returnTo || getHomePathForRole(role);
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
          Đang kiểm tra quyền truy cập...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ returnTo: `${location.pathname}${location.search}` }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

/** Chỉ cho khách — đã đăng nhập thì chuyển về trang phù hợp */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
          Đang kiểm tra phiên đăng nhập...
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const dest = getPostLoginPathForRole(user.role, returnTo);
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
}
