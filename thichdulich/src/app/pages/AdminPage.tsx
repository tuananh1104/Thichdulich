"use client";

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useTourManagement } from '../contexts/TourManagementContext';
import { useBookings } from '../contexts/BookingContext';
import api, { getApiErrorMessage } from '@/services/api';
import type { Tour, TourReview, TourReport, ContactMessage, User, Provider } from '../types/domainTypes';
import {
  LayoutDashboard, Package, Calendar, Users, TrendingUp, Edit, Trash2,
  CheckCircle, XCircle, Clock, MapPin, Star, Shield, ChevronRight,
  BarChart2, Eye, Building2, LogOut, AlertTriangle, Check, X,
  UserCheck, UserX, Search, MessageSquare, Send, ThumbsUp, Image as ImageIcon,
  AlertCircle, RefreshCw, Mail, Phone, Flag, FileText, Activity, Target, Award, Plus
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { SuccessModal } from '../components/SuccessModal';
import { MessagingSystem, type Conversation as ChatConversation } from '../components/MessagingSystem';
import { getProviderStatusLabel, getTourTypeLabel } from '../utils/labels';

function formatVND(price: number) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
}

interface Destination {
  id: string;
  name: string;
  description: string;
  image: string;
  region: 'Bắc' | 'Trung' | 'Nam' | 'Quốc tế';
  tourCount: number;
}

interface TourCategory {
  code: Tour['type'];
  name: string;
  description?: string;
  active: boolean;
  sortOrder: number;
  tourCount: number;
}

