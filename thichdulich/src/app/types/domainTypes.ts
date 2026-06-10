// Shared domain interfaces used by API-backed screens.

export interface Tour {
  id: string;
  name: {
    vi: string;
    en: string;
  };
  description: {
    vi: string;
    en: string;
  };
  location: string;
  type: 'adventure' | 'beach' | 'cultural' | 'food' | 'nature' | 'mountain' | 'city';
  duration: number;
  advanceBookingDays?: number;
  price: number;
  originalPrice?: number;
  promotionTitle?: string;
  promotionBadge?: string;
  discountPercent?: number;
  promotionActive?: boolean;
  promotionStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  promotionSource?: 'none' | 'admin' | 'provider';
  image: string;
  rating: number;
  reviews: number;
  maxSeats?: number;
  availability: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'need_edit' | 'updated';
  providerId: string;
  providerName: string;
  rejectionReason?: string;
  adminNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  editHistory?: {
    date: string;
    action: string;
    by: string;
    note?: string;
  }[];
  itinerary: {
    day: number;
    title: {
      vi: string;
      en: string;
    };
    activities: {
      vi: string[];
      en: string[];
    };
  }[];
  included: string[];
  excluded?: string[];
}

export interface TourFeedback {
  id: string;
  tourId: string;
  messages: {
    id: string;
    senderRole: 'admin' | 'provider';
    senderName: string;
    message: string;
    timestamp: string;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'provider' | 'admin';
  avatar?: string;
  phone?: string;
  joinDate?: string;
  totalBookings?: number;
  totalSpent?: number;
  active?: boolean;
  banned?: boolean;
}

export interface Booking {
  id: string;
  tourId: string;
  bookingId?: string;
  tourName: string;
  userId: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate?: string;
  adults: number;
  children: number;
  totalAmount: number;
  status: 'pending' | 'deposited' | 'paid' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  createdAt: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  paymentMethod?: 'card' | 'transfer' | 'cod' | 'bank_qr' | 'vnpay';
  paymentStatus?: 'pending' | 'deposited' | 'paid' | 'failed' | 'success' | 'refunded';
  depositAmount?: number;
  remainingAmount?: number;
  commissionRate?: number;
  commissionAmount?: number;
  providerPayoutAmount?: number;
  cancelledBy?: 'user' | 'provider' | 'admin' | string;
  cancelledAt?: string;
  cancelReason?: string;
  refundStatus?: 'none' | 'refund_pending' | 'refunded' | 'no_refund' | 'refund_rejected' | string;
  refundAmount?: number;
  refundBankName?: string;
  refundAccountNumber?: string;
  refundAccountName?: string;
  refundRequestedAt?: string;
  refundProcessedAt?: string;
  refundProcessedBy?: string;
  refundRejectReason?: string;
  payoutStatus?: 'none' | 'payout_pending' | 'paid_out' | string;
  payoutAmount?: number;
  payoutProcessedAt?: string;
  payoutProcessedBy?: string;
  specialRequests?: string;
  hasReviewed?: boolean;
  hasReported?: boolean;
}

export interface Provider {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  totalTours: number;
  approvalRate: number;
  averageRating: number;
  joinedDate: string;
  status?: 'pending' | 'approved' | 'rejected';
  verified?: boolean;
  userId?: string;
}

export interface TourReview {
  id: string;
  tourId: string;
  tourName: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  helpful: number;
  response?: {
    from: string;
    message: string;
    createdAt: string;
  };
  responseRequested?: boolean;
  responseRequestedAt?: string;
  responseRequestedBy?: string;
}

export interface TourReport {
  id: string;
  tourId: string;
  tourName: string;
  reportedBy: string;
  reporterName: string;
  reason: string;
  description: string;
  images?: string[];
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'replied' | 'resolved';
  createdAt: string;
  repliedBy?: string;
  repliedAt?: string;
  replyMessage?: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────
