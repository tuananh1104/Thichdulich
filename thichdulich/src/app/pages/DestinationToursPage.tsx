"use client";

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, ChevronDown, Filter, MapPin } from 'lucide-react';
import api from '@/services/api';
import { TourCard } from '../components/TourCard';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import type { Tour } from '../types/domainTypes';
import { useFavorites } from '../contexts/FavoriteContext';
import { toTour, useTourManagement } from '../contexts/TourManagementContext';
import { DestinationCatalogItem, getDestinationByRouteId, mergeApiDestination } from '../data/destinationCatalog';
import { prioritizeFavorites } from '../utils/favorites';
import { normalizeText } from '../utils/text';

export function DestinationToursPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tours: allTours } = useTourManagement();
  const { favoriteIds } = useFavorites();
  const [apiTours, setApiTours] = useState<Tour[]>([]);
  const [apiDestinations, setApiDestinations] = useState<DestinationCatalogItem[]>([]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  const [priceFilter, setPriceFilter] = useState(searchParams.get('price') || 'all');
  const [durationFilter, setDurationFilter] = useState(searchParams.get('duration') || 'all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (sortBy !== 'popular') params.set('sort', sortBy);
    if (priceFilter !== 'all') params.set('price', priceFilter);
    if (durationFilter !== 'all') params.set('duration', durationFilter);
    setSearchParams(params, { replace: true });
  }, [durationFilter, priceFilter, setSearchParams, sortBy]);

  useEffect(() => {
    api.getDestinations()
      .then((data) => setApiDestinations((data || []).map(mergeApiDestination)))
      .catch(() => setApiDestinations([]));
  }, []);

  const destination = useMemo(() => {
    const catalogDestination = getDestinationByRouteId(id);
    if (catalogDestination) return catalogDestination;
    const normalizedId = normalizeText(id);
    return apiDestinations.find((item) =>
      normalizeText(item.id) === normalizedId ||
      normalizeText(item.backendId) === normalizedId
    );
  }, [apiDestinations, id]);

  useEffect(() => {
    setApiTours([]);
    if (!destination?.backendId) return;
    setLoading(true);
    api.getToursByDestination(destination.backendId)
      .then((data) => setApiTours((data || []).map(toTour)))
      .catch(() => setApiTours([]))
      .finally(() => setLoading(false));
  }, [destination?.backendId]);

  const destinationTours = useMemo(() => {
    const merged = new Map<string, Tour>();
    apiTours.forEach((tour) => merged.set(tour.id, tour));
    if (!destination) return [];

    if (destination.backendId) {
      allTours
        .filter((tour) => tour.status === 'approved' && (tour as any).destinationId === destination.backendId)
        .forEach((tour) => merged.set(tour.id, tour));
      return Array.from(merged.values());
    }

    return allTours.filter((tour) => {
      if (tour.status !== 'approved') return false;
      const destinationId = (tour as any).destinationId;
      const text = [tour.location, tour.name.vi, tour.name.en, tour.description.vi, tour.description.en]
        .map(normalizeText)
        .join(' ');

      return destinationId === destination.backendId
        || text.includes(normalizeText(destination.location))
        || destination.aliases.some((alias) => text.includes(normalizeText(alias)));
    });
  }, [apiTours, allTours, destination]);

  const filteredTours = useMemo(() => {
    let result = [...destinationTours];

    if (priceFilter === 'low') result = result.filter(tour => tour.price < 3000000);
    if (priceFilter === 'medium') result = result.filter(tour => tour.price >= 3000000 && tour.price <= 6000000);
    if (priceFilter === 'high') result = result.filter(tour => tour.price > 6000000);

    if (durationFilter === 'short') result = result.filter(tour => tour.duration <= 2);
    if (durationFilter === 'medium') result = result.filter(tour => tour.duration > 2 && tour.duration <= 4);
    if (durationFilter === 'long') result = result.filter(tour => tour.duration > 4);

    if (sortBy === 'priceAsc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'priceDesc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'popular') result.sort((a, b) => b.reviews - a.reviews);

    return prioritizeFavorites(result, favoriteIds);
  }, [destinationTours, priceFilter, durationFilter, sortBy, favoriteIds]);

  if (!destination) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy điểm đến
          </h2>
          <Link to="/destinations">
            <Button>Quay lại</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative min-h-[360px] overflow-hidden">
        <img src={destination.image} alt={destination.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link to="/destinations" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại điểm đến
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-8 h-8 text-white" />
            <h1 className="text-4xl md:text-5xl font-black text-white">
              {destination.name}
            </h1>
          </div>
          <p className="text-lg text-white/90 max-w-3xl">{destination.description}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Bộ lọc tour</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <FilterSelect label="Sắp xếp" value={sortBy} onChange={setSortBy}>
              <option value="popular">Phổ biến</option>
              <option value="priceAsc">Giá thấp đến cao</option>
              <option value="priceDesc">Giá cao đến thấp</option>
              <option value="rating">Đánh giá cao nhất</option>
            </FilterSelect>

            <FilterSelect label="Mức giá" value={priceFilter} onChange={setPriceFilter}>
              <option value="all">Tất cả</option>
              <option value="low">Dưới 3 triệu</option>
              <option value="medium">3-6 triệu</option>
              <option value="high">Trên 6 triệu</option>
            </FilterSelect>

            <FilterSelect label="Thời gian" value={durationFilter} onChange={setDurationFilter}>
              <option value="all">Tất cả</option>
              <option value="short">1-2 ngày</option>
              <option value="medium">3-4 ngày</option>
              <option value="long">5+ ngày</option>
            </FilterSelect>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            {loading ? 'Đang tải...' : 'Tìm thấy'} <span className="font-bold text-primary">{filteredTours.length}</span> tour
          </div>
        </Card>

        {filteredTours.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Chưa có tour phù hợp
            </h3>
            <p className="text-gray-600 mb-5">
              Điểm đến này chưa có tour được duyệt hoặc bộ lọc đang quá hẹp.
            </p>
            <Link to="/tours">
              <Button variant="outline">Xem tất cả tour</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none appearance-none bg-white cursor-pointer"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
