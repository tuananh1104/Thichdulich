import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from './ui/sonner';
import { AIChatbot } from './AIChatbot';

export function Layout() {
  const location = useLocation();
  const isBookingFlow = location.pathname.startsWith('/booking/');
  const isAccountPage = location.pathname === '/my-bookings' || location.pathname === '/profile';
  const hideFooter = isBookingFlow || isAccountPage;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {!isBookingFlow && <Header />}
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
      <Toaster />
      <AIChatbot />
    </div>
  );
}
