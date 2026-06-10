// src/services/navigationHelper.ts
/**
 * Helper functions để cải thiện điều hướng trong ứng dụng
 */

import { useNavigate } from 'react-router';

export type NavigationDestination = 
  | 'home' 
  | 'login' 
  | 'register' 
  | 'tours' 
  | 'destinations'
  | 'profile'
  | 'my-bookings'
  | 'admin'
  | 'provider'
  | 'tour-detail'
  | 'booking';

interface NavigationOptions {
  state?: Record<string, any>;
  replace?: boolean;
}

export function useNavigation() {
  const navigate = useNavigate();

  const navigateTo = (destination: NavigationDestination, options?: NavigationOptions) => {
    const paths: Record<NavigationDestination, string> = {
      home: '/',
      login: '/login',
      register: '/register',
      tours: '/tours',
      destinations: '/destinations',
      profile: '/profile',
      'my-bookings': '/my-bookings',
      admin: '/admin/dashboard',
      provider: '/provider/dashboard',
      'tour-detail': '/tours',
      'booking': '/booking',
    };

    navigate(paths[destination], {
      state: options?.state,
      replace: options?.replace,
    });
  };

  const navigateToTourDetail = (tourId: string) => {
    navigate(`/tours/${tourId}`);
  };

  const navigateToBooking = (tourId: string) => {
    navigate(`/booking/${tourId}`);
  };

  const navigateToDestinationTours = (destinationId: string) => {
    navigate(`/destinations/${destinationId}/tours`);
  };

  return {
    navigateTo,
    navigateToTourDetail,
    navigateToBooking,
    navigateToDestinationTours,
  };
}
