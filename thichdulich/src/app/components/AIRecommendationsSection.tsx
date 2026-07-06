"use client";

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Eye, Heart, Search, Sparkles, TrendingUp } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '../contexts/AuthContext';
import { useBookings } from '../contexts/BookingContext';
import { useFavorites } from '../contexts/FavoriteContext';
import { toTour, useTourManagement } from '../contexts/TourManagementContext';
import { useLanguage } from '../i18n/LanguageContext';
import { AIRecommendationService, RecommendationResult } from '../services/AIRecommendationService';
import { cleanText } from '../utils/text';
import { TourCard } from './TourCard';

export function AIRecommendationsSection() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { tours } = useTourManagement();
  const { bookings } = useBookings();
  const { favoriteIds } = useFavorites();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecommendations([]);
      setInteractions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.getRecommendations(6)
      .then(data => {
        const recs: RecommendationResult[] = (data || []).map((item: any) => ({
          tour: toTour(item.tour),
          score: item.score || 0,
          reasons: (item.reasons || []).map(cleanText),
          confidence: item.score >= 80 ? 'high' : item.score >= 45 ? 'medium' : 'low',
        }));
        setRecommendations(prioritizeRecommendationFavorites(recs, favoriteIds));
      })
      .catch(() => {
        const userBookings = bookings.filter(booking => booking.userId === user.id);
        setRecommendations(prioritizeRecommendationFavorites(
          AIRecommendationService.getRecommendations(tours, userBookings, 6, user.id),
          favoriteIds
        ));
      })
      .finally(() => setLoading(false));

    api.getInteractions()
      .then(data => {
        setInteractions(data || []);
      })
      .catch(() => {
        setInteractions(AIRecommendationService.getUserInteractions(user.id));
      });
  }, [user?.id, tours, bookings, favoriteIds]);

  const insight = useMemo(() => {
    if (!user) return { viewed: 0, searches: 0, favorites: 0, bookings: 0 };
    return {
      viewed: interactions.filter(item => item.action === 'view' || item.action === 'click').length,
      searches: interactions.filter(item => item.action === 'search').length,
      favorites: favoriteIds.size,
      bookings: bookings.filter(item => item.userId === user.id).length,
    };
  }, [user?.id, bookings, favoriteIds, interactions]);

  if (!user) return null;

  return (
    <section className="py-16" style={{ background: '#F6F8FB' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                {language === 'vi' ? 'Gợi ý cá nhân hóa' : 'Personalized recommendations'}
              </div>
              <h2 className="text-slate-950" style={{ fontSize: 'clamp(1.55rem, 3vw, 2.2rem)', fontWeight: 900 }}>
                {language === 'vi' ? 'Tour phù hợp với lịch sử của bạn' : 'Tours matched to your activity'}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {language === 'vi'
                  ? 'Hệ thống xếp hạng tour dựa trên tour bạn đã xem, tìm kiếm, lưu yêu thích và booking trước đó.'
                  : 'Ranked from your viewed tours, searches, favorites and bookings.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[430px]">
              <InsightItem icon={Eye} label={language === 'vi' ? 'Đã xem' : 'Viewed'} value={insight.viewed} />
              <InsightItem icon={Search} label={language === 'vi' ? 'Tìm kiếm' : 'Searches'} value={insight.searches} />
              <InsightItem icon={Heart} label={language === 'vi' ? 'Yêu thích' : 'Saved'} value={insight.favorites} />
              <InsightItem icon={BadgeCheck} label="Booking" value={insight.bookings} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(item => (
              <div key={item} className="h-[460px] animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <Sparkles className="mx-auto mb-3 h-9 w-9 text-slate-400" />
            <p className="font-bold text-slate-900">
              {language === 'vi' ? 'Chưa đủ dữ liệu để cá nhân hóa' : 'Not enough activity yet'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {language === 'vi'
                ? 'Hãy xem vài tour hoặc lưu yêu thích, hệ thống sẽ tự tạo danh sách đề xuất tại đây.'
                : 'View or save a few tours and recommendations will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec, index) => (
              <RecommendationTile key={rec.tour.id} rec={rec} rank={index + 1} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RecommendationTile({ rec, rank }: { rec: RecommendationResult; rank: number }) {
  const reason = cleanText(rec.reasons?.[0] || 'Phù hợp với lịch sử quan tâm của bạn');

  return (
    <div className="h-full">
      <div className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            #{rank} đề xuất
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            <TrendingUp className="h-3.5 w-3.5" />
            {formatScore(rec.score)}% phù hợp
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span className="line-clamp-2">{reason}</span>
        </div>
      </div>
      <TourCard tour={rec.tour} />
    </div>
  );
}

function InsightItem({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-black uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatScore(score: number) {
  return Math.max(1, Math.min(99, Math.round(score || 0)));
}

function prioritizeRecommendationFavorites(recommendations: RecommendationResult[], favoriteIds: Set<string>) {
  return [...recommendations].sort((a, b) => {
    const aFavorite = favoriteIds.has(a.tour.id);
    const bFavorite = favoriteIds.has(b.tour.id);
    if (aFavorite === bFavorite) return b.score - a.score;
    return aFavorite ? -1 : 1;
  });
}
