"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Star, MapPin, ChevronRight, Search, Clock, Users,
  Shield, Headphones, Award, ArrowRight, Play, CheckCircle2,
  TrendingUp, Zap
} from 'lucide-react';
import { useTourManagement } from '../contexts/TourManagementContext';
import { useFavorites } from '../contexts/FavoriteContext';
import { AIRecommendationsSection } from '../components/AIRecommendationsSection';
import { TrendingToursSection } from '../components/TrendingToursSection';
import { TourCard } from '../components/TourCard';
import { getTourImage } from '../utils/tourImages';
import { useAuth } from '../contexts/AuthContext';
import { AIRecommendationService } from '../services/AIRecommendationService';
import { prioritizeFavorites } from '../utils/favorites';
import { cleanText, normalizeText } from '../utils/text';
import api from '@/services/api';

function formatVND(price: number) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
}

// Animated counter hook
function useCounter(target: number, duration = 1600, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return count;
}

const destinations = [
  {
    id: 'ha-long',
    name: 'Vịnh Hạ Long',
    location: 'Quảng Ninh',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&h=600&fit=crop',
    tours: 125,
    tag: 'Di sản UNESCO',
    tagColor: '#0064D2',
    size: 'large',
  },
  {
    id: 'hoi-an',
    name: 'Phố cổ Hội An',
    location: 'Quảng Nam',
    image: 'https://images.unsplash.com/photo-1555618254-84eb0b4602f7?w=600&h=400&fit=crop',
    tours: 87,
    tag: 'Văn hóa',
    tagColor: '#7C3AED',
    size: 'small',
  },
  {
    id: 'sapa',
    name: 'Sapa',
    location: 'Lào Cai',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=400&fit=crop',
    tours: 76,
    tag: 'Núi non',
    tagColor: '#059669',
    size: 'small',
  },
  {
    id: 'nha-trang',
    name: 'Nha Trang',
    location: 'Khánh Hòa',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    tours: 93,
    tag: 'Biển đảo',
    tagColor: '#0891B2',
    size: 'small',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Bảo đảm hoàn tiền',
    desc: 'Hoàn tiền 100% nếu tour bị hủy từ phía chúng tôi, không điều kiện.',
    color: '#0064D2',
    iconBg: 'rgba(0,100,210,0.08)',
  },
  {
    icon: Headphones,
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ hỗ trợ luôn trực tuyến, giải đáp mọi thắc mắc trong vài phút.',
    color: '#7C3AED',
    iconBg: 'rgba(124,58,237,0.08)',
  },
  {
    icon: Award,
    title: 'Tour được kiểm duyệt',
    desc: 'Tất cả tour được xét duyệt nghiêm ngặt bởi chuyên gia du lịch có kinh nghiệm.',
    color: '#059669',
    iconBg: 'rgba(5,150,105,0.08)',
  },
  {
    icon: Users,
    title: 'Hướng dẫn viên bản địa',
    desc: 'Dẫn đoàn am hiểu văn hóa địa phương, nói thành thạo nhiều ngoại ngữ.',
    color: '#FF6000',
    iconBg: 'rgba(255,96,0,0.08)',
  },
];

const testimonials = [
  {
    name: 'Nguyễn Thị Mai',
    role: 'Du khách từ Hà Nội',
    avatar: 'M',
    color: '#0064D2',
    rating: 5,
    text: 'Tour Sapa 3 ngày tuyệt vời! Hướng dẫn viên nhiệt tình, lịch trình hợp lý. Sẽ tiếp tục đặt tour qua Thích Du Lịch.',
  },
  {
    name: 'Trần Quang Khải',
    role: 'Du khách từ TP.HCM',
    avatar: 'K',
    color: '#7C3AED',
    rating: 5,
    text: 'Đặt tour Phú Quốc cực kỳ đơn giản. Giá tốt nhất thị trường, dịch vụ hoàn hảo từ A-Z. Rất hài lòng!',
  },
  {
    name: 'Lê Thị Hương',
    role: 'Du khách từ Đà Nẵng',
    avatar: 'H',
    color: '#059669',
    rating: 5,
    text: 'Đã đặt nhiều tour nhưng chưa thấy nền tảng nào dễ dùng như Thích Du Lịch. Luôn nhận được tour đúng mô tả.',
  },
];

