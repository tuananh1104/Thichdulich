"use client";

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, MapPin, Calendar, Users, ChevronDown, Star } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTourManagement } from '../contexts/TourManagementContext';
import { AIRecommendationService } from '../services/AIRecommendationService';
import { cleanText, normalizeText } from '../utils/text';
import { getTourImage } from '../utils/tourImages';
import { getTourTypeLabel } from '../utils/labels';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function AdvancedSearchBox() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { tours } = useTourManagement();
  const [activeTab, setActiveTab] = useState('tour');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('');
  const [guests, setGuests] = useState('2');
  const destinationSuggestions = useMemo(
    () => AIRecommendationService.getSearchSuggestions(destination, [], 6),
    [destination]
  );
  const tourSuggestions = useMemo(() => {
    const query = normalizeText(destination);
    if (query.length < 2) return [];

    return tours
      .filter(tour => tour.status === 'approved')
      .map(tour => {
        const haystack = normalizeText([
          tour.name.vi,
          tour.name.en,
          tour.location,
          tour.description.vi,
          tour.description.en,
          tour.type,
          getTourTypeLabel(tour.type),
        ].join(' '));
        let score = 0;
        if (normalizeText(tour.name.vi).includes(query)) score += 60;
        if (normalizeText(tour.location).includes(query)) score += 45;
        if (haystack.includes(query)) score += 25;
        score += Math.min(tour.rating || 0, 5);
        return { tour, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(item => item.tour);
  }, [destination, tours]);

  const tabs = [
    { 
      id: 'tour', 
      label: language === 'vi' ? 'Tour du lịch' : 'Tours',
      icon: MapPin 
    },
    { 
      id: 'hotel', 
      label: language === 'vi' ? 'Khách sạn' : 'Hotels',
      icon: MapPin 
    },
    { 
      id: 'combo', 
      label: language === 'vi' ? 'Combo' : 'Combo',
      icon: MapPin 
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('search', destination.trim());
    if (startDate) params.set('startDate', startDate);
    if (duration) params.set('duration', duration);
    if (guests) params.set('guests', guests);
    navigate(`/tours${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const chooseDestination = (value: string) => {
    const params = new URLSearchParams();
    params.set('search', value);
    if (startDate) params.set('startDate', startDate);
    if (duration) params.set('duration', duration);
    if (guests) params.set('guests', guests);
    setDestination(value);
    navigate(`/tours?${params.toString()}`);
  };

  return (
    <Card className="bg-white rounded-3xl shadow-2xl overflow-visible border-0 max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b bg-gray-50/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all relative ${
              activeTab === tab.id
                ? 'text-primary bg-white'
                : 'text-gray-600 hover:text-primary hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="p-6">
        <div className="grid md:grid-cols-12 gap-4">
          {/* Destination */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {language === 'vi' ? 'Điểm đến' : 'Destination'}
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={language === 'vi' ? 'Bạn muốn đi đâu?' : 'Where to go?'}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors text-sm scroll-mt-24"
              />
              {(tourSuggestions.length > 0 || destinationSuggestions.length > 0) && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tour gợi ý phù hợp
                  </div>
                  {tourSuggestions.length > 0 && (
                    <div className="grid gap-2 p-3">
                      {tourSuggestions.map(tour => (
                        <button
                          key={tour.id}
                          type="button"
                          onClick={() => navigate(`/tours/${tour.id}`)}
                          className="grid grid-cols-[86px_1fr] overflow-hidden rounded-xl border border-slate-100 bg-white text-left shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/40"
                        >
                          <img src={getTourImage(tour.image, tour)} alt={cleanText(tour.name.vi)} className="h-full min-h-[96px] w-[86px] object-cover" />
                          <span className="min-w-0 p-3">
                            <span className="mb-1 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                                <MapPin className="h-3 w-3" />
                                {cleanText(tour.location)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {(tour.rating || 0).toFixed(1)}
                              </span>
                            </span>
                            <span className="line-clamp-2 text-sm font-black leading-5 text-slate-950">{cleanText(tour.name.vi)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {destinationSuggestions.length > 0 && (
                    <div className="border-t border-slate-100 px-3 py-2">
                      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Điểm đến liên quan</div>
                      <div className="flex flex-wrap gap-2">
                        {destinationSuggestions.map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => chooseDestination(suggestion)}
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
          </div>

          {/* Start Date */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {language === 'vi' ? 'Ngày đi' : 'Start Date'}
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors text-sm scroll-mt-24"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {language === 'vi' ? 'Số ngày' : 'Duration'}
            </label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors text-sm appearance-none bg-white cursor-pointer scroll-mt-24"
              >
                <option value="">{language === 'vi' ? 'Chọn' : 'Select'}</option>
                <option value="1">1 {language === 'vi' ? 'ngày' : 'day'}</option>
                <option value="2">2 {language === 'vi' ? 'ngày' : 'days'}</option>
                <option value="3">3 {language === 'vi' ? 'ngày' : 'days'}</option>
                <option value="4-7">4-7 {language === 'vi' ? 'ngày' : 'days'}</option>
                <option value="7+">7+ {language === 'vi' ? 'ngày' : 'days'}</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Guests */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {language === 'vi' ? 'Số người' : 'Guests'}
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors text-sm appearance-none bg-white cursor-pointer"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Search Button */}
          <div className="md:col-span-1 flex items-end">
            <Button 
              type="submit"
              className="w-full h-[50px] bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide py-2">
            {language === 'vi' ? 'Phổ biến:' : 'Popular:'}
          </span>
          {[
            language === 'vi' ? 'Vịnh Hạ Long' : 'Ha Long Bay',
            language === 'vi' ? 'Phú Quốc' : 'Phu Quoc',
            language === 'vi' ? 'Sapa' : 'Sapa',
            language === 'vi' ? 'Đà Nẵng' : 'Da Nang',
            language === 'vi' ? 'Nha Trang' : 'Nha Trang',
          ].map((place) => (
            <button
              key={place}
              type="button"
              onClick={() => setDestination(place)}
              className="px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 rounded-full text-xs font-medium transition-all"
            >
              {place}
            </button>
          ))}
        </div>
      </form>
    </Card>
  );
}
