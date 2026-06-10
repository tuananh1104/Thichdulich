import { lazy } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router';
import { Layout } from './components/Layout';
import { AuthLayout } from './components/AuthLayout';
import { ProtectedRoute, GuestRoute, getHomePathForRole } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const DestinationsPage = lazy(() => import('./pages/DestinationsPage').then((module) => ({ default: module.DestinationsPage })));
const DestinationToursPage = lazy(() => import('./pages/DestinationToursPage').then((module) => ({ default: module.DestinationToursPage })));
const TourDetailPage = lazy(() => import('./pages/TourDetailPage').then((module) => ({ default: module.TourDetailPage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then((module) => ({ default: module.BookingPage })));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage').then((module) => ({ default: module.MyBookingsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const ProviderPage = lazy(() => import('./pages/ProviderPage').then((module) => ({ default: module.ProviderPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })));
const OAuthSuccessPage = lazy(() => import('./pages/OAuthSuccessPage').then((module) => ({ default: module.OAuthSuccessPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

function RoleAwareHomePage() {
  const { user, loading } = useAuth();

  if (!loading && user && user.role !== 'user') {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return <HomePage />;
}

function RedirectWithSearch({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
}

export const router = createBrowserRouter([
  // ── Auth Layout (Login/Register) ──────────────────────
  {
    Component: AuthLayout,
    children: [
      {
        path: '/login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: '/register',
        element: (
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        ),
      },
      {
        path: '/verify-email',
        element: (
          <GuestRoute>
            <VerifyEmailPage />
          </GuestRoute>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        ),
      },
      {
        path: '/oauth2/success',
        Component: OAuthSuccessPage,
      },
    ],
  },
  
  // ── Admin Dashboard (NO Layout - standalone) ──────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Navigate to="/admin/overview" replace />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Navigate to="/admin/overview" replace />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/:section',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  
  // ── Provider Dashboard (NO Layout - standalone) ───────
  {
    path: '/provider',
    element: (
      <ProtectedRoute allowedRoles={['provider']}>
        <Navigate to="/provider/overview" replace />
      </ProtectedRoute>
    ),
  },
  {
    path: '/provider/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['provider']}>
        <Navigate to="/provider/overview" replace />
      </ProtectedRoute>
    ),
  },
  {
    path: '/provider/:section',
    element: (
      <ProtectedRoute allowedRoles={['provider']}>
        <ProviderPage />
      </ProtectedRoute>
    ),
  },
  
  // ── Public Pages (WITH Layout - Header/Footer) ────────
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: RoleAwareHomePage },
      { path: 'destinations', Component: DestinationsPage },
      { path: 'destinations/:id/tours', Component: DestinationToursPage },
      { path: 'tours', element: <RedirectWithSearch to="/destinations" /> },
      { path: 'tours/:id', Component: TourDetailPage },
      { 
        path: 'booking/:id', 
        element: (
          <ProtectedRoute allowedRoles={['user']}>
            <BookingPage />
          </ProtectedRoute>
        )
      },
      { 
        path: 'my-bookings', 
        element: (
          <ProtectedRoute allowedRoles={['user']}>
            <MyBookingsPage />
          </ProtectedRoute>
        )
      },
      { 
        path: 'my-bookings/:status', 
        element: (
          <ProtectedRoute allowedRoles={['user']}>
            <MyBookingsPage />
          </ProtectedRoute>
        )
      },
      { 
        path: 'profile', 
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )
      },
      { path: 'about', Component: AboutPage },
      { path: 'contact', Component: ContactPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
