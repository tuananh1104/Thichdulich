"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import api, { getApiErrorMessage } from '@/services/api';
import type { Tour } from '../types/domainTypes';
import { useAuth } from './AuthContext';
import { cleanText } from '../utils/text';
import { getIncludeLabels } from '../utils/includeLabels';

interface TourManagementContextType {
  tours: Tour[];
  loading: boolean;
  refreshTours: () => Promise<void>;
  addTour: (tour: Omit<Tour, 'id'>) => Promise<Tour>;
  updateTour: (id: string, updates: Partial<Tour>) => void;
  deleteTour: (id: string) => void;
  getProviderTours: (providerId: string) => Tour[];
  approveTour: (id: string, adminId?: string) => void;
  rejectTour: (id: string, reason: string, adminId?: string) => void;
  requestTourEdit: (id: string, notes: string, adminId?: string) => void;
}

const TourManagementContext = createContext<TourManagementContextType | undefined>(undefined);

const KNOWN_TOUR_COPY: Record<string, { nameVi: string; descriptionVi: string; location: string }> = {
  'tour-ha-long-3d': {
    nameVi: 'Tour Vịnh Hạ Long 3 ngày 2 đêm',
    descriptionVi: 'Du thuyền Hạ Long, hang Sửng Sốt, đảo Titop, kayak và bữa tối trên vịnh.',
    location: 'Quảng Ninh',
  },
  'tour-ha-long-test-10k': {
    nameVi: 'Tour test Vịnh Hạ Long 10K',
    descriptionVi: 'Tour test thanh toán QR giá thấp để kiểm tra luồng đặt tour và thanh toán.',
    location: 'Quảng Ninh',
  },
  'tour-hoi-an-2d': {
    nameVi: 'Tour Hội An - Đà Nẵng 2 ngày',
    descriptionVi: 'Phố cổ Hội An, làng gốm Thanh Hà, biển An Bàng và ẩm thực địa phương.',
    location: 'Quảng Nam',
  },
  'tour-da-nang-ba-na-3d': {
    nameVi: 'Đà Nẵng - Bà Nà Hills 3 ngày',
    descriptionVi: 'Cầu Vàng, Bà Nà Hills, biển Mỹ Khê, bán đảo Sơn Trà và chợ đêm.',
    location: 'Đà Nẵng',
  },
  'tour-da-lat-2d': {
    nameVi: 'Tour Đà Lạt phiêu lưu 2 ngày',
    descriptionVi: 'Canyoning Datanla, hồ Tuyền Lâm, đồi chè Cầu Đất và chợ đêm.',
    location: 'Lâm Đồng',
  },
  'tour-sapa-fansipan-3d': {
    nameVi: 'Sapa - Fansipan 3 ngày',
    descriptionVi: 'Chinh phục Fansipan, bản Cát Cát, ruộng bậc thang và chợ đêm Sapa.',
    location: 'Lào Cai',
  },
  'tour-phu-quoc-4d': {
    nameVi: 'Phú Quốc nghỉ dưỡng 4 ngày',
    descriptionVi: 'Bãi Sao, Hòn Thơm, lặn ngắm san hô, chợ đêm và hoàng hôn Sunset Town.',
    location: 'Kiên Giang',
  },
  'tour-nha-trang-island-3d': {
    nameVi: 'Nha Trang tour đảo 3 ngày',
    descriptionVi: 'Vịnh Nha Trang, Hòn Mun, lặn biển, tắm bùn khoáng và hải sản.',
    location: 'Khánh Hòa',
  },
  'tour-mekong-can-tho-2d': {
    nameVi: 'Miền Tây - Cần Thơ 2 ngày',
    descriptionVi: 'Chợ nổi Cái Răng, vườn trái cây, thuyền sông và ẩm thực miền Tây.',
    location: 'Cần Thơ',
  },
};

function readLocalized(value: any, fallback = '') {
  const cleanFallback = cleanText(fallback);
  if (!value) return { vi: cleanFallback, en: cleanFallback };
  if (typeof value === 'object') {
    return {
      vi: cleanText(value.vi || cleanFallback),
      en: cleanText(value.en || value.vi || cleanFallback),
    };
  }
  try {
    const parsed = JSON.parse(value);
    return {
      vi: cleanText(parsed.vi || cleanFallback),
      en: cleanText(parsed.en || parsed.vi || cleanFallback),
    };
  } catch {
    const cleanValue = cleanText(value);
    return { vi: cleanValue, en: cleanValue };
  }
}

function readLocalizedList(value: any): { vi: string[]; en: string[] } {
  if (!value) return { vi: [], en: [] };

  if (Array.isArray(value)) {
    const items = value.map(cleanText).filter(Boolean);
    return { vi: items, en: items };
  }

  if (typeof value === 'object') {
    const vi = Array.isArray(value.vi)
      ? value.vi.map(cleanText).filter(Boolean)
      : value.vi
        ? [cleanText(value.vi)].filter(Boolean)
        : [];
    const en = Array.isArray(value.en)
      ? value.en.map(cleanText).filter(Boolean)
      : value.en
        ? [cleanText(value.en)].filter(Boolean)
        : vi;
    return { vi, en: en.length ? en : vi };
  }

  try {
    return readLocalizedList(JSON.parse(value));
  } catch {
    const item = cleanText(value);
    return { vi: item ? [item] : [], en: item ? [item] : [] };
  }
}