export function HomePage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tours: allTours } = useTourManagement();
  const { favoriteIds } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'beach' | 'nature' | 'culture'>('all');
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { key: 'all' as const, label: 'Tất cả' },
    { key: 'beach' as const, label: 'Biển đảo' },
    { key: 'nature' as const, label: 'Thiên nhiên' },
    { key: 'culture' as const, label: 'Văn hóa' },
  ];

  const filteredTours = prioritizeFavorites(
    allTours
      .filter(t => t.status === 'approved')
      .filter(t => activeTab === 'all' ? true : t.type === activeTab || (activeTab === 'culture' && t.type === 'cultural')),
    favoriteIds
  ).slice(0, 6);

  const promotionTours = prioritizeFavorites(
    allTours.filter(t => t.status === 'approved' && t.promotionActive && t.originalPrice && t.originalPrice > t.price),
    favoriteIds
  ).slice(0, 3);

  const totalApproved = allTours.filter(t => t.status === 'approved').length;
  const searchSuggestions = useMemo(
    () => AIRecommendationService.getSearchSuggestions(searchQuery, allTours, 5),
    [searchQuery, allTours]
  );
  const normalizedSearchQuery = normalizeText(searchQuery);
  const tourSearchSuggestions = useMemo(() => {
    if (normalizedSearchQuery.length < 2) return [];

    return allTours
      .filter(tour => tour.status === 'approved')
      .map(tour => {
        const haystack = normalizeText([
          tour.name.vi,
          tour.name.en,
          tour.location,
          tour.description.vi,
          tour.description.en,
          tour.type,
        ].join(' '));
        let score = 0;
        if (normalizeText(tour.name.vi).includes(normalizedSearchQuery)) score += 60;
        if (normalizeText(tour.location).includes(normalizedSearchQuery)) score += 45;
        if (haystack.includes(normalizedSearchQuery)) score += 25;
        score += Math.min(tour.rating || 0, 5);
        return { tour, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.tour);
  }, [normalizedSearchQuery, allTours]);
  const detailedSearch = normalizedSearchQuery.length >= 4;
  const visibleTourSuggestions = tourSearchSuggestions.slice(0, detailedSearch ? 4 : 2);
  const hiddenTourCount = Math.max(tourSearchSuggestions.length - visibleTourSuggestions.length, 0);
  const submittedSearchResults = useMemo(() => {
    const query = normalizeText(submittedSearch);
    if (query.length < 2) return [];

    return allTours
      .filter(tour => tour.status === 'approved')
      .map(tour => {
        const haystack = normalizeText([
          tour.name.vi,
          tour.name.en,
          tour.location,
          tour.description.vi,
          tour.description.en,
          tour.type,
        ].join(' '));
        let score = 0;
        if (normalizeText(tour.name.vi).includes(query)) score += 70;
        if (normalizeText(tour.location).includes(query)) score += 55;
        if (haystack.includes(query)) score += 30;
        score += Math.min(tour.rating || 0, 5);
        if (tour.promotionActive) score += 3;
        return { tour, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.tour);
  }, [submittedSearch, allTours]);

  // Trigger counter animation on scroll
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!submittedSearch) return;
    window.setTimeout(() => {
      searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [submittedSearch]);

  const c1 = useCounter(10000, 1600, statsVisible);
  const c2 = useCounter(500, 1400, statsVisible);
  const c3 = useCounter(63, 1200, statsVisible);

  const recordSearch = (query: string) => {
    if (user && query) {
      AIRecommendationService.saveUserInteraction({
        userId: user.id,
        action: 'search',
        query,
        timestamp: new Date().toISOString(),
      });
      api.saveInteraction({ action: 'search', searchQuery: query }).catch(() => {});
    }
  };

  const showSearchResults = (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    setSearchQuery(cleanQuery);
    setSubmittedSearch(cleanQuery);
    recordSearch(cleanQuery);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    showSearchResults(searchQuery);
  };

  const chooseSearchSuggestion = (suggestion: string) => {
    showSearchResults(suggestion);
  };

  const chooseTourSuggestion = (tourId: string) => {
    navigate(`/tours/${tourId}`);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 580 }}>
        <img
          src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1920&h=900&fit=crop"
          alt="Vịnh Hạ Long"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }}
        />
        {/* Deep gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(165deg, rgba(5,15,40,0.82) 0%, rgba(0,40,100,0.65) 45%, rgba(0,0,0,0.25) 100%)' }}
        />
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '200px' }}
        />

        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          {/* Eyebrow badge */}
          <div
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)' }}
          >
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#60C8FF' }} />
            <span className="text-white/90 font-semibold" style={{ fontSize: '0.8125rem', letterSpacing: '0.02em' }}>
              Hơn {totalApproved}+ tour đang mở bán · Cập nhật hôm nay
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-white mb-5"
            style={{
              fontSize: 'clamp(2.25rem, 5.5vw, 3.5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              maxWidth: 680,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Khám phá Việt Nam —<br />
            <span
              style={{
                background: 'linear-gradient(90deg, #60C8FF, #93C5FD)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Hành trình bắt đầu từ đây.
            </span>
          </h1>

          <p
            className="mb-8 max-w-[480px]"
            style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1rem', lineHeight: 1.7, fontWeight: 400 }}
          >
            Hàng nghìn tour du lịch được tuyển chọn kỹ lưỡng, giá tốt nhất thị trường. Đặt trong 2 phút — hỗ trợ hoàn tiền 100%.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative z-50" style={{ maxWidth: 620 }}>
            <div className="relative">
            <div
              className="flex items-stretch bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.2)' }}
            >
              <div className="flex-1 flex items-center gap-3 px-5">
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#0064D2' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Bạn muốn đi đâu? Hội An, Sapa, Phú Quốc..."
                  className="w-full py-4 bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
                  style={{ fontSize: '0.9375rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>
              <div style={{ width: 1, background: '#F3F4F6', margin: '12px 0' }} />
              <button
                type="submit"
                className="flex items-center gap-2 px-7 text-white font-bold transition-all hover:opacity-92 active:scale-[0.98] flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #FF6000, #FF8C00)',
                  fontSize: '0.9375rem',
                  letterSpacing: '-0.01em',
                }}
              >
                <Search className="w-4 h-4" />
                Tìm tour
              </button>
            </div>

            {(visibleTourSuggestions.length > 0 || searchSuggestions.length > 0) && (
              <div className="relative z-40 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tour gợi ý phù hợp
                </div>
                {visibleTourSuggestions.length > 0 && (
                  <div className="grid gap-2 p-3 sm:grid-cols-2">
                    {visibleTourSuggestions.map(tour => (
                      <button
                        key={tour.id}
                        type="button"
                        onClick={() => chooseTourSuggestion(tour.id)}
                        className="group overflow-hidden rounded-xl border border-slate-100 bg-white text-left shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md"
                      >
                        <div className="grid grid-cols-[92px_1fr]">
                          <img
                            src={getTourImage(tour.image, tour)}
                            alt={cleanText(tour.name.vi)}
                            className="h-full min-h-[112px] w-[92px] object-cover"
                            loading="lazy"
                          />
                          <div className="min-w-0 p-3">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                                <MapPin className="h-3 w-3" />
                                {cleanText(tour.location)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {(tour.rating || 0).toFixed(1)}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-sm font-black leading-5 text-slate-950 group-hover:text-blue-700">
                              {cleanText(tour.name.vi)}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-500">{tour.duration} ngày</span>
                              <span className="text-sm font-black text-orange-600">{formatVND(tour.price)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {hiddenTourCount > 0 && (
                  <button
                    type="button"
                    onClick={() => showSearchResults(searchQuery)}
                    className="flex w-full items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-black text-blue-700 transition-colors hover:bg-blue-50"
                  >
                    <span>Hiển thị thêm {hiddenTourCount} tour phù hợp</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                {searchSuggestions.length > 0 && (
                  <div className="border-t border-slate-100 px-3 py-2">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Điểm đến liên quan</div>
                    <div className="flex flex-wrap gap-2">
                      {searchSuggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => chooseSearchSuggestion(suggestion)}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-blue-100 hover:text-blue-700"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['Vịnh Hạ Long', 'Hội An', 'Sapa', 'Phú Quốc', 'Nha Trang'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    showSearchResults(tag);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:bg-white hover:text-blue-700"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Stats bar */}
        <div
          ref={statsRef}
          className="relative z-10"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: statsVisible ? `${c1.toLocaleString()}+` : '—', label: 'Khách hàng hài lòng' },
              { value: statsVisible ? `${c2}+` : '—', label: 'Tour hấp dẫn' },
              { value: statsVisible ? `${c3}` : '—', label: 'Tỉnh thành phủ sóng' },
              { value: '4.9★', label: 'Điểm đánh giá' },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-1">
                <div
                  className="text-white mb-0.5"
                  style={{ fontSize: '1.1875rem', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ĐIỂM ĐẾN NỔI BẬT ──────────────────────────────── */}
      {submittedSearch && (
        <section ref={searchResultsRef} className="py-14" style={{ background: '#FFFFFF' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-1 w-8 rounded-full" style={{ background: '#FF6000' }} />
                  <span className="text-xs font-black uppercase tracking-wide" style={{ color: '#FF6000' }}>
                    Kết quả tìm kiếm
                  </span>
                </div>
                <h2 className="text-gray-900" style={{ fontSize: '1.75rem', fontWeight: 900 }}>
                  Tour tương tự với "{submittedSearch}"
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {submittedSearchResults.length > 0
                    ? `Tìm thấy ${submittedSearchResults.length} tour phù hợp nhất.`
                    : 'Chưa có tour khớp với từ khóa này, thử tìm theo điểm đến hoặc loại tour khác.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmittedSearch('');
                  setSearchQuery('');
                }}
                className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Xóa tìm kiếm
              </button>
            </div>

            {submittedSearchResults.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {submittedSearchResults.map(tour => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <Search className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="text-sm font-bold text-slate-700">Không tìm thấy tour phù hợp</p>
                <p className="mt-1 text-sm text-slate-500">Bạn có thể thử "Sapa", "Phú Quốc", "biển đảo" hoặc "thiên nhiên".</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-16" style={{ background: '#F8FAFC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="flex items-end justify-between mb-9">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 rounded-full" style={{ background: '#0064D2' }} />
                <span
                  className="font-bold uppercase"
                  style={{ fontSize: '0.7rem', color: '#0064D2' }}
                >
                  Khám phá ngay
                </span>
              </div>
              <h2
                className="text-gray-900 mb-1"
                style={{ fontSize: '1.875rem', fontWeight: 800 }}
              >
                Điểm đến nổi bật
              </h2>
              <p className="text-sm" style={{ color: '#64748B' }}>Những địa danh được yêu thích nhất Việt Nam</p>
            </div>
            <button
              onClick={() => navigate('/destinations')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-white"
              style={{ color: '#0064D2', border: '1px solid #DBEAFE' }}
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4 transition-transform duration-200" />
            </button>
          </div>

          {/* Editorial grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {/* Large card */}
            <div
              className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer group"
              style={{ minHeight: 360, borderRadius: 18, boxShadow: '0 16px 40px rgba(15,23,42,0.14)' }}
              onClick={() => navigate(`/destinations/${destinations[0].id}/tours`)}
            >
              <img
                src={destinations[0].image}
                alt={destinations[0].name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.16) 42%, rgba(15,23,42,0.82) 100%)' }}
              />

              {/* Tag */}
              <div className="absolute top-4 left-4">
                <span
                  className="text-white text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(15,23,42,0.52)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {destinations[0].tag}
                </span>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h3
                  className="text-white mb-1"
                  style={{ fontSize: '1.5rem', fontWeight: 800 }}
                >
                  {destinations[0].name}
                </h3>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                    <MapPin className="w-3.5 h-3.5" />
                    {destinations[0].location}
                  </span>
                  <span
                    className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)' }}
                  >
                    {destinations[0].tours} tour
                  </span>
                </div>
              </div>

              {/* Hover arrow */}
              <div
                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0"
                style={{ background: 'rgba(255,255,255,0.92)' }}
              >
                <ArrowRight className="w-5 h-5" style={{ color: '#0F172A' }} />
              </div>
            </div>

            {/* Small cards */}
            {destinations.slice(1).map((dest) => (
              <div
                key={dest.id}
                className="relative overflow-hidden cursor-pointer group"
                style={{ minHeight: 170, borderRadius: 16, boxShadow: '0 10px 28px rgba(15,23,42,0.10)' }}
                onClick={() => navigate(`/destinations/${dest.id}/tours`)}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(15,23,42,0.12) 45%, rgba(15,23,42,0.78) 100%)' }}
                />
                <div className="absolute top-3 left-3">
                  <span
                    className="text-white text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(15,23,42,0.46)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.65rem' }}
                  >
                    {dest.tag}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold mb-1" style={{ fontSize: '0.95rem' }}>
                    {dest.name}
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>
                      {dest.location}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-white/85">{dest.tours} tour</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOUR ĐỀ XUẤT ──────────────────────────────────── */}
      <section className="py-16" style={{ background: '#F7F9FF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, #FF6000, #FF8C00)' }} />
                <span
                  className="font-bold uppercase"
                  style={{ fontSize: '0.7rem', letterSpacing: '0.14em', color: '#FF6000' }}
                >
                  Được yêu thích
                </span>
              </div>
              <h2
                className="text-gray-900"
                style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em' }}
              >
                Tour đề xuất cho bạn
              </h2>
            </div>
            <button
              onClick={() => navigate('/destinations')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:gap-2.5 hover:bg-orange-50"
              style={{ color: '#FF6000' }}
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tab pills */}
          <div className="flex gap-2 mb-7 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap"
                style={
                  activeTab === tab.key
                    ? { background: '#0064D2', color: 'white', boxShadow: '0 4px 14px rgba(0,100,210,0.32)' }
                    : { background: 'white', color: '#6B7280', border: '1.5px solid #E5E7EB' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tour grid using TourCard */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTours.map(tour => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/destinations')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              style={{
                background: 'white',
                color: '#0064D2',
                border: '2px solid #0064D2',
                boxShadow: '0 2px 12px rgba(0,100,210,0.1)',
              }}
            >
              Xem tất cả {totalApproved}+ tour
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── TẠI SAO CHỌN CHÚNG TÔI ───────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-1 w-6 rounded-full" style={{ background: '#E5E7EB' }} />
              <span
                className="font-bold uppercase"
                style={{ fontSize: '0.7rem', letterSpacing: '0.14em', color: '#9CA3AF' }}
              >
                Cam kết chất lượng
              </span>
              <div className="h-1 w-6 rounded-full" style={{ background: '#E5E7EB' }} />
            </div>
            <h2
              className="text-gray-900 mb-2"
              style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              Tại sao chọn Thích Du Lịch?
            </h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: '#9CA3AF', lineHeight: 1.7 }}>
              Chúng tôi không chỉ bán tour — chúng tôi tạo ra những ký ức khó quên.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={{
                  background: 'white',
                  border: '1.5px solid #F3F4F6',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${feat.color}30`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${feat.color}18`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#F3F4F6';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ background: feat.iconBg }}
                >
                  <feat.icon className="w-6 h-6" style={{ color: feat.color }} />
                </div>
                <h4
                  className="text-gray-900 mb-2"
                  style={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.01em' }}
                >
                  {feat.title}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="py-16" style={{ background: '#F7F9FF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-gray-900" style={{ fontSize: '0.875rem' }}>4.9 · Hơn 10,000 đánh giá</span>
            </div>
            <h2
              className="text-gray-900"
              style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              Khách hàng nói gì về chúng tôi
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white"
                style={{
                  border: '1.5px solid #F3F4F6',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#4B5563' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{t.role}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: '#34D399' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="max-w-7xl mx-auto rounded-2xl overflow-hidden relative border"
          style={{
            background: '#0B1220',
            borderColor: 'rgba(148,163,184,0.22)',
            boxShadow: '0 18px 48px rgba(15,23,42,0.14)',
          }}
        >
          <div className="relative z-10 grid gap-7 px-5 py-8 lg:grid-cols-[0.95fr_1.45fr] lg:px-8 lg:py-9">
            <div className="flex flex-col justify-between">
              <div>
                <div
                  className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1"
                  style={{ background: 'rgba(255,247,237,0.1)', border: '1px solid rgba(253,186,116,0.28)' }}
                >
                  <Zap className="h-3.5 w-3.5" style={{ color: '#FDBA74' }} />
                  <span className="text-[11px] font-black uppercase text-orange-200">
                    Ưu đãi hè 2026
                  </span>
                </div>
                <h2
                  className="mb-3 text-white"
                  style={{ fontSize: 'clamp(1.45rem, 3vw, 2.05rem)', fontWeight: 900 }}
                >
                  Giá tốt cho các hành trình đang được quan tâm
                </h2>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Một số tour nổi bật đang có giá ưu đãi trong thời gian giới hạn. Giá gốc và giá sau giảm được hiển thị rõ trước khi đặt.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/destinations')}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-slate-950 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  style={{ background: '#FDBA74', boxShadow: '0 10px 24px rgba(253,186,116,0.22)' }}
                >
                  Xem ưu đãi
                </button>
                <button
                  onClick={() => navigate('/destinations')}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.18)' }}
                >
                  Tất cả tour
                </button>
              </div>
            </div>

            {promotionTours.length > 0 && (
              <div className="grid gap-3">
                {promotionTours.map(tour => (
                  <button
                    key={tour.id}
                    onClick={() => navigate(`/tours/${tour.id}`)}
                    className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.055] p-3 text-left transition-all hover:bg-white/[0.085] sm:grid-cols-[88px_1fr_auto] sm:items-center"
                  >
                    <img
                      src={getTourImage(tour.image, tour)}
                      alt={tour.name.vi}
                      className="h-20 w-full rounded-lg object-cover sm:h-16 sm:w-[88px]"
                    />
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-black text-white">{tour.name.vi}</h3>
                        <span
                          className="rounded-md px-2 py-0.5 text-[11px] font-black uppercase"
                          style={{ background: '#FFF7ED', color: '#C2410C' }}
                        >
                          {tour.promotionBadge || `-${tour.discountPercent}%`}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-400">
                        {tour.location} • {tour.duration} ngày
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs font-semibold text-slate-500 line-through">{formatVND(tour.originalPrice || tour.price)}</p>
                      <p className="text-lg font-black" style={{ color: '#FDBA74' }}>{formatVND(tour.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── AI RECOMMENDATIONS ────────────────────────────── */}
      <AIRecommendationsSection />

      {/* ── TRENDING TOURS ────────────────────────────── */}
      <TrendingToursSection />
    </div>
  );
}