const initialDestinations: Destination[] = [
  { id: 'dest1', name: 'Vịnh Hạ Long', description: 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400', region: 'Bắc', tourCount: 5 },
  { id: 'dest2', name: 'Phố cổ Hội An', description: 'Phố cổ nổi tiếng với đèn lồng và kiến trúc độc đáo', image: 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=400', region: 'Trung', tourCount: 4 },
  { id: 'dest3', name: 'Đà Lạt', description: 'Thành phố ngàn hoa với khí hậu mát mẻ quanh năm', image: 'https://images.unsplash.com/photo-1651637181617-7a0e50c9176e?w=400', region: 'Nam', tourCount: 3 },
  { id: 'dest4', name: 'Nha Trang', description: 'Thành phố biển với bãi cát trắng và nước biển xanh', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400', region: 'Trung', tourCount: 4 },
  { id: 'dest5', name: 'Sapa', description: 'Thị trấn vùng cao với ruộng bậc thang và văn hóa dân tộc', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400', region: 'Bắc', tourCount: 3 },
  { id: 'dest6', name: 'Phú Quốc', description: 'Đảo ngọc với bãi biển đẹp nhất Việt Nam', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400', region: 'Nam', tourCount: 4 },
];

const monthlyData = [
  { month: 'T10/25', revenue: 145000000, bookings: 48, users: 32 },
  { month: 'T11/25', revenue: 162000000, bookings: 55, users: 41 },
  { month: 'T12/25', revenue: 178000000, bookings: 63, users: 38 },
  { month: 'T1/26', revenue: 193000000, bookings: 72, users: 56 },
  { month: 'T2/26', revenue: 155000000, bookings: 58, users: 44 },
  { month: 'T3/26', revenue: 211000000, bookings: 81, users: 67 },
];

const tourTypeData = [
  { name: 'Biển đảo', value: 35, color: '#0064D2' },
  { name: 'Thiên nhiên', value: 28, color: '#059669' },
  { name: 'Văn hóa', value: 20, color: '#7C3AED' },
  { name: 'Mạo hiểm', value: 10, color: '#FF6000' },
  { name: 'Ẩm thực', value: 7, color: '#D97706' },
];

const emptySystemStats = {
  totalRevenue: 0,
  totalUsers: 0,
  totalProviders: 0,
  totalTours: 0,
  totalBookings: 0,
  monthlyRevenue: [] as { month: string; revenue: number; tours: number; bookings: number; users: number }[],
  topDestinations: [] as { name: string; tours: number; bookings: number; revenue: number }[],
  conversionRate: 0,
  averageRating: 0,
};

const ADMIN_PAGE_SIZE = 10;

type NavKey = 'overview' | 'approve' | 'bookings' | 'users' | 'providers' | 'reviews' | 'messages' | 'reports' | 'support' | 'analytics' | 'destinations';

type NavItem = { key: NavKey; label: string; icon: React.ElementType; badge?: number };
type NavGroup = { label?: string; items: NavItem[] };

const ADMIN_NAV_PATHS: Record<NavKey, string> = {
  overview: '/admin/overview',
  approve: '/admin/tours',
  bookings: '/admin/bookings',
  users: '/admin/users',
  providers: '/admin/providers',
  reviews: '/admin/reviews',
  messages: '/admin/messages',
  reports: '/admin/reports',
  support: '/admin/support',
  analytics: '/admin/analytics',
  destinations: '/admin/destinations',
};

const ADMIN_PATH_TO_NAV: Record<string, NavKey> = {
  dashboard: 'overview',
  overview: 'overview',
  approve: 'approve',
  tours: 'approve',
  bookings: 'bookings',
  users: 'users',
  providers: 'providers',
  reviews: 'reviews',
  messages: 'messages',
  reports: 'reports',
  support: 'support',
  analytics: 'analytics',
  destinations: 'destinations',
};

function toAdminUser(dto: any): User {
  return {
    id: dto.id,
    name: dto.name || '',
    email: dto.email || '',
    role: (dto.role || 'user').toLowerCase() as User['role'],
    avatar: dto.avatar,
    phone: dto.phone,
    joinDate: dto.joinDate || dto.createdAt,
    totalBookings: dto.totalBookings,
    totalSpent: dto.totalSpent,
    active: dto.active ?? dto.isActive ?? true,
    banned: dto.banned ?? dto.isBanned ?? false,
  };
}

function toAdminProvider(dto: any): Provider {
  return {
    id: dto.id,
    companyName: dto.companyName || '',
    email: dto.email || '',
    phone: dto.phone || '',
    totalTours: 0,
    approvalRate: 0,
    averageRating: 0,
    joinedDate: dto.joinedDate || '',
    status: (dto.status || 'pending').toLowerCase() as Provider['status'],
    verified: dto.verified ?? dto.isVerified ?? false,
    userId: dto.userId,
  };
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return `T${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tourTypeLabel(type: Tour['type']) {
  return getTourTypeLabel(type);
}

function toAdminReport(dto: any): TourReport {
  return {
    id: dto.id,
    tourId: dto.tourId || '',
    bookingId: dto.bookingId,
    tourName: dto.tourName || '',
    reportedBy: dto.reportedBy || dto.userId || '',
    reporterName: dto.reporterName || dto.reportedByName || dto.userName || '',
    reason: dto.reason || '',
    description: dto.description || '',
    images: dto.images || [],
    status: (dto.status || 'pending').toLowerCase() as TourReport['status'],
    createdAt: dto.createdAt || new Date().toISOString(),
    reviewedBy: dto.reviewedBy,
    reviewedAt: dto.reviewedAt,
    adminNote: dto.adminNote,
  };
}

function readAdminLocalized(value: any, fallback = '') {
  if (!value) return fallback;
  if (typeof value === 'object') {
    return value.vi || value.en || fallback;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed.vi || parsed.en || fallback;
  } catch {
    return value;
  }
}

function toAdminDestination(dto: any): Destination {
  return {
    id: dto.id,
    name: readAdminLocalized(dto.name),
    description: readAdminLocalized(dto.description),
    image: dto.image || '',
    region: (dto.region || 'Bắc') as Destination['region'],
    tourCount: dto.tourCount ?? dto.tours?.length ?? 0,
  };
}

function toAdminContact(dto: any): ContactMessage {
  return {
    id: dto.id,
    name: dto.name || '',
    email: dto.email || '',
    phone: dto.phone,
    subject: dto.subject || '',
    message: dto.message || '',
    status: (dto.status || 'new') as ContactMessage['status'],
    createdAt: dto.createdAt || new Date().toISOString(),
    repliedBy: dto.repliedBy,
    repliedAt: dto.repliedAt,
    replyMessage: dto.replyMessage,
  };
}

function toAdminReview(dto: any): TourReview {
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
      createdAt: dto.responseDate || dto.updatedAt || dto.createdAt || new Date().toISOString(),
    } : undefined,
    responseRequested: dto.responseRequested ?? false,
    responseRequestedAt: dto.responseRequestedAt,
    responseRequestedBy: dto.responseRequestedBy,
  };
}

function toDestinationPayload(destination: Omit<Destination, 'id' | 'tourCount'>) {
  return {
    name: destination.name,
    description: destination.description,
    image: destination.image,
    region: destination.region,
  };
}

function toAdminTourCategory(dto: any): TourCategory {
  return {
    code: String(dto.code || 'nature').toLowerCase() as Tour['type'],
    name: dto.name || getTourTypeLabel(dto.code),
    description: dto.description || '',
    active: dto.active ?? true,
    sortOrder: dto.sortOrder ?? 0,
    tourCount: dto.tourCount ?? 0,
  };
}

function toTourCategoryPayload(category: Omit<TourCategory, 'tourCount'>) {
  return {
    code: category.code,
    name: category.name,
    description: category.description,
    active: category.active,
    sortOrder: category.sortOrder,
  };
}

const navGroups: NavGroup[] = [
  {
    items: [
      { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    ],
  },
  {
    label: 'QUẢN LÝ',
    items: [
      { key: 'approve',      label: 'Duyệt tour',    icon: Package  },
      { key: 'bookings',     label: 'Đặt chỗ',       icon: Calendar },
      { key: 'destinations', label: 'Điểm đến',      icon: MapPin   },
    ],
  },
  {
    label: 'TÀI KHOẢN',
    items: [
      { key: 'users',     label: 'Người dùng',   icon: Users     },
      { key: 'providers', label: 'Nhà cung cấp', icon: Building2 },
    ],
  },
  {
    label: 'NỘI DUNG',
    items: [
      { key: 'reviews',  label: 'Đánh giá', icon: Star          },
      { key: 'messages', label: 'Trao đổi', icon: MessageSquare },
    ],
  },
  {
    label: 'XỬ LÝ',
    items: [
      { key: 'reports', label: 'Báo cáo vi phạm', icon: Flag },
      { key: 'support', label: 'Hỗ trợ KH',       icon: Mail },
    ],
  },
  {
    label: 'THỐNG KÊ',
    items: [
      { key: 'analytics', label: 'Phân tích', icon: Activity },
    ],
  },
];

// Flat list dùng để lookup label (vd: topbar header)
const allNavItems = navGroups.flatMap(g => g.items);

const tourStatusMap = {
  approved:  { label: 'Đã duyệt',        color: '#059669', bg: '#D1FAE5', icon: CheckCircle },
  pending:   { label: 'Chờ duyệt',       color: '#D97706', bg: '#FEF3C7', icon: Clock },
  rejected:  { label: 'Từ chối',         color: '#DC2626', bg: '#FEE2E2', icon: XCircle },
  need_edit: { label: 'Cần chỉnh sửa',  color: '#7C3AED', bg: '#F5F3FF', icon: AlertCircle },
  updated:   { label: 'Đã cập nhật',    color: '#0064D2', bg: '#DBEAFE', icon: RefreshCw },
};

const bookingStatusMap = {
  pending: { label: 'Chờ thanh toán', color: '#D97706', bg: '#FEF3C7' },
  deposited: { label: 'Đã cọc', color: '#B45309', bg: '#FEF3C7' },
  paid: { label: 'Đã thanh toán', color: '#059669', bg: '#D1FAE5' },
  confirmed: { label: 'Đã xác nhận', color: '#059669', bg: '#D1FAE5' },
  completed: { label: 'Hoàn thành', color: '#0064D2', bg: '#DBEAFE' },
  cancelled: { label: 'Đã hủy', color: '#DC2626', bg: '#FEE2E2' },
  refunded: { label: 'Đã hoàn tiền', color: '#7C3AED', bg: '#F5F3FF' },
};

function isBookingRevenuePaid(booking: Booking) {
  const paymentStatus = booking.paymentStatus?.toLowerCase();
  if (paymentStatus) {
    return paymentStatus === 'paid' || paymentStatus === 'success' || paymentStatus === 'deposited';
  }
  return ['deposited', 'paid', 'confirmed', 'completed'].includes(booking.status);
}

function getAdminCollectedAmount(booking: Booking) {
  if (booking.paymentMethod === 'cod') {
    return booking.depositAmount && booking.depositAmount > 0
      ? booking.depositAmount
      : Math.round((booking.totalAmount || 0) * 0.3);
  }
  return booking.depositAmount && booking.depositAmount > 0
    ? booking.depositAmount
    : booking.totalAmount || 0;
}

function getCustomerPaysProviderAmount(booking: Booking) {
  if (booking.paymentMethod !== 'cod') return 0;
  return booking.remainingAmount && booking.remainingAmount > 0
    ? booking.remainingAmount
    : Math.max((booking.totalAmount || 0) - getAdminCollectedAmount(booking), 0);
}

function getProviderSettlementAmount(booking: Booking) {
  if (booking.paymentMethod === 'cod') {
    return Math.max(getAdminCollectedAmount(booking) - (booking.commissionAmount || 0), 0);
  }
  return Math.max((booking.totalAmount || 0) - (booking.commissionAmount || 0), 0);
}

const roleMap = {
  user: { label: 'Khách hàng', color: '#0064D2', bg: '#DBEAFE' },
  provider: { label: 'Nhà cung cấp', color: '#7C3AED', bg: '#F5F3FF' },
  admin: { label: 'Quản trị', color: '#DC2626', bg: '#FEE2E2' },
};

const reportStatusMap = {
  pending: { label: 'Chờ xử lý', color: '#D97706', bg: '#FEF3C7' },
  reviewed: { label: 'Đã xem xét', color: '#7C3AED', bg: '#F5F3FF' },
  resolved: { label: 'Đã giải quyết', color: '#059669', bg: '#D1FAE5' },
  dismissed: { label: 'Đã bỏ qua', color: '#6B7280', bg: '#F3F4F6' },
};

export function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { tours, refreshTours, approveTour, rejectTour, requestTourEdit, deleteTour: deleteTourCtx } = useTourManagement();
  const { bookings, refreshBookings } = useBookings();
  const activePathSegment = location.pathname.split('/').filter(Boolean)[1] || 'overview';
  const activeNav = ADMIN_PATH_TO_NAV[activePathSegment] || 'overview';
  const setActiveNav = (nav: NavKey) => navigate(ADMIN_NAV_PATHS[nav]);

  useEffect(() => {
    if (!ADMIN_PATH_TO_NAV[activePathSegment]) {
      navigate(ADMIN_NAV_PATHS.overview, { replace: true });
    }
  }, [activePathSegment, navigate]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'warning' });
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });
  const [refundRejectModal, setRefundRejectModal] = useState<{
    open: boolean;
    booking: any | null;
    reason: string;
    submitting: boolean;
  }>({ open: false, booking: null, reason: '', submitting: false });
  const [userSearch, setUserSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [tourFilter, setTourFilter] = useState<'all' | 'pending' | 'updated' | 'approved' | 'rejected'>('all');
  const [selectedTourDetail, setSelectedTourDetail] = useState<Tour | null>(null);
  const [selectedProviderDetail, setSelectedProviderDetail] = useState<Provider | null>(null);
  const [selectedReviewTour, setSelectedReviewTour] = useState<string>('all');
  const [reviewTourSearch, setReviewTourSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<'all' | '5' | '4' | 'low'>('all');
  const [reviewResponseFilter, setReviewResponseFilter] = useState<'all' | 'unanswered' | 'requested' | 'answered'>('all');
  const [reviewPage, setReviewPage] = useState(1);
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<TourReview | null>(null);
  const [selectedReportTour, setSelectedReportTour] = useState<string>('all');
  const [reportSearch, setReportSearch] = useState('');
  const [reportPage, setReportPage] = useState(1);
  const [selectedReportDetail, setSelectedReportDetail] = useState<TourReport | null>(null);
  const [tourMessages, setTourMessages] = useState<Record<string, ChatConversation['messages']>>({});
  const [unreadTourMessages, setUnreadTourMessages] = useState(0);
  const [reviews, setReviews] = useState<TourReview[]>([]);
  const [reports, setReports] = useState<TourReport[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminProviders, setAdminProviders] = useState<Provider[]>([]);
  const [adminStats, setAdminStats] = useState<any>(emptySystemStats);
  const [userEditModal, setUserEditModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [userEditForm, setUserEditForm] = useState({ name: '', email: '', phone: '' });
  const [userEditError, setUserEditError] = useState('');
  const [savingUserEdit, setSavingUserEdit] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [providerSearch, setProviderSearch] = useState('');
  const [providerStatusFilter, setProviderStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const showAdminError = (title: string, error: unknown, fallback: string) => {
    setSuccessModal({
      isOpen: true,
      title,
      message: getApiErrorMessage(error, fallback),
    });
  };

  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all');
  const [supportFilter, setSupportFilter] = useState<'all' | 'new' | 'replied' | 'resolved'>('all');
  const [supportSearch, setSupportSearch] = useState('');
  const [contactReplyModal, setContactReplyModal] = useState<{
    open: boolean;
    contact: ContactMessage | null;
    message: string;
    submitting: boolean;
  }>({ open: false, contact: null, message: '', submitting: false });

  // Destinations state
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destModal, setDestModal] = useState<{ open: boolean; editing: Destination | null }>({ open: false, editing: null });
  const [destForm, setDestForm] = useState<Omit<Destination, 'id' | 'tourCount'>>({
    name: '',
    description: '',
    image: '',
    region: 'Bắc',
  });
  const [destImageFile, setDestImageFile] = useState<File | null>(null);
  const [destRegionFilter, setDestRegionFilter] = useState<'all' | Destination['region']>('all');
  const [tourCategories, setTourCategories] = useState<TourCategory[]>([]);
  const [categoryForm, setCategoryForm] = useState<Omit<TourCategory, 'tourCount'>>({
    code: 'beach',
    name: '',
    description: '',
    active: true,
    sortOrder: 10,
  });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing: TourCategory | null }>({ open: false, editing: null });

  const pendingTours = tours.filter(t => t.status === 'pending' || t.status === 'updated');
  const approvedTours = tours.filter(t => t.status === 'approved');
  const rejectedTours = tours.filter(t => t.status === 'rejected');

  const totalRevenue = bookings
    .filter(isBookingRevenuePaid)
    .reduce((s, b) => s + getAdminCollectedAmount(b), 0);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return {
        key: monthKey(date),
        month: monthLabel(date),
        revenue: 0,
        bookings: 0,
        users: 0,
        tours: 0,
      };
    });
    const byKey = new Map(months.map(item => [item.key, item]));

    bookings.forEach(booking => {
      const date = parseDate(booking.createdAt);
      const item = date ? byKey.get(monthKey(date)) : null;
      if (!item) return;
      item.bookings += 1;
      if (isBookingRevenuePaid(booking)) item.revenue += getAdminCollectedAmount(booking);
    });

    allUsers.forEach(itemUser => {
      const date = parseDate(itemUser.joinDate);
      const item = date ? byKey.get(monthKey(date)) : null;
      if (item) item.users += 1;
    });

    tours.forEach(tour => {
      const date = parseDate(tour.submittedAt || tour.reviewedAt);
      const item = date ? byKey.get(monthKey(date)) : null;
      if (item) item.tours += 1;
    });

    return months.map(({ key, ...item }) => item);
  }, [bookings, allUsers, tours]);

  const tourTypeData = useMemo(() => {
    const colors: Record<Tour['type'], string> = {
      beach: '#0064D2',
      nature: '#059669',
      cultural: '#7C3AED',
      adventure: '#FF6000',
      food: '#D97706',
      mountain: '#475569',
      city: '#0891B2',
    };
    const counts = tours.reduce((acc, tour) => {
      acc[tour.type] = (acc[tour.type] || 0) + 1;
      return acc;
    }, {} as Record<Tour['type'], number>);
    const total = tours.length || 1;
    return Object.entries(counts).map(([type, count]) => ({
      name: tourTypeLabel(type as Tour['type']),
      value: Math.round((count / total) * 100),
      color: colors[type as Tour['type']] || '#6B7280',
    }));
  }, [tours]);

  const topDestinations = useMemo(() => {
    return tours
      .map(tour => {
        const tourBookings = bookings.filter(booking => booking.tourId === tour.id);
        return {
          name: tour.location || tour.name.vi,
          tours: 1,
          bookings: tourBookings.length,
          revenue: tourBookings
            .filter(isBookingRevenuePaid)
            .reduce((sum, booking) => sum + getAdminCollectedAmount(booking), 0),
        };
      })
      .reduce((items, item) => {
        const existing = items.find(entry => entry.name === item.name);
        if (existing) {
          existing.tours += item.tours;
          existing.bookings += item.bookings;
          existing.revenue += item.revenue;
        } else {
          items.push({ ...item });
        }
        return items;
      }, [] as { name: string; tours: number; bookings: number; revenue: number }[])
      .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
      .slice(0, 5);
  }, [tours, bookings]);

  const averageRating = reviews.length > 0
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
    : 0;

  const resolvedMonthlyRevenue = Array.isArray(adminStats.monthlyRevenue) && adminStats.monthlyRevenue.length > 0
    ? adminStats.monthlyRevenue
    : monthlyData;
  const resolvedTopDestinations = Array.isArray(adminStats.topDestinations) && adminStats.topDestinations.length > 0
    ? adminStats.topDestinations
    : topDestinations;
  const resolvedTotalRevenue = adminStats.totalRevenue ?? adminStats.revenue ?? totalRevenue;
  const averageMonthlyRevenue = resolvedMonthlyRevenue.length > 0
    ? resolvedMonthlyRevenue.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0) / resolvedMonthlyRevenue.length
    : 0;

  const liveAdminStats = {
    ...adminStats,
    totalRevenue: resolvedTotalRevenue,
    totalUsers: allUsers.length,
    totalProviders: adminProviders.length,
    totalTours: tours.length,
    totalBookings: bookings.length,
    monthlyRevenue: resolvedMonthlyRevenue,
    topDestinations: resolvedTopDestinations,
    conversionRate: adminStats.conversionRate ?? (tours.length > 0 ? Math.round((bookings.length / tours.length) * 100) : 0),
    averageRating: adminStats.averageRating ?? averageRating,
    averageMonthlyRevenue,
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }

    api.getAllUsers()
      .then(data => setAllUsers((data || []).map(toAdminUser)))
      .catch(error => showAdminError('Không thể tải người dùng', error, 'Vui lòng thử lại sau.'));

    api.getAllProviders()
      .then(data => setAdminProviders((data || []).map(toAdminProvider)))
      .catch(error => showAdminError('Không thể tải nhà cung cấp', error, 'Vui lòng thử lại sau.'));

    api.getAllReports()
      .then(data => setReports((data || []).map(toAdminReport)))
      .catch(error => showAdminError('Không thể tải báo cáo', error, 'Vui lòng thử lại sau.'));

    api.getAdminStats()
      .then(data => setAdminStats((prev: any) => ({
        ...prev,
        ...data,
        totalRevenue: data?.revenue ?? data?.totalRevenue ?? prev.totalRevenue,
      })))
      .catch(error => showAdminError('Không thể tải thống kê', error, 'Vui lòng thử lại sau.'));

    api.getDestinations()
      .then(data => setDestinations((data || []).map(toAdminDestination)))
      .catch(error => showAdminError('Không thể tải điểm đến', error, 'Vui lòng thử lại sau.'));

    api.getAdminTourCategories()
      .then(data => setTourCategories((data || []).map(toAdminTourCategory)))
      .catch(error => showAdminError('Không thể tải loại hình tour', error, 'Vui lòng thử lại sau.'));

    api.getContactMessages()
      .then(data => setContacts((data || []).map(toAdminContact)))
      .catch(error => showAdminError('Không thể tải liên hệ', error, 'Vui lòng thử lại sau.'));
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin' || tours.length === 0) return;
    Promise.all(tours.map(tour =>
      api.getReviews(tour.id)
        .then(data => (data || []).map(toAdminReview))
        .catch(() => [] as TourReview[])
    )).then(results => setReviews(results.flat()));
  }, [user?.role, tours]);

  useEffect(() => {
    if (user?.role !== 'admin' || tours.length === 0) return;
    Promise.all(tours.map(tour =>
      api.getTourMessages(tour.id)
        .then(data => [tour.id, (data || []).map((message: any) => ({
          id: message.id,
          senderRole: (message.senderRole || 'provider').toLowerCase(),
          senderName: message.senderName || '',
          message: message.message || '',
          timestamp: message.sentAt || new Date().toISOString(),
        }))] as const)
        .catch(() => [tour.id, []] as const)
    )).then(entries => setTourMessages(Object.fromEntries(entries)));
  }, [user?.role, tours]);

  const providers: Provider[] = adminProviders;
  const regularUsers = allUsers.filter(u => u.role === 'user');

  const filteredUsers = regularUsers
    .filter(u => {
      if (userStatusFilter === 'active') return !u.banned && u.active !== false;
      if (userStatusFilter === 'banned') return Boolean(u.banned);
      return true;
    })
    .filter(u => {
      const keyword = userSearch.trim().toLowerCase();
      if (!keyword) return true;
      return [
        u.name,
        u.email,
        u.phone || '',
      ].some(value => value.toLowerCase().includes(keyword));
    });
  const filteredProviders = providers
    .filter(provider => providerStatusFilter === 'all' || provider.status === providerStatusFilter)
    .filter(provider => {
      const keyword = providerSearch.trim().toLowerCase();
      if (!keyword) return true;
      return [
        provider.companyName,
        provider.email,
        provider.phone,
        provider.status || '',
      ].some(value => value.toLowerCase().includes(keyword));
    });

  const filteredTours = tourFilter === 'all' ? tours : tours.filter(t => t.status === tourFilter);
  const filteredBookings = (bookingFilter === 'all' ? bookings : bookings.filter(b => b.status === (bookingFilter as any)))
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const refundPendingBookings = bookings.filter(b => b.refundStatus === 'refund_pending');
  const payoutPendingBookings = bookings.filter(b => b.payoutStatus === 'payout_pending');
  const filteredReviewItems = reviews
    .filter(review => {
      const tour = tours.find(item => item.id === review.tourId);
      const keyword = reviewSearch.trim().toLowerCase();
      const matchesKeyword = !keyword || [
        review.userName,
        review.tourName,
        review.comment,
        tour?.name.vi || '',
        tour?.providerName || '',
        tour?.location || '',
      ].some(value => value.toLowerCase().includes(keyword));
      const matchesRating =
        reviewRatingFilter === 'all'
        || (reviewRatingFilter === 'low' ? review.rating <= 2 : review.rating === Number(reviewRatingFilter));
      const matchesResponse =
        reviewResponseFilter === 'all'
        || (reviewResponseFilter === 'answered' && Boolean(review.response))
        || (reviewResponseFilter === 'unanswered' && !review.response)
        || (reviewResponseFilter === 'requested' && !review.response && Boolean(review.responseRequested));
      return matchesKeyword && matchesRating && matchesResponse;
    })
    .slice()
    .sort((a, b) => {
      const aPriority = !a.response && a.responseRequested ? 0 : !a.response ? 1 : 2;
      const bPriority = !b.response && b.responseRequested ? 0 : !b.response ? 1 : 2;
      return aPriority - bPriority || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const reviewPageCount = Math.max(1, Math.ceil(filteredReviewItems.length / ADMIN_PAGE_SIZE));
  const paginatedReviews = filteredReviewItems.slice((reviewPage - 1) * ADMIN_PAGE_SIZE, reviewPage * ADMIN_PAGE_SIZE);
  const selectedReviewDetailTour = selectedReviewDetail
    ? tours.find(tour => tour.id === selectedReviewDetail.tourId)
    : null;

  const filteredReports = reports
    .filter(report => reportFilter === 'all' || report.status === reportFilter)
    .filter(report => {
      const tour = tours.find(item => item.id === report.tourId);
      const keyword = reportSearch.trim().toLowerCase();
      if (!keyword) return true;
      return [
        report.tourName,
        report.reporterName,
        report.reason,
        report.description,
        report.adminNote || '',
        tour?.providerName || '',
        tour?.location || '',
      ].some(value => value.toLowerCase().includes(keyword));
    })
    .slice()
    .sort((a, b) => {
      const statusOrder = { pending: 0, reviewed: 1, resolved: 2, dismissed: 3 } as Record<TourReport['status'], number>;
      return statusOrder[a.status] - statusOrder[b.status] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const reportPageCount = Math.max(1, Math.ceil(filteredReports.length / ADMIN_PAGE_SIZE));
  const paginatedReports = filteredReports.slice((reportPage - 1) * ADMIN_PAGE_SIZE, reportPage * ADMIN_PAGE_SIZE);
  const selectedReportDetailTour = selectedReportDetail
    ? tours.find(tour => tour.id === selectedReportDetail.tourId)
    : null;
  const filteredContacts = contacts
    .filter(contact => supportFilter === 'all' || contact.status === supportFilter)
    .filter(contact => {
      const keyword = supportSearch.trim().toLowerCase();
      if (!keyword) return true;
      return [
        contact.subject,
        contact.name,
        contact.email,
        contact.phone || '',
        contact.message,
        contact.replyMessage || '',
      ].some(value => value.toLowerCase().includes(keyword));
    })
    .slice()
    .sort((a, b) => {
      const priority = { new: 0, replied: 1, resolved: 2 } as Record<ContactMessage['status'], number>;
      return priority[a.status] - priority[b.status]
        || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const reportTours = useMemo(() => {
    const tourIds = Array.from(new Set(filteredReports.map(report => report.tourId).filter(Boolean)));

    return tourIds.map(tourId => {
      const tourReports = filteredReports.filter(report => report.tourId === tourId);
      const relatedTour = tours.find(tour => tour.id === tourId);
      const relatedBookings = bookings.filter(booking => booking.tourId === tourId);
      const relatedReviews = reviews.filter(review => review.tourId === tourId);
      const latestReportAt = tourReports
        .map(report => new Date(report.createdAt).getTime())
        .filter(time => !Number.isNaN(time))
        .sort((a, b) => b - a)[0] || 0;

      return {
        tourId,
        tour: relatedTour,
        tourName: relatedTour?.name.vi || tourReports[0]?.tourName || 'Tour không xác định',
        providerName: relatedTour?.providerName || 'Nhà cung cấp',
        image: relatedTour?.image,
        reports: tourReports,
        pendingCount: tourReports.filter(report => report.status === 'pending').length,
        activeCount: tourReports.filter(report => report.status === 'pending' || report.status === 'reviewed').length,
        reviewedCount: tourReports.filter(report => report.status === 'reviewed').length,
        resolvedCount: tourReports.filter(report => report.status === 'resolved').length,
        dismissedCount: tourReports.filter(report => report.status === 'dismissed').length,
        bookingsCount: relatedBookings.length,
        reviewsCount: relatedReviews.length,
        rating: relatedReviews.length
          ? Number((relatedReviews.reduce((sum, item) => sum + item.rating, 0) / relatedReviews.length).toFixed(1))
          : 0,
        revenue: relatedBookings
          .filter(isBookingRevenuePaid)
          .reduce((sum, item) => sum + (item.totalAmount || 0), 0),
        latestReportAt,
      };
    }).sort((a, b) => b.activeCount - a.activeCount || b.pendingCount - a.pendingCount || b.latestReportAt - a.latestReportAt);
  }, [filteredReports, tours, bookings, reviews]);

  const activeReportTourId = selectedReportTour === 'all'
    ? reportTours[0]?.tourId
    : selectedReportTour;
  const selectedReportTourData = reportTours.find(item => item.tourId === activeReportTourId) || reportTours[0];
  const selectedTourReports = selectedReportTourData
    ? [...selectedReportTourData.reports].sort((a, b) => {
      const statusOrder = { pending: 0, reviewed: 1, resolved: 2, dismissed: 3 } as Record<TourReport['status'], number>;
      return statusOrder[a.status] - statusOrder[b.status] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    : [];

  useEffect(() => {
    setReviewPage(1);
  }, [reviewSearch, reviewRatingFilter, reviewResponseFilter]);

  useEffect(() => {
    setReportPage(1);
  }, [reportSearch, reportFilter]);

  useEffect(() => {
    setReviewPage(page => Math.min(page, reviewPageCount));
  }, [reviewPageCount]);

  useEffect(() => {
    setReportPage(page => Math.min(page, reportPageCount));
  }, [reportPageCount]);

  const adminConversations: ChatConversation[] = useMemo(() => tours.map(tour => ({
      tourId: tour.id,
      tourName: tour.name.vi,
      tourImage: tour.image,
      tourStatus: tour.status,
      providerName: tour.providerName,
      providerId: tour.providerId,
      messages: tourMessages[tour.id] ?? [],
    })), [tours, tourMessages]);

  useEffect(() => {
    try {
      const readAtByTour = JSON.parse(localStorage.getItem('tour-message-read-admin') || '{}') as Record<string, number>;
      const unread = adminConversations.reduce((sum, conversation) => {
        const readAt = readAtByTour[conversation.tourId] || 0;
        return sum + conversation.messages.filter(message =>
          message.senderRole !== 'admin' && new Date(message.timestamp).getTime() > readAt
        ).length;
      }, 0);
      setUnreadTourMessages(unread);
    } catch {
      setUnreadTourMessages(0);
    }
  }, [adminConversations]);

  // Count badges
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const newContactsCount = contacts.filter(c => c.status === 'new').length;

  // Badge map: NavKey -> số hiển thị trên nav
  const badgeMap: Partial<Record<NavKey, number>> = {};
  if (pendingTours.length > 0)    badgeMap['approve']  = pendingTours.length;
  if (unreadTourMessages > 0)     badgeMap['messages'] = unreadTourMessages;
  if (pendingReportsCount > 0)    badgeMap['reports']  = pendingReportsCount;
  if (newContactsCount > 0)       badgeMap['support']  = newContactsCount;

  const handleApproveTour = (id: string, tourName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Duyệt tour',
      message: `Bạn có chắc muốn duyệt tour "${tourName}"? Tour sẽ được hiển thị công khai trên website.`,
      variant: 'info',
      onConfirm: () => {
        approveTour(id, user?.id || 'admin1');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setSuccessModal({
          isOpen: true,
          title: 'Duyệt thành công!',
          message: `Tour "${tourName}" đã được duyệt và sẽ hiển thị công khai.`
        });
      }
    });
  };

  const handleRejectTour = (id: string, tourName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Từ chối tour',
      message: `Bạn có chắc muốn từ chối tour "${tourName}"? Provider sẽ nhận được thông báo.`,
      variant: 'danger',
      onConfirm: () => {
        rejectTour(id, 'Không đạt yêu cầu duyệt', user?.id || 'admin1');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setSuccessModal({
          isOpen: true,
          title: 'Đã từ chối!',
          message: `Tour "${tourName}" đã bị từ chối.`
        });
      }
    });
  };

  const handleRequestEdit = (id: string, tourName = '') => {
    const notes = 'Vui lòng bổ sung hoặc chỉnh sửa thông tin tour theo yêu cầu kiểm duyệt.';
    setConfirmModal({
      isOpen: true,
      title: 'Yêu cầu chỉnh sửa',
      message: `Gửi yêu cầu chỉnh sửa${tourName ? ` cho tour "${tourName}"` : ''}?`,
      variant: 'warning',
      onConfirm: () => {
        requestTourEdit(id, notes, user?.id || 'admin1');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setSuccessModal({
          isOpen: true,
          title: 'Đã gửi yêu cầu',
          message: tourName ? `Tour "${tourName}" đã được chuyển sang trạng thái cần chỉnh sửa.` : 'Tour đã được chuyển sang trạng thái cần chỉnh sửa.',
        });
      }
    });
  };

  const handleApprovePromotion = async (tourId: string) => {
    try {
      await api.approveTourPromotion(tourId);
      await refreshTours();
      setSuccessModal({
        isOpen: true,
        title: 'Đã duyệt ưu đãi',
        message: 'Ưu đãi của supplier đã được hiển thị cho khách hàng.',
      });
    } catch (error) {
      showAdminError('Không thể duyệt ưu đãi', error, 'Vui lòng thử lại sau.');
    }
  };

  const handleMarkRefunded = (booking: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận đã hoàn tiền',
      message: `Đánh dấu đã hoàn ${formatVND(booking.refundAmount || 0)} cho khách "${booking.userName}"?`,
      variant: 'info',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await api.markBookingRefunded(booking.id);
          await refreshBookings();
          setSuccessModal({ isOpen: true, title: 'Đã hoàn tiền', message: 'Đơn đã được chuyển sang trạng thái đã hoàn tiền.' });
        } catch (error) {
          showAdminError('Không thể xác nhận hoàn tiền', error, 'Vui lòng thử lại sau.');
        }
      },
    });
  };

  const handleRejectRefund = (booking: any) => {
    setRefundRejectModal({
      open: true,
      booking,
      reason: '',
      submitting: false,
    });
  };

  const submitRejectRefund = async () => {
    const booking = refundRejectModal.booking;
    const reason = refundRejectModal.reason.trim();
    if (!booking || !reason) {
      setSuccessModal({
        isOpen: true,
        title: 'Thiếu lý do',
        message: 'Vui lòng nhập lý do từ chối hoàn tiền.',
      });
      return;
    }
    setRefundRejectModal(prev => ({ ...prev, submitting: true }));
    try {
      await api.rejectBookingRefund(booking.id, reason);
      await refreshBookings();
      setRefundRejectModal({ open: false, booking: null, reason: '', submitting: false });
      setSuccessModal({ isOpen: true, title: 'Đã từ chối hoàn tiền', message: 'Trạng thái hoàn tiền của đơn đã được cập nhật.' });
    } catch (error) {
      setRefundRejectModal(prev => ({ ...prev, submitting: false }));
      showAdminError('Không thể từ chối hoàn tiền', error, 'Vui lòng thử lại sau.');
    }
  };

  const handleMarkPaidOut = (booking: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận chuyển tiền NCC',
      message: `Đánh dấu đã chuyển ${formatVND(booking.payoutAmount || booking.providerPayoutAmount || 0)} cho nhà cung cấp?`,
      variant: 'info',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await api.markBookingPaidOut(booking.id);
          await refreshBookings();
          setSuccessModal({ isOpen: true, title: 'Đã chuyển tiền NCC', message: 'Đối soát booking này đã hoàn tất.' });
        } catch (error) {
          showAdminError('Không thể xác nhận chuyển tiền', error, 'Vui lòng thử lại sau.');
        }
      },
    });
  };

  const handleRemovePromotions = async (tourIds: string[]) => {
    const validTourIds = tourIds.filter(Boolean);
    if (validTourIds.length === 0) {
      setSuccessModal({
        isOpen: true,
        title: 'Chưa chọn tour',
        message: 'Vui lòng chọn ít nhất một tour đang có ưu đãi để gỡ.',
      });
      return;
    }

    setApplyingPromo(true);
    try {
      await api.removePromotions(validTourIds);
      await refreshTours();
      setSuccessModal({
        isOpen: true,
        title: 'Đã bỏ ưu đãi',
        message: `Đã gỡ ưu đãi khỏi ${validTourIds.length} tour.`,
      });
    } catch (error) {
      showAdminError('Không thể bỏ ưu đãi', error, 'Vui lòng thử lại sau.');
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleReviewReport = (report: TourReport) => {
    api.markReportReviewed(report.id, 'Đã xem xét báo cáo')
      .then(updated => {
        setReports(prev => prev.map(item => item.id === report.id ? toAdminReport(updated) : item));
        setSuccessModal({
          isOpen: true,
          title: 'Đã đánh dấu xem xét',
          message: `Báo cáo về tour "${report.tourName}" đã được chuyển sang trạng thái đã xem xét.`,
        });
      })
      .catch(error => {
        setSuccessModal({
          isOpen: true,
          title: 'Không thể cập nhật báo cáo',
          message: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
        });
      });
  };

  const handleResolveReport = (report: TourReport) => {
    api.resolveReport(report.id, 'Đã xử lý báo cáo')
      .then(updated => {
        setReports(prev => prev.map(item => item.id === report.id ? toAdminReport(updated) : item));
        setSuccessModal({
          isOpen: true,
          title: 'Đã xử lý báo cáo',
          message: `Báo cáo về tour "${report.tourName}" đã được ghi nhận là đã giải quyết.`,
        });
      })
      .catch(error => {
        setSuccessModal({
          isOpen: true,
          title: 'Không thể xử lý báo cáo',
          message: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
        });
      });
  };

  const handleDismissReport = (report: TourReport) => {
    api.dismissReport(report.id, 'Không đủ căn cứ xử lý')
      .then(updated => {
        setReports(prev => prev.map(item => item.id === report.id ? toAdminReport(updated) : item));
        setSuccessModal({
          isOpen: true,
          title: 'Đã bỏ qua báo cáo',
          message: `Báo cáo về tour "${report.tourName}" đã được lưu với trạng thái bỏ qua.`,
        });
      })
      .catch(error => {
        setSuccessModal({
          isOpen: true,
          title: 'Không thể bỏ qua báo cáo',
          message: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
        });
      });
  };

  const handleWarnProviderReport = (report: TourReport) => {
    const message = [
      '[Cảnh báo báo cáo vi phạm]',
      `Tour: ${report.tourName}`,
      report.bookingId ? `Mã booking: ${report.bookingId}` : '',
      `Khách báo cáo: ${report.reporterName || 'Khách hàng'}`,
      `Lý do: ${report.reason}`,
      `Nội dung: ${report.description || 'Không có mô tả chi tiết.'}`,
      report.images?.length ? `Bằng chứng ảnh: ${report.images.length} ảnh, vui lòng đối chiếu trong hồ sơ báo cáo.` : 'Bằng chứng ảnh: Không có',
      'Yêu cầu: kiểm tra lại dịch vụ/tour, phản hồi trong mục trao đổi này và cập nhật thông tin hoặc phương án xử lý nếu cần.',
    ].filter(Boolean).join('\n');
    api.sendTourMessage(report.tourId, message, user?.name || 'Admin')
      .then(savedMessage => {
        setTourMessages(prev => ({
          ...prev,
          [report.tourId]: [
            ...(prev[report.tourId] ?? []),
            {
              id: savedMessage.id,
              senderRole: (savedMessage.senderRole || 'admin').toLowerCase(),
              senderName: savedMessage.senderName || user?.name || 'Admin',
              message: savedMessage.message || message,
              timestamp: savedMessage.sentAt || new Date().toISOString(),
            },
          ],
        }));
        return api.markReportReviewed(report.id, 'Đã gửi cảnh báo cho nhà cung cấp, chờ phản hồi/xử lý');
      })
      .then(updated => {
        setReports(prev => prev.map(item => item.id === report.id ? toAdminReport(updated) : item));
        setSuccessModal({
          isOpen: true,
          title: 'Đã cảnh báo nhà cung cấp',
          message: `Cảnh báo đã được gửi trong mục trao đổi của tour "${report.tourName}".`,
        });
      })
      .catch(error => {
        setSuccessModal({
          isOpen: true,
          title: 'Không thể gửi cảnh báo',
          message: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
        });
      });
  };

  const handleReplyContact = (contact: ContactMessage) => {
    const template = contact.replyMessage || [
      `Chào ${contact.name},`,
      '',
      'Cảm ơn bạn đã liên hệ với Thích Du Lịch. Chúng tôi đã tiếp nhận yêu cầu của bạn và xin phản hồi như sau:',
      '',
      '',
      'Trân trọng,',
      'Bộ phận hỗ trợ khách hàng',
    ].join('\n');
    setContactReplyModal({ open: true, contact, message: template, submitting: false });
  };

  const submitContactReply = () => {
    const contact = contactReplyModal.contact;
    const reply = contactReplyModal.message.trim();
    if (!contact || !reply) {
      setSuccessModal({
        isOpen: true,
        title: 'Chưa có nội dung phản hồi',
        message: 'Vui lòng nhập nội dung trả lời trước khi gửi cho khách hàng.',
      });
      return;
    }

    setContactReplyModal(prev => ({ ...prev, submitting: true }));
    api.replyContactMessage(contact.id, reply)
      .then(updated => {
        setContacts(prev => prev.map(item => item.id === contact.id ? toAdminContact(updated) : item));
        setContactReplyModal({ open: false, contact: null, message: '', submitting: false });
        setSuccessModal({
          isOpen: true,
          title: 'Đã lưu phản hồi',
          message: `Yêu cầu của ${contact.name} đã được cập nhật trạng thái đã trả lời.`,
        });
      })
      .catch(error => {
        setContactReplyModal(prev => ({ ...prev, submitting: false }));
        showAdminError('Không thể trả lời liên hệ', error, 'Vui lòng thử lại sau.');
      });
  };

  const handleResolveContact = (contact: ContactMessage) => {
    api.resolveContactMessage(contact.id)
      .then(updated => setContacts(prev => prev.map(item => item.id === contact.id ? toAdminContact(updated) : item)))
      .catch(error => showAdminError('Không thể xử lý liên hệ', error, 'Vui lòng thử lại sau.'));
  };

  const handleDeleteReview = (review: TourReview) => {
    api.deleteReview(review.id)
      .then(() => {
        setReviews(prev => prev.filter(item => item.id !== review.id));
        setSuccessModal({
          isOpen: true,
          title: 'Đã xóa đánh giá',
          message: `Đánh giá của ${review.userName} đã được gỡ khỏi hệ thống.`,
        });
      })
      .catch(error => {
        setSuccessModal({
          isOpen: true,
          title: 'Không thể xóa đánh giá',
          message: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
        });
      });
  };

  const handleToggleUserBan = (target: User) => {
    const shouldBan = !target.banned;
    setConfirmModal({
      isOpen: true,
      title: shouldBan ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      message: `${shouldBan ? 'Khóa' : 'Mở khóa'} tài khoản "${target.name}"?`,
      variant: shouldBan ? 'danger' : 'info',
      onConfirm: () => {
        const request = shouldBan ? api.banUser(target.id) : api.unbanUser(target.id);
        request
          .then(updated => {
            setAllUsers(prev => prev.map(item => item.id === target.id ? toAdminUser(updated) : item));
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setSuccessModal({
              isOpen: true,
              title: shouldBan ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
              message: `Trạng thái tài khoản "${target.name}" đã được cập nhật.`,
            });
          })
          .catch(error => {
            showAdminError('Không thể cập nhật trạng thái tài khoản', error, 'Vui lòng thử lại sau.');
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          });
      },
    });
  };

  const handleOpenUserEditForm = (target: User) => {
    setUserEditForm({
      name: target.name || '',
      email: target.email || '',
      phone: target.phone || '',
    });
    setUserEditError('');
    setUserEditModal({ open: true, user: target });
  };

  const handleSaveUserEdit = () => {
    const target = userEditModal.user;
    if (!target || savingUserEdit) return;

    const name = userEditForm.name.trim();
    const email = userEditForm.email.trim();
    const phone = userEditForm.phone.trim();

    if (!name) {
      setUserEditError('Vui lòng nhập tên người dùng.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setUserEditError('Email không hợp lệ.');
      return;
    }

    setSavingUserEdit(true);
    setUserEditError('');
    api.updateAdminUser(target.id, { name, email, phone })
      .then(updated => {
        setAllUsers(prev => prev.map(item => item.id === target.id ? toAdminUser(updated) : item));
        setUserEditModal({ open: false, user: null });
        setSuccessModal({
          isOpen: true,
          title: 'Đã cập nhật tài khoản',
          message: `Thông tin tài khoản "${name}" đã được lưu thành công.`,
        });
      })
      .catch(error => {
        showAdminError('Không thể cập nhật tài khoản', error, 'Vui lòng kiểm tra thông tin và thử lại.');
        setUserEditError('Không thể lưu thay đổi. Vui lòng kiểm tra thông tin và thử lại.');
      })
      .finally(() => setSavingUserEdit(false));
  };

  const handleToggleUserBanProfessional = (target: User) => {
    const shouldBan = !target.banned;
    setConfirmModal({
      isOpen: true,
      title: shouldBan ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      message: shouldBan
        ? `Tài khoản "${target.name}" sẽ không thể đăng nhập cho đến khi được mở khóa. Bạn muốn tiếp tục?`
        : `Khôi phục quyền đăng nhập cho tài khoản "${target.name}"?`,
      variant: shouldBan ? 'danger' : 'info',
      onConfirm: () => {
        const request = shouldBan ? api.banUser(target.id) : api.unbanUser(target.id);
        request
          .then(updated => {
            setAllUsers(prev => prev.map(item => item.id === target.id ? toAdminUser(updated) : item));
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setSuccessModal({
              isOpen: true,
              title: shouldBan ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
              message: shouldBan
                ? `Tài khoản "${target.name}" đã bị khóa. Người dùng sẽ nhận được thông báo rõ ràng khi đăng nhập.`
                : `Tài khoản "${target.name}" đã được khôi phục quyền đăng nhập.`,
            });
          })
          .catch(error => {
            showAdminError('Không thể cập nhật trạng thái tài khoản', error, 'Vui lòng thử lại sau.');
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          });
      },
    });
  };

  const handleShowProviderDetail = (provider: Provider) => {
    setSelectedProviderDetail(provider);
  };

  const handleSuspendProvider = (provider: Provider) => {
    setConfirmModal({
      isOpen: true,
      title: 'Đình chỉ nhà cung cấp',
      message: `Đình chỉ tài khoản "${provider.companyName}"? Nhà cung cấp sẽ không đăng nhập được cho đến khi được duyệt lại.`,
      variant: 'danger',
      onConfirm: () => {
        api.updateProviderStatus(provider.id, 'rejected')
          .then(updated => {
            const mappedProvider = toAdminProvider(updated);
            setAdminProviders(prev => prev.map(item => item.id === provider.id ? mappedProvider : item));
            if (mappedProvider.userId) {
              setAllUsers(prev => prev.map(item => item.id === mappedProvider.userId ? { ...item, active: false, banned: true } : item));
            }
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setSuccessModal({
              isOpen: true,
              title: 'Đã đình chỉ',
              message: `Nhà cung cấp "${provider.companyName}" đã bị đình chỉ.`,
            });
          })
          .catch(error => {
            showAdminError('Không thể đình chỉ nhà cung cấp', error, 'Vui lòng thử lại sau.');
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          });
      },
    });
  };

  const handleUpdateProviderStatus = (provider: Provider, status: 'approved' | 'rejected' | 'pending') => {
    const titleMap = {
      approved: 'Duyệt nhà cung cấp',
      rejected: 'Từ chối nhà cung cấp',
      pending: 'Chuyển về chờ duyệt',
    };
    const messageMap = {
      approved: `Duyệt hồ sơ "${provider.companyName}"? Nhà cung cấp sẽ được mở quyền quản lý tour và đơn đặt chỗ.`,
      rejected: `Từ chối hồ sơ "${provider.companyName}"? Tài khoản sẽ bị khóa quyền hoạt động nhà cung cấp.`,
      pending: `Chuyển "${provider.companyName}" về trạng thái chờ duyệt? Nhà cung cấp sẽ tạm thời không quản lý được tour.`,
    };

    setConfirmModal({
      isOpen: true,
      title: titleMap[status],
      message: messageMap[status],
      variant: status === 'rejected' ? 'danger' : 'warning',
      onConfirm: () => {
        api.updateProviderStatus(provider.id, status)
          .then(updated => {
            const mappedProvider = toAdminProvider(updated);
            setAdminProviders(prev => prev.map(item => item.id === provider.id ? mappedProvider : item));
            if (mappedProvider.userId) {
              setAllUsers(prev => prev.map(item => item.id === mappedProvider.userId
                ? { ...item, active: status !== 'rejected', banned: status === 'rejected' }
                : item
              ));
            }
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setSuccessModal({
              isOpen: true,
              title: status === 'approved' ? 'Đã duyệt nhà cung cấp' : status === 'rejected' ? 'Đã từ chối nhà cung cấp' : 'Đã chuyển về chờ duyệt',
              message: `Hồ sơ "${provider.companyName}" hiện là ${getProviderStatusLabel(status).toLowerCase()}.`,
            });
          })
          .catch(error => {
            showAdminError('Không thể cập nhật nhà cung cấp', error, 'Vui lòng thử lại sau.');
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          });
      },
    });
  };

  const handleRequestProviderReviewResponse = (review: TourReview) => {
    api.requestReviewResponse(review.id).then(updated => {
      setReviews(prev => prev.map(item => item.id === review.id ? toAdminReview(updated) : item));
      setSuccessModal({
        isOpen: true,
        title: 'Đã yêu cầu phản hồi',
        message: `Đánh giá của ${review.userName} đã được đưa vào danh sách cần phản hồi của nhà cung cấp.`,
      });
    }).catch(error => {
      setSuccessModal({
        isOpen: true,
        title: 'Không thể yêu cầu phản hồi',
        message: getApiErrorMessage(error, 'Vui lòng thử lại sau.'),
      });
    });
  };

  const handleDeleteTour = (id: string, tourName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa tour',
      message: `Bạn có chắc muốn xóa tour "${tourName}" khỏi hệ thống? Hành động này không thể hoàn tác!`,
      variant: 'danger',
      onConfirm: () => {
        deleteTourCtx(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setSuccessModal({
          isOpen: true,
          title: 'Đã xóa!',
          message: `Tour "${tourName}" đã được xóa khỏi hệ thống.`
        });
      }
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const reviewTours = tours
    .filter(tour => reviews.some(review => review.tourId === tour.id))
    .sort((a, b) => reviews.filter(r => r.tourId === b.id).length - reviews.filter(r => r.tourId === a.id).length);
  const reviewTourSearchTerm = reviewTourSearch.trim().toLowerCase();
  const filteredReviewTours = reviewTourSearchTerm
    ? reviewTours.filter(tour =>
        tour.name.vi.toLowerCase().includes(reviewTourSearchTerm) ||
        tour.name.en.toLowerCase().includes(reviewTourSearchTerm) ||
        tour.providerName.toLowerCase().includes(reviewTourSearchTerm) ||
        tour.location.toLowerCase().includes(reviewTourSearchTerm)
      )
    : reviewTours;
  const activeReviewTourId = selectedReviewTour === 'all' || !filteredReviewTours.some(tour => tour.id === selectedReviewTour)
    ? filteredReviewTours[0]?.id
    : selectedReviewTour;
  const selectedReviewTourData = tours.find(t => t.id === activeReviewTourId);
  const filteredReviews = activeReviewTourId ? reviews.filter(r => r.tourId === activeReviewTourId) : [];

  return (
    <div className="console-shell flex h-screen overflow-hidden" style={{ '--console-accent': '#FF6000' } as React.CSSProperties}>
      {/* ── SIDEBAR ────────────────────────────────── */}
      <aside className="console-sidebar w-60 flex-shrink-0 flex flex-col" style={{ height: '100vh' }}>
        {/* Logo */}
        <div className="console-sidebar-header px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="console-brand-mark w-7 h-7 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Admin Panel</span>
          </div>
          <p className="console-brand-subtitle text-xs">Thích Du Lịch Management</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {/* Divider + Group label */}
              {group.label && (
                <div className={gi > 0 ? 'mt-4 mb-2' : 'mb-2'}>
                  <p className="console-sidebar-section mx-2 px-1 pt-3">{group.label}</p>
                </div>
              )}
              {gi === 0 && <div className="mb-1" />}
              {/* Group items */}
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
                      <span className="flex-1 text-left">{item.label}</span>
                      {badge && badge > 0 && (
                        <span
                          className="min-w-[20px] h-5 px-1 rounded-full text-white flex items-center justify-center font-bold"
                          style={{ fontSize: '11px', background: '#FF6000' }}
                        >
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

        {/* Stats mini */}
        <div className="console-sidebar-panel mx-3 mb-3 p-3 rounded-xl">
          <p className="text-xs font-semibold text-white mb-2">Hệ thống</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Tour', value: approvedTours.length },
              { label: 'User', value: regularUsers.length },
              { label: 'Booking', value: bookings.length },
              { label: 'Provider', value: providers.length },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="console-sidebar-muted text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile footer */}
        <div className="console-sidebar-header p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="console-avatar w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold">AD</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">Admin Thích Du Lịch</p>
              <p className="console-sidebar-muted text-xs truncate">admin@demo.com</p>
            </div>
          </div>
          <button className="console-sidebar-muted w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/10" onClick={() => setShowLogoutModal(true)}>
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="console-topbar px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-bold text-gray-900" style={{ fontSize: '1.125rem' }}>
              {allNavItems.find(n => n.key === activeNav)?.label}
            </h1>
            <p className="text-xs text-gray-500">Thích Du Lịch · Hệ thống quản trị</p>
          </div>
          {activeNav === 'approve' && pendingTours.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#D97706' }} />
              <span className="text-xs font-semibold" style={{ color: '#92400E' }}>{pendingTours.length} tour đang chờ duyệt</span>
            </div>
          )}
        </header>

        <div className={activeNav === 'messages' ? 'min-h-0 flex-1 overflow-hidden p-4' : 'console-content min-h-0 flex-1 overflow-auto'}>
          {/* ── OVERVIEW ────────────────────────────── */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  { label: 'Tổng người dùng', value: allUsers.length, icon: Users, color: '#0064D2', bg: '#EFF6FF', sub: '+12% tháng này' },
                  { label: 'Tổng Provider', value: providers.length, icon: Building2, color: '#7C3AED', bg: '#F5F3FF', sub: `${providers.length} hoạt động` },
                  { label: 'Tour đang hoạt động', value: approvedTours.length, icon: Package, color: '#059669', bg: '#ECFDF5', sub: `${pendingTours.length} chờ duyệt` },
                  { label: 'Tổng đặt chỗ', value: bookings.length, icon: Calendar, color: '#F59E0B', bg: '#FEF3C7', sub: '+18% tháng này' },
                  { label: 'Doanh thu hệ thống', value: formatVND(totalRevenue), icon: TrendingUp, color: '#FF6000', bg: '#FFF7ED', sub: '+25% tháng này' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="min-w-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-xs text-gray-500 font-medium leading-tight">{stat.label}</p>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                          <Icon className="w-4 h-4" style={{ color: stat.color }} />
                        </div>
                      </div>
                      <p className="money-text font-bold text-gray-900 mb-1" style={{ fontSize: typeof stat.value === 'string' ? 'clamp(0.95rem, 2.5vw, 1.5rem)' : i === 3 ? '0.9rem' : '1.5rem' }} title={String(stat.value)}>{stat.value}</p>
                      <p className="text-xs font-medium" style={{ color: '#059669' }}>{stat.sub}</p>
                    </div>
                  );
                })}
              </div>

              {/* Pending alert */}
              {pendingTours.length > 0 && (
                <div
                  className="flex items-center justify-between p-4 rounded-2xl cursor-pointer hover:shadow-md transition-shadow"
                  style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #F59E0B' }}
                  onClick={() => setActiveNav('approve')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#D97706' }}>
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#92400E' }}>Có {pendingTours.length} tour đang chờ duyệt!</p>
                      <p className="text-xs" style={{ color: '#B45309' }}>Nhà cung cấp đang chờ phản hồi từ bạn</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#D97706' }}>
                    Duyệt ngay <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Quick Widgets */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveNav('reports')}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                      <Flag className="w-5 h-5" style={{ color: '#DC2626' }} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                      {pendingReportsCount}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Tour bị báo cáo</p>
                  <p className="text-xs text-gray-500">Cần xử lý ngay</p>
                </button>

                <button
                  onClick={() => setActiveNav('support')}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE' }}>
                      <Mail className="w-5 h-5" style={{ color: '#0064D2' }} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#DBEAFE', color: '#0064D2' }}>
                      {newContactsCount}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Phản hồi mới</p>
                  <p className="text-xs text-gray-500">Khách hàng cần hỗ trợ</p>
                </button>

                <button
                  onClick={() => setActiveNav('reviews')}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEF3C7' }}>
                      <Star className="w-5 h-5" style={{ color: '#F59E0B' }} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#FEF3C7', color: '#D97706' }}>
                      {reviews.length}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Đánh giá tour</p>
                  <p className="text-xs text-gray-500">★ {liveAdminStats.averageRating} trung bình</p>
                </button>
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-sm">Doanh thu & Đặt chỗ 6 tháng</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: '#0064D2' }} />
                        <span className="text-xs text-gray-500">Doanh thu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: '#FF6000' }} />
                        <span className="text-xs text-gray-500">Đặt chỗ</span>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer key="rc-overview-revenue" width="100%" height={230}>
                    <BarChart id="admin-overview-revenue" data={monthlyData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000) + 'M'} />
                      <Tooltip formatter={(v: number, name: string) => name === 'Doanh thu' ? formatVND(v) : v} />
                      <Bar key="bar-revenue" isAnimationActive={false} dataKey="revenue" name="Doanh thu" fill="#0064D2" radius={[5, 5, 0, 0]} />
                      <Bar key="bar-bookings-overview" isAnimationActive={false} dataKey="bookings" name="Đặt chỗ" fill="#FF6000" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">Cơ cấu tour theo loại</h3>
                  <ResponsiveContainer key="rc-overview-pie" width="100%" height={180}>
                    <PieChart id="admin-overview-pie">
                      <Pie key="pie-main" isAnimationActive={false} data={tourTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                        {tourTypeData.map((entry, i) => <Cell key={`pie-${i}-${entry.name}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {tourTypeData.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-xs text-gray-600">{d.name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* User growth & Conversion */}
              <div className="grid lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">Tăng trưởng người dùng</h3>
                  <ResponsiveContainer key="rc-overview-users" width="100%" height={180}>
                    <LineChart id="admin-overview-users" data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line key="line-users" isAnimationActive={false} type="monotone" dataKey="users" name="Người dùng mới" stroke="#0064D2" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">Tỉ lệ chuyển đổi</h3>
                  <div className="flex items-center justify-center h-[180px]">
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-40 h-40">
                          <circle cx="80" cy="80" r="70" fill="none" stroke="#F3F4F6" strokeWidth="12" />
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="none"
                            stroke="#0064D2"
                            strokeWidth="12"
                            strokeDasharray={`${2 * Math.PI * 70 * (liveAdminStats.conversionRate / 100)} ${2 * Math.PI * 70}`}
                            strokeLinecap="round"
                            transform="rotate(-90 80 80)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-4xl font-bold" style={{ color: '#0064D2' }}>{liveAdminStats.conversionRate}%</p>
                          <p className="text-xs text-gray-500 mt-1">Conversion Rate</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">Từ xem tour đến đặt chỗ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── APPROVE TOURS ────────────────────────── */}
          {activeNav === 'approve' && (
            <div className="space-y-5">
              {/* Tab filter */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pending', 'updated', 'approved', 'rejected'] as const).map(f => {
                  const count = f === 'all' ? tours.length : tours.filter(t => t.status === f).length;
                  const isActive = tourFilter === f;
                  const cfg = f !== 'all' ? tourStatusMap[f] : { color: 'white', bg: '#0064D2' };
                  return (
                    <button
                      key={f}
                      onClick={() => setTourFilter(f)}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: isActive ? (f === 'all' ? '#0064D2' : cfg.bg) : 'white',
                        color: isActive ? (f === 'all' ? 'white' : cfg.color) : '#6B7280',
                        border: isActive ? 'none' : '1px solid #E5E7EB',
                      }}
                    >
                      {f === 'all' ? 'Tất cả' : tourStatusMap[f].label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Tour list */}
              <div className="space-y-3">
                {filteredTours.length === 0 && (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1FAE5' }} />
                    <p className="text-gray-400 text-sm">Không có tour nào</p>
                  </div>
                )}
                {filteredTours.map(tour => {
                  const stCfg = tourStatusMap[tour.status as keyof typeof tourStatusMap] || tourStatusMap.pending;
                  const StIcon = stCfg.icon;
                  return (
                    <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="flex">
                        {/* Image */}
                        <div className="w-40 flex-shrink-0 relative">
                          <img src={tour.image} alt={tour.name.vi} className="w-full h-full object-cover" style={{ minHeight: 120 }} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: stCfg.bg, color: stCfg.color }}>
                                  <StIcon className="w-3 h-3" />
                                  {stCfg.label}
                                </span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tour.type}</span>
                              </div>
                              <h3 className="font-bold text-gray-900 mb-1">{tour.name.vi}</h3>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{tour.description.vi}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" style={{ color: '#0064D2' }} />{tour.location}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tour.duration} ngày</span>
                                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" style={{ color: '#7C3AED' }} />{tour.providerName}</span>
                              </div>
                            </div>
                            <div className="min-w-0 max-w-[160px] flex-shrink-0 text-right">
                              {tour.promotionActive && tour.originalPrice && tour.originalPrice > tour.price && (
                                <p className="money-text text-xs font-semibold text-gray-400 line-through" title={formatVND(tour.originalPrice)}>{formatVND(tour.originalPrice)}</p>
                              )}
                              <p className="money-text font-bold" style={{ color: '#0064D2', fontSize: '1.0625rem' }} title={formatVND(tour.price)}>{formatVND(tour.price)}</p>
                              {(tour.promotionActive || (tour.promotionStatus === 'pending' && (tour.discountPercent || 0) > 0)) && (
                                <p className="text-xs font-bold text-orange-600">
                                  {tour.promotionStatus === 'pending' ? 'Chờ duyệt ưu đãi: ' : ''}
                                  {tour.promotionBadge || `SALE ${tour.discountPercent || 0}%`}
                                </p>
                              )}
                              <p className="text-xs text-gray-400">/người</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            {(tour.status === 'pending' || tour.status === 'updated') && (
                              <>
                                <button
                                  onClick={() => handleApproveTour(tour.id, tour.name.vi)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                                  style={{ background: '#059669' }}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  {tour.status === 'updated' ? 'Duyệt cập nhật' : 'Duyệt tour'}
                                </button>
                                <button
                                  onClick={() => handleRejectTour(tour.id, tour.name.vi)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Từ chối
                                </button>
                                <button
                                  onClick={() => handleRequestEdit(tour.id, tour.name.vi)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                  style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Yêu cầu sửa
                                </button>
                              </>
                            )}
                            {tour.status === 'approved' && (
                              <button
                                onClick={() => handleRejectTour(tour.id, tour.name.vi)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                style={{ background: '#FEF3C7', color: '#D97706' }}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Thu hồi duyệt
                              </button>
                            )}
                            {tour.status === 'rejected' && (
                              <button
                                onClick={() => handleApproveTour(tour.id, tour.name.vi)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                style={{ background: '#D1FAE5', color: '#059669' }}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Duyệt lại
                              </button>
                            )}
                            {tour.promotionStatus === 'pending' && (tour.discountPercent || 0) > 0 && (
                              <button
                                onClick={() => handleApprovePromotion(tour.id)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}
                              >
                                <Check className="w-3.5 h-3.5" />
                                Duyệt ưu đãi
                              </button>
                            )}
                            {tour.promotionActive && (
                              <button
                                onClick={() => handleRemovePromotions([tour.id])}
                                disabled={applyingPromo}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-red-50 disabled:opacity-60"
                                style={{ color: '#DC2626', border: '1px solid #FECACA' }}
                              >
                                <X className="w-3.5 h-3.5" />
                                Bỏ ưu đãi
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedTourDetail(tour)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-blue-50"
                              style={{ color: '#0064D2', border: '1px solid #BFDBFE' }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem chi tiết
                            </button>
                            <button
                              onClick={() => handleDeleteTour(tour.id, tour.name.vi)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs transition-all hover:bg-red-50"
                              style={{ color: '#DC2626', border: '1px solid #FECACA' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── BOOKINGS ────────────────────────────── */}
          {activeNav === 'bookings' && (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Tổng booking', value: bookings.length, hint: 'Toàn hệ thống', icon: Calendar, color: '#0064D2', bg: '#EFF6FF' },
                  { label: 'Đã thu tiền', value: bookings.filter(isBookingRevenuePaid).length, hint: formatVND(totalRevenue), icon: TrendingUp, color: '#059669', bg: '#ECFDF5' },
                  { label: 'Chờ hoàn tiền', value: refundPendingBookings.length, hint: refundPendingBookings.reduce((sum, item) => sum + (item.refundAmount || 0), 0) ? formatVND(refundPendingBookings.reduce((sum, item) => sum + (item.refundAmount || 0), 0)) : 'Không có yêu cầu', icon: RefreshCw, color: '#D97706', bg: '#FFFBEB' },
                  { label: 'Chờ chuyển NCC', value: payoutPendingBookings.length, hint: payoutPendingBookings.reduce((sum, item) => sum + getProviderSettlementAmount(item), 0) ? formatVND(payoutPendingBookings.reduce((sum, item) => sum + getProviderSettlementAmount(item), 0)) : 'Không có khoản chờ', icon: Building2, color: '#7C3AED', bg: '#F5F3FF' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
                          <p className="mt-2 text-2xl font-black text-gray-900">{item.value}</p>
                          <p className="money-text mt-1 text-xs font-semibold" style={{ color: item.color }} title={String(item.hint)}>{item.hint}</p>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: item.bg, color: item.color }}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Hoàn tiền cần xử lý</h3>
                      <p className="mt-1 text-xs text-gray-500">Khách/NCC hủy, admin chuyển khoản thủ công.</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{refundPendingBookings.length}</span>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto p-3">
                    {refundPendingBookings.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                        Không có yêu cầu hoàn tiền đang chờ.
                      </div>
                    ) : refundPendingBookings.slice(0, 5).map(booking => (
                      <div key={booking.id} className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50/60">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">{booking.tourName}</p>
                            <p className="mt-1 text-xs text-gray-500">{booking.userName} - {booking.userEmail}</p>
                            <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
                              <span className="rounded-lg bg-gray-50 px-2.5 py-1.5">{booking.refundBankName || 'Chưa có ngân hàng'}</span>
                              <span className="rounded-lg bg-gray-50 px-2.5 py-1.5">{booking.refundAccountNumber || 'Chưa có STK'}</span>
                              <span className="rounded-lg bg-gray-50 px-2.5 py-1.5">{booking.refundAccountName || 'Chưa có chủ TK'}</span>
                            </div>
                            {booking.cancelReason && <p className="mt-2 line-clamp-1 text-xs text-gray-500">Lý do: {booking.cancelReason}</p>}
                          </div>
                          <div className="min-w-0 max-w-[150px] shrink-0 text-right">
                            <p className="money-text text-sm font-black text-red-600" title={formatVND(booking.refundAmount || 0)}>{formatVND(booking.refundAmount || 0)}</p>
                            <p className="mt-1 text-xs text-gray-400">{booking.cancelledBy || 'system'}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <button type="button" onClick={() => handleRejectRefund(booking)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Từ chối</button>
                          <button type="button" onClick={() => handleMarkRefunded(booking)} className="rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: '#059669' }}>Đã hoàn tiền</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Đối soát nhà cung cấp</h3>
                      <p className="mt-1 text-xs text-gray-500">Tour hoàn thành, admin chuyển tiền cho NCC.</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{payoutPendingBookings.length}</span>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto p-3">
                    {payoutPendingBookings.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                        Không có khoản đối soát đang chờ.
                      </div>
                    ) : payoutPendingBookings.slice(0, 5).map(booking => (
                      <div key={booking.id} className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50/60">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">{booking.tourName}</p>
                            <p className="mt-1 text-xs text-gray-500">{booking.paymentMethod === 'cod' ? 'COD - admin giữ cọc, chuyển phần dư sau hoa hồng' : 'QR - chuyển tiền sau hoa hồng'}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                              <span className="money-text max-w-full rounded-lg bg-gray-50 px-2.5 py-1.5" title={`Admin thu ${formatVND(getAdminCollectedAmount(booking))}`}>Admin thu {formatVND(getAdminCollectedAmount(booking))}</span>
                              {booking.paymentMethod === 'cod' && (
                                <span className="money-text max-w-full rounded-lg bg-gray-50 px-2.5 py-1.5" title={`Khách trả NCC ${formatVND(getCustomerPaysProviderAmount(booking))}`}>Khách trả NCC {formatVND(getCustomerPaysProviderAmount(booking))}</span>
                              )}
                              <span className="money-text max-w-full rounded-lg bg-gray-50 px-2.5 py-1.5" title={`Hoa hồng ${formatVND(booking.commissionAmount || 0)}`}>Hoa hồng {formatVND(booking.commissionAmount || 0)}</span>
                            </div>
                          </div>
                          <div className="min-w-0 max-w-[150px] shrink-0 text-right">
                            <p className="money-text text-sm font-black text-blue-600" title={formatVND(getProviderSettlementAmount(booking))}>{formatVND(getProviderSettlementAmount(booking))}</p>
                            <p className="mt-1 text-xs text-gray-400">#{booking.id}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button type="button" onClick={() => handleMarkPaidOut(booking)} className="rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: '#0064D2' }}>Đã chuyển NCC</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Danh sách booking</h3>
                    <p className="mt-1 text-xs text-gray-500">Theo dõi trạng thái thanh toán, xác nhận, hoàn tiền và hoàn thành tour.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'pending', 'deposited', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded'] as const).map(f => {
                      const isActive = bookingFilter === f;
                      const count = f === 'all' ? bookings.length : bookings.filter(b => b.status === f).length;
                      const label = f === 'all' ? 'Tất cả' : bookingStatusMap[f].label;
                      return (
                        <button
                          key={f}
                          onClick={() => setBookingFilter(f)}
                          className="rounded-lg px-3 py-2 text-xs font-bold transition-all"
                          style={{
                            background: isActive ? '#111827' : '#F9FAFB',
                            color: isActive ? 'white' : '#6B7280',
                            border: isActive ? '1px solid #111827' : '1px solid #E5E7EB',
                          }}
                        >
                          {label} {count}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] table-fixed">
                    <thead>
                      <tr className="bg-gray-50">
                        {['Booking', 'Khách hàng', 'Lịch đi', 'Thanh toán', 'Hoa hồng', 'Xử lý tiền', 'Trạng thái'].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => {
                        const st = bookingStatusMap[b.status] || bookingStatusMap.pending;
                        const refundDisplayAmount = b.refundAmount || b.depositAmount || b.totalAmount || 0;
                        const financeInfo = b.refundStatus === 'refund_pending'
                          ? { label: 'Chờ hoàn', amount: refundDisplayAmount, color: '#D97706', bg: '#FFFBEB' }
                          : b.refundStatus === 'refunded' || b.status === 'refunded'
                            ? { label: 'Đã hoàn', amount: refundDisplayAmount, color: '#7C3AED', bg: '#F5F3FF' }
                            : b.refundStatus === 'refund_rejected'
                              ? { label: 'Từ chối hoàn', amount: 0, color: '#DC2626', bg: '#FEF2F2' }
                              : b.refundStatus === 'no_refund'
                                ? { label: 'Hủy không hoàn', amount: 0, color: '#6B7280', bg: '#F3F4F6' }
                                : b.payoutStatus === 'payout_pending'
                                  ? { label: 'Chờ chuyển NCC', amount: getProviderSettlementAmount(b), color: '#0064D2', bg: '#EFF6FF' }
                                  : b.payoutStatus === 'paid_out'
                                    ? { label: 'Đã chuyển NCC', amount: getProviderSettlementAmount(b), color: '#059669', bg: '#ECFDF5' }
                                    : { label: 'Không phát sinh', amount: 0, color: '#6B7280', bg: '#F9FAFB' };
                        return (
                          <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                            <td className="px-5 py-4 align-top">
                              <p className="text-xs font-black text-blue-600">#{b.id}</p>
                              <p className="mt-1 max-w-[220px] truncate text-sm font-bold text-gray-900">{b.tourName}</p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="truncate text-sm font-semibold text-gray-800">{b.userName}</p>
                              <p className="mt-1 truncate text-xs text-gray-400">{b.userEmail}</p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="text-sm font-semibold text-gray-700">{new Date(b.startDate).toLocaleDateString('vi-VN')}</p>
                              <p className="mt-1 text-xs text-gray-400">{b.adults + b.children} khách</p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="money-text text-sm font-black text-gray-900" title={formatVND(getAdminCollectedAmount(b))}>{formatVND(getAdminCollectedAmount(b))}</p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">
                                  {b.paymentMethod === 'cod' ? 'COD cọc 30%' : 'QR 100%'}
                                </span>
                                {b.paymentMethod === 'cod' && (
                                  <span className="money-text max-w-full rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700" title={`NCC thu ${formatVND(getCustomerPaysProviderAmount(b))}`}>
                                    NCC thu {formatVND(getCustomerPaysProviderAmount(b))}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="money-text text-sm font-semibold text-gray-700" title={formatVND(b.commissionAmount || 0)}>{formatVND(b.commissionAmount || 0)}</p>
                              <p className="mt-1 text-xs text-gray-400">{b.commissionRate || 10}% tổng tour</p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: financeInfo.bg, color: financeInfo.color }}>
                                {financeInfo.label}
                              </span>
                              {financeInfo.amount > 0 && (
                                <p className="money-text mt-1.5 text-xs font-black text-gray-800" title={formatVND(financeInfo.amount)}>{formatVND(financeInfo.amount)}</p>
                              )}
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeNav === 'users' && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Tổng khách hàng', value: regularUsers.length, color: '#0064D2', bg: '#EFF6FF' },
                  { label: 'Đang hoạt động', value: regularUsers.filter(u => !u.banned && u.active !== false).length, color: '#059669', bg: '#ECFDF5' },
                  { label: 'Đã khóa', value: regularUsers.filter(u => u.banned).length, color: '#DC2626', bg: '#FEF2F2' },
                  { label: 'Có số điện thoại', value: regularUsers.filter(u => Boolean(u.phone)).length, color: '#D97706', bg: '#FEF3C7' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium leading-tight">{s.label}</p>
                    <p className="mt-2 text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, email, số điện thoại..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={userStatusFilter}
                    onChange={event => setUserStatusFilter(event.target.value as typeof userStatusFilter)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="banned">Đã khóa</option>
                  </select>
                </div>
              </div>

              {/* User grid */}
              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                  <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#E5E7EB' }} />
                  <p className="text-gray-500 mb-2 font-semibold text-lg">Không tìm thấy người dùng</p>
                  <p className="text-sm text-gray-400">Thử đổi từ khóa hoặc bộ lọc.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredUsers.map(user => {
                  const roleCfg = roleMap[user.role];
                  const initials = user.name.split(' ').map(n => n[0]).slice(-2).join('');
                  return (
                    <div key={user.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ background: user.role === 'admin' ? '#DC2626' : user.role === 'provider' ? '#7C3AED' : '#0064D2' }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: roleCfg.bg, color: roleCfg.color }}>{roleCfg.label}</span>
                            {user.banned && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FEE2E2', color: '#DC2626' }}>Đã khóa</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="text-center p-2 rounded-lg" style={{ background: '#F9FAFB' }}>
                          <p className="text-xs text-gray-500">SĐT</p>
                          <p className="text-xs font-semibold text-gray-700">{user.phone}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: '#F9FAFB' }}>
                          <p className="text-xs text-gray-500">Ngày tham gia</p>
                          <p className="text-xs font-semibold text-gray-700">{user.joinDate ? new Date(user.joinDate).toLocaleDateString('vi-VN') : '-'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenUserEditForm(user)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-gray-50"
                          style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                        >
                          <Edit className="w-3 h-3" />
                          Chỉnh sửa
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserBanProfessional(user)}
                            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-red-50"
                            style={{ color: user.banned ? '#059669' : '#DC2626', border: user.banned ? '1px solid #A7F3D0' : '1px solid #FECACA' }}
                          >
                            {user.banned ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            {user.banned ? 'Mở khóa' : 'Khóa'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PROVIDERS ────────────────────────────── */}
          {activeNav === 'providers' && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Tổng nhà cung cấp', value: providers.length, color: '#7C3AED', bg: '#F5F3FF' },
                  { label: 'Đã duyệt', value: providers.filter(item => item.status === 'approved').length, color: '#059669', bg: '#ECFDF5' },
                  { label: 'Chờ duyệt', value: providers.filter(item => item.status === 'pending').length, color: '#D97706', bg: '#FEF3C7' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                    <p className="font-bold mb-1" style={{ fontSize: '1.75rem', color: s.color }}>{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên công ty, email, số điện thoại..."
                      value={providerSearch}
                      onChange={event => setProviderSearch(event.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={providerStatusFilter}
                    onChange={event => setProviderStatusFilter(event.target.value as typeof providerStatusFilter)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Đã từ chối</option>
                  </select>
                </div>
              </div>

              {/* Provider cards */}
              {filteredProviders.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                  <Building2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#E5E7EB' }} />
                  <p className="text-gray-500 mb-2 font-semibold text-lg">Không tìm thấy nhà cung cấp</p>
                  <p className="text-sm text-gray-400">Thử đổi từ khóa hoặc bộ lọc.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProviders.map(prov => {
                  const provTours = tours.filter(t => t.providerId === prov.id || t.providerName === prov.companyName);
                  const provApproved = provTours.filter(t => t.status === 'approved');
                  const provPending = provTours.filter(t => t.status === 'pending');
                  const provBookings = bookings.filter(b => provTours.some(t => t.id === b.tourId));
                  const provRevenue = provBookings.filter(isBookingRevenuePaid).reduce((s, b) => s + b.totalAmount, 0);
                  const providerStatus = {
                    pending: { label: 'Chờ duyệt', color: '#D97706', bg: '#FEF3C7' },
                    approved: { label: 'Đã duyệt', color: '#059669', bg: '#D1FAE5' },
                    rejected: { label: 'Đã từ chối', color: '#DC2626', bg: '#FEE2E2' },
                  }[prov.status || 'pending'] || { label: getProviderStatusLabel(prov.status), color: '#6B7280', bg: '#F3F4F6' };

                  return (
                    <div key={prov.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold" style={{ background: '#7C3AED' }}>
                            {prov.companyName.split(' ').slice(-1)[0][0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{prov.companyName}</p>
                            <p className="text-xs text-gray-500">{prov.email} · {prov.phone}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Tham gia: {prov.joinedDate ? new Date(prov.joinedDate).toLocaleDateString('vi-VN') : '-'}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: providerStatus.bg, color: providerStatus.color }}>
                          {providerStatus.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-3">
                        {(() => {
                          const provReviews = reviews.filter(r => provTours.some(t => t.id === r.tourId));
                          const avgRating = provReviews.length > 0 
                            ? (provReviews.reduce((s, r) => s + r.rating, 0) / provReviews.length).toFixed(1)
                            : '0.0';
                          const approvalRate = provTours.length > 0
                            ? Math.round((provApproved.length / provTours.length) * 100)
                            : 0;
                          return [
                            { label: 'Tổng tour', value: provTours.length, color: '#0064D2' },
                            { label: 'Tỉ lệ duyệt', value: approvalRate + '%', color: '#059669' },
                            { label: 'Rating TB', value: '⭐ ' + avgRating, color: '#F59E0B' },
                            { label: 'Đánh giá', value: provReviews.length, color: '#7C3AED' },
                            { label: 'Doanh thu', value: formatVND(provRevenue), color: '#FF6000' },
                          ].map((stat, i) => (
                            <div key={i} className="min-w-0 text-center p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                              <p className="money-text font-bold text-xs mb-0.5" style={{ color: stat.color }} title={String(stat.value)}>{stat.value}</p>
                              <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Provider's tours mini list */}
                      {provTours.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Tour của nhà cung cấp:</p>
                          <div className="flex flex-wrap gap-2">
                            {provTours.map(t => {
                              const sc = tourStatusMap[t.status as keyof typeof tourStatusMap] || tourStatusMap.pending;
                              return (
                                <span key={t.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={{ background: sc.bg, color: sc.color }}>
                                  {t.name.vi}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleShowProviderDetail(prov)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-gray-50"
                          style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                        >
                          <Eye className="w-3 h-3" />
                          Xem chi tiết
                        </button>
                        {prov.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateProviderStatus(prov, 'approved')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:opacity-90"
                            style={{ background: '#D1FAE5', color: '#047857' }}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Duyệt
                          </button>
                        )}
                        {prov.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateProviderStatus(prov, 'rejected')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-red-50"
                            style={{ color: '#DC2626', border: '1px solid #FECACA' }}
                          >
                            <XCircle className="w-3 h-3" />
                            Từ chối
                          </button>
                        )}
                        {(() => {
                          const approvalRate = provTours.length > 0
                            ? Math.round((provApproved.length / provTours.length) * 100)
                            : 100;
                          return approvalRate < 50 && provTours.length >= 3 ? (
                            <button
                              onClick={() => handleSuspendProvider(prov)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:opacity-90"
                              style={{ background: '#FEF3C7', color: '#D97706' }}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Cảnh cáo
                            </button>
                          ) : null;
                        })()}
                        <button
                          onClick={() => prov.status === 'approved' ? handleSuspendProvider(prov) : handleUpdateProviderStatus(prov, 'pending')}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-red-50"
                          style={{ color: prov.status === 'approved' ? '#DC2626' : '#D97706', border: prov.status === 'approved' ? '1px solid #FECACA' : '1px solid #FDE68A' }}
                        >
                          {prov.status === 'approved' ? <UserX className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {prov.status === 'approved' ? 'Đình chỉ' : 'Chờ duyệt lại'}
                        </button>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          )}
          {activeNav === 'reviews' && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-gray-950">Kiểm duyệt đánh giá</p>
                        <p className="mt-0.5 text-sm text-gray-500">Theo dõi đánh giá theo từng tour và yêu cầu nhà cung cấp phản hồi khi cần.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                      Điểm TB {averageRating.toFixed(1)}
                    </span>
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                      {reviews.filter(r => r.response).length} đã phản hồi
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_170px_210px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={reviewSearch}
                      onChange={event => setReviewSearch(event.target.value)}
                      placeholder="Tìm khách, tour, provider, nội dung đánh giá..."
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <select
                    value={reviewRatingFilter}
                    onChange={event => setReviewRatingFilter(event.target.value as typeof reviewRatingFilter)}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">Tất cả sao</option>
                    <option value="5">5 sao</option>
                    <option value="4">4 sao</option>
                    <option value="low">1-2 sao</option>
                  </select>
                  <select
                    value={reviewResponseFilter}
                    onChange={event => setReviewResponseFilter(event.target.value as typeof reviewResponseFilter)}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">Tất cả phản hồi</option>
                    <option value="unanswered">Chưa phản hồi</option>
                    <option value="requested">Admin đã yêu cầu</option>
                    <option value="answered">Đã phản hồi</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                  <div>
                    <p className="text-base font-black text-gray-900">Danh sách đánh giá</p>
                    <p className="mt-0.5 text-xs text-gray-500">Hiển thị {paginatedReviews.length} / {filteredReviewItems.length} đánh giá phù hợp</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">
                    Trang {reviewPage}/{reviewPageCount}
                  </span>
                </div>

                {filteredReviewItems.length === 0 ? (
                  <div className="p-16 text-center">
                    <Star className="mx-auto mb-4 h-16 w-16 text-gray-200" />
                    <p className="text-lg font-bold text-gray-600">Không có đánh giá phù hợp</p>
                    <p className="mt-1 text-sm text-gray-400">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {paginatedReviews.map(review => {
                      const tour = tours.find(item => item.id === review.tourId);
                      const status = review.response
                        ? { label: 'Đã phản hồi', bg: '#ECFDF5', color: '#059669' }
                        : review.responseRequested
                          ? { label: 'Đã yêu cầu', bg: '#FFFBEB', color: '#D97706' }
                          : { label: 'Chưa phản hồi', bg: '#F3F4F6', color: '#6B7280' };
                      return (
                        <button
                          key={review.id}
                          type="button"
                          onClick={() => setSelectedReviewDetail(review)}
                          className="grid w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_120px]"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: '#0064D2' }}>
                                {review.userName.split(' ').slice(-1)[0]?.[0] || 'K'}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-gray-900">{review.userName || 'Khách hàng'}</p>
                                <div className="mt-1 flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-3.5 w-3.5" fill={i < review.rating ? '#F59E0B' : 'none'} style={{ color: i < review.rating ? '#F59E0B' : '#D1D5DB' }} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">{review.comment || 'Không có nội dung đánh giá.'}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">{tour?.name.vi || review.tourName || 'Tour không xác định'}</p>
                            <p className="mt-1 truncate text-xs text-gray-500">{tour?.providerName || 'Nhà cung cấp'}</p>
                            <p className="mt-1 truncate text-xs text-gray-400">{tour?.location || ''}</p>
                          </div>
                          <div className="flex items-start xl:justify-center">
                            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 xl:text-right">
                            <p className="font-bold text-gray-700">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                            <p className="mt-1 text-xs">{review.helpful} hữu ích</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-gray-500">Mỗi trang {ADMIN_PAGE_SIZE} đánh giá</p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setReviewPage(page => Math.max(1, page - 1))} disabled={reviewPage <= 1} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                      Trước
                    </button>
                    <button type="button" onClick={() => setReviewPage(page => Math.min(reviewPageCount, page + 1))} disabled={reviewPage >= reviewPageCount} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                      Sau
                    </button>
                  </div>
                </div>
              </div>

              {selectedReviewDetail && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelectedReviewDetail(null)}>
                  <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
                    <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
                      <div>
                        <p className="text-lg font-black text-gray-950">Chi tiết đánh giá</p>
                        <p className="mt-1 text-sm text-gray-500">{selectedReviewDetailTour?.name.vi || selectedReviewDetail.tourName}</p>
                      </div>
                      <button onClick={() => setSelectedReviewDetail(null)} className="rounded-xl p-2 hover:bg-gray-100">
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-black text-gray-900">{selectedReviewDetail.userName || 'Khách hàng'}</p>
                            <p className="mt-1 text-xs text-gray-500">{new Date(selectedReviewDetail.createdAt).toLocaleString('vi-VN')}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4" fill={i < selectedReviewDetail.rating ? '#F59E0B' : 'none'} style={{ color: i < selectedReviewDetail.rating ? '#F59E0B' : '#D1D5DB' }} />
                            ))}
                          </div>
                        </div>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">{selectedReviewDetail.comment || 'Không có nội dung đánh giá.'}</p>
                      </div>

                      {selectedReviewDetail.images && selectedReviewDetail.images.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-black uppercase text-gray-500">Ảnh đánh giá</p>
                          <div className="grid grid-cols-3 gap-3">
                            {selectedReviewDetail.images.map((image, index) => (
                              <a key={index} href={image} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                                <img src={image} alt={`Review ${index + 1}`} className="h-28 w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedReviewDetail.response ? (
                        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
                          <p className="text-xs font-black uppercase text-purple-700">Phản hồi nhà cung cấp</p>
                          <p className="mt-2 text-sm leading-7 text-gray-700">{selectedReviewDetail.response.message}</p>
                          <p className="mt-3 text-xs text-gray-500">{selectedReviewDetail.response.from} · {new Date(selectedReviewDetail.response.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      ) : selectedReviewDetail.responseRequested ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                          Đã yêu cầu nhà cung cấp phản hồi
                          {selectedReviewDetail.responseRequestedAt ? ` · ${new Date(selectedReviewDetail.responseRequestedAt).toLocaleString('vi-VN')}` : ''}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row">
                      {!selectedReviewDetail.response && (
                        <button onClick={() => handleRequestProviderReviewResponse(selectedReviewDetail)} disabled={selectedReviewDetail.responseRequested} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:opacity-90" style={{ background: selectedReviewDetail.responseRequested ? '#F3F4F6' : '#F5F3FF', color: selectedReviewDetail.responseRequested ? '#9CA3AF' : '#7C3AED' }}>
                          <MessageSquare className="h-4 w-4" />
                          {selectedReviewDetail.responseRequested ? 'Đã yêu cầu phản hồi' : 'Yêu cầu Provider phản hồi'}
                        </button>
                      )}
                      <button onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Xóa đánh giá',
                          message: `Bạn chắc chắn muốn xóa đánh giá của ${selectedReviewDetail.userName}? Thao tác này không thể hoàn tác.`,
                          variant: 'danger',
                          onConfirm: () => {
                            handleDeleteReview(selectedReviewDetail);
                            setSelectedReviewDetail(null);
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                          },
                        });
                      }} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                        Xóa đánh giá
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="hidden">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm xl:sticky xl:top-5 xl:self-start">
                  <div className="border-b border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-black text-gray-900">Tour có đánh giá</p>
                        <p className="mt-1 text-xs text-gray-500">Chọn một tour để kiểm duyệt phản hồi</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                        {filteredReviewTours.length}/{reviewTours.length}
                      </span>
                    </div>
                  </div>

                  <div className="relative m-4 mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={reviewTourSearch}
                      onChange={(event) => {
                        setReviewTourSearch(event.target.value);
                        setSelectedReviewTour('all');
                      }}
                      placeholder="Tìm tour, nhà cung cấp, địa điểm..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="space-y-3 p-3">
                    {reviewTours.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                        Chưa có tour nào có đánh giá.
                      </div>
                    ) : filteredReviewTours.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                        Không tìm thấy tour phù hợp.
                      </div>
                    ) : filteredReviewTours.map(tour => {
                      const tourReviews = reviews.filter(r => r.tourId === tour.id);
                      const tourAverage = (tourReviews.reduce((sum, review) => sum + review.rating, 0) / tourReviews.length).toFixed(1);
                      const unanswered = tourReviews.filter(review => !review.response).length;
                      const isSelected = tour.id === activeReviewTourId;
                      return (
                        <button
                          key={tour.id}
                          type="button"
                          onClick={() => setSelectedReviewTour(tour.id)}
                          className="w-full rounded-2xl border p-4 text-left transition-all"
                          style={{
                            borderColor: isSelected ? '#0064D2' : '#E5E7EB',
                            background: isSelected ? '#EFF6FF' : '#FFFFFF',
                            boxShadow: isSelected ? '0 12px 24px rgba(0,100,210,0.12)' : 'none',
                          }}
                        >
                          <div className="flex gap-3">
                            <img src={tour.image} alt={tour.name.vi} className="h-[72px] w-24 rounded-xl object-cover" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-gray-900">{tour.name.vi}</p>
                              <p className="truncate text-xs text-gray-500">{tour.providerName}</p>
                              <div className="mt-2 flex items-center gap-2 text-xs">
                                <span className="font-bold text-amber-600">{tourAverage} sao</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-600">{tourReviews.length} đánh giá</span>
                                {unanswered > 0 && (
                                  <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-700">
                                    {unanswered} chờ phản hồi
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  {selectedReviewTourData && (
                    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                      <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <img src={selectedReviewTourData.image} alt={selectedReviewTourData.name.vi} className="h-56 w-full object-cover lg:h-full" />
                        <div className="min-w-0 p-6">
                          <div className="flex items-start gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="text-2xl font-black leading-tight text-gray-950">{selectedReviewTourData.name.vi}</h3>
                                  <p className="mt-1 text-sm text-gray-500">{selectedReviewTourData.providerName} · {selectedReviewTourData.location}</p>
                                </div>
                                <button
                                  onClick={() => setSelectedTourDetail(selectedReviewTourData)}
                                  className="flex items-center gap-1.5 rounded-xl border border-blue-200 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Mở hồ sơ tour
                                </button>
                              </div>
                              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                                {[
                                  { label: 'Đánh giá', value: filteredReviews.length, color: '#0064D2' },
                                  { label: 'Điểm TB', value: filteredReviews.length ? (filteredReviews.reduce((s, r) => s + r.rating, 0) / filteredReviews.length).toFixed(1) : '0.0', color: '#F59E0B' },
                                  { label: 'Đã phản hồi', value: filteredReviews.filter(r => r.response).length, color: '#059669' },
                                  { label: 'Chờ phản hồi', value: filteredReviews.filter(r => !r.response).length, color: '#D97706' },
                                ].map((item, index) => (
                                  <div key={index} className="min-w-0 rounded-xl bg-gray-50 p-3 text-center">
                                    <p className="money-text text-sm font-black" style={{ color: item.color }} title={String(item.value)}>{item.value}</p>
                                    <p className="text-xs text-gray-500">{item.label}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                {filteredReviews.length === 0 ? (
                  <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                    <Star className="w-20 h-20 mx-auto mb-4" style={{ color: '#E5E7EB' }} />
                    <p className="text-gray-500 mb-2 font-semibold text-lg">Chưa có đánh giá</p>
                    <p className="text-sm text-gray-400">Khách hàng chưa để lại đánh giá cho tour này</p>
                  </div>
                ) : (
                  filteredReviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:p-7">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#0064D2' }}>
                            {review.userName.split(' ').slice(-1)[0][0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{review.userName}</p>
                            <p className="text-xs text-gray-500">{review.tourName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-3.5 h-3.5"
                                    fill={i < review.rating ? '#F59E0B' : 'none'}
                                    style={{ color: i < review.rating ? '#F59E0B' : '#D1D5DB' }}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{review.helpful} hữu ích</span>
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="mb-5 rounded-2xl bg-gray-50 p-5">
                        <p className="text-base leading-7 text-gray-800">{review.comment}</p>
                      </div>

                      {!review.response && review.responseRequested && (
                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                          Đã yêu cầu nhà cung cấp phản hồi
                          {review.responseRequestedAt ? ` · ${new Date(review.responseRequestedAt).toLocaleString('vi-VN')}` : ''}
                        </div>
                      )}

                      {/* Images if any */}
                      {review.images && review.images.length > 0 && (
                        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                          {review.images.map((img, idx) => (
                            <a key={idx} href={img} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                              <img
                              key={idx}
                              src={img}
                              alt={`Review ${idx + 1}`}
                              className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Provider Response */}
                      {review.response && (
                        <div className="mt-4 p-4 rounded-xl" style={{ background: '#F5F3FF', border: '1px solid #E9D5FF' }}>
                          <div className="flex items-start gap-2 mb-2">
                            <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#7C3AED' }} />
                            <div>
                              <p className="text-xs font-bold" style={{ color: '#7C3AED' }}>{review.response.from}</p>
                              <p className="text-xs text-gray-500">{new Date(review.response.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{review.response.message}</p>
                        </div>
                      )}

                      {/* Admin actions */}
                      <div className="flex flex-col gap-3 mt-5 pt-5 border-t border-gray-100 sm:flex-row sm:flex-wrap">
                        {!review.response && (
                          <button
                            onClick={() => handleRequestProviderReviewResponse(review)}
                            disabled={review.responseRequested}
                            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                            style={{ background: review.responseRequested ? '#F3F4F6' : '#F5F3FF', color: review.responseRequested ? '#9CA3AF' : '#7C3AED' }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {review.responseRequested ? 'Đã yêu cầu phản hồi' : 'Yêu cầu Provider phản hồi'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Xóa đánh giá',
                              message: `Bạn chắc chắn muốn xóa đánh giá của ${review.userName}? Thao tác này không thể hoàn tác.`,
                              variant: 'danger',
                              onConfirm: () => {
                                handleDeleteReview(review);
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              },
                            });
                          }}
                          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-red-50"
                          style={{ color: '#DC2626', border: '1px solid #FECACA' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
              </div>
            </div>
          )}
          {activeNav === 'messages' && (() => {
            return (
              <div className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <MessagingSystem
                initialConversations={adminConversations}
                role="admin"
                currentUserName="Admin Thích Du Lịch"
                onUnreadCountChange={setUnreadTourMessages}
                quickReplies={[
                  'Đã nhận thông tin, chúng tôi sẽ xem xét và phản hồi sớm.',
                  'Tour đã được duyệt thành công. Chúc mừng!',
                  'Vui lòng bổ sung: ảnh chất lượng cao và mô tả chi tiết hơn.',
                  'Thông tin lịch trình chưa đầy đủ, cần cập nhật lại.',
                  'Chính sách hủy tour cần được bổ sung rõ ràng hơn.',
                  'Giá tour cần phù hợp với chất lượng dịch vụ đã mô tả.',
                ]}
              />
              </div>
            );
          })()}
          {activeNav === 'reports' && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                      <Flag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-950">Báo cáo vi phạm</p>
                      <p className="mt-0.5 text-sm text-gray-500">Tập trung xử lý theo tour, đối chiếu bằng chứng và ghi nhận hành động admin.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                      {reports.filter(r => r.status === 'pending').length} chờ xử lý
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      {reports.filter(r => r.status === 'resolved').length} đã giải quyết
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-gray-900">Báo cáo theo tour</p>
                    <p className="mt-0.5 text-xs text-gray-500">Chọn một tour để xem toàn bộ báo cáo, lịch sử xử lý và hành động nghiệp vụ.</p>
                  </div>
                  <select
                    value={reportFilter}
                    onChange={(e) => {
                      setReportFilter(e.target.value as any);
                      setSelectedReportTour('all');
                    }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 sm:w-[260px]"
                    style={{ '--tw-ring-color': '#FF6000' } as React.CSSProperties}
                  >
                    <option value="all">Tất cả trạng thái ({reports.length})</option>
                    <option value="pending">Chờ xử lý ({reports.filter(r => r.status === 'pending').length})</option>
                    <option value="reviewed">Đã xem xét ({reports.filter(r => r.status === 'reviewed').length})</option>
                    <option value="resolved">Đã giải quyết ({reports.filter(r => r.status === 'resolved').length})</option>
                    <option value="dismissed">Đã bỏ qua ({reports.filter(r => r.status === 'dismissed').length})</option>
                  </select>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={reportSearch}
                    onChange={event => setReportSearch(event.target.value)}
                    placeholder="Tìm tour, provider, người báo cáo, lý do hoặc nội dung..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                  <div>
                    <p className="text-base font-black text-gray-900">Danh sách báo cáo</p>
                    <p className="mt-0.5 text-xs text-gray-500">Hiển thị {paginatedReports.length} / {filteredReports.length} báo cáo phù hợp</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">
                    Trang {reportPage}/{reportPageCount}
                  </span>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="p-16 text-center">
                    <Flag className="mx-auto mb-4 h-16 w-16 text-gray-200" />
                    <p className="text-lg font-bold text-gray-600">Không có báo cáo phù hợp</p>
                    <p className="mt-1 text-sm text-gray-400">Thử đổi trạng thái hoặc từ khóa tìm kiếm.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {paginatedReports.map(report => {
                      const tour = tours.find(item => item.id === report.tourId);
                      const st = reportStatusMap[report.status] || reportStatusMap.pending;
                      return (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => setSelectedReportDetail(report)}
                          className="grid w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 xl:grid-cols-[150px_minmax(0,1.25fr)_minmax(0,1fr)_140px_120px]"
                        >
                          <div>
                            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: st.bg, color: st.color }}>
                              {st.label}
                            </span>
                            <p className="mt-2 text-xs font-semibold text-gray-400">#{report.id.slice(0, 8)}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-gray-900">{tour?.name.vi || report.tourName || 'Tour không xác định'}</p>
                            <p className="mt-1 truncate text-xs text-gray-500">{tour?.providerName || 'Nhà cung cấp'}</p>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">{report.description || 'Không có mô tả chi tiết.'}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase text-gray-400">Lý do</p>
                            <p className="mt-1 line-clamp-2 text-sm font-bold text-red-700">{report.reason}</p>
                            <p className="mt-2 truncate text-xs text-gray-500">{report.reporterName || 'Khách hàng'}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            <p className="font-bold text-gray-700">{new Date(report.createdAt).toLocaleDateString('vi-VN')}</p>
                            <p className="mt-1 text-xs">{report.images?.length || 0} ảnh</p>
                          </div>
                          <div className="flex items-start xl:justify-end">
                            <span className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">
                              Xem xử lý
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-gray-500">Mỗi trang {ADMIN_PAGE_SIZE} báo cáo</p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setReportPage(page => Math.max(1, page - 1))} disabled={reportPage <= 1} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                      Trước
                    </button>
                    <button type="button" onClick={() => setReportPage(page => Math.min(reportPageCount, page + 1))} disabled={reportPage >= reportPageCount} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                      Sau
                    </button>
                  </div>
                </div>
              </div>

              {selectedReportDetail && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelectedReportDetail(null)}>
                  <div className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
                    <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
                      <div>
                        <p className="text-lg font-black text-gray-950">Chi tiết báo cáo</p>
                        <p className="mt-1 text-sm text-gray-500">{selectedReportDetailTour?.name.vi || selectedReportDetail.tourName}</p>
                      </div>
                      <button onClick={() => setSelectedReportDetail(null)} className="rounded-xl p-2 hover:bg-gray-100">
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                      {(() => {
                        const st = reportStatusMap[selectedReportDetail.status] || reportStatusMap.pending;
                        return (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">{selectedReportDetail.reason}</span>
                            <span className="text-xs text-gray-400">{new Date(selectedReportDetail.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                        );
                      })()}

                      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                        <p className="text-xs font-black uppercase text-gray-500">Người báo cáo</p>
                        <p className="mt-1 text-sm font-black text-gray-900">{selectedReportDetail.reporterName || 'Khách hàng'}</p>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">{selectedReportDetail.description || 'Không có mô tả chi tiết.'}</p>
                      </div>

                      {selectedReportDetail.images && selectedReportDetail.images.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-black uppercase text-gray-500">Bằng chứng ảnh</p>
                          <div className="grid grid-cols-3 gap-3">
                            {selectedReportDetail.images.map((image, index) => (
                              <a key={index} href={image} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                                <img src={image} alt={`Bằng chứng ${index + 1}`} className="h-32 w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedReportDetail.adminNote && (
                        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
                          <p className="text-xs font-black uppercase text-purple-700">Ghi chú xử lý</p>
                          <p className="mt-2 text-sm leading-7 text-gray-700">{selectedReportDetail.adminNote}</p>
                          <p className="mt-3 text-xs text-gray-500">Bởi {selectedReportDetail.reviewedBy || 'Admin'} · {selectedReportDetail.reviewedAt ? new Date(selectedReportDetail.reviewedAt).toLocaleString('vi-VN') : ''}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-3 border-t border-gray-100 px-6 py-4 sm:grid-cols-2">
                      {selectedReportDetail.status === 'pending' && (
                        <button onClick={() => handleReviewReport(selectedReportDetail)} className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                          <Check className="h-4 w-4" />
                          Tiếp nhận báo cáo
                        </button>
                      )}
                      {(selectedReportDetail.status === 'pending' || selectedReportDetail.status === 'reviewed') && (
                        <>
                          <button onClick={() => handleWarnProviderReport(selectedReportDetail)} className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold" style={{ background: '#FEF3C7', color: '#B45309' }}>
                            <AlertTriangle className="h-4 w-4" />
                            Cảnh báo nhà cung cấp
                          </button>
                          <button onClick={() => handleResolveReport(selectedReportDetail)} className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ background: '#059669' }}>
                            <CheckCircle className="h-4 w-4" />
                            Hoàn tất xử lý
                          </button>
                          <button onClick={() => handleDismissReport(selectedReportDetail)} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">
                            <X className="h-4 w-4" />
                            Bỏ qua báo cáo
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="hidden">
              {filteredReports.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                  <Flag className="w-20 h-20 mx-auto mb-4" style={{ color: '#E5E7EB' }} />
                  <p className="text-gray-500 mb-2 font-semibold text-lg">Không có báo cáo</p>
                  <p className="text-sm text-gray-400">Không có báo cáo nào trong trạng thái đang lọc.</p>
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm xl:sticky xl:top-5 xl:self-start">
                    <div className="border-b border-gray-100 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-gray-900">Tour có báo cáo</p>
                          <p className="mt-1 text-xs text-gray-500">Ưu tiên các tour còn báo cáo đang xử lý</p>
                        </div>
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                          {reportTours.length} tour
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 p-3">
                      {reportTours.map(item => {
                        const active = item.tourId === selectedReportTourData?.tourId;
                        return (
                          <button
                            key={item.tourId}
                            type="button"
                            onClick={() => setSelectedReportTour(item.tourId)}
                            className="mb-3 w-full rounded-2xl p-4 text-left transition-all"
                            style={{
                              background: active ? '#FFF7ED' : 'white',
                              border: active ? '1px solid #FDBA74' : '1px solid #F3F4F6',
                              boxShadow: active ? '0 8px 20px rgba(249,115,22,0.12)' : 'none',
                            }}
                          >
                            <div className="flex gap-3">
                              {item.image ? (
                                <img src={item.image} alt={item.tourName} className="h-[72px] w-24 rounded-xl object-cover" />
                              ) : (
                                <div className="flex h-[72px] w-24 items-center justify-center rounded-xl bg-gray-100">
                                  <Package className="h-6 w-6 text-gray-300" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-black text-red-700">
                                    {item.reports.length} báo cáo
                                  </span>
                                  {item.pendingCount > 0 && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
                                      {item.pendingCount} mới
                                    </span>
                                  )}
                                </div>
                                <p className="line-clamp-2 text-sm font-black text-gray-900">{item.tourName}</p>
                                <p className="mt-1 truncate text-xs text-gray-500">{item.providerName}</p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                              <div className="rounded-lg bg-gray-50 py-2">
                                <p className="text-xs font-black text-gray-900">{item.activeCount}</p>
                                <p className="text-[10px] text-gray-500">Đang xử lý</p>
                              </div>
                              <div className="rounded-lg bg-gray-50 py-2">
                                <p className="text-xs font-black text-gray-900">{item.reviewsCount}</p>
                                <p className="text-[10px] text-gray-500">Đánh giá</p>
                              </div>
                              <div className="rounded-lg bg-gray-50 py-2">
                                <p className="text-xs font-black text-gray-900">{item.rating.toFixed(1)}</p>
                                <p className="text-[10px] text-gray-500">Rating</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedReportTourData && (
                    <div className="space-y-4">
                      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 p-5">
                          <div className="flex items-start justify-between gap-5">
                            <div className="flex min-w-0 gap-4">
                              {selectedReportTourData.image ? (
                                <img src={selectedReportTourData.image} alt={selectedReportTourData.tourName} className="h-24 w-32 rounded-xl object-cover" />
                              ) : (
                                <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-gray-100">
                                  <Package className="h-8 w-8 text-gray-300" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                                    {selectedReportTourData.reports.length} báo cáo vi phạm
                                  </span>
                                  {selectedReportTourData.activeCount > 0 ? (
                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                                      {selectedReportTourData.activeCount} còn xử lý
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                      Đã kết thúc
                                    </span>
                                  )}
                                </div>
                                <h3 className="truncate text-xl font-black text-gray-900">{selectedReportTourData.tourName}</h3>
                                <p className="mt-1 text-sm text-gray-500">{selectedReportTourData.providerName}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => selectedReportTourData.tour && setSelectedTourDetail(selectedReportTourData.tour)}
                              disabled={!selectedReportTourData.tour}
                              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 px-4 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Mở hồ sơ tour
                            </button>
                          </div>

                          <div className="mt-5 grid grid-cols-4 gap-3">
                            {[
                              { label: 'Đặt chỗ', value: selectedReportTourData.bookingsCount, color: '#0064D2' },
                              { label: 'Đánh giá', value: selectedReportTourData.reviewsCount, color: '#7C3AED' },
                              { label: 'Rating', value: selectedReportTourData.rating.toFixed(1), color: '#F59E0B' },
                              { label: 'Doanh thu', value: formatVND(selectedReportTourData.revenue), color: '#059669' },
                            ].map((item, index) => (
                              <div key={index} className="rounded-xl bg-gray-50 p-3 text-center">
                                <p className="text-sm font-black" style={{ color: item.color }}>{item.value}</p>
                                <p className="text-xs text-gray-500">{item.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {selectedTourReports.map(report => {
                          const st = reportStatusMap[report.status] || reportStatusMap.pending;
                          return (
                            <div key={report.id} className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm xl:grid-cols-[minmax(0,1fr)_360px]">
                              <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: st.bg, color: st.color }}>
                                    {st.label}
                                  </span>
                                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                                    {report.reason}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(report.createdAt).toLocaleString('vi-VN')}
                                  </span>
                                </div>

                                <div>
                                  <p className="text-xs font-bold uppercase text-gray-500">Người báo cáo</p>
                                  <p className="mt-1 text-sm font-bold text-gray-900">{report.reporterName || 'Khách hàng'}</p>
                                </div>

                                <div className="rounded-2xl bg-gray-50 p-5">
                                  <p className="mb-2 text-xs font-bold uppercase text-gray-500">Nội dung báo cáo</p>
                                  <p className="text-base leading-7 text-gray-800">{report.description || 'Không có mô tả chi tiết.'}</p>
                                  {report.images && report.images.length > 0 && (
                                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                      {report.images.map((image, index) => (
                                        <a key={index} href={image} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                          <img
                                            src={image}
                                            alt={`Bằng chứng ${index + 1}`}
                                            className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {report.adminNote && (
                                  <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                                    <p className="mb-1 text-xs font-bold uppercase text-purple-700">Ghi chú xử lý</p>
                                    <p className="text-sm text-gray-700">{report.adminNote}</p>
                                    <p className="mt-2 text-xs text-gray-500">
                                      Bởi {report.reviewedBy || 'Admin'} · {report.reviewedAt ? new Date(report.reviewedAt).toLocaleString('vi-VN') : ''}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5">
                                <p className="mb-4 text-base font-black text-gray-900">Xử lý báo cáo</p>
                                <div className="space-y-3">
                                  {report.status === 'pending' && (
                                    <button
                                      onClick={() => handleReviewReport(report)}
                                      className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all hover:opacity-90"
                                      style={{ background: '#F5F3FF', color: '#7C3AED' }}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      Tiếp nhận báo cáo
                                    </button>
                                  )}
                                  {(report.status === 'pending' || report.status === 'reviewed') && (
                                    <>
                                      <button
                                        onClick={() => handleWarnProviderReport(report)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all hover:opacity-90"
                                        style={{ background: '#FEF3C7', color: '#B45309' }}
                                      >
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Cảnh báo nhà cung cấp
                                      </button>
                                      <button
                                        onClick={() => handleResolveReport(report)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
                                        style={{ background: '#059669' }}
                                      >
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Hoàn tất xử lý
                                      </button>
                                      <button
                                        onClick={() => handleDismissReport(report)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                        Bỏ qua báo cáo
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTour(report.tourId, report.tourName)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3.5 text-sm font-bold text-red-600 transition-all hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Gỡ tour khỏi hệ thống
                                      </button>
                                    </>
                                  )}
                                  {(report.status === 'resolved' || report.status === 'dismissed') && (
                                    <div className="rounded-xl bg-gray-50 p-4 text-center text-sm font-semibold text-gray-500">
                                      Báo cáo đã kết thúc xử lý.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          )}

          {activeNav === 'support' && (
            <div className="space-y-5">
              {(() => {
                const statusMap: Record<ContactMessage['status'], { label: string; color: string; bg: string; ring: string }> = {
                  new: { label: 'Mới', color: '#DC2626', bg: '#FFF1F2', ring: '#FFE4E6' },
                  replied: { label: 'Đã trả lời', color: '#0064D2', bg: '#F0F7FF', ring: '#DBEAFE' },
                  resolved: { label: 'Đã giải quyết', color: '#059669', bg: '#ECFDF5', ring: '#D1FAE5' },
                };
                const counts = {
                  all: contacts.length,
                  new: contacts.filter(c => c.status === 'new').length,
                  replied: contacts.filter(c => c.status === 'replied').length,
                  resolved: contacts.filter(c => c.status === 'resolved').length,
                };
                const stats = [
                  { label: 'Cần phản hồi', value: counts.new, icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2' },
                  { label: 'Đang theo dõi', value: counts.replied, icon: Clock, color: '#0064D2', bg: '#EFF6FF' },
                  { label: 'Hoàn tất', value: counts.resolved, icon: CheckCircle, color: '#059669', bg: '#ECFDF5' },
                  { label: 'Tổng ticket', value: counts.all, icon: Mail, color: '#374151', bg: '#F3F4F6' },
                ];

                return (
                  <>
                    <div className="grid grid-cols-4 gap-4">
                      {stats.map(item => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium leading-tight">{item.label}</p>
                                <p className="mt-2 text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                              </div>
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                                <Icon className="w-5 h-5" style={{ color: item.color }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="relative min-w-0 flex-1">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            value={supportSearch}
                            onChange={event => setSupportSearch(event.target.value)}
                            placeholder="Tìm theo tên, email, số điện thoại, tiêu đề hoặc nội dung"
                            className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                          />
                        </div>
                        <select
                          value={supportFilter}
                          onChange={event => setSupportFilter(event.target.value as typeof supportFilter)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                        >
                          <option value="all">Tất cả ({counts.all})</option>
                          <option value="new">Mới ({counts.new})</option>
                          <option value="replied">Đã trả lời ({counts.replied})</option>
                          <option value="resolved">Đã giải quyết ({counts.resolved})</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredContacts.length === 0 ? (
                        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                          <Mail className="w-20 h-20 mx-auto mb-4" style={{ color: '#E5E7EB' }} />
                          <p className="text-gray-500 mb-2 font-semibold text-lg">Không có liên hệ</p>
                          <p className="mt-1 text-sm text-gray-400">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                        </div>
                      ) : (
                        filteredContacts.map(contact => {
                          const st = statusMap[contact.status] || statusMap.new;
                          return (
                            <div key={contact.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: st.bg, color: st.color, border: `1px solid ${st.ring}` }}>
                                      {st.label}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-400">#{contact.id.slice(0, 8)}</span>
                                    <span className="text-xs text-gray-400">{new Date(contact.createdAt).toLocaleString('vi-VN')}</span>
                                  </div>
                                  <h3 className="mt-3 text-base font-bold text-gray-900">{contact.subject}</h3>
                                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5" />{contact.name}</span>
                                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{contact.email}</span>
                                    {contact.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{contact.phone}</span>}
                                  </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2">
                                  {contact.status !== 'resolved' && (
                                    <button
                                      type="button"
                                      onClick={() => handleReplyContact(contact)}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                                      style={{ background: '#0064D2' }}
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      {contact.replyMessage ? 'Sửa phản hồi' : 'Trả lời'}
                                    </button>
                                  )}
                                  {contact.status !== 'resolved' && (
                                    <button
                                      type="button"
                                      onClick={() => handleResolveContact(contact)}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                                      style={{ background: '#D1FAE5', color: '#059669' }}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      Đã giải quyết
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
                                <div className="p-4 rounded-xl bg-gray-50">
                                  <p className="text-xs font-bold text-gray-700 mb-2">Nội dung khách gửi</p>
                                  <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{contact.message}</p>
                                </div>

                                <div className="p-4 rounded-xl" style={{ background: contact.replyMessage ? '#EFF6FF' : '#F9FAFB', border: `1px solid ${contact.replyMessage ? '#BFDBFE' : '#E5E7EB'}` }}>
                                  <p className="text-xs font-bold mb-2" style={{ color: contact.replyMessage ? '#0064D2' : '#6B7280' }}>
                                    Phản hồi nội bộ
                                  </p>
                                  {contact.replyMessage ? (
                                    <>
                                      <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{contact.replyMessage}</p>
                                      <p className="mt-3 text-xs text-gray-500">
                                        {contact.repliedBy || 'Admin'} · {contact.repliedAt ? new Date(contact.repliedAt).toLocaleString('vi-VN') : ''}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-400">Chưa có phản hồi.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          {activeNav === 'destinations' && (() => {
            const regionColors: Record<string, { color: string; bg: string }> = {
              'Bắc':     { color: '#0064D2', bg: '#DBEAFE' },
              'Trung':   { color: '#7C3AED', bg: '#F5F3FF' },
              'Nam':     { color: '#059669', bg: '#D1FAE5' },
              'Quốc tế': { color: '#D97706', bg: '#FEF3C7' },
            };
            const filtered = destRegionFilter === 'all'
              ? destinations
              : destinations.filter(d => d.region === destRegionFilter);

            const openAdd = () => {
              setDestForm({ name: '', description: '', image: '', region: 'Bắc' });
              setDestImageFile(null);
              setDestModal({ open: true, editing: null });
            };
            const openEdit = (dest: Destination) => {
              setDestForm({ name: dest.name, description: dest.description, image: dest.image, region: dest.region });
              setDestImageFile(null);
              setDestModal({ open: true, editing: dest });
            };
            const handleSave = async () => {
              if (!destForm.name.trim()) return;
              let nextForm = destForm;
              try {
                const uploadedImage = destImageFile ? await api.uploadImage(destImageFile, 'destinations') : null;
                nextForm = uploadedImage?.url ? { ...destForm, image: uploadedImage.url } : destForm;
              } catch (error) {
                showAdminError('Không thể upload ảnh điểm đến', error, 'Vui lòng kiểm tra cấu hình Cloudinary và thử lại.');
                return;
              }
              if (destModal.editing) {
                const previous = destinations;
                setDestinations(prev => prev.map(d =>
                  d.id === destModal.editing!.id ? { ...d, ...nextForm } : d
                ));
                api.updateDestination(destModal.editing.id, toDestinationPayload(nextForm))
                  .then(updated => setDestinations(prev => prev.map(d =>
                    d.id === destModal.editing!.id ? toAdminDestination(updated) : d
                  )))
                  .catch(error => {
                    showAdminError('Không thể cập nhật điểm đến', error, 'Vui lòng kiểm tra thông tin và thử lại.');
                    setDestinations(previous);
                  });
              } else {
                const optimistic: Destination = {
                  id: 'dest_' + Date.now(),
                  ...nextForm,
                  tourCount: 0,
                };
                setDestinations(prev => [...prev, {
                  ...optimistic,
                }]);
                api.createDestination(toDestinationPayload(nextForm))
                  .then(created => setDestinations(prev => prev.map(d =>
                    d.id === optimistic.id ? toAdminDestination(created) : d
                  )))
                  .catch(error => {
                    showAdminError('Không thể tạo điểm đến', error, 'Vui lòng kiểm tra thông tin và thử lại.');
                    setDestinations(prev => prev.filter(d => d.id !== optimistic.id));
                  });
              }
              setDestImageFile(null);
              setDestModal({ open: false, editing: null });
            };
            const handleDelete = (id: string, name: string) => {
              setConfirmModal({
                isOpen: true, title: 'Xóa điểm đến', variant: 'danger',
                message: `Bạn có chắc muốn xóa điểm đến "${name}"? Hành động này không thể hoàn tác.`,
                onConfirm: () => {
                  const previous = destinations;
                  setDestinations(prev => prev.filter(d => d.id !== id));
                  api.deleteDestination(id).catch(error => {
                    showAdminError('Không thể xóa điểm đến', error, 'Điểm đến này có thể đang có tour liên quan.');
                    setDestinations(previous);
                  });
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  setSuccessModal({ isOpen: true, title: 'Đã xóa', message: `Điểm đến "${name}" đã được xóa khỏi hệ thống.` });
                },
              });
            };

            const openEditCategory = (category: TourCategory) => {
              setCategoryForm({
                code: category.code,
                name: category.name,
                description: category.description || '',
                active: category.active,
                sortOrder: category.sortOrder,
              });
              setCategoryModal({ open: true, editing: category });
            };

            const saveCategory = () => {
              if (!categoryModal.editing || !categoryForm.name.trim()) return;
              const previous = tourCategories;
              setTourCategories(prev => prev.map(item =>
                item.code === categoryModal.editing!.code
                  ? { ...item, ...categoryForm, name: categoryForm.name.trim(), description: categoryForm.description?.trim() }
                  : item
              ));
              api.updateTourCategory(categoryModal.editing.code, toTourCategoryPayload({
                ...categoryForm,
                name: categoryForm.name.trim(),
                description: categoryForm.description?.trim(),
              }))
                .then(updated => setTourCategories(prev => prev.map(item =>
                  item.code === categoryModal.editing!.code ? toAdminTourCategory(updated) : item
                )))
                .catch(error => {
                  showAdminError('Không thể cập nhật loại hình tour', error, 'Vui lòng kiểm tra thông tin và thử lại.');
                  setTourCategories(previous);
                });
              setCategoryModal({ open: false, editing: null });
            };

            const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

            return (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                  <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-2xl font-black text-gray-950">Điểm đến & loại hình tour</p>
                      <p className="mt-1 text-sm text-gray-500">Quản lý vùng miền, ảnh đại diện điểm đến và các nhóm trải nghiệm provider được phép dùng.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[360px]">
                      {[
                        { label: 'Điểm đến', value: destinations.length, color: '#0064D2' },
                        { label: 'Loại đang bật', value: tourCategories.filter(item => item.active).length, color: '#059669' },
                        { label: 'Tour gắn điểm', value: destinations.reduce((sum, item) => sum + item.tourCount, 0), color: '#7C3AED' },
                      ].map(item => (
                        <div key={item.label} className="rounded-2xl bg-gray-50 px-4 py-3">
                          <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
                          <p className="text-xs font-semibold text-gray-500">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
                    <p className="text-sm font-semibold text-gray-600">{filtered.length} điểm đến đang hiển thị</p>
                  <button
                    onClick={openAdd}
                    className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: '#0064D2' }}
                  >
                    <Plus className="h-4 w-4" /> Thêm điểm đến
                  </button>
                  </div>
                </div>
                <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
                  <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
                    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                      <p className="text-sm font-black text-gray-900">Bộ lọc vùng miền</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">Chọn vùng để thu gọn danh sách điểm đến.</p>
                      <div className="mt-4 space-y-2">
                        {(['all', 'Bắc', 'Trung', 'Nam', 'Quốc tế'] as const).map(region => {
                          const count = region === 'all' ? destinations.length : destinations.filter(d => d.region === region).length;
                          const isActive = destRegionFilter === region;
                          const rc = region === 'all' ? { color: '#0064D2', bg: '#EFF6FF' } : regionColors[region];
                          return (
                            <button
                              key={region}
                              onClick={() => setDestRegionFilter(region)}
                              className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all"
                              style={{
                                background: isActive ? rc.bg : 'white',
                                color: isActive ? rc.color : '#4B5563',
                                borderColor: isActive ? rc.color : '#E5E7EB',
                              }}
                            >
                              <span>{region === 'all' ? 'Tất cả vùng miền' : `Miền ${region}`}</span>
                              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-gray-900">Loại hình tour</p>
                          <p className="mt-1 text-xs leading-5 text-gray-500">Provider chỉ thấy loại đang bật.</p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                          {tourCategories.filter(item => item.active).length}/{tourCategories.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {tourCategories.map(category => (
                          <div key={category.code} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-gray-900">{category.name}</p>
                                <p className="mt-0.5 text-xs font-mono text-gray-400">{category.code}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = { ...category, active: !category.active };
                                  const previous = tourCategories;
                                  setTourCategories(prev => prev.map(item => item.code === category.code ? next : item));
                                  api.updateTourCategory(category.code, toTourCategoryPayload(next))
                                    .then(updated => setTourCategories(prev => prev.map(item => item.code === category.code ? toAdminTourCategory(updated) : item)))
                                    .catch(error => {
                                      showAdminError('Không thể đổi trạng thái loại hình', error, 'Vui lòng thử lại sau.');
                                      setTourCategories(previous);
                                    });
                                }}
                                className="rounded-full px-2.5 py-1 text-xs font-bold"
                                style={{
                                  background: category.active ? '#DCFCE7' : '#FEE2E2',
                                  color: category.active ? '#15803D' : '#B91C1C',
                                }}
                              >
                                {category.active ? 'Bật' : 'Tắt'}
                              </button>
                            </div>
                            <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-500">{category.description || 'Chưa có mô tả'}</p>
                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                              <span className="text-xs font-semibold text-gray-400">{category.tourCount} tour</span>
                              <button
                                type="button"
                                onClick={() => openEditCategory(category)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                              >
                                <Edit className="w-3 h-3" /> Sửa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>

                  <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {filtered.map(dest => {
                    const rc = regionColors[dest.region] ?? { color: '#374151', bg: '#F3F4F6' };
                    return (
                      <div key={dest.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
                        {/* Top: image + badge */}
                        <div className="relative h-52 overflow-hidden">
                          <img
                            src={dest.image || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400'}
                            alt={dest.name}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)' }} />
                          <span
                            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: rc.bg, color: rc.color }}
                          >
                            Miền {dest.region}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="p-5">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <p className="text-lg font-black leading-tight text-gray-900">{dest.name}</p>
                            <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500">
                              <Package className="w-3 h-3" />
                              {dest.tourCount} tour
                            </span>
                          </div>
                          <p className="min-h-[44px] text-sm leading-6 text-gray-500 line-clamp-2">{dest.description || 'Chưa có mô tả điểm đến.'}</p>
                        <div className="mt-5 flex gap-3 border-t border-gray-100 pt-4">
                          <button
                            onClick={() => openEdit(dest)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors hover:bg-gray-50"
                            style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
                          >
                            <Edit className="w-3 h-3" />
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => handleDelete(dest.id, dest.name)}
                            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors hover:bg-red-50"
                            style={{ color: '#DC2626', border: '1px solid #FECACA' }}
                          >
                            <Trash2 className="w-3 h-3" />
                            Xóa
                          </button>
                        </div>
                        </div>
                      </div>
                    );
                  })}
                  </section>
                </div>

                {/* Modal: Add / Edit */}
                {destModal.open && (
                  <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
                    onClick={() => setDestModal({ open: false, editing: null })}
                  >
                    <div
                      className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Modal header */}
                      <div className="px-7 py-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0A2540, #1E3A5F)' }}>
                        <div>
                          <p className="font-black text-white text-lg">{destModal.editing ? 'Chỉnh sửa điểm đến' : 'Thêm điểm đến mới'}</p>
                          <p className="text-xs text-white/60 mt-0.5">Điền đầy đủ thông tin bên dưới</p>
                        </div>
                        <button onClick={() => setDestModal({ open: false, editing: null })} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      {/* Modal body */}
                      <div className="grid max-h-[76vh] gap-6 overflow-y-auto p-7 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="space-y-5">
                          <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">Tên điểm đến *</label>
                            <input className={inputCls} value={destForm.name} onChange={e => setDestForm(p => ({ ...p, name: e.target.value }))} placeholder="Vịnh Hạ Long" />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">Mô tả</label>
                            <textarea className={`${inputCls} resize-none`} rows={7} value={destForm.description} onChange={e => setDestForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả ngắn về điểm đến..." />
                          </div>
                          <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">Vùng miền</label>
                            <select className={inputCls} value={destForm.region} onChange={e => setDestForm(p => ({ ...p, region: e.target.value as Destination['region'] }))}>
                              {(['Bắc', 'Trung', 'Nam', 'Quốc tế'] as const).map(r => (
                                <option key={r} value={r}>Miền {r}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">Hình ảnh điểm đến</label>
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50">
                              <ImageIcon className="h-8 w-8 text-blue-600" />
                              <span className="text-sm font-black text-gray-800">Chọn ảnh từ máy</span>
                              <span className="text-xs text-gray-500">JPG, PNG, WEBP. Ảnh sẽ upload lên Cloudinary khi lưu.</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={event => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  setDestImageFile(file);
                                  setDestForm(prev => ({ ...prev, image: URL.createObjectURL(file) }));
                                }}
                              />
                            </label>
                          </div>
                          {destForm.image ? (
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                              <img src={destForm.image} alt="preview" className="h-72 w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                          ) : (
                            <div className="flex h-72 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-400">
                              Chưa chọn ảnh
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Modal footer */}
                      <div className="px-7 py-5 border-t border-gray-100 flex gap-3">
                        <button
                          onClick={handleSave}
                          disabled={!destForm.name.trim()}
                          className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                          style={{ background: !destForm.name.trim() ? '#E5E7EB' : 'linear-gradient(135deg, #0064D2, #0091FF)', color: !destForm.name.trim() ? '#9CA3AF' : 'white' }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {destModal.editing ? 'Lưu thay đổi' : 'Thêm điểm đến'}
                        </button>
                        <button onClick={() => setDestModal({ open: false, editing: null })} className="px-7 py-3.5 rounded-xl text-sm font-bold" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {categoryModal.open && (
                  <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
                    onClick={() => setCategoryModal({ open: false, editing: null })}
                  >
                    <div
                      className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0A2540, #1E3A5F)' }}>
                        <div>
                          <p className="font-bold text-white text-sm">Chỉnh sửa loại hình tour</p>
                          <p className="text-xs text-white/60 mt-0.5">{categoryForm.code}</p>
                        </div>
                        <button onClick={() => setCategoryModal({ open: false, editing: null })} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block">Tên loại hình *</label>
                          <input className={inputCls} value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block">Mô tả</label>
                          <textarea className={inputCls} rows={3} value={categoryForm.description || ''} onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-700 mb-1.5 block">Thứ tự</label>
                            <input type="number" className={inputCls} value={categoryForm.sortOrder} onChange={e => setCategoryForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
                          </div>
                          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700">
                            <input type="checkbox" checked={categoryForm.active} onChange={e => setCategoryForm(p => ({ ...p, active: e.target.checked }))} />
                            Đang bật
                          </label>
                        </div>
                      </div>
                      <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                        <button
                          onClick={saveCategory}
                          disabled={!categoryForm.name.trim()}
                          className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Lưu thay đổi
                        </button>
                        <button onClick={() => setCategoryModal({ open: false, editing: null })} className="px-6 py-3 rounded-xl text-sm font-bold" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          {activeNav === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Revenue by Month */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: '#0064D2' }} />
                    Doanh thu theo tháng
                  </h3>
                  <ResponsiveContainer key="rc-analytics-revenue" width="100%" height={250}>
                    <LineChart id="admin-analytics-revenue" data={liveAdminStats.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v / 1000000) + 'M'} />
                      <Tooltip formatter={(v: number) => formatVND(v)} />
                      <Line key="line-revenue" isAnimationActive={false} type="monotone" dataKey="revenue" name="Doanh thu" stroke="#0064D2" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Tours & Bookings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5" style={{ color: '#FF6000' }} />
                      Tour & Đặt chỗ theo tháng
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: '#0064D2' }} />
                        <span className="text-xs text-gray-500">Tour mới</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: '#FF6000' }} />
                        <span className="text-xs text-gray-500">Đặt chỗ</span>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer key="rc-analytics-tours" width="100%" height={250}>
                    <BarChart id="admin-analytics-tours" data={liveAdminStats.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar key="bar-tours" isAnimationActive={false} dataKey="tours" name="Tour mới" fill="#0064D2" radius={[5, 5, 0, 0]} />
                      <Bar key="bar-bookings-analytics" isAnimationActive={false} dataKey="bookings" name="Đặt chỗ" fill="#FF6000" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Destinations */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" style={{ color: '#059669' }} />
                  Top địa điểm Hot
                </h3>
                <div className="space-y-3">
                  {liveAdminStats.topDestinations.map((dest: any, idx: number) => (
                    <div key={dest.name} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#9CA3AF' }}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">{dest.name}</p>
                          <p className="money-text max-w-[150px] text-right text-sm font-bold" style={{ color: '#0064D2' }} title={formatVND(dest.revenue)}>{formatVND(dest.revenue)}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{dest.tours} tour</span>
                          <span>{dest.bookings} đặt chỗ</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FEF3C7' }}>
                      <Activity className="w-6 h-6" style={{ color: '#D97706' }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tỉ lệ chuyển đổi</p>
                      <p className="text-2xl font-bold" style={{ color: '#D97706' }}>{liveAdminStats.conversionRate}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Từ xem tour đến đặt chỗ</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FEF3C7' }}>
                      <Star className="w-6 h-6" style={{ color: '#F59E0B' }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Rating trung bình</p>
                      <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{liveAdminStats.averageRating} điểm</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Đánh giá chất lượng hệ thống</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                      <Award className="w-6 h-6" style={{ color: '#059669' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Doanh thu TB/tháng</p>
                      <p className="money-text text-lg font-bold" style={{ color: '#059669' }} title={formatVND(liveAdminStats.averageMonthlyRevenue)}>{formatVND(liveAdminStats.averageMonthlyRevenue)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">6 tháng gần đây</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      {selectedTourDetail && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTourDetail(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-gray-900 text-xl">{selectedTourDetail.name.vi}</h2>
                <p className="text-xs text-gray-500 mt-1">Chi tiết đầy đủ về tour</p>
              </div>
              <button
                onClick={() => setSelectedTourDetail(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {(() => {
                const modalBookings = bookings.filter(booking => booking.tourId === selectedTourDetail.id);
                const modalReviews = reviews.filter(review => review.tourId === selectedTourDetail.id);
                const modalReports = reports.filter(report => report.tourId === selectedTourDetail.id);
                const modalRevenue = modalBookings
                  .filter(isBookingRevenuePaid)
                  .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
                return (
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Đặt chỗ', value: modalBookings.length, color: '#0064D2', bg: '#EFF6FF' },
                      { label: 'Doanh thu', value: formatVND(modalRevenue), color: '#059669', bg: '#ECFDF5' },
                      { label: 'Đánh giá', value: modalReviews.length, color: '#F59E0B', bg: '#FFFBEB' },
                      { label: 'Báo cáo', value: modalReports.length, color: '#DC2626', bg: '#FEF2F2' },
                    ].map((item, index) => (
                      <div key={index} className="min-w-0 rounded-xl p-4 text-center" style={{ background: item.bg }}>
                        <p className="money-text text-base font-black" style={{ color: item.color }} title={String(item.value)}>{item.value}</p>
                        <p className="mt-1 text-xs font-semibold" style={{ color: item.color }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Image */}
              <img
                src={selectedTourDetail.image}
                alt={selectedTourDetail.name.vi}
                className="w-full h-80 object-cover rounded-2xl"
              />

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0 p-4 rounded-xl" style={{ background: '#EFF6FF' }}>
                  <p className="text-xs text-gray-500 mb-1">Giá tour</p>
                  <p className="money-text font-bold text-lg" style={{ color: '#0064D2' }} title={formatVND(selectedTourDetail.price)}>{formatVND(selectedTourDetail.price)}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: '#FFF7ED' }}>
                  <p className="text-xs text-gray-500 mb-1">Thời gian</p>
                  <p className="font-bold text-lg" style={{ color: '#FF6000' }}>{selectedTourDetail.duration} ngày</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: '#F5F3FF' }}>
                  <p className="text-xs text-gray-500 mb-1">Nhà cung cấp</p>
                  <p className="font-bold text-sm" style={{ color: '#7C3AED' }}>{selectedTourDetail.providerName}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: '#ECFDF5' }}>
                  <p className="text-xs text-gray-500 mb-1">Địa điểm</p>
                  <p className="font-bold text-sm" style={{ color: '#059669' }}>{selectedTourDetail.location}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3">Mô tả</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedTourDetail.description.vi}</p>
              </div>

              {/* Itinerary */}
              {selectedTourDetail.itinerary && selectedTourDetail.itinerary.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Lịch trình chi tiết</h3>
                  <div className="space-y-3">
                    {selectedTourDetail.itinerary.map((day) => {
                      const title = typeof day.title === 'string' ? day.title : day.title?.vi || '';
                      const activities = Array.isArray(day.activities)
                        ? day.activities
                        : day.activities?.vi || day.activities?.en || [];
                      return (
                        <div key={day.day} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                          <p className="font-bold text-sm mb-2" style={{ color: '#0064D2' }}>
                            Ngày {day.day}: {title}
                          </p>
                          {activities.length > 0 && (
                            <ul className="space-y-1">
                              {activities.map((act, idx) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                  <span className="text-orange-500 mt-0.5">"</span>
                                  <span>{act}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Included */}
              {selectedTourDetail.included && selectedTourDetail.included.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Bao gồm</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTourDetail.included.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#059669' }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews của tour này */}
              {(() => {
                const tourReviews = reviews.filter(r => r.tourId === selectedTourDetail.id);
                if (tourReviews.length === 0) return null;
                const avgRating = (tourReviews.reduce((s, r) => s + r.rating, 0) / tourReviews.length).toFixed(1);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-800">Đánh giá từ khách hàng</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4"
                              fill={i < Math.round(Number(avgRating)) ? '#F59E0B' : 'none'}
                              style={{ color: i < Math.round(Number(avgRating)) ? '#F59E0B' : '#D1D5DB' }}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{avgRating}/5</span>
                        <span className="text-xs text-gray-400">({tourReviews.length} đánh giá)</span>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {tourReviews.map((review) => (
                        <div key={review.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#0064D2' }}>
                              {review.userName.split(' ').slice(-1)[0][0]}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">{review.userName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className="w-3 h-3"
                                      fill={i < review.rating ? '#F59E0B' : 'none'}
                                      style={{ color: i < review.rating ? '#F59E0B' : '#D1D5DB' }}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-4 flex gap-3">
              {(selectedTourDetail.status === 'pending' || selectedTourDetail.status === 'updated') && (
                <>
                  <button
                    onClick={() => {
                      handleApproveTour(selectedTourDetail.id, selectedTourDetail.name.vi);
                      setSelectedTourDetail(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: '#059669' }}
                  >
                    <Check className="w-4 h-4" />
                    {selectedTourDetail.status === 'updated' ? 'Duyệt cập nhật' : 'Duyệt tour ngay'}
                  </button>
                  <button
                    onClick={() => {
                      handleRequestEdit(selectedTourDetail.id, selectedTourDetail.name.vi);
                      setSelectedTourDetail(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: '#FEF3C7', color: '#D97706' }}
                  >
                    <Edit className="w-4 h-4" />
                    Yêu cầu chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      handleRejectTour(selectedTourDetail.id, selectedTourDetail.name.vi);
                      setSelectedTourDetail(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: '#FEE2E2', color: '#DC2626' }}
                  >
                    <X className="w-4 h-4" />
                    Từ chối
                  </button>
                </>
              )}
              {selectedTourDetail.status !== 'pending' && selectedTourDetail.status !== 'updated' && (
                <button
                  onClick={() => setSelectedTourDetail(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {userEditModal.open && userEditModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa người dùng</h3>
                  <p className="mt-1 text-sm text-gray-500">{userEditModal.user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUserEditModal({ open: false, user: null })}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {userEditError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {userEditError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Họ tên</label>
                <input
                  value={userEditForm.name}
                  onChange={event => setUserEditForm(prev => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  value={userEditForm.email}
                  onChange={event => setUserEditForm(prev => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Số điện thoại</label>
                <input
                  value={userEditForm.phone}
                  onChange={event => setUserEditForm(prev => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setUserEditModal({ open: false, user: null })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveUserEdit}
                disabled={savingUserEdit}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: '#0064D2' }}
              >
                {savingUserEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProviderDetail && (() => {
        const providerTours = tours.filter(t => t.providerId === selectedProviderDetail.id || t.providerName === selectedProviderDetail.companyName);
        const providerBookings = bookings.filter(booking => providerTours.some(tour => tour.id === booking.tourId));
        const providerReviews = reviews.filter(review => providerTours.some(tour => tour.id === review.tourId));
        const providerReports = reports.filter(report => providerTours.some(tour => tour.id === report.tourId));
        const providerRevenue = providerBookings
          .filter(isBookingRevenuePaid)
          .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
        const avgRating = providerReviews.length
          ? (providerReviews.reduce((sum, review) => sum + review.rating, 0) / providerReviews.length).toFixed(1)
          : '0.0';
        const activeReports = providerReports.filter(report => report.status === 'pending' || report.status === 'reviewed').length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h3 className="text-xl font-black text-gray-900">{selectedProviderDetail.companyName}</h3>
                  <p className="mt-1 text-sm text-gray-500">{selectedProviderDetail.email} · {selectedProviderDetail.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProviderDetail(null)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[calc(90vh-86px)] overflow-y-auto p-6">
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Tour', value: providerTours.length, color: '#0064D2', bg: '#EFF6FF' },
                    { label: 'Booking', value: providerBookings.length, color: '#059669', bg: '#ECFDF5' },
                    { label: 'Doanh thu', value: formatVND(providerRevenue), color: '#FF6000', bg: '#FFF7ED' },
                    { label: 'Rating TB', value: avgRating, color: '#F59E0B', bg: '#FFFBEB' },
                    { label: 'Báo cáo mở', value: activeReports, color: '#DC2626', bg: '#FEF2F2' },
                  ].map((item, index) => (
                    <div key={index} className="min-w-0 rounded-xl p-4 text-center" style={{ background: item.bg }}>
                      <p className="money-text text-lg font-black" style={{ color: item.color }} title={String(item.value)}>{item.value}</p>
                      <p className="mt-1 text-xs font-semibold" style={{ color: item.color }}>{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-gray-900">Tour đang quản lý</p>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">{providerTours.length}</span>
                    </div>
                    {providerTours.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                        Nhà cung cấp chưa có tour nào.
                      </div>
                    ) : providerTours.map(tour => {
                      const status = tourStatusMap[tour.status] || tourStatusMap.pending;
                      const tourBookings = providerBookings.filter(booking => booking.tourId === tour.id);
                      const tourReviews = providerReviews.filter(review => review.tourId === tour.id);
                      return (
                        <div key={tour.id} className="rounded-xl border border-gray-100 p-4">
                          <div className="flex gap-4">
                            <img src={tour.image} alt={tour.name.vi} className="h-20 w-28 rounded-xl object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-gray-900">{tour.name.vi}</p>
                                  <p className="mt-1 truncate text-xs text-gray-500" title={`${tour.location} · ${formatVND(tour.price)}`}>{tour.location} · {formatVND(tour.price)}</p>
                                </div>
                                <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: status.bg, color: status.color }}>
                                  {status.label}
                                </span>
                              </div>
                              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                                <span>{tourBookings.length} booking</span>
                                <span>{tourReviews.length} đánh giá</span>
                                <span>{tourReviews.filter(review => !review.response).length} chờ phản hồi</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-black text-gray-900">Điểm cần theo dõi</p>
                    <div className="rounded-xl border border-gray-100 p-4">
                      <p className="text-xs font-bold text-gray-500">Báo cáo chưa kết thúc</p>
                      <p className="mt-2 text-2xl font-black text-red-600">{activeReports}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-4">
                      <p className="text-xs font-bold text-gray-500">Đánh giá chưa phản hồi</p>
                      <p className="mt-2 text-2xl font-black text-orange-600">{providerReviews.filter(review => !review.response).length}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-4">
                      <p className="text-xs font-bold text-gray-500">Trạng thái nhà cung cấp</p>
                      <p className="mt-2 text-sm font-bold text-gray-800">{getProviderStatusLabel(selectedProviderDetail.status)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSuspendProvider(selectedProviderDetail)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4" />
                      Đình chỉ nhà cung cấp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {refundRejectModal.open && refundRejectModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <h3 className="text-lg font-black text-gray-900">Từ chối hoàn tiền</h3>
              <p className="mt-1 text-sm text-gray-500">
                Đơn #{refundRejectModal.booking.id} - {refundRejectModal.booking.userName}
              </p>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                Lý do này sẽ được lưu vào booking để admin theo dõi lại lịch sử xử lý.
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">Lý do từ chối</label>
                <textarea
                  value={refundRejectModal.reason}
                  onChange={event => setRefundRejectModal(prev => ({ ...prev, reason: event.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="Ví dụ: Yêu cầu hủy quá hạn miễn phí, không đủ điều kiện hoàn tiền..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setRefundRejectModal({ open: false, booking: null, reason: '', submitting: false })}
                disabled={refundRejectModal.submitting}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={submitRejectRefund}
                disabled={refundRejectModal.submitting}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: '#DC2626' }}
              >
                {refundRejectModal.submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {contactReplyModal.open && contactReplyModal.contact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div className="min-w-0">
                <p className="text-lg font-semibold text-gray-900">Phản hồi khách hàng</p>
                <p className="mt-1 truncate text-sm text-gray-500">
                  {contactReplyModal.contact.name} · {contactReplyModal.contact.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactReplyModal({ open: false, contact: null, message: '', submitting: false })}
                disabled={contactReplyModal.submitting}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{contactReplyModal.contact.subject}</p>
                  <span className="text-xs font-normal text-gray-400">{new Date(contactReplyModal.contact.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-normal leading-6 text-gray-700">{contactReplyModal.contact.message}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Nội dung phản hồi</label>
                <textarea
                  value={contactReplyModal.message}
                  onChange={event => setContactReplyModal(prev => ({ ...prev, message: event.target.value }))}
                  rows={10}
                  disabled={contactReplyModal.submitting}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm font-normal leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="Nhập nội dung phản hồi cho khách hàng..."
                />
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setContactReplyModal({ open: false, contact: null, message: '', submitting: false })}
                disabled={contactReplyModal.submitting}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitContactReply}
                disabled={contactReplyModal.submitting}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: '#0064D2' }}
              >
                <Send className="h-4 w-4" />
                {contactReplyModal.submitting ? 'Đang lưu...' : 'Lưu phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
      
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
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