function toIncludePayload(included?: string[]) {
  const values = (included || [])
    .map(item => cleanText(item).trim())
    .filter(Boolean)
    .map(item => {
      const normalized = item
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_\-\s]/g, '')
        .toLowerCase();

      if (['accommodation', 'hotel', 'khachsan', 'luutru', 'phong'].some(key => normalized.includes(key))) return 'accommodation';
      if (['meals', 'meal', 'food', 'anuong', 'buaan', 'ansang', 'antrua', 'anto'].some(key => normalized.includes(key))) return 'meals';
      if (['transportation', 'transport', 'vehicle', 'dichuyen', 'xedua', 'xe', 'bus'].some(key => normalized.includes(key))) return 'transportation';
      if (['tourguide', 'guide', 'huongdanvien', 'huongdan'].some(key => normalized.includes(key))) return 'tourGuide';
      if (['entrance', 'ticket', 'tickets', 'vevao', 've'].some(key => normalized.includes(key))) return 'entrance';
      return '';
    })
    .filter(Boolean);

  return Array.from(new Set(values));
}

export function suggestedAdvanceBookingDays(duration?: number) {
  const days = duration && duration > 0 ? duration : 1;
  if (days === 1) return 1;
  if (days <= 3) return 3;
  if (days <= 5) return 5;
  return 7;
}

export function toTour(dto: any): Tour {
  const knownCopy = KNOWN_TOUR_COPY[dto.id];
  const tour = {
    id: dto.id,
    name: readLocalized(dto.name, knownCopy?.nameVi),
    description: readLocalized(dto.description, knownCopy?.descriptionVi),
    location: cleanText(dto.location || knownCopy?.location || ''),
    type: (dto.type || 'nature').toLowerCase() as Tour['type'],
    duration: dto.duration || 1,
    advanceBookingDays: dto.advanceBookingDays || suggestedAdvanceBookingDays(dto.duration || 1),
    price: dto.price || 0,
    originalPrice: dto.originalPrice,
    promotionTitle: cleanText(dto.promotionTitle),
    promotionBadge: cleanText(dto.promotionBadge),
    discountPercent: dto.discountPercent,
    promotionActive: dto.promotionActive ?? false,
    promotionStatus: (dto.promotionStatus || 'none').toLowerCase(),
    promotionSource: (dto.promotionSource || 'none').toLowerCase(),
    image: dto.image || '',
    rating: dto.rating || 0,
    reviews: dto.reviewCount || dto.reviews || 0,
    maxSeats: dto.maxSeats,
    availability: dto.availability ?? true,
    status: (dto.status || 'pending').toLowerCase() as Tour['status'],
    providerId: dto.providerId || '',
    providerName: cleanText(dto.providerName || 'Nhà cung cấp'),
    rejectionReason: cleanText(dto.rejectionReason),
    adminNotes: cleanText(dto.adminNotes),
    submittedAt: dto.submittedAt,
    reviewedAt: dto.reviewedAt,
    reviewedBy: dto.reviewedBy,
    itinerary: (dto.itineraries || []).map((item: any) => ({
      ...item,
      title: readLocalized(item.title),
      activities: readLocalizedList(item.activities),
    })),
    included: getIncludeLabels(dto.included || []),
    excluded: (dto.excluded || []).map(cleanText).filter(Boolean),
    ...(dto.destinationId ? { destinationId: dto.destinationId } : {}),
    ...(dto.images ? { images: dto.images } : {}),
  };

  if (knownCopy) {
    tour.name.vi = knownCopy.nameVi;
    tour.description.vi = knownCopy.descriptionVi;
    tour.location = knownCopy.location;
  }

  return tour;
}

function toTourPayload(tour: Partial<Tour>) {
  const payload: Record<string, any> = {
    name: typeof tour.name === 'object' ? tour.name.vi : tour.name,
    description: typeof tour.description === 'object' ? tour.description.vi : tour.description,
    location: tour.location,
    type: tour.type,
    duration: tour.duration,
    advanceBookingDays: (tour as any).advanceBookingDays,
    price: tour.price,
    image: tour.image,
    maxSeats: (tour as any).maxSeats,
    destinationId: (tour as any).destinationId,
    childPrice: (tour as any).childPrice,
    status: (tour as any).status,
    included: toIncludePayload(tour.included),
    excluded: ((tour as any).excluded || []).map(cleanText).filter(Boolean),
    images: (tour as any).images,
    itineraries: tour.itinerary?.map((item: any) => ({
      id: item.id,
      day: item.day,
      title: typeof item.title === 'object' ? item.title.vi : item.title,
      activities: Array.isArray(item.activities)
        ? item.activities
        : item.activities?.vi || item.activities?.en || [],
      notes: item.notes,
    })),
  };

  const promotionActive = Boolean((tour as any).promotionActive);
  const discountPercent = Number((tour as any).discountPercent) || 0;
  if (promotionActive && discountPercent > 0) {
    payload.originalPrice = (tour as any).originalPrice;
    payload.promotionTitle = (tour as any).promotionTitle;
    payload.promotionBadge = (tour as any).promotionBadge;
    payload.discountPercent = discountPercent;
    payload.promotionActive = true;
    payload.promotionStatus = (tour as any).promotionStatus;
    payload.promotionSource = (tour as any).promotionSource;
  }

  return payload;
}

