"use client";

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { suggestedAdvanceBookingDays, useTourManagement } from '../contexts/TourManagementContext';
import { useBookings } from '../contexts/BookingContext';
import api, { getApiErrorMessage } from '@/services/api';
import type { Tour, Booking, TourReview } from '../types/domainTypes';
import {
  LayoutDashboard, Package, Plus, Edit, Trash2,
  CheckCircle, Clock, XCircle, MapPin, ChevronRight, X,
  Eye, AlertCircle, MessageSquare, RefreshCw, LogOut,
  Building2, Phone, Mail, Save, Users, UserCheck, Ban, CreditCard,
  Calendar, Star, ChevronDown, ChevronUp, Image as ImageIcon,
  List, Info, Send, ThumbsUp,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { SuccessModal } from '../components/SuccessModal';
import { CreateTourModal } from '../components/CreateTourModal';
import { MessagingSystem, type Conversation as ChatConversation } from '../components/MessagingSystem';
import { getIncludeLabel } from '../utils/includeLabels';
import { getProviderStatusLabel, getTourTypeLabel as getSharedTourTypeLabel } from '../utils/labels';

const PROVIDER_ID = 'prov1';

function formatVND(price: number) {
  return new Intl.NumberFormat('vi-VN').format(price || 0) + 'đ';
}

const monthlyData = [
  { month: 'T10/25', bookings: 12 },
  { month: 'T11/25', bookings: 18 },
  { month: 'T12/25', bookings: 15 },
  { month: 'T1/26',  bookings: 22 },
  { month: 'T2/26',  bookings: 19 },
  { month: 'T3/26',  bookings: 25 },
];

type NavKey = 'overview' | 'company' | 'tours' | 'bookings' | 'reviews' | 'feedback';

const PROVIDER_NAV_PATHS: Record<NavKey, string> = {
  overview: '/provider/overview',
  company: '/provider/company',
  tours: '/provider/tours',
  bookings: '/provider/bookings',
  reviews: '/provider/reviews',
  feedback: '/provider/feedback',
};

const PROVIDER_PATH_TO_NAV: Record<string, NavKey> = {
  dashboard: 'overview',
  overview: 'overview',
  company: 'company',
  tours: 'tours',
  bookings: 'bookings',
  reviews: 'reviews',
  feedback: 'feedback',
  messages: 'feedback',
};

const tourStatusMap: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  approved:   { label: 'Đã duyệt',      color: '#059669', bg: '#D1FAE5', icon: CheckCircle },
  pending:    { label: 'Chờ duyệt',     color: '#D97706', bg: '#FEF3C7', icon: Clock },
  rejected:   { label: 'Bị từ chối',    color: '#DC2626', bg: '#FEE2E2', icon: XCircle },
  need_edit:  { label: 'Cần chỉnh sửa', color: '#7C3AED', bg: '#F5F3FF', icon: AlertCircle },
  updated:    { label: 'Đã cập nhật',   color: '#0064D2', bg: '#DBEAFE', icon: RefreshCw },
};

const fallbackTourStatus = { label: 'Chờ duyệt', color: '#D97706', bg: '#FEF3C7', icon: Clock };

const tourTypeOptions: Array<{ value: Tour['type']; label: string }> = [
  { value: 'adventure', label: 'Mạo hiểm' },
  { value: 'beach', label: 'Biển đảo' },
  { value: 'cultural', label: 'Văn hóa' },
  { value: 'food', label: 'Ẩm thực' },
  { value: 'nature', label: 'Thiên nhiên' },
  { value: 'mountain', label: 'Núi' },
  { value: 'city', label: 'Thành phố' },
];

function getTourTypeLabel(type: string) {
  return getSharedTourTypeLabel(type);
}

const bookingStatusMap = {
  pending:   { label: 'Chờ thanh toán', color: '#D97706', bg: '#FEF3C7' },
  deposited: { label: 'Đã cọc',      color: '#B45309', bg: '#FEF3C7' },
  paid:      { label: 'Đã thanh toán', color: '#059669', bg: '#D1FAE5' },
  confirmed: { label: 'Đã xác nhận', color: '#059669', bg: '#D1FAE5' },
  cancelled: { label: 'Đã hủy',      color: '#DC2626', bg: '#FEE2E2' },
  completed: { label: 'Hoàn thành',  color: '#0064D2', bg: '#DBEAFE' },
  refunded:  { label: 'Đã hoàn tiền', color: '#7C3AED', bg: '#F5F3FF' },
};

const DEFAULT_MAX_SEATS: Record<string, number> = {
  '1': 30, '2': 20, '3': 25, '4': 15, '5': 40, '6': 25, '7': 35,
};

type EditTab = 'basic' | 'itinerary' | 'seats' | 'departures';

interface DepartureSchedule {
  id: string;
  tourId: string;
  date: string;
  totalSlots: number;
  bookedSlots: number;
  status: 'open' | 'closed' | 'full';
  reason?: string;
}

function toBlockedDate(dto: any): DepartureSchedule {
  return {
    id: dto.id,
    tourId: dto.tourId,
    date: dto.departureDate || dto.blockedDate || dto.date,
    totalSlots: dto.totalSlots || 0,
    bookedSlots: dto.bookedSlots || 0,
    status: (dto.status || 'closed').toLowerCase(),
    reason: dto.reason || '',
  };
}

function toProviderReview(dto: any): TourReview {
  return {
    id: dto.id,
    tourId: dto.tourId || '',
    tourName: dto.tourName || '',
    userId: dto.userId || '',
    userName: dto.userName || '',
    rating: dto.rating || 0,
    comment: dto.comment || '',
    images: dto.images || [],
    createdAt: dto.createdAt || new Date().toISOString(),
    helpful: dto.helpfulCount || 0,
    response: dto.providerResponse ? {
      from: dto.responseFrom || 'Nhà cung cấp',
      message: dto.providerResponse,
      createdAt: dto.responseDate || dto.responseAt || new Date().toISOString(),
    } : undefined,
    responseRequested: dto.responseRequested ?? false,
    responseRequestedAt: dto.responseRequestedAt,
    responseRequestedBy: dto.responseRequestedBy,
  };
}

interface ItineraryDay {
  day: number;
  titleVi: string;
  titleEn: string;
  activitiesVi: string[];
  activitiesEn: string[];
}

interface EditFormState {
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  location: string;
  type: string;
  duration: number;
  advanceBookingDays: number;
  price: number;
  originalPrice: number;
  promotionTitle: string;
  promotionBadge: string;
  discountPercent: number;
  promotionActive: boolean;
  image: string;
  imageFile?: File | null;
  images: string[];
  galleryFiles?: File[];
  included: string[];
  itinerary: ItineraryDay[];
  maxSeats: number;
}

function getTourActivities(day: any, lang: 'vi' | 'en' = 'vi'): string[] {
  const activities = day?.activities;
  if (Array.isArray(activities)) return activities;
  if (Array.isArray(activities?.[lang])) return activities[lang];
  if (Array.isArray(activities?.vi)) return activities.vi;
  if (Array.isArray(activities?.en)) return activities.en;
  return [];
}

