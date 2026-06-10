"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, Flame, Eye } from 'lucide-react';
import { useFavorites } from '../contexts/FavoriteContext';
import type { Tour } from '../types/domainTypes';
import { useTourManagement } from '../contexts/TourManagementContext';
import { AIRecommendationService } from '../services/AIRecommendationService';
import { TourCard } from './TourCard';
import { prioritizeFavorites } from '../utils/favorites';

export function TrendingToursSection() {
  const { favoriteIds } = useFavorites();
  const { tours } = useTourManagement();
  const [trendingTours, setTrendingTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const avgRating = trendingTours.length > 0
    ? (trendingTours.reduce((sum, tour) => sum + Number(tour.rating || 0), 0) / trendingTours.length).toFixed(1)
    : '0.0';
  const promotionCount = trendingTours.filter(tour => tour.promotionActive).length;

  useEffect(() => {
    const loadTrending = () => {
      setLoading(true);
      const trending = AIRecommendationService.getTrendingTours(tours, 8);
      setTrendingTours(prioritizeFavorites(trending, favoriteIds));
      setLoading(false);
    };

    loadTrending();
  }, [favoriteIds, tours]);

  if (trendingTours.length === 0 && !loading) return null;

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 right-10 w-64 h-64 bg-orange-200 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-red-200 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Trending Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-4 animate-pulse" style={{
            background: 'linear-gradient(135deg, #FF6B00, #FF0080)',
            boxShadow: '0 4px 20px rgba(255,107,0,0.3)'
          }}>
            <Flame className="w-5 h-5 text-yellow-200" />
            <span className="text-white font-bold text-sm">
              ĐANG HOT NHẤT
            </span>
            <TrendingUp className="w-5 h-5 text-yellow-200" />
          </div>

          <h2 className="text-gray-900 mb-4" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900 }}>
            Tours <span style={{
              background: 'linear-gradient(135deg, #FF6B00, #FF0080)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>hot nhất</span> hiện nay
          </h2>

          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Được nhiều du khách quan tâm và đặt tour nhất trong thời gian gần đây
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C42)' }}>
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ color: '#FF6B00' }}>{trendingTours.length}</p>
                  <p className="text-xs text-gray-600 font-medium">
                    Tour đang nổi bật
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF0080, #FF42A5)' }}>
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ color: '#FF0080' }}>{promotionCount}</p>
                  <p className="text-xs text-gray-600 font-medium">
                    Tour có ưu đãi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9333EA, #C026D3)' }}>
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ color: '#9333EA' }}>{avgRating}</p>
                  <p className="text-xs text-gray-600 font-medium">
                    Điểm trung bình
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-red-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gradient-to-r from-orange-100 to-red-100 rounded w-3/4" />
                  <div className="h-3 bg-gradient-to-r from-orange-100 to-red-100 rounded w-full" />
                  <div className="h-3 bg-gradient-to-r from-orange-100 to-red-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tours Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingTours.map((tour, index) => (
              <div key={tour.id} className="relative">
                {/* Trending Rank Badge */}
                {index < 3 && (
                  <div
                    className="absolute -top-2 -left-2 z-20 w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-lg"
                    style={{
                      background: index === 0
                        ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : index === 1
                        ? 'linear-gradient(135deg, #C0C0C0, #808080)'
                        : 'linear-gradient(135deg, #CD7F32, #8B4513)'
                    }}
                  >
                    #{index + 1}
                  </div>
                )}

                {/* Hot Badge */}
                <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-lg" style={{ background: 'rgba(255,107,0,0.95)' }}>
                  <Flame className="w-3 h-3 text-yellow-200 animate-pulse" />
                  <span className="text-white text-xs font-bold">HOT</span>
                </div>

                <TourCard tour={tour} />
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => window.location.href = '/tours'}
            className="px-8 py-4 rounded-xl font-bold text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #FF0080)' }}
          >
            Xem tất cả tour
          </button>
        </div>
      </div>
    </section>
  );
}
