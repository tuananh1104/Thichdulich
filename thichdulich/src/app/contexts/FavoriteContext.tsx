"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api, { getApiErrorMessage } from '@/services/api';
import type { Tour } from '../types/domainTypes';
import { useAuth } from './AuthContext';
import { toTour } from './TourManagementContext';
import { AIRecommendationService } from '../services/AIRecommendationService';

interface FavoriteContextType {
  favoriteIds: Set<string>;
  favoriteTours: Tour[];
  loading: boolean;
  isFavorite: (tourId: string) => boolean;
  toggleFavorite: (tour: Tour) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export function FavoriteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteTours, setFavoriteTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteTours([]);
      return;
    }

    setLoading(true);
    try {
      const data = await api.getFavorites();
      setFavoriteTours((data || []).map(toTour));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải danh sách yêu thích.'));
      setFavoriteTours([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const favoriteIds = useMemo(() => new Set(favoriteTours.map(tour => tour.id)), [favoriteTours]);

  const isFavorite = useCallback((tourId: string) => favoriteIds.has(tourId), [favoriteIds]);

  const toggleFavorite = useCallback(async (tour: Tour) => {
    if (!user) {
      return;
    }

    const currentlyFavorite = favoriteIds.has(tour.id);
    const previous = favoriteTours;
    setFavoriteTours(currentlyFavorite
      ? favoriteTours.filter(item => item.id !== tour.id)
      : [tour, ...favoriteTours]);

    try {
      if (currentlyFavorite) {
        await api.removeFavorite(tour.id);
      } else {
        const saved = await api.addFavorite(tour.id);
        setFavoriteTours(prev => [toTour(saved), ...prev.filter(item => item.id !== tour.id)]);
        AIRecommendationService.saveUserInteraction({
          userId: user.id,
          tourId: tour.id,
          action: 'bookmark',
          timestamp: new Date().toISOString(),
        });
        api.saveInteraction({ tourId: tour.id, action: 'bookmark' }).catch(() => {});
      }
    } catch (error) {
      setFavoriteTours(previous);
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật yêu thích.'));
    }
  }, [favoriteIds, favoriteTours, user?.id]);

  const value = useMemo(() => ({
    favoriteIds,
    favoriteTours,
    loading,
    isFavorite,
    toggleFavorite,
    refreshFavorites,
  }), [favoriteIds, favoriteTours, loading, isFavorite, toggleFavorite, refreshFavorites]);

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoriteProvider');
  }
  return context;
}
