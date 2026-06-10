"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ElementType } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Compass,
  Filter as FilterIcon,
  Globe,
  Landmark,
  MapPin,
  Mountain,
  Search,
  SlidersHorizontal,
  Star,
  TreePine,
  TrendingUp,
  Users,
  Waves,
  X,
} from 'lucide-react';
import api from '@/services/api';
import { useTourManagement } from '../contexts/TourManagementContext';
import { DESTINATION_CATALOG, DestinationCatalogItem, mergeApiDestination } from '../data/destinationCatalog';
import { cleanText, normalizeText } from '../utils/text';
import { getTourImage } from '../utils/tourImages';

type Region = 'all' | 'north' | 'central' | 'south';
type Category = 'all' | 'beach' | 'mountain' | 'culture' | 'nature' | 'city';
type SortBy = 'popular' | 'price_asc' | 'price_desc' | 'rating';

interface DestinationView extends DestinationCatalogItem {
  tours: number;
  priceFrom: number;
  popular: boolean;
  trending: boolean;
}

function getRealDestinationStats(matchedTours: Array<{ rating?: number; reviews?: number }>) {
  const reviewCount = matchedTours.reduce((sum, tour) => sum + Number(tour.reviews || 0), 0);
  if (reviewCount === 0) {
    return { rating: 0, reviewCount: 0 };
  }

  const weightedRating = matchedTours.reduce((sum, tour) => {
    const tourReviews = Number(tour.reviews || 0);
    return sum + Number(tour.rating || 0) * tourReviews;
  }, 0) / reviewCount;

  return {
    rating: Number(weightedRating.toFixed(1)),
    reviewCount,
  };
}

const REGION_OPTIONS: Array<{ value: Region; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'north', label: 'Miền Bắc' },
  { value: 'central', label: 'Miền Trung' },
  { value: 'south', label: 'Miền Nam' },
];

const CATEGORY_OPTIONS: Array<{ value: Category; label: string; Icon: ElementType }> = [
  { value: 'all', label: 'Tất cả', Icon: Globe },
  { value: 'beach', label: 'Biển', Icon: Waves },
  { value: 'mountain', label: 'Núi', Icon: Mountain },
  { value: 'culture', label: 'Văn hóa', Icon: Landmark },
  { value: 'nature', label: 'Thiên nhiên', Icon: TreePine },
  { value: 'city', label: 'Thành phố', Icon: Building2 },
];

const PRICE_OPTIONS = [
  { value: 'all', label: 'Tất cả mức giá' },
  { value: 'low', label: 'Dưới 2 triệu' },
  { value: 'mid', label: '2 - 4 triệu' },
  { value: 'high', label: 'Trên 4 triệu' },
] as const;

const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
];

const CATEGORY_ICONS: Record<string, ElementType> = {
  beach: Waves,
  mountain: Mountain,
  culture: Landmark,
  nature: TreePine,
  city: Building2,
};

const heroImage = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&h=1080&fit=crop';

