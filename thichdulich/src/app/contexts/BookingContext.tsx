"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import api, { getApiErrorMessage } from '@/services/api';
import type { Booking } from '../types/domainTypes';
import { useAuth } from './AuthContext';

interface BookingContextType {
  bookings: Booking[];
  loading: boolean;
  refreshBookings: () => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  cancelBooking: (bookingId: string, data?: Partial<Booking>) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  markBookingReported: (bookingId: string) => void;
  getUserBookings: (userId: string) => Booking[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

function toBooking(dto: any): Booking {
  const method = (dto.paymentMethod || '').toLowerCase();
  const status = (dto.paymentStatus || '').toLowerCase();
  return {
    id: dto.id,
    tourId: dto.tourId,
    tourName: dto.tourName || '',
    userId: dto.userId || '',
    userName: dto.userName || dto.contactName || '',
    userEmail: dto.userEmail || dto.contactEmail || '',
    startDate: dto.startDate || '',
    endDate: dto.endDate,
    adults: dto.adults || 1,
    children: dto.children || 0,
    totalAmount: dto.totalAmount || 0,
    status: (dto.status || 'pending').toLowerCase() as Booking['status'],
    createdAt: dto.createdAt || new Date().toISOString(),
    contactName: dto.contactName,
    contactEmail: dto.contactEmail,
    contactPhone: dto.contactPhone,
    paymentMethod: (method || 'cod') as Booking['paymentMethod'],
    paymentStatus: (status || 'pending') as Booking['paymentStatus'],
    depositAmount: dto.depositAmount || 0,
    remainingAmount: dto.remainingAmount || 0,
    commissionRate: dto.commissionRate || 10,
    commissionAmount: dto.commissionAmount || 0,
    providerPayoutAmount: dto.providerPayoutAmount || 0,
    cancelledBy: dto.cancelledBy,
    cancelledAt: dto.cancelledAt,
    cancelReason: dto.cancelReason,
    refundStatus: dto.refundStatus || 'none',
    refundAmount: dto.refundAmount || 0,
    refundBankName: dto.refundBankName,
    refundAccountNumber: dto.refundAccountNumber,
    refundAccountName: dto.refundAccountName,
    refundRequestedAt: dto.refundRequestedAt,
    refundProcessedAt: dto.refundProcessedAt,
    refundProcessedBy: dto.refundProcessedBy,
    refundRejectReason: dto.refundRejectReason,
    payoutStatus: dto.payoutStatus || 'none',
    payoutAmount: dto.payoutAmount || 0,
    payoutProcessedAt: dto.payoutProcessedAt,
    payoutProcessedBy: dto.payoutProcessedBy,
    specialRequests: dto.specialRequests,
    hasReviewed: Boolean(dto.hasReviewed),
    hasReported: Boolean(dto.hasReported),
  };
}

function toBookingPayload(booking: Partial<Booking>) {
  return {
    tourId: booking.tourId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    adults: booking.adults,
    children: booking.children,
    contactName: booking.contactName || booking.userName,
    contactEmail: booking.contactEmail || booking.userEmail,
    contactPhone: booking.contactPhone,
    paymentMethod: booking.paymentMethod,
    specialRequests: booking.specialRequests,
  };
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBookings = async () => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = user.role === 'provider' ? await api.getProviderBookings() : await api.getBookings();
      setBookings((data || []).map(toBooking));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải danh sách đơn đặt tour. Vui lòng thử lại.'));
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBookings();
  }, [user?.id, user?.role]);

  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>): Booking => {
    const optimistic: Booking = {
      ...bookingData,
      id: `pending_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setBookings(prev => [optimistic, ...prev]);
    api.createBooking(toBookingPayload(bookingData))
      .then(created => setBookings(prev => [toBooking(created), ...prev.filter(b => b.id !== optimistic.id)]))
      .catch(error => {
        toast.error(getApiErrorMessage(error, 'Không thể tạo đơn đặt tour. Vui lòng thử lại.'));
        setBookings(prev => prev.filter(b => b.id !== optimistic.id));
      });
    return optimistic;
  };

  const cancelBooking = async (bookingId: string, data?: Partial<Booking>) => {
    const previousBookings = bookings;
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    try {
      const updated = await api.cancelBooking(bookingId, data);
      setBookings(prev => prev.map(b => b.id === bookingId ? toBooking(updated) : b));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể hủy đặt tour. Vui lòng thử lại.'));
      setBookings(previousBookings);
      throw error;
    }
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    const previousBookings = bookings;
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    try {
      const updated = await api.updateBookingStatus(bookingId, status);
      setBookings(prev => prev.map(b => b.id === bookingId ? toBooking(updated) : b));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật trạng thái đơn. Vui lòng thử lại.'));
      setBookings(previousBookings);
      throw error;
    }
  };

  const markBookingReported = (bookingId: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, hasReported: true } : b));
  };

  const getUserBookings = (userId: string): Booking[] => {
    return bookings.filter(b => b.userId === userId || user?.id === userId);
  };

  const value = useMemo(() => ({
    bookings,
    loading,
    refreshBookings,
    addBooking,
    cancelBooking,
    updateBookingStatus,
    markBookingReported,
    getUserBookings,
  }), [bookings, loading, user?.id]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
}