export function TourManagementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTours = async () => {
    setLoading(true);
    try {
      const data =
        user?.role === 'admin'
          ? await api.getAdminTours()
          : user?.role === 'provider'
            ? await api.getProviderTours()
            : await api.getTours();
      setTours((data || []).map(toTour));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải danh sách tour.'));
      setTours([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTours();
  }, [user?.role, user?.id]);

  const addTour = async (tourData: Omit<Tour, 'id'>): Promise<Tour> => {
    const optimistic: Tour = {
      ...tourData,
      id: `pending_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    setTours(prev => [optimistic, ...prev]);
    try {
      const created = toTour(await api.createTour(toTourPayload(tourData)));
      setTours(prev => [created, ...prev.filter(t => t.id !== optimistic.id)]);
      return created;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tạo tour. Vui lòng kiểm tra thông tin và thử lại.'));
      setTours(prev => prev.filter(t => t.id !== optimistic.id));
      throw error;
    }
    /*
    api.createTour(toTourPayload(tourData))
      .then(created => setTours(prev => [toTour(created), ...prev.filter(t => t.id !== optimistic.id)]))
      .catch(error => {
        toast.error(getApiErrorMessage(error, 'Không thể tạo tour. Vui lòng kiểm tra thông tin và thử lại.'));
        setTours(prev => prev.filter(t => t.id !== optimistic.id));
      });
    return optimistic;
    */
  };

  const updateTour = (id: string, updates: Partial<Tour>) => {
    setTours(prev => prev.map(tour => tour.id === id ? { ...tour, ...updates } : tour));
    api.updateTour(id, toTourPayload(updates))
      .then(updated => setTours(prev => prev.map(tour => tour.id === id ? toTour(updated) : tour)))
      .catch(error => {
        toast.error(getApiErrorMessage(error, 'Không thể cập nhật tour. Dữ liệu đã được khôi phục.'));
        refreshTours();
      });
  };

  const deleteTour = (id: string) => {
    const previous = tours;
    setTours(prev => prev.filter(tour => tour.id !== id));
    api.deleteTour(id)
      .then(() => refreshTours())
      .catch(error => {
        toast.error(getApiErrorMessage(error, 'Không thể xóa tour. Dữ liệu đã được khôi phục.'));
        setTours(previous);
      });
  };

  const getProviderTours = (providerId: string): Tour[] => {
    return tours.filter(tour => tour.providerId === providerId);
  };

  const approveTour = (id: string) => {
    setTours(prev => prev.map(tour => tour.id === id ? { ...tour, status: 'approved' } : tour));
    api.approveTour(id)
      .then(updated => setTours(prev => prev.map(tour => tour.id === id ? toTour(updated) : tour)))
      .catch(error => {
        toast.error(getApiErrorMessage(error, 'Không thể duyệt tour.'));
        refreshTours();
      });
  };

  const rejectTour = (id: string, reason: string) => {
    setTours(prev => prev.map(tour => tour.id === id ? { ...tour, status: 'rejected', rejectionReason: reason } : tour));
    api.rejectTour(id, reason)
      .then(updated => setTours(prev => prev.map(tour => tour.id === id ? toTour(updated) : tour)))
      .catch(error => {
        toast.error(getApiErrorMessage(error, 'Không thể từ chối tour.'));
        refreshTours();
      });
  };

  const requestTourEdit = (id: string, notes: string) => {
    setTours(prev => prev.map(tour => tour.id === id ? { ...tour, status: 'need_edit', adminNotes: notes } : tour));
    api.requestTourEdit(id, notes)
      .then(updated => setTours(prev => prev.map(tour => tour.id === id ? toTour(updated) : tour)))
      .catch(error => {
        toast.error(getApiErrorMessage(error, 'Không thể gửi yêu cầu chỉnh sửa tour.'));
        refreshTours();
      });
  };

  const value = useMemo(() => ({
    tours,
    loading,
    refreshTours,
    addTour,
    updateTour,
    deleteTour,
    getProviderTours,
    approveTour,
    rejectTour,
    requestTourEdit,
  }), [tours, loading, user?.role]);

  return (
    <TourManagementContext.Provider value={value}>
      {children}
    </TourManagementContext.Provider>
  );
}

export function useTourManagement() {
  const context = useContext(TourManagementContext);
  if (context === undefined) {
    throw new Error('useTourManagement must be used within TourManagementProvider');
  }
  return context;
}
