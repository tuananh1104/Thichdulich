"use client";

import { useState } from 'react';
import { Link } from 'react-router';
import { MapPin, Clock, Star, Heart, ArrowRight } from 'lucide-react';
import type { Tour } from '../types/domainTypes';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoriteContext';
import { AIRecommendationService } from '../services/AIRecommendationService';
import api from '@/services/api';
import { cleanText } from '../utils/text';
import { getTourImage } from '../utils/tourImages';
import { getTourTypeLabel } from '../utils/labels';

interface TourCardProps {
  tour: Tour;
  featured?: boolean;
}

const TYPE_META: Record<string, string> = {
  beach: 'Biển đảo',
  nature: 'Thiên nhiên',
  culture: 'Văn hóa',
  cultural: 'Văn hóa',
  mountain: 'Núi non',
  adventure: 'Phiêu lưu',
  city: 'Thành phố',
  food: 'Ẩm thực',
};

export function TourCard({ tour, featured = false }: TourCardProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imgError, setImgError] = useState(false);

  const formatVND = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  const name = cleanText(tour.name.vi || tour.name.en);
  const desc = cleanText(tour.description.vi || tour.description.en);
  const location = cleanText(tour.location);
  const image = imgError ? getTourImage(undefined, tour) : getTourImage(tour.image, tour);
  const reviewCount = tour.reviews || 0;
  const hasReviews = reviewCount > 0;
  const hasPromotion = Boolean(
    tour.promotionActive &&
    tour.originalPrice &&
    tour.originalPrice > tour.price &&
    tour.promotionStatus !== 'pending'
  );

  const handleClick = () => {
    if (!user) return;
    AIRecommendationService.saveUserInteraction({
      userId: user.id,
      tourId: tour.id,
      action: 'click',
      timestamp: new Date().toISOString(),
    });
    api.saveInteraction({ tourId: tour.id, action: 'click' }).catch(() => {});
  };

  const handleWishlist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(tour);
  };

  const wishlisted = isFavorite(tour.id);

  return (
    <Link
      to={`/tours/${tour.id}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
      onClick={handleClick}
    >
      <article
        className="bg-white rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col"
        style={{
          boxShadow: '0 1px 6px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className={`relative overflow-hidden flex-shrink-0 ${featured ? 'h-56' : 'h-48'}`}>
          <img
            src={image}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 45%, rgba(0,0,0,0.08) 100%)' }}
          />

          <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-white bg-black/45 backdrop-blur-sm">
            {getTourTypeLabel(tour.type, 'Tour')}
          </span>

          {hasReviews && (
            <div className="absolute top-3 right-10 flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 backdrop-blur-sm">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-gray-900">{tour.rating || 0}</span>
            </div>
          )}

          <button
            onClick={handleWishlist}
            className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-90"
            style={{ background: wishlisted ? '#FF6000' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
            aria-label={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
          >
            <Heart
              className="w-3.5 h-3.5"
              fill={wishlisted ? 'white' : 'none'}
              stroke={wishlisted ? 'white' : '#6B7280'}
              strokeWidth={2}
            />
          </button>

          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm">
            <Clock className="w-3 h-3 text-white/80" />
            <span className="text-xs font-semibold text-white">{tour.duration} ngày</span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#0064D2' }} />
            <span className="text-xs font-medium truncate" style={{ color: '#6B7280' }}>{location}</span>
          </div>

          <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 leading-snug transition-colors duration-150 group-hover:text-blue-700">
            {name}
          </h3>

          <p className="text-xs leading-relaxed line-clamp-2 mb-3 flex-1" style={{ color: '#6B7280' }}>
            {desc}
          </p>

          <div className="flex items-center gap-1 mb-3">
            {hasReviews ? (
              <>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className="w-3 h-3"
                      fill={s <= Math.round(tour.rating || 0) ? '#FBBF24' : '#E5E7EB'}
                      stroke="none"
                    />
                  ))}
                </div>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>({reviewCount} đánh giá)</span>
              </>
            ) : (
              <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Chưa có đánh giá</span>
            )}
          </div>

          <div style={{ height: 1, background: '#F3F4F6', margin: '0 0 12px' }} />

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{hasPromotion ? 'Giá ưu đãi' : 'Giá từ'}</p>
                {hasPromotion && (
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase leading-none"
                    style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}
                  >
                    {tour.promotionBadge || `-${tour.discountPercent || Math.round((1 - tour.price / (tour.originalPrice || tour.price)) * 100)}%`}
                  </span>
                )}
              </div>
              {hasPromotion && (
                <p className="text-xs font-medium line-through" style={{ color: '#94A3B8' }}>
                  {formatVND(tour.originalPrice || tour.price)}
                </p>
              )}
              <p className="font-black leading-none" style={{ fontSize: '1.0625rem', color: hasPromotion ? '#E65300' : '#0064D2', letterSpacing: '-0.02em' }}>
                {formatVND(tour.price)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#CBD5E1' }}>/người</p>
            </div>

            <div
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all duration-200 group-hover:gap-2.5"
              style={{
                background: 'linear-gradient(135deg, #0064D2, #0091FF)',
                boxShadow: '0 2px 8px rgba(0,100,210,0.28)',
              }}
            >
              Xem ngay
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
