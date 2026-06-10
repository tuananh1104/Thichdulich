import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { TourManagementProvider } from './contexts/TourManagementContext';
import { FavoriteProvider } from './contexts/FavoriteContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <TourManagementProvider>
        <FavoriteProvider>
          <BookingProvider>
            <LanguageProvider>
              <Suspense fallback={<div className="min-h-screen bg-white" />}>
                <RouterProvider router={router} />
              </Suspense>
            </LanguageProvider>
          </BookingProvider>
        </FavoriteProvider>
      </TourManagementProvider>
    </AuthProvider>
  );
}