export function DestinationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const { tours } = useTourManagement();
  const initialRegion = REGION_OPTIONS.some((option) => option.value === searchParams.get('region')) ? searchParams.get('region') as Region : 'all';
  const initialCategory = CATEGORY_OPTIONS.some((option) => option.value === searchParams.get('category')) ? searchParams.get('category') as Category : 'all';
  const initialPrice = PRICE_OPTIONS.some((option) => option.value === searchParams.get('price')) ? searchParams.get('price') as (typeof PRICE_OPTIONS)[number]['value'] : 'all';
  const initialSort = SORT_OPTIONS.some((option) => option.value === searchParams.get('sort')) ? searchParams.get('sort') as SortBy : 'popular';

  const [apiDestinations, setApiDestinations] = useState<DestinationCatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('destination') || '');
  const [region, setRegion] = useState<Region>(initialRegion);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [priceRange, setPriceRange] = useState<(typeof PRICE_OPTIONS)[number]['value']>(initialPrice);
  const [sortBy, setSortBy] = useState<SortBy>(initialSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (region !== 'all') params.set('region', region);
    if (category !== 'all') params.set('category', category);
    if (priceRange !== 'all') params.set('price', priceRange);
    if (sortBy !== 'popular') params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [category, priceRange, region, searchQuery, setSearchParams, sortBy]);

  useEffect(() => {
    api.getDestinations()
      .then((data) => setApiDestinations((data || []).map(mergeApiDestination)))
      .catch(() => setApiDestinations([]));
  }, []);

  const destinations = useMemo<DestinationView[]>(() => {
    const merged = new Map<string, DestinationCatalogItem>();
    DESTINATION_CATALOG.forEach((destination) => merged.set(destination.id, destination));
    apiDestinations.forEach((destination) => merged.set(destination.id, destination));

    return Array.from(merged.values()).map((destination, index) => {
      const matchedTours = tours.filter((tour) => {
        if (tour.status !== 'approved') return false;
        const destinationId = (tour as any).destinationId;
        const searchable = [tour.location, tour.name.vi, tour.name.en, tour.description.vi, tour.description.en]
          .map(normalizeText)
          .join(' ');

        return destinationId === destination.backendId
          || searchable.includes(normalizeText(destination.location))
          || destination.aliases.some((alias) => searchable.includes(normalizeText(alias)));
      });
      const stats = getRealDestinationStats(matchedTours);

      return {
        ...destination,
        name: cleanText(destination.name),
        location: cleanText(destination.location),
        description: cleanText(destination.description),
        highlight: cleanText(destination.highlight),
        image: pickImage(destination, matchedTours),
        rating: stats.rating,
        reviewCount: stats.reviewCount,
        tours: matchedTours.length,
        priceFrom: matchedTours.length ? Math.min(...matchedTours.map((tour) => tour.price)) : 0,
        popular: matchedTours.length > 0,
        trending: stats.reviewCount > 0,
      };
    });
  }, [apiDestinations, tours]);

  const filtered = useMemo(() => {
    const query = normalizeText(searchQuery);
    const result = destinations.filter((destination) => {
      const searchBody = [
        destination.name,
        destination.location,
        destination.description,
        destination.highlight,
        ...destination.aliases,
      ].map(normalizeText).join(' ');

      const matchSearch = !query || searchBody.includes(query);
      const matchRegion = region === 'all' || destination.region === region;
      const matchCategory = category === 'all' || destination.categories.includes(category);
      const matchPrice =
        priceRange === 'all' ||
        (priceRange === 'low' && destination.priceFrom > 0 && destination.priceFrom < 2000000) ||
        (priceRange === 'mid' && destination.priceFrom >= 2000000 && destination.priceFrom < 4000000) ||
        (priceRange === 'high' && destination.priceFrom >= 4000000);

      return matchSearch && matchRegion && matchCategory && matchPrice;
    });

    if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.priceFrom || Number.MAX_SAFE_INTEGER) - (b.priceFrom || Number.MAX_SAFE_INTEGER));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.priceFrom - a.priceFrom);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      result.sort((a, b) => b.tours - a.tours || Number(b.popular) - Number(a.popular));
    }

    return result;
  }, [destinations, searchQuery, region, category, priceRange, sortBy]);

  const featured = useMemo(() => {
    const priority = destinations.filter((destination) => destination.popular).sort((a, b) => b.tours - a.tours);
    return (priority.length ? priority : destinations).slice(0, 6);
  }, [destinations]);

  const searchSuggestions = useMemo(() => {
    const query = normalizeText(searchQuery);
    if (query.length < 2) return [];

    return destinations
      .filter((destination) => {
        const searchable = [
          destination.name,
          destination.location,
          destination.highlight,
          ...destination.aliases,
        ].map(normalizeText).join(' ');
        return searchable.includes(query);
      })
      .slice(0, 6);
  }, [destinations, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: destinations.length };
    CATEGORY_OPTIONS.forEach((option) => {
      if (option.value !== 'all') {
        counts[option.value] = destinations.filter((destination) => destination.categories.includes(option.value)).length;
      }
    });
    return counts;
  }, [destinations]);

  const activeFiltersCount =
    Number(region !== 'all') +
    Number(priceRange !== 'all');
  const heroDestinationCount = Math.max(destinations.length, 12);

  const formatPrice = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;

  const clearFilters = () => {
    setSearchQuery('');
    setRegion('all');
    setCategory('all');
    setPriceRange('all');
  };

  const clearSmartFilters = () => {
    setRegion('all');
    setPriceRange('all');
  };

  const scrollToGrid = () => {
    if (!gridRef.current) return;
    const headerOffset = 96;
    const top = gridRef.current.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
  };
  const openDestination = (destination: DestinationView) => navigate(`/destinations/${destination.id}/tours`);
  const chooseSuggestion = (destination: DestinationView) => {
    setSearchQuery(destination.name);
    scrollToGrid();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="relative min-h-[560px] overflow-hidden">
        <img
          src={heroImage}
          alt="Vietnam landscape"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(6,27,55,0.92)_0%,rgba(0,82,150,0.66)_50%,rgba(0,50,94,0.48)_100%)]" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-20 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-bold text-white backdrop-blur">
              <Compass className="h-5 w-5 text-sky-200" />
              vn Khám phá Việt Nam
            </div>

            <h1 className="mb-5 text-[clamp(2.6rem,5vw,4.6rem)] font-black leading-[1.04] text-white">
              Mỗi điểm đến<br />
              <span className="text-[#58C3FF]">là một câu chuyện</span>
            </h1>

            <p className="mb-8 max-w-2xl text-[1.05rem] leading-8 text-white/76">
              Từ vịnh biển hùng vĩ miền Bắc, phố cổ thơ mộng miền Trung đến vùng sông nước phương Nam. Hơn 500 tour chất lượng đang chờ bạn.
            </p>

            <div className="relative max-w-2xl">
              <div className="overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
                <div className="flex flex-col sm:flex-row">
                <div className="flex flex-1 items-center gap-3 px-6">
                  <Search className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Tìm điểm đến, tỉnh thành..."
                    className="w-full bg-transparent py-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={scrollToGrid}
                  className="px-7 py-4 text-sm font-black text-white transition hover:brightness-105"
                  style={{ background: '#FF6B16' }}
              >
                  Khám phá ngay
              </button>
                </div>
              </div>

              {searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Gợi ý điểm đến
                  </div>
                  {searchSuggestions.map((destination) => (
                    <button
                      key={destination.id}
                      type="button"
                      onClick={() => chooseSuggestion(destination)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-slate-950">{destination.name}</span>
                        <span className="block truncate text-xs font-medium text-slate-500">{destination.location} · {destination.tours} tour</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex max-w-xl flex-wrap gap-3">
              <HeroPill icon={MapPin} value={heroDestinationCount} label="điểm đến" />
              <HeroPill icon={BadgeCheck} value="500+" label="Tour" />
              <HeroPill icon={Users} value="50K+" label="Du khách" />
              <HeroPill icon={Star} value="4.8★" label="Đánh giá" />
            </div>
          </div>

          <div className="relative hidden min-h-[430px] lg:block">
            {featured[0] && (
              <HeroPreviewCard
                destination={featured[0]}
                className="absolute left-5 top-6 h-[210px] w-[350px]"
              />
            )}
            {featured[1] && (
              <HeroPreviewCard
                destination={featured[1]}
                className="absolute right-2 top-[120px] h-[184px] w-[286px]"
              />
            )}
            {featured[2] && (
              <HeroPreviewCard
                destination={featured[2]}
                className="absolute bottom-8 left-16 h-[184px] w-[286px]"
              />
            )}
            <div className="absolute bottom-0 right-0 flex items-center gap-3 rounded-2xl bg-blue-500 px-6 py-4 text-white shadow-2xl">
              <BadgeCheck className="h-6 w-6" />
              <div>
                <div className="font-black">Đã xác thực</div>
                <div className="text-sm text-white/80">Tours chất lượng cao</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="block h-[82px] w-full" preserveAspectRatio="none">
            <path
              d="M0,88 C260,60 430,72 650,54 C920,31 1130,54 1440,86 L1440,120 L0,120 Z"
              fill="#F8FAFC"
            />
          </svg>
        </div>
      </section>

      <section className="border-y border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-1 left-1 z-10 w-8 rounded-l-2xl bg-gradient-to-r from-blue-50 to-transparent md:hidden" />
            <div className="pointer-events-none absolute inset-y-1 right-1 z-10 w-8 rounded-r-2xl bg-gradient-to-l from-blue-50 to-transparent md:hidden" />
            <div className="flex snap-x snap-mandatory items-center gap-2 overflow-x-auto rounded-2xl border border-blue-100 bg-blue-50/60 p-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden">
              {CATEGORY_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => {
                    setCategory(value);
                  }}
                  className={`flex snap-start shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    category === value ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-slate-600 hover:bg-white/80 hover:text-blue-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${category === value ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-400'}`}>
                    {categoryCounts[value] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-[linear-gradient(90deg,#0064D2,#0091FF)]" />
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-blue-700">Khám phá ngay</span>
              </div>
              <h2 className="mb-1 text-[1.875rem] font-extrabold tracking-[-0.03em] text-slate-950">Điểm đến nổi bật</h2>
              <p className="text-sm text-slate-400">Những địa danh được yêu thích nhất Việt Nam</p>
            </div>
            <button onClick={scrollToGrid} className="hidden items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-blue-700 transition hover:gap-2.5 hover:bg-blue-50 sm:flex">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <button onClick={() => openDestination(featured[0])} className="group relative col-span-2 row-span-2 min-h-[360px] overflow-hidden rounded-2xl text-left">
              <img src={featured[0].image} alt={featured[0].name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.12)_55%,transparent_100%)]" />
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-blue-700/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{featured[0].highlight}</span>
              </div>
              <div className="absolute right-4 top-4 flex h-10 w-10 -translate-x-2 items-center justify-center rounded-full bg-orange-600 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="mb-1 text-2xl font-extrabold tracking-[-0.02em] text-white">{featured[0].name}</h3>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-white/75">
                    <MapPin className="h-3.5 w-3.5" />
                    {featured[0].location}
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/18 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition group-hover:scale-105">
                    {featured[0].tours} tour
                  </span>
                </div>
              </div>
            </button>

            {featured.slice(1, 5).map((destination) => (
              <button key={destination.id} onClick={() => openDestination(destination)} className="group relative min-h-[170px] overflow-hidden rounded-2xl text-left">
                <img src={destination.image} alt={destination.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.05)_60%,transparent_100%)]" />
                <div className="absolute left-3 top-3">
                  <span className="rounded-full bg-black/35 px-2 py-1 text-[0.65rem] font-bold text-white backdrop-blur">{destination.highlight}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <h3 className="mb-0.5 text-[0.9375rem] font-bold tracking-[-0.01em] text-white">{destination.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/65">{destination.location}</span>
                    <span className="text-xs font-semibold text-white/80">{destination.tours} tour</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          </div>
        </section>
      )}

      <section ref={gridRef} className="scroll-mt-24 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-start gap-7 lg:grid-cols-[292px_1fr]">
          <aside className="hidden self-start lg:block">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.09)]">
              <div className="border-b border-blue-50 bg-gradient-to-b from-blue-50/75 to-white px-5 py-5">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
                      <SlidersHorizontal className="h-4 w-4 text-white" />
                    </span>
                    <span className="text-sm font-black text-slate-950">Lọc điểm đến</span>
                  </div>
                  {activeFiltersCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">{activeFiltersCount}</span>}
                </div>
                <p className="text-xs leading-5 text-slate-500">Chọn vùng miền và ngân sách để thu hẹp danh sách.</p>
              </div>
              <div className="p-5 pt-4">
                <FiltersPanel
                  region={region}
                  priceRange={priceRange}
                  setRegion={setRegion}
                  setPriceRange={setPriceRange}
                  clearFilters={clearSmartFilters}
                  activeFiltersCount={activeFiltersCount}
                />
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div>
                <h2 className="text-[1.25rem] font-black text-slate-950">Tất cả điểm đến</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Hiển thị <span className="font-bold text-blue-700">{filtered.length}</span> kết quả
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3 sm:mt-0">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 lg:hidden"
                >
                  <FilterIcon className="h-4 w-4" />
                  Bộ lọc
                  {activeFiltersCount > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">{activeFiltersCount}</span>}
                </button>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortBy)}
                  className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white"
                >
                  {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-24 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <MapPin className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="mb-2 text-lg font-black text-slate-950">Không tìm thấy điểm đến</h3>
                <p className="mb-6 text-sm text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button onClick={clearFilters} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700">
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((destination) => (
                  <DestinationGridCard key={destination.id} destination={destination} onClick={() => openDestination(destination)} formatPrice={formatPrice} />
                ))}
              </div>
            )}
          </main>
        </div>
      </section>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} aria-label="Đóng bộ lọc" />
          <div className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-5 w-5 text-blue-700" />
                <span className="font-black text-slate-950">Bộ lọc</span>
                {activeFiltersCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">{activeFiltersCount}</span>}
              </div>
              <button onClick={() => setMobileFiltersOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 [scrollbar-width:thin] [scrollbar-color:#CBD5E1_transparent]">
              <FiltersPanel
                region={region}
                priceRange={priceRange}
                setRegion={setRegion}
                setPriceRange={setPriceRange}
                clearFilters={clearSmartFilters}
                activeFiltersCount={activeFiltersCount}
              />
            </div>
            <div className="border-t border-slate-100 px-6 py-5">
              <button onClick={() => setMobileFiltersOpen(false)} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white hover:bg-blue-700">
                Xem {filtered.length} kết quả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroPill({ icon: Icon, value, label }: { icon: ElementType; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/12 px-5 py-3 text-white backdrop-blur">
      <Icon className="h-4 w-4 text-sky-200" />
      <div className="text-base">
        <span className="font-black text-white">{value}</span>
        <span className="ml-1 text-white/65">{label}</span>
      </div>
    </div>
  );
}

function HeroPreviewCard({ destination, className }: { destination: DestinationView; className: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-white/25 bg-white/10 shadow-2xl backdrop-blur ${className}`}>
      <img src={destination.image} alt={destination.name} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute right-4 top-4 rounded-full bg-white/35 px-3 py-1.5 text-sm font-black text-white backdrop-blur">
        {destination.tours || 0} tours
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="font-black text-white">{destination.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-black">{destination.rating}</span>
          <span>({destination.reviewCount.toLocaleString()})</span>
        </div>
      </div>
    </div>
  );
}

function DestinationGridCard({
  destination,
  onClick,
  formatPrice,
}: {
  destination: DestinationView;
  onClick: () => void;
  formatPrice: (value: number) => string;
}) {
  const Icon = CATEGORY_ICONS[destination.categories[0]] || Globe;

  return (
    <button
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_6px_22px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)]"
    >
      <div className="relative h-[196px] overflow-hidden">
        <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.1)_50%,transparent_100%)]" />
        <div className="absolute left-3.5 top-3.5 flex gap-1.5">
          {destination.popular && <span className="rounded-full bg-white/92 px-2.5 py-1 text-xs font-black text-slate-900 backdrop-blur">Phổ biến</span>}
          {destination.trending && !destination.popular && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-xs font-black text-slate-900 backdrop-blur">
              <TrendingUp className="h-3 w-3" /> Xu hướng
            </span>
          )}
        </div>
        <div className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-black text-white">{destination.rating}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-white/70">
            <MapPin className="h-3 w-3" />
            {destination.location}
          </div>
          <h3 className="text-[1.125rem] font-black tracking-[-0.02em] text-white">{destination.name}</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
            <Icon className="h-3 w-3" />
            {destination.highlight}
          </span>
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-[1.65] text-slate-600">{destination.description}</p>

        <div className="mb-4 flex items-center gap-1.5">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-3.5 w-3.5"
                style={{
                  fill: star <= Math.round(destination.rating) ? '#FBBF24' : 'transparent',
                  color: star <= Math.round(destination.rating) ? '#FBBF24' : '#E2E8F0',
                }}
              />
            ))}
          </div>
          <span className="text-xs font-black text-slate-700">{destination.rating}</span>
          <span className="text-xs text-slate-400">({destination.reviewCount.toLocaleString()} đánh giá)</span>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            {destination.priceFrom > 0 ? (
              <>
                <div className="mb-0.5 text-xs font-medium text-slate-400">Từ</div>
                <div className="text-[1.125rem] font-black tracking-[-0.025em] text-blue-700">{formatPrice(destination.priceFrom)}</div>
              </>
            ) : (
              <>
                <div className="mb-0.5 text-xs font-medium text-slate-400">Tour</div>
                <div className="text-[1.125rem] font-black tracking-[-0.025em] text-blue-700">{destination.tours}</div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white transition-all group-hover:gap-2.5" style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)', boxShadow: '0 6px 18px rgba(0,100,210,0.26)' }}>
            {destination.tours} tour
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

function FiltersPanel({
  region,
  priceRange,
  setRegion,
  setPriceRange,
  clearFilters,
  activeFiltersCount,
}: {
  region: Region;
  priceRange: (typeof PRICE_OPTIONS)[number]['value'];
  setRegion: (value: Region) => void;
  setPriceRange: (value: (typeof PRICE_OPTIONS)[number]['value']) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-black uppercase text-blue-700">Vùng miền</p>
        <div className="grid gap-2">
          {REGION_OPTIONS.map((item) => (
            <button
              key={item.value}
              onClick={() => setRegion(item.value)}
              className="flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-all"
              style={{
                background: region === item.value ? '#EFF6FF' : '#FFFFFF',
                color: region === item.value ? '#0064D2' : '#64748B',
                borderColor: region === item.value ? '#93C5FD' : '#DDE7F3',
                boxShadow: region === item.value ? '0 6px 16px rgba(0,100,210,0.08)' : 'none',
                fontWeight: region === item.value ? 700 : 500,
              }}
            >
              <span>{item.label}</span>
              {region === item.value && <span className="h-2 w-2 rounded-full bg-blue-600" />}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div>
        <p className="mb-3 text-xs font-black uppercase text-blue-700">Mức giá</p>
        <div className="grid gap-2">
          {PRICE_OPTIONS.map((item) => (
            <button
              key={item.value}
              onClick={() => setPriceRange(item.value)}
              className="flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-all"
              style={{
                background: priceRange === item.value ? '#EFF6FF' : '#FFFFFF',
                color: priceRange === item.value ? '#0064D2' : '#64748B',
                borderColor: priceRange === item.value ? '#93C5FD' : '#DDE7F3',
                boxShadow: priceRange === item.value ? '0 6px 16px rgba(0,100,210,0.08)' : 'none',
                fontWeight: priceRange === item.value ? 700 : 500,
              }}
            >
              <span>{item.label}</span>
              {priceRange === item.value && <span className="h-2 w-2 rounded-full bg-blue-600" />}
            </button>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <>
          <div className="h-px bg-slate-100" />
          <button
            onClick={clearFilters}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-500 transition-all"
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </button>
        </>
      )}
    </div>
  );
}

function pickImage(
  destination: DestinationCatalogItem,
  matchedTours: Array<{
    image?: string;
    location?: string;
    type?: string;
    name?: { vi?: string; en?: string };
    description?: { vi?: string; en?: string };
  }>
) {
  const tour = matchedTours.find((item) => item.image);
  return tour ? getTourImage(tour.image, tour) : destination.image;
}