export function ProviderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { tours: allTours, deleteTour, addTour, updateTour, refreshTours } = useTourManagement();
  const { bookings: allBookings, updateBookingStatus, cancelBooking } = useBookings();

  // ─── Nav ──────────────────────────────────────────────────────────────
  const activePathSegment = location.pathname.split('/').filter(Boolean)[1] || 'overview';
  const activeNav = PROVIDER_PATH_TO_NAV[activePathSegment] || 'overview';
  const setActiveNav = (nav: NavKey) => navigate(PROVIDER_NAV_PATHS[nav]);

  useEffect(() => {
    if (!PROVIDER_PATH_TO_NAV[activePathSegment]) {
      navigate(PROVIDER_NAV_PATHS.overview, { replace: true });
    }
  }, [activePathSegment, navigate]);

  // ─── Modals ───────────────────────────────────────────────────────────
  const [showLogoutModal, setShowLogoutModal]   = useState(false);
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string;
    onConfirm: () => void; variant?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'warning' });
  const [successModal, setSuccessModal] = useState<{ 
    isOpen: boolean; title: string; message: string;
  }>({ isOpen: false, title: '', message: '' });
  const [reviewResponseDrafts, setReviewResponseDrafts] = useState<Record<string, string>>({});
  const [savingReviewResponseId, setSavingReviewResponseId] = useState<string | null>(null);

  // ─── Selection states ─────────────────────────────────────────────────
  const [selectedTour,     setSelectedTour]    = useState<Tour | null>(null);
  const [selectedBooking,  setSelectedBooking] = useState<Booking | null>(null);
  const [selectedReviewTour, setSelectedReviewTour] = useState<string>('all');
  const [editingTour,      setEditingTour]     = useState<Tour | null>(null);
  const [editTab,          setEditTab]         = useState<EditTab>('basic');
  const [expandedTour, setExpandedTour] = useState<string | null>(null);
  const [selectedSeatDateByTour, setSelectedSeatDateByTour] = useState<Record<string, string>>({});

  // ─── Edit form state ──────────────────────────────────────────────────
  const [editForm, setEditForm] = useState<EditFormState>({
    nameVi: '', nameEn: '', descVi: '', descEn: '',
    location: '', type: 'adventure', duration: 1, advanceBookingDays: 1, price: 0,
    originalPrice: 0, promotionTitle: '', promotionBadge: '', discountPercent: 0, promotionActive: false,
    image: '', imageFile: null, images: [], galleryFiles: [], included: [], itinerary: [], maxSeats: 20,
  });

  // ─── Seat management ──────────────────────────────────────────────────
  const [seatMap, setSeatMap] = useState<Record<string, number>>(DEFAULT_MAX_SEATS);

  // ─── Blocked dates ───────────────────────────────────────────────────
  const [departures, setDepartures] = useState<DepartureSchedule[]>([]);
  const [reviews, setReviews] = useState<TourReview[]>([]);
  const [tourMessages, setTourMessages] = useState<Record<string, ChatConversation['messages']>>({});
  const [unreadTourMessages, setUnreadTourMessages] = useState(0);
  const [showAddDeparture, setShowAddDeparture] = useState(false);
  const [newDepartureDate, setNewDepartureDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  // ─── Company info ─────────────────────────────────────────────────────
  const [company, setCompany] = useState({
    name:    'Công ty Du lịch Bắc Việt',
    email:   'bacviet@travel.vn',
    phone:   '024 3826 5555',
    address: '25 Tràng Thi, Hoàn Kiếm, Hà Nội',
    description:
      'Chúng tôi là công ty du lịch uy tín hàng đầu khu vực miền Bắc, chuyên cung cấp các tour du lịch trong nước và quốc tế chất lượng cao từ năm 2005.',
    taxCode:  '0102345678',
    license:  'LHVH-0142/2005',
  });
  const [providerId, setProviderId] = useState(PROVIDER_ID);
  const [providerProfileStatus, setProviderProfileStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [providerProfileLoading, setProviderProfileLoading] = useState(user?.role === 'provider');
  const [companySaving, setCompanySaving] = useState(false);
  const validateCompanyProfile = () => {
    const requiredFields = [
      { value: company.name, message: 'Vui lòng nhập tên công ty.' },
      { value: company.email, message: 'Vui lòng nhập email liên hệ.' },
      { value: company.phone, message: 'Vui lòng nhập số điện thoại.' },
      { value: company.taxCode, message: 'Vui lòng nhập mã số thuế.' },
      { value: company.license, message: 'Vui lòng nhập số giấy phép kinh doanh.' },
    ];
    const missing = requiredFields.find(field => !field.value.trim());
    if (missing) return missing.message;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.email.trim())) {
      return 'Email liên hệ không đúng định dạng.';
    }
    if (!/^[0-9+() .-]{8,15}$/.test(company.phone.trim())) {
      return 'Số điện thoại không đúng định dạng.';
    }
    if (!/^[0-9-]{10,14}$/.test(company.taxCode.trim())) {
      return 'Mã số thuế không đúng định dạng.';
    }
    return '';
  };
  const showProviderError = (title: string, error: unknown, fallback: string) => {
    setSuccessModal({
      isOpen: true,
      title,
      message: getApiErrorMessage(error, fallback),
    });
  };

  // ─── Derived data ─────────────────────────────────────────────────────
  const providerAccessApproved = user?.role !== 'provider' || providerProfileStatus === 'approved';
  const tours    = user?.role === 'provider'
    ? (providerAccessApproved ? allTours : [])
    : allTours.filter(t => t.providerId === providerId);
  const tourIds  = tours.map(t => t.id);
  const bookings = allBookings.filter(b => tourIds.includes(b.tourId));

  useEffect(() => {
    if (user?.role !== 'provider') {
      setProviderProfileLoading(false);
      return;
    }
    setProviderProfileLoading(true);
    api.getProviderProfile()
      .then(profile => {
        if (!profile) return;
        setProviderId(profile.id || PROVIDER_ID);
        setProviderProfileStatus(((profile.status || 'pending').toLowerCase()) as 'pending' | 'approved' | 'rejected');
        setCompany(prev => ({
          ...prev,
          name: profile.companyName || prev.name,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
          address: profile.address || prev.address,
          description: profile.description || prev.description,
          taxCode: profile.taxCode || prev.taxCode,
          license: profile.licenseNumber || prev.license,
        }));
      })
      .catch(error => showProviderError('Không thể tải hồ sơ nhà cung cấp', error, 'Vui lòng đăng nhập lại hoặc thử lại sau.'))
      .finally(() => setProviderProfileLoading(false));
  }, [user?.role]);

  useEffect(() => {
    if (tours.length === 0) {
      setDepartures([]);
      return;
    }

    let isMounted = true;
    Promise.all(tours.map(tour =>
      api.getTourSchedules(tour.id)
        .then(data => (data || []).filter((item: any) => (item.status || '').toLowerCase() === 'closed').map(toBlockedDate))
        .catch(error => {
          showProviderError('Không thể tải ngày khóa', error, `Không tải được ngày khóa của tour "${tour.name.vi}".`);
          return [] as DepartureSchedule[];
        })
    )).then(results => {
      if (isMounted) setDepartures(results.flat());
    });

    return () => {
      isMounted = false;
    };
  }, [tourIds.join('|')]);

  useEffect(() => {
    if (tours.length === 0) {
      setReviews([]);
      return;
    }

    let isMounted = true;
    Promise.all(tours.map(tour =>
      api.getReviews(tour.id)
        .then(data => (data || []).map(toProviderReview))
        .catch(() => [] as TourReview[])
    )).then(results => {
      if (isMounted) setReviews(results.flat());
    });

    return () => {
      isMounted = false;
    };
  }, [tourIds.join('|')]);

  useEffect(() => {
    if (tours.length === 0) {
      setTourMessages({});
      return;
    }

    let isMounted = true;
    Promise.all(tours.map(tour =>
      api.getTourMessages(tour.id)
        .then(data => [tour.id, (data || []).map((message: any) => ({
          id: message.id,
          senderRole: (message.senderRole || 'provider').toLowerCase() as ChatConversation['messages'][number]['senderRole'],
          senderName: message.senderName || '',
          message: message.message || '',
          timestamp: message.sentAt || new Date().toISOString(),
        }))] as const)
        .catch(() => [tour.id, []] as const)
    )).then(entries => {
      if (isMounted) setTourMessages(Object.fromEntries(entries));
    });

    return () => {
      isMounted = false;
    };
  }, [tourIds.join('|')]);

  const providerReviews = reviews.filter(r => tourIds.includes(r.tourId));
  const feedbacks = useMemo(
    () => tours.map(tour => ({ tourId: tour.id, messages: tourMessages[tour.id] ?? [] })),
    [tours, tourMessages]
  );
  const pendingBookings = bookings.filter(b => ['deposited', 'paid'].includes(b.status));
  const pendingTours    = tours.filter(t => t.status === 'pending');
  const needEditTours   = tours.filter(t => t.status === 'need_edit');

  const avgRating = providerReviews.length > 0
    ? (providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length).toFixed(1)
    : '0.0';

  const actionableBookings = bookings
    .filter(booking => ['deposited', 'paid'].includes(booking.status))
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const activeTours = tours.filter(tour => tour.status === 'approved');
  const completedBookings = bookings.filter(booking => booking.status === 'completed');
  const cancelledBookings = bookings.filter(booking => ['cancelled', 'refunded'].includes(booking.status));
  const receivableStatuses = ['deposited', 'paid', 'confirmed', 'completed'];
  const hasCollectedPayment = (booking: Booking) =>
    ['deposited', 'paid', 'success'].includes(booking.paymentStatus || '') || Number(booking.depositAmount || 0) > 0;
  const isRetainedCancelledBooking = (booking: Booking) =>
    booking.status === 'cancelled'
    && ['no_refund', 'refund_rejected'].includes(booking.refundStatus || '')
    && hasCollectedPayment(booking);
  const isReceivableBooking = (booking: Booking) =>
    receivableStatuses.includes(booking.status) || isRetainedCancelledBooking(booking);
  const isVoidedBooking = (booking: Booking) =>
    booking.status === 'refunded' || (booking.status === 'cancelled' && !isRetainedCancelledBooking(booking));
  const receivableBookings = bookings.filter(isReceivableBooking);
  const getCustomerPaysProviderAmount = (booking: Booking) => {
    if (booking.paymentMethod !== 'cod') return 0;
    return booking.remainingAmount && booking.remainingAmount > 0
      ? booking.remainingAmount
      : Math.max(Number(booking.totalAmount || 0) - Number(booking.depositAmount || 0), 0);
  };
  const getAdminTransfersProviderAmount = (booking: Booking) => {
    const fallback = booking.paymentMethod === 'cod'
      ? Math.max(Number(booking.depositAmount || 0) - Number(booking.commissionAmount || 0), 0)
      : Math.max(Number(booking.totalAmount || 0) - Number(booking.commissionAmount || 0), 0);
    return Number(booking.payoutAmount || booking.providerPayoutAmount || fallback || 0);
  };
  const getProviderNetAmount = (booking: Booking) =>
    getCustomerPaysProviderAmount(booking) + getAdminTransfersProviderAmount(booking);
  const paidOutBookings = receivableBookings.filter(booking => booking.payoutStatus === 'paid_out');
  const providerNetRevenue = receivableBookings.reduce((sum, booking) => sum + getProviderNetAmount(booking), 0);
  const providerDirectCodAmount = receivableBookings.reduce((sum, booking) => sum + getCustomerPaysProviderAmount(booking), 0);
  const providerPaidOutAmount = paidOutBookings.reduce((sum, booking) => sum + getAdminTransfersProviderAmount(booking), 0);
  const pendingPayoutAmount = receivableBookings
    .filter(booking => (booking.status === 'completed' || isRetainedCancelledBooking(booking)) && booking.payoutStatus !== 'paid_out')
    .reduce((sum, booking) => sum + getAdminTransfersProviderAmount(booking), 0);
  const conversionBase = bookings.filter(booking => booking.status !== 'pending').length;
  const completionRate = conversionBase > 0
    ? Math.round((completedBookings.length / conversionBase) * 100)
    : 0;
  const upcomingBookings = bookings
    .filter(booking => ['deposited', 'paid', 'confirmed'].includes(booking.status))
    .filter(booking => new Date(booking.startDate || booking.departureDate || booking.createdAt || 0).getTime() >= Date.now())
    .slice()
    .sort((a, b) => new Date(a.startDate || a.departureDate || 0).getTime() - new Date(b.startDate || b.departureDate || 0).getTime())
    .slice(0, 5);
  const latestReviews = providerReviews
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const providerMonthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthBookings = bookings.filter(booking => {
      const createdAt = new Date(booking.createdAt || 0);
      return createdAt.getMonth() === month && createdAt.getFullYear() === year;
    });
    return {
      month: `T${month + 1}/${String(year).slice(-2)}`,
      bookings: monthBookings.length,
      revenue: monthBookings.reduce((sum, booking) => {
        if (!['deposited', 'paid', 'confirmed', 'completed'].includes(booking.status)) return sum;
        return sum + Math.max(Number(booking.totalAmount || 0) - Number(booking.commissionAmount || 0), 0);
      }, 0),
    };
  });

  const reviewTours = useMemo(() => {
    return tours
      .map(tour => {
        const tourReviews = providerReviews.filter(review => review.tourId === tour.id);
        const requestedCount = tourReviews.filter(review => !review.response && review.responseRequested).length;
        const unansweredCount = tourReviews.filter(review => !review.response).length;
        const rating = tourReviews.length
          ? Number((tourReviews.reduce((sum, review) => sum + review.rating, 0) / tourReviews.length).toFixed(1))
          : 0;

        return {
          tour,
          reviews: tourReviews,
          requestedCount,
          unansweredCount,
          answeredCount: tourReviews.length - unansweredCount,
          rating,
          latestReviewAt: tourReviews
            .map(review => new Date(review.createdAt).getTime())
            .filter(time => !Number.isNaN(time))
            .sort((a, b) => b - a)[0] || 0,
        };
      })
      .filter(item => item.reviews.length > 0)
      .sort((a, b) => b.requestedCount - a.requestedCount || b.unansweredCount - a.unansweredCount || b.latestReviewAt - a.latestReviewAt);
  }, [tours, providerReviews]);

  const activeReviewTourId = selectedReviewTour === 'all'
    ? reviewTours[0]?.tour.id
    : selectedReviewTour;
  const selectedReviewTourData = reviewTours.find(item => item.tour.id === activeReviewTourId) || reviewTours[0];
  const selectedTourReviews = selectedReviewTourData
    ? [...selectedReviewTourData.reviews].sort((a, b) => {
      const aRequested = !a.response && a.responseRequested;
      const bRequested = !b.response && b.responseRequested;
      if (aRequested && !bRequested) return -1;
      if (!aRequested && bRequested) return 1;
      if (!a.response && b.response) return -1;
      if (a.response && !b.response) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    : [];

  // ─── Nav groups ───────────────────────────────────────────────────────
  type NavItem  = { key: NavKey; label: string; icon: React.ElementType };
  type NavGroup = { label?: string; items: NavItem[] };

  const navGroups: NavGroup[] = [
    { items: [{ key: 'overview', label: 'Tổng quan', icon: LayoutDashboard }] },
    { label: 'DOANH NGHIỆP', items: [{ key: 'company', label: 'Thông tin công ty', icon: Building2 }] },
    {
      label: 'QUẢN LÝ TOUR',
      items: [{ key: 'tours', label: 'Danh sách tour', icon: Package }],
    },
    { label: 'ĐƠN ĐẶT', items: [{ key: 'bookings', label: 'Đơn đặt tour', icon: UserCheck }] },
    { label: 'DỊCH VỤ', items: [{ key: 'reviews', label: 'Đánh giá', icon: Star }] },
    { label: 'LIÊN LẠC', items: [{ key: 'feedback', label: 'Trao đổi Admin', icon: MessageSquare }] },
  ];

  const badgeMap: Partial<Record<NavKey, number>> = {};
  if (needEditTours.length > 0)    badgeMap['tours']    = needEditTours.length;
  if (pendingBookings.length > 0)  badgeMap['bookings'] = pendingBookings.length;
  const requestedReviews = providerReviews.filter(r => !r.response && r.responseRequested).length;
  const unansweredReviews = providerReviews.filter(r => !r.response).length;
  if (requestedReviews > 0) badgeMap['reviews'] = requestedReviews;
  if (unreadTourMessages > 0) badgeMap['feedback'] = unreadTourMessages;

  const allNavItems = navGroups.flatMap(g => g.items);

  const providerConversations: ChatConversation[] = useMemo(() => tours.map(tour => {
    const fb = feedbacks.find(f => f.tourId === tour.id);
    return {
      tourId: tour.id,
      tourName: tour.name.vi,
      tourImage: tour.image,
      tourStatus: tour.status,
      providerName: tour.providerName,
      providerId: tour.providerId,
      messages: (fb?.messages ?? []).map(m => ({
        id: m.id,
        senderRole: m.senderRole,
        senderName: m.senderName,
        message: m.message,
        timestamp: m.timestamp,
      })),
    };
  }).sort((a, b) => {
    const latestA = a.messages.at(-1)?.timestamp;
    const latestB = b.messages.at(-1)?.timestamp;
    return new Date(latestB || 0).getTime() - new Date(latestA || 0).getTime();
  }), [tours, feedbacks]);

  useEffect(() => {
    try {
      const readAtByTour = JSON.parse(localStorage.getItem('tour-message-read-provider') || '{}') as Record<string, number>;
      const unread = providerConversations.reduce((sum, conversation) => {
        const readAt = readAtByTour[conversation.tourId] || 0;
        return sum + conversation.messages.filter(message =>
          message.senderRole !== 'provider' && new Date(message.timestamp).getTime() > readAt
        ).length;
      }, 0);
      setUnreadTourMessages(unread);
    } catch {
      setUnreadTourMessages(0);
    }
  }, [providerConversations]);

  // ─── Helpers ──────────────────────────────────────────────────────────
  const getMaxSeats = (tourId: string) => {
    const tour = tours.find(item => item.id === tourId);
    return seatMap[tourId] ?? tour?.maxSeats ?? DEFAULT_MAX_SEATS[tourId] ?? 20;
  };
  const slotHoldingStatuses = ['pending', 'deposited', 'paid', 'confirmed', 'completed'];
  const getBookingDateKey = (booking: Booking) => {
    const rawDate = booking.startDate || booking.departureDate || booking.createdAt;
    if (!rawDate) return 'unknown';
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return String(rawDate).slice(0, 10);
    return parsed.toISOString().slice(0, 10);
  };
  const getTodayKey = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const getBookedSeats = (tourId: string) => {
    return bookings
      .filter(b => b.tourId === tourId && slotHoldingStatuses.includes(b.status))
      .reduce((sum, b) => sum + b.adults + b.children, 0);
  };
  const getSeatRowsByDate = (tourId: string) => {
    const maxSeats = getMaxSeats(tourId);
    const grouped = bookings
      .filter(b => b.tourId === tourId && slotHoldingStatuses.includes(b.status))
      .reduce((acc, booking) => {
        const dateKey = getBookingDateKey(booking);
        const guests = Number(booking.adults || 0) + Number(booking.children || 0);
        if (!acc[dateKey]) {
          acc[dateKey] = { dateKey, guests: 0, bookingCount: 0 };
        }
        acc[dateKey].guests += guests;
        acc[dateKey].bookingCount += 1;
        return acc;
      }, {} as Record<string, { dateKey: string; guests: number; bookingCount: number }>);

    return Object.values(grouped)
      .map(row => ({
        ...row,
        maxSeats,
        freeSeats: Math.max(0, maxSeats - row.guests),
        pct: maxSeats > 0 ? Math.min(100, Math.round((row.guests / maxSeats) * 100)) : 0,
      }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  };
  const getMaxBookedSeatsInDay = (tourId: string) => {
    const rows = getSeatRowsByDate(tourId);
    return rows.length > 0 ? Math.max(...rows.map(row => row.guests)) : 0;
  };
  const getSeatUsageForDate = (tourId: string, dateKey: string) => {
    const maxSeats = getMaxSeats(tourId);
    const matched = getSeatRowsByDate(tourId).find(row => row.dateKey === dateKey);
    const guests = matched?.guests || 0;
    return {
      dateKey,
      guests,
      bookingCount: matched?.bookingCount || 0,
      maxSeats,
      freeSeats: Math.max(0, maxSeats - guests),
      pct: maxSeats > 0 ? Math.min(100, Math.round((guests / maxSeats) * 100)) : 0,
    };
  };
  const formatDateKey = (dateKey: string) => {
    if (dateKey === 'unknown') return 'Chưa rõ ngày';
    return new Date(dateKey + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleAddDeparture = (tourId: string) => {
    if (!newDepartureDate) return;
    const exists = departures.find(d => d.tourId === tourId && d.date === newDepartureDate);
    if (exists) {
      setSuccessModal({
        isOpen: true,
        title: 'Ngày đã bị khóa',
        message: 'Ngày này đã nằm trong danh sách tạm ngừng nhận khách của tour.',
      });
      return;
    }

    const optimistic: DepartureSchedule = {
      id: 'dep_' + Date.now(),
      tourId,
      date: newDepartureDate,
      totalSlots: 0,
      bookedSlots: 0,
      status: 'closed',
      reason: newBlockedReason,
    };
    setDepartures(prev => [...prev, optimistic]);
    setNewDepartureDate('');
    setNewBlockedReason('');
    setShowAddDeparture(false);

    api.createProviderSchedule(tourId, {
      departureDate: optimistic.date,
      totalSlots: 0,
      bookedSlots: 0,
      status: 'closed',
    })
      .then(created => setDepartures(prev => prev.map(d => d.id === optimistic.id ? toBlockedDate(created) : d)))
      .catch(error => {
        showProviderError('Không thể khóa ngày', error, 'Vui lòng kiểm tra ngày rồi thử lại.');
        setDepartures(prev => prev.filter(d => d.id !== optimistic.id));
      });
  };

  const handleToggleDeparture = (dep: DepartureSchedule) => {
    handleDeleteDeparture(dep);
  };

  const handleDeleteDeparture = (dep: DepartureSchedule) => {
    setDepartures(prev => prev.filter(d => d.id !== dep.id));
    api.deleteProviderSchedule(dep.tourId, dep.id)
      .catch(error => {
        showProviderError('Không thể mở lại ngày', error, 'Vui lòng thử lại sau.');
        setDepartures(prev => [...prev, dep]);
      });
  };

  const handleDeleteTour = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true, title: 'Xóa tour', variant: 'danger',
      message: `Bạn có chắc muốn xóa tour "${name}"? Thao tác này không thể hoàn tác.`,
      onConfirm: () => {
        deleteTour(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setSelectedTour(null);
        setEditingTour(null);
        setExpandedTour(prev => prev === id ? null : prev);
        setSuccessModal({ isOpen: true, title: 'Đã xóa tour', message: 'Tour đã được xóa thành công.' });
      },
    });
  };

  const handleConfirmBooking = (booking: Booking) => {
    setConfirmModal({
      isOpen: true, title: 'Xác nhận đặt chỗ', variant: 'info',
      message: `Xác nhận đơn đặt của khách "${booking.userName}" cho tour "${booking.tourName}"?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await updateBookingStatus(booking.id, 'confirmed');
          setSelectedBooking(null);
          setSuccessModal({ isOpen: true, title: 'Xác nhận thành công', message: 'Đơn đặt tour đã được xác nhận.' });
        } catch (error) {
          showProviderError('Không thể xác nhận đặt chỗ', error, 'Ngày khởi hành này không còn đủ chỗ cho số khách trong đơn. Vui lòng kiểm tra sức chứa theo ngày hoặc trao đổi lại với khách.');
        }
      },
    });
  };

  const handleCancelBooking = (booking: Booking) => {
    setConfirmModal({
      isOpen: true, title: booking.status === 'confirmed' ? 'Hủy đơn đặt tour' : 'Từ chối đặt chỗ', variant: 'danger',
      message: `Hủy đơn đặt của "${booking.userName}"? Nếu khách đã thanh toán/cọc, hệ thống sẽ chuyển đơn sang chờ admin hoàn tiền.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await cancelBooking(booking.id, {
            cancelReason: 'Nhà cung cấp hủy/từ chối đơn đặt tour',
          });
          setSelectedBooking(null);
          setSuccessModal({ isOpen: true, title: 'Đã hủy đơn', message: 'Đơn đã hủy. Nếu có tiền cọc/thanh toán, admin sẽ thấy trong danh sách chờ hoàn tiền.' });
        } catch (error) {
          showProviderError('Không thể từ chối đặt chỗ', error, 'Vui lòng thử lại sau.');
        }
      },
    });
  };

  const handleSendReviewResponse = async (review: TourReview) => {
    const message = (reviewResponseDrafts[review.id] || '').trim();
    if (!message) {
      setSuccessModal({
        isOpen: true,
        title: 'Chưa có nội dung phản hồi',
        message: 'Vui lòng nhập phản hồi trước khi gửi.',
      });
      return;
    }

    setSavingReviewResponseId(review.id);
    try {
      const updated = await api.addReviewResponse(review.id, message);
      setReviews(prev => prev.map(item => item.id === review.id ? toProviderReview(updated) : item));
      setReviewResponseDrafts(prev => ({ ...prev, [review.id]: '' }));
      setSuccessModal({
        isOpen: true,
        title: 'Đã gửi phản hồi',
        message: 'Phản hồi của bạn đã hiển thị dưới đánh giá của khách hàng.',
      });
    } catch (error) {
      setSuccessModal({
        isOpen: true,
        title: 'Không thể gửi phản hồi',
        message: getApiErrorMessage(error, 'Vui lòng kiểm tra quyền quản lý tour và thử lại.'),
      });
    } finally {
      setSavingReviewResponseId(null);
    }
  };

  const handleCreateTour = async (data: any) => {
    try {
      await addTour({ ...data, providerId, providerName: company.name });
      setShowCreateModal(false);
      setActiveNav('tours');
    } catch (error) {
      setSuccessModal({
        isOpen: true,
        title: 'Không thể tạo tour',
        message: getApiErrorMessage(error, 'Vui lòng kiểm tra thông tin tour và thử lại.'),
      });
      throw error;
    }
    setSuccessModal({ isOpen: true, title: 'Tạo tour thành công!', message: 'Tour mới đã được gửi đến Admin để xét duyệt.' });
  };

  const handleSaveCompany = () => {
    const validationMessage = validateCompanyProfile();
    if (validationMessage) {
      setSuccessModal({
        isOpen: true,
        title: 'Thiếu thông tin công ty',
        message: validationMessage,
      });
      return;
    }

    setCompanySaving(true);
    api.updateProviderProfile({
      companyName: company.name.trim(),
      email: company.email.trim(),
      phone: company.phone.trim(),
      address: company.address.trim(),
      description: company.description.trim(),
      taxCode: company.taxCode.trim(),
      licenseNumber: company.license.trim(),
    })
      .then(profile => {
        if (profile) {
          setCompany(prev => ({
            ...prev,
            name: profile.companyName || prev.name,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
            address: profile.address || prev.address,
            description: profile.description || prev.description,
            taxCode: profile.taxCode || prev.taxCode,
            license: profile.licenseNumber || prev.license,
          }));
        }
        setSuccessModal({ isOpen: true, title: 'Lưu thành công', message: 'Thông tin công ty đã được cập nhật.' });
      })
      .catch(error => showProviderError('Không thể lưu hồ sơ công ty', error, 'Vui lòng kiểm tra thông tin và thử lại.'))
      .finally(() => setCompanySaving(false));
  };



  const openEditTour = (tour: Tour) => {
    const maxSeats = getMaxSeats(tour.id);
    setEditForm({
      nameVi:    tour.name.vi,
      nameEn:    tour.name.en,
      descVi:    tour.description?.vi ?? '',
      descEn:    tour.description?.en ?? '',
      location:  tour.location,
      type:      tour.type,
      duration:  tour.duration,
      advanceBookingDays: tour.advanceBookingDays || suggestedAdvanceBookingDays(tour.duration),
      price:     tour.price,
      originalPrice: tour.originalPrice || tour.price,
      promotionTitle: tour.promotionTitle || 'Ưu đãi mùa hè',
      promotionBadge: tour.promotionBadge || '',
      discountPercent: tour.discountPercent || 0,
      promotionActive: Boolean(tour.promotionActive),
      image:     tour.image,
      imageFile: null,
      images:    Array.from(new Set([tour.image, ...(((tour as any).images || []) as string[])].filter(Boolean))),
      galleryFiles: [],
      included:  (tour.included ?? []).map(getIncludeLabel),
      itinerary: (tour.itinerary ?? []).map(d => ({
        day: d.day,
        titleVi: d.title.vi,
        titleEn: d.title.en,
        activitiesVi: getTourActivities(d, 'vi'),
        activitiesEn: getTourActivities(d, 'en'),
      })),
      maxSeats,
    });
    setEditTab('basic');
    setEditingTour(tour);
  };

  const handleSaveEditTour = async () => {
    if (!editingTour) return;
    try {
    // Update seat map
    setSeatMap(prev => ({ ...prev, [editingTour.id]: editForm.maxSeats }));
    // Update tour
    const hasPromotion = editForm.promotionActive && Number(editForm.discountPercent) > 0;
    const normalizedItinerary = editForm.itinerary.map(d => ({
      day: d.day,
      title: d.titleVi.trim(),
      activities: d.activitiesVi.map(item => item.trim()).filter(Boolean),
    }));
    const currentItinerary = (editingTour.itinerary ?? []).map(d => ({
      day: d.day,
      title: d.title.vi.trim(),
      activities: getTourActivities(d, 'vi').map(item => item.trim()).filter(Boolean),
    }));
    const uploadedCover = editForm.imageFile ? await api.uploadImage(editForm.imageFile, 'tours') : null;
    const uploadedGallery = editForm.galleryFiles?.length ? await api.uploadImages(editForm.galleryFiles, 'tours') : [];
    const coverUrl = uploadedCover?.url || editForm.image || editingTour.image;
    const uploadedGalleryUrls = uploadedGallery.map((item: any) => item.url).filter(Boolean);
    const nextImages = Array.from(new Set([coverUrl, ...editForm.images, ...uploadedGalleryUrls].map(url => url.trim()).filter(Boolean)));
    const contentChanged =
      (editForm.nameVi || editingTour.name.vi) !== editingTour.name.vi
      || (editForm.descVi || '') !== (editingTour.description?.vi ?? '')
      || (editForm.location || editingTour.location) !== editingTour.location
      || editForm.type !== editingTour.type
      || Number(editForm.duration) !== editingTour.duration
      || Number(editForm.advanceBookingDays) !== (editingTour.advanceBookingDays || suggestedAdvanceBookingDays(editingTour.duration))
      || Number(editForm.price) !== editingTour.price
      || coverUrl !== editingTour.image
      || JSON.stringify(nextImages) !== JSON.stringify([editingTour.image, ...(((editingTour as any).images || []) as string[])].filter(Boolean))
      || editForm.maxSeats !== getMaxSeats(editingTour.id)
      || JSON.stringify(editForm.included) !== JSON.stringify(editingTour.included ?? [])
      || JSON.stringify(normalizedItinerary) !== JSON.stringify(currentItinerary);
    const nextStatus =
      contentChanged && (editingTour.status === 'approved' || editingTour.status === 'need_edit')
        ? 'updated'
        : contentChanged && editingTour.status === 'rejected'
          ? 'pending'
          : editingTour.status;
    updateTour(editingTour.id, {
      name:        { vi: editForm.nameVi || editingTour.name.vi, en: editForm.nameVi || editingTour.name.vi },
      description: { vi: editForm.descVi, en: editForm.descVi },
      location:    editForm.location || editingTour.location,
      type:        editForm.type as Tour['type'],
      duration:    Number(editForm.duration) || editingTour.duration,
      advanceBookingDays: Number(editForm.advanceBookingDays) || suggestedAdvanceBookingDays(Number(editForm.duration) || editingTour.duration),
      price:       Number(editForm.price) || editingTour.price,
      originalPrice: hasPromotion ? Number(editForm.originalPrice) || editingTour.price : undefined,
      promotionTitle: hasPromotion ? editForm.promotionTitle : undefined,
      promotionBadge: hasPromotion ? editForm.promotionBadge : undefined,
      discountPercent: hasPromotion ? Number(editForm.discountPercent) || 0 : undefined,
      promotionActive: hasPromotion,
      image:       coverUrl,
      images:      nextImages,
      maxSeats:    editForm.maxSeats,
      included:    editForm.included,
      itinerary:   editForm.itinerary.map(d => ({
        day: d.day,
        title: { vi: d.titleVi, en: d.titleVi },
        activities: { vi: d.activitiesVi, en: d.activitiesVi },
      })),
      status: nextStatus,
    });
    setEditingTour(null);
    setSuccessModal({ isOpen: true, title: 'Lưu thành công', message: 'Thông tin tour đã được cập nhật và gửi Admin xét duyệt lại.' });
    } catch (error) {
      showProviderError('Không thể upload ảnh tour', error, 'Vui lòng kiểm tra cấu hình Cloudinary và thử lại.');
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  // ─── Itinerary helpers ────────────────────────────────────────────────
  const addItineraryDay = () => {
    const day = editForm.itinerary.length + 1;
    setEditForm(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, { day, titleVi: `Ngày ${day}`, titleEn: `Ngày ${day}`, activitiesVi: [''], activitiesEn: [''] }],
    }));
  };

  const removeItineraryDay = (idx: number) => {
    setEditForm(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })),
    }));
  };

  const updateItineraryDay = (idx: number, field: keyof ItineraryDay, value: any) => {
    setEditForm(prev => {
      const it = [...prev.itinerary];
      it[idx] = { ...it[idx], [field]: value };
      return { ...prev, itinerary: it };
    });
  };

  const updateActivity = (dayIdx: number, actIdx: number, lang: 'vi' | 'en', val: string) => {
    setEditForm(prev => {
      const it = [...prev.itinerary];
      const field = lang === 'vi' ? 'activitiesVi' : 'activitiesEn';
      const acts = [...it[dayIdx][field]];
      acts[actIdx] = val;
      it[dayIdx] = { ...it[dayIdx], [field]: acts };
      return { ...prev, itinerary: it };
    });
  };

  const addActivity = (dayIdx: number, lang: 'vi' | 'en') => {
    setEditForm(prev => {
      const it = [...prev.itinerary];
      const field = lang === 'vi' ? 'activitiesVi' : 'activitiesEn';
      it[dayIdx] = { ...it[dayIdx], [field]: [...it[dayIdx][field], ''] };
      return { ...prev, itinerary: it };
    });
  };

  const removeActivity = (dayIdx: number, actIdx: number, lang: 'vi' | 'en') => {
    setEditForm(prev => {
      const it = [...prev.itinerary];
      const field = lang === 'vi' ? 'activitiesVi' : 'activitiesEn';
      it[dayIdx] = { ...it[dayIdx], [field]: it[dayIdx][field].filter((_, i) => i !== actIdx) };
      return { ...prev, itinerary: it };
    });
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  if (user?.role === 'provider' && providerProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Clock className="mx-auto mb-3 h-8 w-8 text-blue-600" />
          <p className="text-sm font-bold text-slate-900">Đang kiểm tra hồ sơ nhà cung cấp</p>
          <p className="mt-1 text-sm text-slate-500">Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  if (user?.role === 'provider' && providerProfileStatus !== 'approved') {
    const rejected = providerProfileStatus === 'rejected';
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-950">Hồ sơ nhà cung cấp</p>
                  <p className="mt-1 text-sm text-slate-500">{company.name}</p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    background: rejected ? '#FEE2E2' : '#FEF3C7',
                    color: rejected ? '#DC2626' : '#D97706',
                  }}
                >
                  {getProviderStatusLabel(providerProfileStatus)}
                </span>
              </div>
            </div>

            <div className="px-6 py-8">
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: rejected ? '#FEF2F2' : '#FFFBEB' }}
              >
                {rejected ? <XCircle className="h-7 w-7 text-red-600" /> : <Clock className="h-7 w-7 text-amber-600" />}
              </div>
              <h1 className="text-2xl font-black text-slate-950">
                {rejected ? 'Hồ sơ chưa được chấp nhận' : 'Hồ sơ đang chờ admin duyệt'}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {rejected
                  ? 'Tài khoản nhà cung cấp của bạn hiện chưa đủ điều kiện hoạt động. Vui lòng liên hệ admin để biết lý do và gửi lại thông tin cần bổ sung.'
                  : 'Bạn đã có tài khoản nhà cung cấp, nhưng chưa thể quản lý tour, lịch khởi hành hoặc đơn đặt chỗ cho đến khi admin duyệt hồ sơ.'}
              </p>

              <div className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Email</p>
                  <p className="mt-1 font-semibold text-slate-800">{company.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Số điện thoại</p>
                  <p className="mt-1 font-semibold text-slate-800">{company.phone || '-'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="console-shell flex h-screen overflow-hidden" style={{ '--console-accent': '#0064D2' } as React.CSSProperties}>
      {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
      <aside className="console-sidebar w-60 flex-shrink-0 flex flex-col" style={{ height: '100vh' }}>
        <div className="console-sidebar-header px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="console-brand-mark w-7 h-7 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Provider Panel</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Thích Du Lịch Management</p>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div className={gi > 0 ? 'mt-4 mb-2' : 'mb-2'}>
                  <p className="console-sidebar-section mx-2 px-1 pt-3">{group.label}</p>
                </div>
              )}
              {gi === 0 && <div className="mb-1" />}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = activeNav === item.key;
                  const badge = badgeMap[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveNav(item.key)}
                      className={`console-nav-item ${active ? 'console-nav-item-active' : ''} w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.key === 'reviews' ? 'Phản hồi đánh giá' : item.label}</span>
                      {badge && badge > 0 && (
                        <span className="min-w-[20px] h-5 px-1 rounded-full text-white flex items-center justify-center font-bold" style={{ fontSize: '11px', background: '#FF6000' }}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="console-sidebar-panel mx-3 mb-3 p-3 rounded-xl">
          <p className="text-xs font-semibold text-white mb-2">Thống kê nhanh</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Tour',      value: tours.length },
              { label: 'Đặt chỗ',  value: bookings.length },
              { label: 'Chờ duyệt',value: pendingTours.length },
              { label: 'Rating',   value: avgRating },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="console-sidebar-muted text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="console-sidebar-header p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="console-avatar w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold">PV</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{company.name}</p>
              <p className="console-sidebar-muted text-xs truncate">{company.email}</p>
            </div>
          </div>
          <button
            className="console-sidebar-muted w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/10"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="console-topbar px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-bold text-gray-900" style={{ fontSize: '1.125rem' }}>
              {allNavItems.find(n => n.key === activeNav)?.label}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Quản lý và theo dõi hoạt động kinh doanh</p>
          </div>
          <div className="flex items-center gap-3">
            {activeNav === 'tours' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="console-button-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
                Tạo tour mới
              </button>
            )}
            <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#EFF6FF', color: '#0064D2' }}>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        <div className={activeNav === 'feedback' ? 'min-h-0 flex-1 overflow-hidden p-4' : 'console-content min-h-0 flex-1 overflow-auto'}>

          {/* ── OVERVIEW ──────────────────────────────────────────────── */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                <div className="xl:col-span-2 rounded-2xl p-6 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0A2540, #0064D2)' }}>
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/70">Thực nhận sau hoa hồng</p>
                      <p className="money-text money-text-lg mt-2 font-black" title={formatVND(providerNetRevenue)}>{formatVND(providerNetRevenue)}</p>
                      <p className="mt-2 text-sm text-white/70">Gồm tiền khách COD trả trực tiếp và khoản admin chuyển sau khi trừ hoa hồng.</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/15">
                      <CreditCard className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="min-w-0 rounded-xl bg-white/10 p-3">
                      <p className="text-xs text-white/65">Admin đã chuyển</p>
                      <p className="money-text money-text-fluid mt-1 font-black" title={formatVND(providerPaidOutAmount)}>{formatVND(providerPaidOutAmount)}</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-white/10 p-3">
                      <p className="text-xs text-white/65">Chờ admin chuyển</p>
                      <p className="money-text money-text-fluid mt-1 font-black" title={formatVND(pendingPayoutAmount)}>{formatVND(pendingPayoutAmount)}</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-white/10 p-3">
                      <p className="text-xs text-white/65">Khách COD trả NCC</p>
                      <p className="money-text money-text-fluid mt-1 font-black" title={formatVND(providerDirectCodAmount)}>{formatVND(providerDirectCodAmount)}</p>
                    </div>
                  </div>
                </div>

                {[
                  { label: 'Tour đang bán', value: activeTours.length, sub: tours.length + ' tour tổng', icon: Package, color: '#0064D2', bg: '#EFF6FF', nav: 'tours' as NavKey },
                  { label: 'Cần xác nhận', value: actionableBookings.length, sub: 'Đơn đã thanh toán/cọc', icon: Clock, color: '#D97706', bg: '#FFFBEB', nav: 'bookings' as NavKey },
                  { label: 'Đánh giá TB', value: avgRating, sub: providerReviews.length + ' đánh giá', icon: Star, color: '#F59E0B', bg: '#FEF3C7', nav: 'reviews' as NavKey },
                  { label: 'Tỉ lệ hoàn thành', value: completionRate + '%', sub: completedBookings.length + ' hoàn thành', icon: CheckCircle, color: '#059669', bg: '#D1FAE5', nav: null },
                  { label: 'Đơn đã hủy', value: cancelledBookings.length, sub: 'Gồm hủy và hoàn tiền', icon: XCircle, color: '#DC2626', bg: '#FEE2E2', nav: 'bookings' as NavKey },
                  { label: 'Tin nhắn mới', value: unreadTourMessages, sub: 'Trao đổi với admin', icon: MessageSquare, color: '#7C3AED', bg: '#F5F3FF', nav: 'feedback' as NavKey },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => stat.nav && setActiveNav(stat.nav)}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs text-gray-500 font-bold">{stat.label}</p>
                          <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                          <Icon className="w-5 h-5" style={{ color: stat.color }} />
                        </div>
                      </div>
                      <p className="font-black text-gray-900 text-3xl">{stat.value}</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-bold text-gray-900">Xu hướng đặt chỗ 6 tháng gần đây</h3>
                      <p className="text-xs text-gray-500 mt-1">Dữ liệu lấy từ booking thật của nhà cung cấp.</p>
                    </div>
                    <button
                      onClick={() => setActiveNav('bookings')}
                      className="px-3 py-2 rounded-xl text-xs font-bold"
                      style={{ background: '#EFF6FF', color: '#0064D2' }}
                    >
                      Xem đặt chỗ
                    </button>
                  </div>
                  <ResponsiveContainer key="rc-provider-bookings" width="100%" height={260}>
                    <LineChart id="provider-overview-bookings" data={providerMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value, name) => name === 'Doanh thu' ? formatVND(Number(value)) : value} />
                      <Line key="line-bookings" isAnimationActive={false} type="monotone" dataKey="bookings" name="Đặt chỗ" stroke="#0064D2" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line key="line-revenue" isAnimationActive={false} type="monotone" dataKey="revenue" name="Doanh thu" stroke="#059669" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Việc cần xử lý</h3>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#B45309' }}>
                      {actionableBookings.length + needEditTours.length + requestedReviews + unreadTourMessages} việc
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { show: needEditTours.length > 0, title: needEditTours.length + ' tour cần chỉnh sửa', desc: 'Admin yêu cầu cập nhật thông tin tour.', icon: AlertCircle, color: '#7C3AED', nav: 'tours' as NavKey },
                      { show: actionableBookings.length > 0, title: actionableBookings.length + ' đơn chờ xác nhận', desc: 'Khách đã thanh toán hoặc đặt cọc.', icon: Calendar, color: '#D97706', nav: 'bookings' as NavKey },
                      { show: requestedReviews > 0, title: requestedReviews + ' đánh giá cần phản hồi', desc: 'Admin hoặc khách đang chờ phản hồi.', icon: Star, color: '#F59E0B', nav: 'reviews' as NavKey },
                      { show: unreadTourMessages > 0, title: unreadTourMessages + ' tin nhắn mới', desc: 'Trao đổi với admin cần đọc.', icon: MessageSquare, color: '#0064D2', nav: 'feedback' as NavKey },
                    ].filter(item => item.show).map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => setActiveNav(item.nav)}
                          className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '15' }}>
                              <Icon className="w-4 h-4" style={{ color: item.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                              <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </button>
                      );
                    })}
                    {actionableBookings.length + needEditTours.length + requestedReviews + unreadTourMessages === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#059669' }} />
                        <p className="text-sm font-bold text-gray-800">Không có việc gấp</p>
                        <p className="text-xs text-gray-500 mt-1">Các đơn và tour hiện đang ổn.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Lịch khởi hành gần nhất</h3>
                    <button onClick={() => setActiveNav('bookings')} className="text-xs font-bold" style={{ color: '#0064D2' }}>Xem tất cả</button>
                  </div>
                  <div className="space-y-3">
                    {upcomingBookings.length === 0 ? (
                      <p className="text-sm text-gray-500 py-8 text-center">Chưa có lịch khởi hành sắp tới.</p>
                    ) : upcomingBookings.map(booking => {
                      const st = bookingStatusMap[booking.status as keyof typeof bookingStatusMap] || bookingStatusMap.pending;
                      return (
                        <div key={booking.id} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-gray-100">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{booking.tourName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {booking.userName} • {Number(booking.adults || 0) + Number(booking.children || 0)} khách • {new Date(booking.startDate || booking.departureDate || booking.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Đánh giá mới</h3>
                    <button onClick={() => setActiveNav('reviews')} className="text-xs font-bold" style={{ color: '#0064D2' }}>Phản hồi</button>
                  </div>
                  <div className="space-y-3">
                    {latestReviews.length === 0 ? (
                      <p className="text-sm text-gray-500 py-8 text-center">Chưa có đánh giá mới.</p>
                    ) : latestReviews.map(review => (
                      <div key={review.id} className="p-3 rounded-xl border border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{review.tourName}</p>
                            <p className="text-xs text-gray-500 mt-1">{review.userName} • {new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <span className="text-xs font-black whitespace-nowrap" style={{ color: '#F59E0B' }}>{review.rating}/5</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── COMPANY INFO ────────────────────────────────────────────── */}
          {activeNav === 'company' && (
            <div className="space-y-6 w-full">
              <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="h-28 flex items-end px-8 pb-4" style={{ background: 'linear-gradient(135deg, #0A2540, #1E3A5F)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg" style={{ background: '#0064D2' }}>
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="bg-white px-8 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{company.name}</h2>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#D1FAE5', color: '#059669' }}>✓ Đối tác xác minh</span>
                      <span className="text-xs text-gray-500">Mã GPKD: {company.license}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveCompany}
                    disabled={companySaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: '#0064D2' }}
                  >
                    <Save className="w-4 h-4" />
                    {companySaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <Building2 className="w-4 h-4" style={{ color: '#0064D2' }} />
                  Thông tin cơ bản
                </h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tên công ty *</label>
                    <input type="text" value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"><Mail className="w-3.5 h-3.5 inline mr-1.5" style={{ color: '#0064D2' }} />Email liên hệ *</label>
                    <input type="email" value={company.email} onChange={e => setCompany(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"><Phone className="w-3.5 h-3.5 inline mr-1.5" style={{ color: '#0064D2' }} />Số điện thoại *</label>
                    <input type="tel" value={company.phone} onChange={e => setCompany(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mã số thuế *</label>
                    <input type="text" value={company.taxCode} onChange={e => setCompany(p => ({ ...p, taxCode: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Số giấy phép kinh doanh *</label>
                    <input type="text" value={company.license} onChange={e => setCompany(p => ({ ...p, license: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"><MapPin className="w-3.5 h-3.5 inline mr-1.5" style={{ color: '#0064D2' }} />Địa chỉ</label>
                    <input type="text" value={company.address} onChange={e => setCompany(p => ({ ...p, address: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Giới thiệu công ty</label>
                    <textarea value={company.description} onChange={e => setCompany(p => ({ ...p, description: e.target.value }))} rows={4} className={`${inputCls} resize-none`} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Thống kê hoạt động</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Tổng tour',      value: tours.length,                                          color: '#0064D2' },
                    { label: 'Đã được duyệt',  value: tours.filter(t => t.status === 'approved').length,     color: '#059669' },
                    { label: 'Tổng đặt chỗ',  value: bookings.length,                                       color: '#7C3AED' },
                    { label: 'Đánh giá TB',   value: avgRating + '★',                                       color: '#F59E0B' },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-4 rounded-xl" style={{ background: '#F9FAFB' }}>
                      <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TOURS (comprehensive) ──────────────────────────────────── */}
          {activeNav === 'tours' && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Tổng tour',    value: tours.length,                                        color: '#0064D2', bg: '#EFF6FF' },
                  { label: 'Đã duyệt',    value: tours.filter(t => t.status === 'approved').length,    color: '#059669', bg: '#ECFDF5' },
                  { label: 'Chờ duyệt',   value: tours.filter(t => t.status === 'pending').length,     color: '#D97706', bg: '#FFFBEB' },
                  { label: 'Cần sửa',     value: needEditTours.length,                                 color: '#7C3AED', bg: '#F5F3FF' },
                  { label: 'Tổng đặt chỗ',value: bookings.length,                                      color: '#0064D2', bg: '#EFF6FF' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
                    <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: s.color, opacity: 0.75 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {tours.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-semibold text-gray-500 mb-2">Chưa có tour nào</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white mt-2"
                    style={{ background: '#0064D2' }}
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Tạo tour đầu tiên
                  </button>
                </div>
              ) : tours.map(tour => {
                const status = tourStatusMap[tour.status] || fallbackTourStatus;
                const StatusIcon = status.icon;
                const tourBookings = bookings.filter(b => b.tourId === tour.id);
                const tourReviews  = reviews.filter(r => r.tourId === tour.id);
                const maxSeats     = getMaxSeats(tour.id);
                const seatRows = getSeatRowsByDate(tour.id);
                const selectedSeatDate = selectedSeatDateByTour[tour.id] || getTodayKey();
                const selectedSeatUsage = getSeatUsageForDate(tour.id, selectedSeatDate);
                const bookedSeats  = selectedSeatUsage.guests;
                const freeSeats    = selectedSeatUsage.freeSeats;
                const seatPct      = selectedSeatUsage.pct;
                const isExpanded   = expandedTour === tour.id;

                return (
                  <div
                    key={tour.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md"
                  >
                    {/* ── Card main row ── */}
                    <div className="p-5 flex gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={tour.image}
                          alt={tour.name.vi}
                          className="w-36 h-36 rounded-xl object-cover"
                        />
                        <div
                          className="absolute bottom-2 left-2 right-2 text-center px-2 py-1 rounded-lg text-xs font-bold text-white"
                          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                        >
                          {tour.duration} ngày {tour.duration - 1} đêm
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-gray-900 text-base truncate">{tour.name.vi}</h3>
                            <p className="text-xs text-gray-400 truncate">{tour.name.en}</p>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0" style={{ background: status.bg, color: status.color }}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </div>
                        </div>

                        {/* Location + price */}
                        <div className="flex items-center gap-4 mb-3">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />{tour.location}
                          </span>
                          <span className="money-text max-w-[150px] text-sm font-black" style={{ color: '#0064D2' }} title={formatVND(tour.price)}>{formatVND(tour.price)}</span>
                          {tour.promotionActive && tour.originalPrice && tour.originalPrice > tour.price && (
                            <span className="text-xs font-semibold text-orange-600">
                              {tour.promotionBadge || `SALE ${tour.discountPercent || 0}%`}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">/ người</span>
                        </div>

                        {/* Admin note */}
                        {(tour.status === 'need_edit' || tour.status === 'rejected') && (tour.adminNotes || tour.rejectionReason) && (
                          <div className="p-2.5 rounded-xl mb-3" style={{ background: tour.status === 'need_edit' ? '#F5F3FF' : '#FEE2E2' }}>
                            <p className="text-xs font-bold mb-0.5" style={{ color: tour.status === 'need_edit' ? '#7C3AED' : '#DC2626' }}>
                              {tour.status === 'need_edit' ? '⚠️ Yêu cầu chỉnh sửa:' : '❌ Lý do từ chối:'}
                            </p>
                            <p className="text-xs" style={{ color: tour.status === 'need_edit' ? '#5B21B6' : '#991B1B' }}>
                              {tour.status === 'need_edit' ? tour.adminNotes : tour.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3 lg:grid-cols-5">
                          <div className="text-center p-2 rounded-xl" style={{ background: '#F9FAFB' }}>
                            <p className="text-xs text-gray-400">Đánh giá</p>
                            <p className="text-sm font-black text-gray-800 flex items-center justify-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{tour.rating}
                            </p>
                          </div>
                          <div className="text-center p-2 rounded-xl" style={{ background: '#F9FAFB' }}>
                            <p className="text-xs text-gray-400">Lượt đặt</p>
                            <p className="text-sm font-black text-gray-800">{tourBookings.length}</p>
                          </div>
                          <div className="text-center p-2 rounded-xl" style={{ background: '#F9FAFB' }}>
                            <p className="text-xs text-gray-400">Đánh giá</p>
                            <p className="text-sm font-black text-gray-800">{tourReviews.length}</p>
                          </div>
                          <div className="col-span-2 p-2 rounded-xl" style={{ background: freeSeats === 0 ? '#FEE2E2' : '#ECFDF5' }}>
                            <div className="flex flex-col gap-2 mb-1 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs font-bold" style={{ color: freeSeats === 0 ? '#DC2626' : '#059669' }}>
                                  Sức chứa theo ngày
                                </p>
                                <p className="text-[11px]" style={{ color: freeSeats === 0 ? '#DC2626' : '#059669', opacity: 0.75 }}>
                                  {formatDateKey(selectedSeatDate)}
                                </p>
                              </div>
                              <input
                                type="date"
                                value={selectedSeatDate}
                                onChange={event => setSelectedSeatDateByTour(prev => ({ ...prev, [tour.id]: event.target.value }))}
                                className="h-8 w-full rounded-lg border border-white/70 bg-white px-2 text-xs font-bold text-gray-700 outline-none sm:max-w-[132px]"
                              />
                            </div>
                            <div className="mb-1 flex items-center justify-between">
                              <p className="text-xs" style={{ color: freeSeats === 0 ? '#DC2626' : '#059669' }}>
                                {selectedSeatUsage.bookingCount} đơn giữ chỗ
                              </p>
                              <p className="text-xs font-black" style={{ color: freeSeats === 0 ? '#DC2626' : '#059669' }}>
                                {bookedSeats}/{maxSeats} chỗ
                              </p>
                            </div>
                            <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${seatPct}%`,
                                  background: seatPct >= 90 ? '#DC2626' : seatPct >= 70 ? '#F59E0B' : '#059669',
                                }}
                              />
                            </div>
                            <p className="text-xs mt-1" style={{ color: freeSeats === 0 ? '#DC2626' : '#059669' }}>
                              Còn {freeSeats} chỗ trống
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedTour(isExpanded ? null : tour.id)}
                            className="flex min-w-0 items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{ border: '1px solid #E5E7EB', color: '#6B7280', background: isExpanded ? '#F9FAFB' : 'white' }}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTour(tour)}
                            className="flex min-w-0 items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                            style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditTour(tour)}
                            className="flex min-w-0 items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                            style={{ background: '#0064D2' }}
                          >
                            <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                          </button>
                          {tour.status === 'need_edit' && (
                            <button
                              type="button"
                              onClick={() => openEditTour(tour)}
                              className="flex min-w-0 items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                              style={{ background: '#7C3AED', color: 'white' }}
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Gửi lại
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTour(tour.id, tour.name.vi)}
                            className="flex min-w-0 items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-red-50 sm:ml-auto"
                            style={{ border: '1px solid #FECACA', color: '#DC2626' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Expanded detail panel ── */}
                    {isExpanded && (
                      <div className="border-t border-gray-100" style={{ background: '#F9FAFB' }}>
                        <div className="p-6 grid md:grid-cols-2 gap-6">
                          {/* Left: description + included */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Sức chứa theo ngày khởi hành</p>
                              {seatRows.length === 0 ? (
                                <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
                                  Chưa có khách giữ chỗ cho ngày khởi hành nào. Mỗi ngày đang còn {maxSeats} chỗ.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {seatRows.slice(0, 5).map(row => (
                                    <div key={row.dateKey} className="rounded-xl border border-gray-100 bg-white p-3">
                                      <div className="flex items-center justify-between gap-3 mb-2">
                                        <div>
                                          <p className="text-sm font-bold text-gray-900">{formatDateKey(row.dateKey)}</p>
                                          <p className="text-xs text-gray-500">{row.bookingCount} đơn giữ chỗ</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-black" style={{ color: row.freeSeats === 0 ? '#DC2626' : '#059669' }}>{row.guests}/{row.maxSeats} chỗ</p>
                                          <p className="text-xs" style={{ color: row.freeSeats === 0 ? '#DC2626' : '#059669' }}>Còn {row.freeSeats}</p>
                                        </div>
                                      </div>
                                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                          className="h-full rounded-full"
                                          style={{
                                            width: `${row.pct}%`,
                                            background: row.pct >= 90 ? '#DC2626' : row.pct >= 70 ? '#F59E0B' : '#059669',
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                  {seatRows.length > 5 && (
                                    <p className="text-xs text-gray-500">Còn {seatRows.length - 5} ngày khác trong danh sách đặt chỗ.</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Mô tả (Tiếng Việt)</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{tour.description?.vi || '(Chưa có mô tả)'}</p>
                            </div>
                            {tour.included && tour.included.length > 0 && (
                              <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Bao gồm</p>
                                <div className="flex flex-wrap gap-2">
                                  {tour.included.map((item, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#ECFDF5', color: '#059669' }}>
                                      ✓ {getIncludeLabel(item)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right: itinerary */}
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Lịch trình chi tiết</p>
                            {tour.itinerary && tour.itinerary.length > 0 ? (
                              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {tour.itinerary.map(day => (
                                  <div key={day.day} className="flex gap-3 bg-white rounded-xl p-3 border border-gray-100">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ background: '#0064D2' }}>
                                      {day.day}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-gray-800 text-sm">{day.title.vi}</p>
                                      <ul className="mt-1 space-y-0.5">
                                        {getTourActivities(day, 'vi').map((act, i) => (
                                          <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                                            <span className="text-gray-300 mt-0.5">•</span>{act}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">(Chưa có lịch trình)</p>
                            )}
                          </div>
                        </div>

                        <div className="px-6 pb-5">
                          <button
                            type="button"
                            onClick={() => openEditTour(tour)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                            style={{ background: '#0064D2' }}
                          >
                            <Edit className="w-4 h-4" /> Chỉnh sửa toàn bộ thông tin tour
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── BOOKINGS ──────────────────────────────────────────────── */}
          {activeNav === 'bookings' && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: 'Tất cả',       value: bookings.length,                                       icon: Calendar,   color: '#0064D2', bg: '#EFF6FF', border: '#BFDBFE' },
                  { label: 'Chờ xác nhận', value: pendingBookings.length,                                icon: Clock,      color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                  { label: 'Đã xác nhận',  value: bookings.filter(b => b.status === 'confirmed').length, icon: UserCheck,  color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
                  { label: 'Đã hủy',       value: bookings.filter(b => b.status === 'cancelled').length, icon: Ban,        color: '#DC2626', bg: '#FFF5F5', border: '#FECACA' },
                  { label: 'Chờ chuyển',   value: formatVND(pendingPayoutAmount),                         icon: CreditCard, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
                  { label: 'Thực nhận',    value: formatVND(providerNetRevenue),                          icon: CreditCard, color: '#059669', bg: '#ECFDF5', border: '#BBF7D0' },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <Icon className="w-5 h-5" style={{ color: s.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="money-text money-text-fluid font-bold text-xl" style={{ color: s.color }} title={String(s.value)}>{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                    <p className="text-gray-400 font-semibold">Chưa có đơn đặt nào</p>
                  </div>
                ) : bookings.map(booking => {
                  const st = bookingStatusMap[booking.status as keyof typeof bookingStatusMap] || bookingStatusMap.cancelled;
                  const tour = tours.find(t => t.id === booking.tourId);
                  const isAwaitingPayment = booking.status === 'pending';
                  const canProviderConfirm = ['deposited', 'paid'].includes(booking.status);
                  const customerPaysProvider = isVoidedBooking(booking) ? 0 : getCustomerPaysProviderAmount(booking);
                  const adminTransfersProvider = isVoidedBooking(booking) ? 0 : getAdminTransfersProviderAmount(booking);
                  const providerNetAmount = isVoidedBooking(booking) ? 0 : getProviderNetAmount(booking);
                  const commissionAmount = isVoidedBooking(booking) ? 0 : Number(booking.commissionAmount || 0);
                  const payoutStatus = isVoidedBooking(booking)
                    ? { label: 'Không phát sinh chuyển NCC', color: '#6B7280', bg: '#F3F4F6' }
                    : booking.payoutStatus === 'paid_out'
                      ? { label: 'Admin đã chuyển', color: '#059669', bg: '#ECFDF5' }
                      : booking.payoutStatus === 'payout_pending'
                        ? { label: 'Chờ admin chuyển', color: '#0064D2', bg: '#EFF6FF' }
                        : { label: booking.status === 'completed' || isRetainedCancelledBooking(booking) ? 'Chưa ghi nhận chuyển' : 'Chưa đến hạn chuyển', color: '#6B7280', bg: '#F3F4F6' };
                  return (
                    <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden">
                      {(isAwaitingPayment || canProviderConfirm) && <div className="h-1" style={{ background: 'linear-gradient(90deg, #F59E0B, #FCD34D)' }} />}
                      <div className="p-5 flex gap-4">
                        {tour ? (
                          <img src={tour.image} alt={booking.tourName} className="w-[88px] h-[88px] rounded-2xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-[88px] h-[88px] rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                            <Package className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">{booking.tourName}</p>
                              <p className="text-xs text-gray-400 mt-0.5">#{booking.id}</p>
                            </div>
                            <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: '#F9FAFB' }}>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#0064D2' }}>
                                {booking.userName.charAt(0)}
                              </div>
                              <span className="text-xs font-medium text-gray-700">{booking.userName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: '#F9FAFB' }}>
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs text-gray-600">{new Date(booking.startDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: '#F9FAFB' }}>
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs text-gray-600">{booking.adults + booking.children} người</span>
                            </div>
                          </div>
                          <div className="mb-3 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
                            <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2">
                              <p className="font-semibold text-gray-400">Hoa hồng</p>
                              <p className="money-text mt-1 font-black text-gray-800" title={formatVND(commissionAmount)}>{formatVND(commissionAmount)}</p>
                            </div>
                            {booking.paymentMethod === 'cod' && (
                              <div className="min-w-0 rounded-xl bg-amber-50 px-3 py-2">
                                <p className="font-semibold text-amber-600">Khách trả NCC</p>
                                <p className="money-text mt-1 font-black text-amber-700" title={formatVND(customerPaysProvider)}>{formatVND(customerPaysProvider)}</p>
                              </div>
                            )}
                            <div className="min-w-0 rounded-xl bg-blue-50 px-3 py-2">
                              <p className="font-semibold text-blue-600">Admin chuyển</p>
                              <p className="money-text mt-1 font-black text-blue-700" title={formatVND(adminTransfersProvider)}>{formatVND(adminTransfersProvider)}</p>
                            </div>
                            <div className="min-w-0 rounded-xl bg-emerald-50 px-3 py-2">
                              <p className="font-semibold text-emerald-600">Thực nhận</p>
                              <p className="money-text mt-1 font-black text-emerald-700" title={formatVND(providerNetAmount)}>{formatVND(providerNetAmount)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="money-text font-bold" style={{ color: '#0064D2', fontSize: '1.1rem' }} title={formatVND(booking.totalAmount)}>{formatVND(booking.totalAmount)}</p>
                              <span className="mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: payoutStatus.bg, color: payoutStatus.color }}>{payoutStatus.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSelectedBooking(booking)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ border: '1.5px solid #E5E7EB', color: '#6B7280' }}>
                                <Eye className="w-3.5 h-3.5" /> Chi tiết
                              </button>
                              {canProviderConfirm && (
                                <>
                                  <button onClick={() => handleConfirmBooking(booking)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90" style={{ background: '#059669' }}>
                                    <UserCheck className="w-3.5 h-3.5" /> Xác nhận
                                  </button>
                                  <button onClick={() => handleCancelBooking(booking)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold hover:opacity-90" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                                    <Ban className="w-3.5 h-3.5" /> Từ chối
                                  </button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <button onClick={() => handleCancelBooking(booking)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold hover:opacity-90" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                                  <Ban className="w-3.5 h-3.5" /> Hủy đơn
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeNav === 'reviews' && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Tổng đánh giá', value: providerReviews.length, color: '#0064D2', bg: '#EFF6FF' },
                  { label: 'Điểm trung bình', value: avgRating, color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'Admin yêu cầu', value: requestedReviews, color: '#DC2626', bg: '#FEF2F2' },
                  { label: 'Đã phản hồi', value: providerReviews.filter(r => r.response).length, color: '#059669', bg: '#D1FAE5' },
                ].map((item, index) => (
                  <div key={index} className="rounded-2xl border border-gray-100 p-5 text-center shadow-sm" style={{ background: item.bg }}>
                    <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                    <p className="mt-1 text-xs font-semibold" style={{ color: item.color }}>{item.label}</p>
                  </div>
                ))}
              </div>

              {providerReviews.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center shadow-sm">
                  <Star className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <p className="text-lg font-bold text-gray-600">Chưa có đánh giá</p>
                  <p className="mt-1 text-sm text-gray-400">Đánh giá của khách hàng sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div className="grid min-h-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)] xl:h-[calc(100vh-250px)] xl:max-h-[760px]">
                  <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-4">
                      <p className="text-sm font-black text-gray-900">Tour có đánh giá</p>
                      <p className="mt-0.5 text-xs text-gray-500">Chọn tour để phản hồi đúng nhóm đánh giá.</p>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                      {reviewTours.map(item => {
                        const active = item.tour.id === selectedReviewTourData?.tour.id;
                        return (
                          <button
                            key={item.tour.id}
                            type="button"
                            onClick={() => setSelectedReviewTour(item.tour.id)}
                            className="mb-2 w-full rounded-xl p-3 text-left transition-all"
                            style={{
                              background: active ? '#EFF6FF' : 'white',
                              border: active ? '1px solid #93C5FD' : '1px solid #F3F4F6',
                              boxShadow: active ? '0 8px 20px rgba(37,99,235,0.12)' : 'none',
                            }}
                          >
                            <div className="flex gap-3">
                              <img src={item.tour.image} alt={item.tour.name.vi} className="h-16 w-20 rounded-lg object-cover" />
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-black text-blue-700">
                                    {item.reviews.length} đánh giá
                                  </span>
                                  {item.unansweredCount > 0 && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
                                      {item.unansweredCount} chờ
                                    </span>
                                  )}
                                  {item.requestedCount > 0 && (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-black text-red-700">
                                      {item.requestedCount} admin yêu cầu
                                    </span>
                                  )}
                                </div>
                                <p className="line-clamp-2 text-sm font-black text-gray-900">{item.tour.name.vi}</p>
                                <p className="mt-1 truncate text-xs text-gray-500">{item.tour.location}</p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                              <div className="rounded-lg bg-gray-50 py-2">
                                <p className="text-xs font-black text-gray-900">{item.rating.toFixed(1)}</p>
                                <p className="text-[10px] text-gray-500">Rating</p>
                              </div>
                              <div className="rounded-lg bg-gray-50 py-2">
                                <p className="text-xs font-black text-gray-900">{item.requestedCount}</p>
                                <p className="text-[10px] text-gray-500">Admin YC</p>
                              </div>
                              <div className="rounded-lg bg-gray-50 py-2">
                                <p className="text-xs font-black text-gray-900">{item.answeredCount}</p>
                                <p className="text-[10px] text-gray-500">Đã trả lời</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {selectedReviewTourData && (
                      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                          <img src={selectedReviewTourData.tour.image} alt={selectedReviewTourData.tour.name.vi} className="h-24 w-32 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-black text-gray-900">{selectedReviewTourData.tour.name.vi}</h3>
                                <p className="mt-1 text-sm text-gray-500">{selectedReviewTourData.tour.location}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedTour(selectedReviewTourData.tour)}
                                className="flex items-center gap-1.5 rounded-xl border border-blue-200 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Xem tour
                              </button>
                            </div>
                            <div className="mt-4 grid grid-cols-4 gap-3">
                              {[
                                { label: 'Đánh giá', value: selectedReviewTourData.reviews.length, color: '#0064D2' },
                                { label: 'Điểm TB', value: selectedReviewTourData.rating.toFixed(1), color: '#F59E0B' },
                                { label: 'Admin yêu cầu', value: selectedReviewTourData.requestedCount, color: '#DC2626' },
                                { label: 'Đã phản hồi', value: selectedReviewTourData.answeredCount, color: '#059669' },
                              ].map((item, index) => (
                                <div key={index} className="rounded-xl bg-gray-50 p-3 text-center">
                                  <p className="text-sm font-black" style={{ color: item.color }}>{item.value}</p>
                                  <p className="text-xs text-gray-500">{item.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTourReviews.map(review => (
                      <div key={review.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: '#0064D2' }}>
                              {review.userName.split(' ').slice(-1)[0]?.[0] || 'K'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{review.userName}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className="h-3.5 w-3.5"
                                      fill={i < review.rating ? '#F59E0B' : 'none'}
                                      style={{ color: i < review.rating ? '#F59E0B' : '#D1D5DB' }}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {review.helpful} hữu ích
                          </div>
                        </div>

                        <p className="mb-4 text-sm leading-relaxed text-gray-700">{review.comment}</p>

                        {review.images && review.images.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {review.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Ảnh đánh giá ${index + 1}`}
                                className="h-20 w-20 rounded-xl border border-gray-200 object-cover"
                              />
                            ))}
                          </div>
                        )}

                        {!review.response && review.responseRequested && (
                          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                            Admin đã yêu cầu phản hồi
                            {review.responseRequestedAt ? ` · ${new Date(review.responseRequestedAt).toLocaleString('vi-VN')}` : ''}
                          </div>
                        )}

                        {review.response ? (
                          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <p className="text-xs font-bold text-green-700">Phản hồi của nhà cung cấp</p>
                              <span className="text-xs text-green-600">{new Date(review.response.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-700">{review.response.message}</p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <label className="mb-2 block text-xs font-bold text-gray-700">Phản hồi đánh giá</label>
                            <textarea
                              value={reviewResponseDrafts[review.id] || ''}
                              onChange={(event) => setReviewResponseDrafts(prev => ({ ...prev, [review.id]: event.target.value }))}
                              rows={3}
                              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              placeholder="Nhập lời cảm ơn, giải thích hoặc cam kết cải thiện dịch vụ..."
                            />
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleSendReviewResponse(review)}
                                disabled={savingReviewResponseId === review.id}
                                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                                style={{ background: '#0064D2' }}
                              >
                                <Send className="h-3.5 w-3.5" />
                                {savingReviewResponseId === review.id ? 'Đang gửi...' : 'Gửi phản hồi'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* ── FEEDBACK ──────────────────────────────────────────────── */}
          {activeNav === 'feedback' && (() => {
            return (
              <div className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <MessagingSystem
                  initialConversations={providerConversations}
                  role="provider"
                  currentUserName={company.name}
                  onUnreadCountChange={setUnreadTourMessages}
                />
              </div>
            );
          })()}
        </div>
      </main>

      {/* ── MODAL: TOUR PREVIEW (read-only full detail) ──────────────────── */}
      {selectedTour && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedTour(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-black text-gray-900">{selectedTour.name.vi}</h2>
                <p className="text-xs text-gray-400">{selectedTour.name.en}</p>
              </div>
              <button onClick={() => setSelectedTour(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="relative h-52">
                <img src={selectedTour.image} alt={selectedTour.name.vi} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                <div className="absolute bottom-4 left-5 flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: (tourStatusMap[selectedTour.status] || fallbackTourStatus).bg, color: (tourStatusMap[selectedTour.status] || fallbackTourStatus).color, border: '1px solid currentColor' }}>
                    {(tourStatusMap[selectedTour.status] || fallbackTourStatus).label}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Basic info grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Địa điểm',   value: selectedTour.location },
                    { label: 'Thời lượng', value: `${selectedTour.duration} ngày ${selectedTour.duration - 1} đêm` },
                    { label: 'Giá',        value: formatVND(selectedTour.price) + ' / người' },
                    { label: 'Đánh giá',  value: `⭐ ${selectedTour.rating} (${selectedTour.reviews} reviews)` },
                    { label: 'Loại hình', value: getTourTypeLabel(selectedTour.type) },
                    { label: 'Ngày đông nhất',  value: `${getMaxBookedSeatsInDay(selectedTour.id)}/${getMaxSeats(selectedTour.id)} chỗ` },
                  ].map((info, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                      <p className="text-xs text-gray-400 mb-0.5">{info.label}</p>
                      <p className="text-sm font-bold text-gray-800">{info.value}</p>
                    </div>
                  ))}
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 gap-3"><div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mô tả (Tiếng Việt)</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedTour.description?.vi || '—'}</p>
                  </div></div>

                {/* Included */}
                {selectedTour.included && selectedTour.included.length > 0 && (
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bao gồm trong tour</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTour.included.map((item, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#ECFDF5', color: '#059669' }}>✓ {getIncludeLabel(item)}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Itinerary */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Lịch trình chi tiết</p>
                  <div className="space-y-3">
                    {selectedTour.itinerary.map(day => (
                      <div key={day.day} className="p-4 rounded-xl border border-gray-200">
                        <p className="font-bold text-sm mb-2" style={{ color: '#0064D2' }}>Ngày {day.day}: {day.title.vi}</p>
                        <ul className="space-y-1">
                          {getTourActivities(day, 'vi').map((act, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-gray-400">•</span>{act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 bg-white">
              <button
                onClick={() => { openEditTour(selectedTour); setSelectedTour(null); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: '#0064D2' }}
              >
                <Edit className="w-4 h-4" /> Chỉnh sửa tour
              </button>
              <button onClick={() => setSelectedTour(null)} className="px-6 py-3 rounded-xl text-sm font-bold" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: BOOKING DETAIL ──────────────────────────────────────── */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-xl text-gray-900">Chi tiết đặt chỗ</h2>
              <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl" style={{ background: '#F9FAFB' }}>
                <p className="text-xs text-gray-500 mb-1">Mã đơn</p>
                <p className="text-lg font-bold" style={{ color: '#0064D2' }}>{selectedBooking.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tour',        value: selectedBooking.tourName },
                  { label: 'Ngày KH',    value: new Date(selectedBooking.startDate).toLocaleDateString('vi-VN') },
                  { label: 'Khách hàng', value: selectedBooking.userName },
                  { label: 'Email',       value: selectedBooking.userEmail },
                  { label: 'Người lớn',  value: `${selectedBooking.adults} người` },
                  { label: 'Trẻ em',     value: `${selectedBooking.children} người` },
                ].map((info, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                    <p className="text-xs text-gray-500 mb-1">{info.label}</p>
                    <p className="text-sm font-semibold text-gray-700">{info.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black text-gray-900">Đối soát tiền nhà cung cấp</p>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    {selectedBooking.paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản/QR'}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Tổng tiền tour', value: formatVND(selectedBooking.totalAmount || 0), color: '#0064D2', bg: '#EFF6FF' },
                    { label: 'Hoa hồng hệ thống', value: formatVND(isVoidedBooking(selectedBooking) ? 0 : selectedBooking.commissionAmount || 0), color: '#DC2626', bg: '#FEF2F2' },
                    { label: 'Khách trả trực tiếp NCC', value: formatVND(isVoidedBooking(selectedBooking) ? 0 : getCustomerPaysProviderAmount(selectedBooking)), color: '#D97706', bg: '#FFFBEB' },
                    { label: 'Admin chuyển NCC', value: formatVND(isVoidedBooking(selectedBooking) ? 0 : getAdminTransfersProviderAmount(selectedBooking)), color: '#7C3AED', bg: '#F5F3FF' },
                    { label: 'Thực nhận sau hoa hồng', value: formatVND(isVoidedBooking(selectedBooking) ? 0 : getProviderNetAmount(selectedBooking)), color: '#059669', bg: '#ECFDF5' },
                    {
                      label: 'Trạng thái chuyển tiền',
                      value: isVoidedBooking(selectedBooking)
                        ? 'Không phát sinh'
                        : selectedBooking.payoutStatus === 'paid_out'
                        ? 'Đã chuyển'
                        : selectedBooking.payoutStatus === 'payout_pending'
                          ? 'Chờ admin chuyển'
                          : selectedBooking.status === 'completed' || isRetainedCancelledBooking(selectedBooking) ? 'Chưa ghi nhận chuyển' : 'Chưa đến hạn',
                      color: selectedBooking.payoutStatus === 'paid_out' ? '#059669' : '#0064D2',
                      bg: selectedBooking.payoutStatus === 'paid_out' ? '#ECFDF5' : '#EFF6FF',
                    },
                  ].map((item, index) => (
                    <div key={index} className="min-w-0 rounded-xl px-3 py-2.5" style={{ background: item.bg }}>
                      <p className="text-xs font-semibold text-gray-500">{item.label}</p>
                      <p className="money-text mt-1 text-sm font-black" style={{ color: item.color }} title={String(item.value)}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {selectedBooking.payoutProcessedAt && (
                  <p className="mt-3 text-xs font-semibold text-gray-500">
                    Admin xác nhận chuyển: {new Date(selectedBooking.payoutProcessedAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
              <div className="p-5 rounded-xl" style={{ background: '#EFF6FF' }}>
                <div className="flex min-w-0 items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-700">Tổng thanh toán</span>
                  <span className="money-text max-w-[65%] text-right text-2xl font-bold" style={{ color: '#0064D2' }} title={formatVND(selectedBooking.totalAmount)}>{formatVND(selectedBooking.totalAmount)}</span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              {['deposited', 'paid'].includes(selectedBooking.status) && (
                <>
                  <button
                    onClick={() => handleConfirmBooking(selectedBooking)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90"
                    style={{ background: '#059669' }}
                  >
                    <CheckCircle className="w-4 h-4" /> Xác nhận đặt chỗ
                  </button>
                  <button
                    onClick={() => handleCancelBooking(selectedBooking)}
                    className="px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-50"
                    style={{ color: '#DC2626', border: '1px solid #FECACA' }}
                  >
                    Từ chối
                  </button>
                </>
              )}
              {!['deposited', 'paid'].includes(selectedBooking.status) && (
                <button onClick={() => setSelectedBooking(null)} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT TOUR (comprehensive, tabbed) ─────────────────────── */}
      {editingTour && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setEditingTour(null)}>
          <div
            className="bg-white rounded-2xl w-full flex flex-col"
            style={{ maxWidth: 820, maxHeight: '95vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-black text-gray-900">Chỉnh sửa tour</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingTour.name.vi}</p>
              </div>
              <button onClick={() => setEditingTour(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 px-6 pt-4 flex-shrink-0 border-b border-gray-100">
              {([
                { key: 'basic',      label: 'Thông tin cơ bản',   icon: Info },
                { key: 'itinerary',  label: 'Lịch trình',         icon: List },
                { key: 'seats',      label: 'Số chỗ',             icon: Users },
                { key: 'departures', label: 'Ngày khóa',          icon: Calendar },
              ] as { key: EditTab; label: string; icon: React.ElementType }[]).map(tab => {
                const Icon = tab.icon;
                const active = editTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setEditTab(tab.key)}
                    className="flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px"
                    style={{
                      borderBottomColor: active ? '#0064D2' : 'transparent',
                      color: active ? '#0064D2' : '#94A3B8',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Note */}
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="p-3 rounded-xl text-sm flex items-center gap-2" style={{ background: '#EFF6FF', color: '#0064D2' }}>
                <Info className="w-4 h-4 flex-shrink-0" />
                Sau khi lưu, tour sẽ được gửi lại Admin để xét duyệt.
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* ── TAB: Basic ── */}
              {editTab === 'basic' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tên tour (Tiếng Việt) *</label>
                      <input type="text" value={editForm.nameVi} onChange={e => setEditForm(p => ({ ...p, nameVi: e.target.value }))} className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Địa điểm *</label>
                      <input type="text" value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Loại hình tour</label>
                      <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                        {tourTypeOptions.map(typeOption => (
                          <option key={typeOption.value} value={typeOption.value}>{typeOption.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Thời lượng (ngày)</label>
                      <input
                        type="number"
                        value={editForm.duration}
                        min={1}
                        onChange={e => {
                          const nextDuration = Number(e.target.value);
                          setEditForm(p => ({
                            ...p,
                            duration: nextDuration,
                            advanceBookingDays: suggestedAdvanceBookingDays(nextDuration),
                          }));
                        }}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Giá (₫ / người)</label>
                      <input type="number" value={editForm.price} min={0} onChange={e => setEditForm(p => ({ ...p, price: Number(e.target.value) }))} className={inputCls} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Đặt trước tối thiểu</label>
                        <p className="text-xs leading-relaxed text-gray-500">
                          Tự gợi ý theo thời lượng tour, provider có thể chỉnh để có đủ thời gian chuẩn bị.
                        </p>
                      </div>
                      <input
                        type="number"
                        value={editForm.advanceBookingDays}
                        min={1}
                        onChange={e => setEditForm(p => ({ ...p, advanceBookingDays: Number(e.target.value) }))}
                        className={inputCls}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[1, 3, 5, 7].map(days => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setEditForm(p => ({ ...p, advanceBookingDays: days }))}
                          className="rounded-full border px-3 py-1.5 text-xs font-bold transition-all"
                          style={{
                            borderColor: editForm.advanceBookingDays === days ? '#0064D2' : '#BFDBFE',
                            background: editForm.advanceBookingDays === days ? '#0064D2' : 'white',
                            color: editForm.advanceBookingDays === days ? 'white' : '#0064D2',
                          }}
                        >
                          {days} ngày
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                    <label className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                      <input
                        type="checkbox"
                        checked={editForm.promotionActive}
                        onChange={e => setEditForm(p => ({ ...p, promotionActive: e.target.checked }))}
                        className="h-4 w-4"
                        style={{ accentColor: '#FF6000' }}
                      />
                      Tạo ưu đãi cho tour này
                    </label>
                    {editForm.promotionActive && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Giá gốc</label>
                          <input type="number" value={editForm.originalPrice} min={0} onChange={e => setEditForm(p => ({ ...p, originalPrice: Number(e.target.value) }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Giảm giá (%)</label>
                          <input type="number" value={editForm.discountPercent} min={0} max={100} onChange={e => setEditForm(p => ({ ...p, discountPercent: Number(e.target.value) }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Tên ưu đãi</label>
                          <input type="text" value={editForm.promotionTitle} onChange={e => setEditForm(p => ({ ...p, promotionTitle: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Nhãn hiển thị</label>
                          <input type="text" value={editForm.promotionBadge} onChange={e => setEditForm(p => ({ ...p, promotionBadge: e.target.value }))} className={inputCls} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả tour *</label>
                    <textarea value={editForm.descVi} onChange={e => setEditForm(p => ({ ...p, descVi: e.target.value }))} rows={4} className={`${inputCls} resize-none`} placeholder="Mô tả trải nghiệm, điểm tham quan nổi bật và dịch vụ đi kèm..." />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh đại diện *</label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-4 text-sm font-bold text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600">
                      <ImageIcon className="h-4 w-4" />
                      Chọn ảnh từ máy
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={event => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setEditForm(prev => ({ ...prev, imageFile: file, image: URL.createObjectURL(file) }));
                        }}
                      />
                    </label>
                    {editForm.image && (
                      <div className="mt-3 h-36 overflow-hidden rounded-xl bg-gray-100">
                        <img src={editForm.image} alt="Ảnh đại diện tour" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Thư viện ảnh tour</label>
                    <div className="hidden">
                      <input
                        type="url"
                        placeholder="Dán URL ảnh khác của tour..."
                        className={inputCls}
                        onKeyDown={event => {
                          if (event.key !== 'Enter') return;
                          event.preventDefault();
                          const value = event.currentTarget.value.trim();
                          if (!value) return;
                          setEditForm(prev => ({ ...prev, images: Array.from(new Set([...prev.images, value])) }));
                          event.currentTarget.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={event => {
                          const input = event.currentTarget.parentElement?.querySelector('input');
                          const value = input?.value.trim();
                          if (!value) return;
                          setEditForm(prev => ({ ...prev, images: Array.from(new Set([...prev.images, value])) }));
                          input.value = '';
                        }}
                        className="flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                        style={{ background: '#0064D2' }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-4 text-sm font-bold text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600">
                      <Plus className="h-4 w-4" />
                      Chọn nhiều ảnh
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={event => {
                          const files = Array.from(event.target.files || []);
                          if (!files.length) return;
                          setEditForm(prev => ({ ...prev, galleryFiles: [...(prev.galleryFiles || []), ...files].slice(0, 8) }));
                          event.target.value = '';
                        }}
                      />
                    </label>
                    <p className="mt-1.5 text-xs text-gray-400">Ảnh đại diện và các ảnh này sẽ được lưu vào gallery chi tiết tour.</p>
                    {(editForm.images.length > 0 || (editForm.galleryFiles?.length || 0) > 0) && (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {editForm.images.map(url => (
                          <div key={url} className="group relative h-28 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                            <img
                              src={url}
                              alt="Ảnh tour"
                              className="h-full w-full object-cover"
                              onError={event => { event.currentTarget.style.opacity = '0.2'; }}
                            />
                            <button
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, images: prev.images.filter(item => item !== url) }))}
                              className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label="Xóa ảnh"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        {(editForm.galleryFiles || []).map((file, index) => (
                          <div key={`${file.name}-${file.size}-${index}`} className="group relative h-28 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Ảnh tour"
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, galleryFiles: (prev.galleryFiles || []).filter((_, itemIndex) => itemIndex !== index) }))}
                              className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label="XÃ³a áº£nh"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Dịch vụ bao gồm</label>
                    <div className="space-y-2">
                      {editForm.included.map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={e => setEditForm(p => ({ ...p, included: p.included.map((v, i) => i === idx ? e.target.value : v) }))}
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onClick={() => setEditForm(p => ({ ...p, included: p.included.filter((_, i) => i !== idx) }))}
                            className="p-2 rounded-xl hover:bg-red-50 flex-shrink-0 transition-colors"
                            style={{ color: '#EF4444', border: '1px solid #FECACA' }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditForm(p => ({ ...p, included: [...p.included, ''] }))}
                        className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        style={{ border: '1.5px dashed #BFDBFE', color: '#0064D2' }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm dịch vụ
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Itinerary ── */}
              {editTab === 'itinerary' && (
                <div className="space-y-4">
                  {editForm.itinerary.map((day, dayIdx) => (
                    <div key={dayIdx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={{ background: '#F8FAFC' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black" style={{ background: '#0064D2' }}>
                            {day.day}
                          </div>
                          <span className="text-sm font-bold text-gray-700">Ngày {day.day}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItineraryDay(dayIdx)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-5 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Tiêu đề</label>
                          <input
                            type="text"
                            value={day.titleVi}
                            onChange={e => updateItineraryDay(dayIdx, 'titleVi', e.target.value)}
                            className={inputCls}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2">Hoạt động</label>
                          <div className="space-y-2">
                            {day.activitiesVi.map((act, actIdx) => (
                              <div key={actIdx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={act}
                                  onChange={e => updateActivity(dayIdx, actIdx, 'vi', e.target.value)}
                                  className={inputCls}
                                  placeholder="Hoạt động trong ngày..."
                                />
                                <button
                                  type="button"
                                  onClick={() => removeActivity(dayIdx, actIdx, 'vi')}
                                  className="p-2 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0"
                                  style={{ color: '#EF4444', border: '1px solid #FECACA' }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addActivity(dayIdx, 'vi')}
                              className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                              style={{ border: '1.5px dashed #BFDBFE', color: '#0064D2' }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Thêm hoạt động
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItineraryDay}
                    className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    style={{ border: '1.5px dashed #BFDBFE', color: '#0064D2' }}
                  >
                    <Plus className="w-4 h-4" />
                    Thêm ngày
                  </button>
                </div>
              )}
              {/* ── TAB: Seats ── */}
              {editTab === 'seats' && (
                <div className="space-y-5">
                  {/* Overview stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Sức chứa tối đa', value: editForm.maxSeats, color: '#0064D2', bg: '#EFF6FF' },
                      { label: 'Ngày đông nhất', value: getMaxBookedSeatsInDay(editingTour.id), color: '#D97706', bg: '#FFFBEB' },
                      { label: 'Còn trống tối thiểu', value: Math.max(0, editForm.maxSeats - getMaxBookedSeatsInDay(editingTour.id)), color: '#059669', bg: '#ECFDF5' },
                    ].map((s, i) => (
                      <div key={i} className="rounded-2xl p-5 text-center" style={{ background: s.bg }}>
                        <p className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs font-medium" style={{ color: s.color, opacity: 0.7 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  {(() => {
                    const booked = getMaxBookedSeatsInDay(editingTour.id);
                    const pct = Math.min(100, Math.round((booked / editForm.maxSeats) * 100));
                    return (
                      <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-gray-700">Tỉ lệ lấp đầy</p>
                          <p className="text-sm font-black" style={{ color: pct >= 90 ? '#DC2626' : pct >= 70 ? '#D97706' : '#059669' }}>
                            {pct}%
                          </p>
                        </div>
                        <div className="w-full h-3 rounded-full" style={{ background: '#F1F5F9' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 90 ? 'linear-gradient(90deg, #DC2626, #EF4444)' : pct >= 70 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #059669, #34D399)',
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Ngày đông nhất có {booked} chỗ đã giữ / {editForm.maxSeats} chỗ mỗi ngày
                        </p>
                      </div>
                    );
                  })()}

                  {/* Edit max seats */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
                    <h4 className="font-bold text-gray-800">Chỉnh sửa sức chứa</h4>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Số chỗ tối đa *
                        <span className="ml-2 text-xs font-normal text-gray-400">(Tối thiểu = ngày đông nhất: {getMaxBookedSeatsInDay(editingTour.id)} chỗ)</span>
                      </label>
                      <input
                        type="number"
                        value={editForm.maxSeats}
                        min={getMaxBookedSeatsInDay(editingTour.id)}
                        onChange={e => setEditForm(p => ({ ...p, maxSeats: Number(e.target.value) }))}
                        className={inputCls}
                      />
                    </div>

                    {/* Quick presets */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">Chọn nhanh</p>
                      <div className="flex flex-wrap gap-2">
                        {[10, 15, 20, 25, 30, 40, 50].map(n => (
                          <button
                            key={n}
                            onClick={() => setEditForm(p => ({ ...p, maxSeats: n }))}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            style={{
                              background: editForm.maxSeats === n ? '#0064D2' : '#F1F5F9',
                              color: editForm.maxSeats === n ? 'white' : '#64748B',
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bookings breakdown */}
                    {(() => {
                      const tourBks = bookings.filter(b => b.tourId === editingTour.id);
                      if (tourBks.length === 0) return null;
                      return (
                        <div>
                          <p className="text-xs font-bold text-gray-500 mb-2">Chi tiết đặt chỗ ({tourBks.length} đơn)</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {tourBks.map(b => {
                              const st = bookingStatusMap[b.status as keyof typeof bookingStatusMap] || bookingStatusMap.cancelled;
                              return (
                                <div key={b.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: '#F9FAFB' }}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#0064D2' }}>
                                      {b.userName.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{b.userName}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">{b.adults + b.children} người</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* -- TAB: Blocked dates -- */}
              {editTab === 'departures' && (() => {
                const blockedDates = departures.filter(d => d.tourId === editingTour.id);
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Ngày đang khóa', value: blockedDates.length, color: '#DC2626', bg: '#FEE2E2' },
                        { label: 'Sức chứa mỗi ngày', value: `${editForm.maxSeats} khách`, color: '#0064D2', bg: '#EFF6FF' },
                      ].map((s, i) => (
                        <div key={i} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
                          <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                          <p className="text-xs mt-1" style={{ color: s.color, opacity: 0.8 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <button
                        onClick={() => setShowAddDeparture(p => !p)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          <Ban className="w-4 h-4" style={{ color: '#DC2626' }} />
                          Khóa ngày tạm ngừng nhận khách
                        </span>
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>
                      {showAddDeparture && (
                        <div className="px-5 pb-5 pt-0 space-y-3 border-t border-gray-50">
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div>
                              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Ngày cần khóa</label>
                              <input
                                type="date"
                                value={newDepartureDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setNewDepartureDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': '#0064D2' } as React.CSSProperties}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Lý do</label>
                              <input
                                type="text"
                                value={newBlockedReason}
                                onChange={e => setNewBlockedReason(e.target.value)}
                                placeholder="Nghỉ lễ, bảo trì, thiếu nhân sự..."
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddDeparture(editingTour.id)}
                            className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)' }}
                          >
                            <Ban className="w-4 h-4" /> Khóa ngày này
                          </button>
                        </div>
                      )}
                    </div>

                    {blockedDates.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Chưa có ngày nào bị khóa</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {blockedDates
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map(dep => (
                            <div key={dep.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-bold text-gray-800 text-sm">
                                    {new Date(dep.date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">{dep.reason || 'Tạm ngừng nhận khách'}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteDeparture(dep)}
                                  className="px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-50 transition-colors flex items-center gap-1.5"
                                  style={{ color: '#059669' }}
                                  title="Mở lại ngày này"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Mở lại
                                </button>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
              <button
                onClick={handleSaveEditTour}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
              >
                <Save className="w-4 h-4" /> Lưu tất cả thay đổi
              </button>
              <button
                onClick={() => setEditingTour(null)}
                className="px-7 py-3 rounded-xl text-sm font-bold"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GLOBAL MODALS ─────────────────────────────────────────────── */}
      <CreateTourModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTour}
        providerId={providerId}
        providerName={company.name}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
        title={successModal.title}
        message={successModal.message}
      />

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        userName={user?.name}
      />
    </div>
  );
}
