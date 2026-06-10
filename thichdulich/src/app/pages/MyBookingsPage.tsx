"use client";

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useBookings } from '../contexts/BookingContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Calendar, Users, Mail, Phone, Star, AlertTriangle, CheckCircle2, QrCode, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ReviewModal, ReviewData } from '../components/ReviewModal';
import { ReportModal, ReportData } from '../components/ReportModal';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { BookingDetailModal } from '../components/BookingDetailModal';
import api, { getApiErrorMessage } from '@/services/api';
import { getBookingStatusLabel } from '../utils/labels';

const emptyCancelForm = {
  reason: '',
  refundBankName: '',
  refundAccountNumber: '',
  refundAccountName: '',
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxSide = 1200;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        readFileAsDataUrl(file).then(resolve).catch(reject);
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      readFileAsDataUrl(file).then(resolve).catch(reject);
    };

    image.src = objectUrl;
  });
}

function formatBookingDate(value?: string | null) {
  if (!value) return 'Chưa có lịch';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có lịch';
  return format(date, 'dd/MM/yyyy');
}

export function MyBookingsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { status } = useParams();
  const { user } = useAuth();
  const { getUserBookings, cancelBooking, markBookingReported, refreshBookings } = useBookings();
  
  // Get bookings for current user
  const myBookings = user ? getUserBookings(user.id) : [];
  
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; booking: any }>({ 
    isOpen: false, booking: null 
  });
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; tourName: string; bookingId: string }>({ 
    isOpen: false, tourName: '', bookingId: '' 
  });
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; tourName: string; bookingId: string }>({ 
    isOpen: false, tourName: '', bookingId: '' 
  });
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({ 
    isOpen: false, title: '', message: '' 
  });
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; booking: any; payment: any; loading: boolean }>({
    isOpen: false,
    booking: null,
    payment: null,
    loading: false,
  });
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; booking: any; submitting: boolean }>({
    isOpen: false,
    booking: null,
    submitting: false,
  });
  const [cancelForm, setCancelForm] = useState(emptyCancelForm);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'warning' });
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [reportedBookingIds, setReportedBookingIds] = useState<Set<string>>(new Set());
  const bookingTab = ['all', 'pending', 'confirmed', 'completed'].includes(status || '') ? status! : 'all';

  useEffect(() => {
    if (status && bookingTab === 'all' && status !== 'all') {
      navigate('/my-bookings', { replace: true });
    }
  }, [bookingTab, navigate, status]);

  const handleViewDetails = (booking: any) => {
    setDetailModal({ isOpen: true, booking });
  };

  const handleContinuePayment = async (booking: any) => {
    setPaymentModal({ isOpen: true, booking, payment: null, loading: true });
    try {
      const method = booking.paymentMethod === 'cod' ? 'cod' : 'bank_qr';
      const payment = await api.createPayment({ bookingId: booking.id, method });
      setPaymentModal({ isOpen: true, booking, payment, loading: false });
    } catch (error) {
      setPaymentModal({ isOpen: false, booking: null, payment: null, loading: false });
      setSuccessModal({
        isOpen: true,
        title: 'Không thể mở thanh toán',
        message: getApiErrorMessage(error, 'Không thể tạo lại mã thanh toán. Vui lòng thử lại.'),
      });
    }
  };

  const handleReviewSubmit = async (reviewData: ReviewData) => {
    const booking = myBookings.find(item => item.id === reviewModal.bookingId);
    if (!booking?.tourId) {
      setSuccessModal({
        isOpen: true,
        title: 'Không thể gửi đánh giá',
        message: 'Không tìm thấy tour của booking này. Vui lòng tải lại trang và thử lại.'
      });
      return;
    }

    try {
      const imageUrls = reviewData.images?.length
        ? await Promise.all(reviewData.images.map(compressImageToDataUrl))
        : [];
      await api.createReview({
        tourId: booking.tourId,
        bookingId: booking.id,
        rating: reviewData.rating,
        comment: reviewData.content,
        images: imageUrls,
      });
      setReviewedBookingIds(prev => new Set(prev).add(booking.id));
      setReviewModal({ isOpen: false, tourName: '', bookingId: '' });
      setSuccessModal({
        isOpen: true,
        title: 'Gửi đánh giá thành công!',
        message: `Cảm ơn bạn đã đánh giá ${reviewData.rating} sao. Đánh giá của bạn đã được ghi nhận và sẽ hiển thị trong phần nhận xét tour.`
      });
    } catch (error) {
      setSuccessModal({
        isOpen: true,
        title: 'Không thể gửi đánh giá',
        message: getApiErrorMessage(error, 'Đánh giá chưa được gửi. Vui lòng kiểm tra đơn đặt tour đã hoàn thành và thử lại.')
      });
    }
  };

  const handleReportSubmit = async (reportData: ReportData) => {
    const booking = myBookings.find(item => item.id === reportModal.bookingId);
    if (!booking?.tourId) return;
    try {
      const imageUrls = reportData.evidence?.length
        ? await Promise.all(
          reportData.evidence
            .filter(file => file.type.startsWith('image/'))
            .map(compressImageToDataUrl)
        )
        : [];
      await api.createReport({
        tourId: booking.tourId,
        bookingId: booking.id,
        reason: reportData.subject || reportData.category,
        description: reportData.description,
        images: imageUrls,
      });
      markBookingReported(booking.id);
      setReportedBookingIds(prev => new Set(prev).add(booking.id));
      setReportModal({ isOpen: false, tourName: '', bookingId: '' });
      setSuccessModal({
        isOpen: true,
        title: 'Đã gửi báo cáo!',
        message: 'Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ. Cảm ơn bạn đã thông báo!'
      });
    } catch (error) {
      setSuccessModal({
        isOpen: true,
        title: 'Không thể gửi báo cáo',
        message: getApiErrorMessage(error, 'Báo cáo chưa được gửi. Vui lòng thử lại sau.')
      });
    }
  };

  const getPaidOnlineAmount = (booking: any) => {
    const paymentStatus = String(booking.paymentStatus || '').toLowerCase();
    if (!['paid', 'success', 'deposited'].includes(paymentStatus)) return 0;
    return Number(booking.depositAmount || booking.totalAmount || 0);
  };

  const isFreeCancelWindow = (booking: any) => {
    if (!booking?.startDate) return false;
    return new Date(booking.startDate + 'T00:00:00').getTime() - Date.now() >= 24 * 60 * 60 * 1000;
  };

  const handleCancelBooking = (booking: any) => {
    setCancelForm(emptyCancelForm);
    setCancelModal({ isOpen: true, booking, submitting: false });
  };

  const submitCancelBooking = async () => {
    const booking = cancelModal.booking;
    if (!booking) return;

    const isRefundInfoUpdate = booking.status === 'cancelled' && booking.refundStatus === 'refund_pending';
    const refundAmount = isRefundInfoUpdate
      ? Number(booking.refundAmount || booking.depositAmount || booking.totalAmount || 0)
      : isFreeCancelWindow(booking) ? getPaidOnlineAmount(booking) : 0;
    if (refundAmount > 0 && (!cancelForm.refundBankName.trim() || !cancelForm.refundAccountNumber.trim() || !cancelForm.refundAccountName.trim())) {
      setSuccessModal({
        isOpen: true,
        title: 'Thiếu thông tin hoàn tiền',
        message: 'Vui lòng nhập đủ tên ngân hàng, số tài khoản và tên chủ tài khoản để admin hoàn tiền.',
      });
      return;
    }

    setCancelModal(prev => ({ ...prev, submitting: true }));
    try {
      await cancelBooking(booking.id, {
        cancelReason: cancelForm.reason,
        refundBankName: cancelForm.refundBankName,
        refundAccountNumber: cancelForm.refundAccountNumber,
        refundAccountName: cancelForm.refundAccountName,
      });
      setCancelModal({ isOpen: false, booking: null, submitting: false });
      setSuccessModal({
        isOpen: true,
        title: isRefundInfoUpdate ? 'Đã cập nhật thông tin hoàn tiền' : refundAmount > 0 ? 'Đã gửi yêu cầu hoàn tiền' : 'Đã hủy đặt tour',
        message: isRefundInfoUpdate
          ? 'Admin đã có thông tin ngân hàng để hoàn tiền cho bạn.'
          : refundAmount > 0
          ? `Admin sẽ hoàn ${formatPrice(refundAmount)} theo thông tin ngân hàng bạn đã nhập.`
          : 'Đơn đã hủy và không phát sinh hoàn tiền theo chính sách hủy trong vòng 24 giờ.',
      });
    } catch (error) {
      setCancelModal(prev => ({ ...prev, submitting: false }));
      setSuccessModal({
        isOpen: true,
        title: 'Không thể hủy đặt tour',
        message: getApiErrorMessage(error, 'Vui lòng kiểm tra thông tin và thử lại.'),
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'deposited':
        return 'bg-amber-100 text-amber-700';
      case 'paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // If no user logged in, show message
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Vui lòng đăng nhập để xem đặt chỗ của bạn</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">{t('myBookings')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <h2 className="font-semibold text-lg">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>

              <div className="space-y-3 pt-6 border-t">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-6">
                {t('editProfile')}
              </Button>
            </div>
          </div>

          {/* Bookings Content */}
          <div className="lg:col-span-3">
            <Tabs
              value={bookingTab}
              onValueChange={(value) => navigate(value === 'all' ? '/my-bookings' : `/my-bookings/${value}`)}
              className="w-full"
            >
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
                <TabsTrigger value="all">
                  {t('bookingHistory')}
                </TabsTrigger>
                <TabsTrigger value="pending">
                  {t('pending')}
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  {t('confirmed')}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  {t('completed')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="space-y-4">
                  {myBookings.map(booking => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking}
                      onReview={(tourName, bookingId) => setReviewModal({ isOpen: true, tourName, bookingId })}
                      onReport={(tourName, bookingId) => setReportModal({ isOpen: true, tourName, bookingId })}
                      onCancel={() => handleCancelBooking(booking)}
                      onViewDetails={handleViewDetails}
                      onContinuePayment={handleContinuePayment}
                      hasReviewed={Boolean(booking.hasReviewed || reviewedBookingIds.has(booking.id))}
                      hasReported={Boolean(booking.hasReported || reportedBookingIds.has(booking.id))}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <div className="space-y-4">
                  {myBookings
                    .filter(b => ['pending', 'deposited', 'paid'].includes(b.status))
                    .map(booking => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking}
                        onReview={(tourName, bookingId) => setReviewModal({ isOpen: true, tourName, bookingId })}
                        onReport={(tourName, bookingId) => setReportModal({ isOpen: true, tourName, bookingId })}
                        onCancel={() => handleCancelBooking(booking)}
                        onViewDetails={handleViewDetails}
                        onContinuePayment={handleContinuePayment}
                        hasReviewed={Boolean(booking.hasReviewed || reviewedBookingIds.has(booking.id))}
                        hasReported={Boolean(booking.hasReported || reportedBookingIds.has(booking.id))}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="confirmed" className="mt-6">
                <div className="space-y-4">
                  {myBookings
                    .filter(b => b.status === 'confirmed')
                    .map(booking => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking}
                        onReview={(tourName, bookingId) => setReviewModal({ isOpen: true, tourName, bookingId })}
                        onReport={(tourName, bookingId) => setReportModal({ isOpen: true, tourName, bookingId })}
                        onCancel={() => handleCancelBooking(booking)}
                        onViewDetails={handleViewDetails}
                        onContinuePayment={handleContinuePayment}
                        hasReviewed={Boolean(booking.hasReviewed || reviewedBookingIds.has(booking.id))}
                        hasReported={Boolean(booking.hasReported || reportedBookingIds.has(booking.id))}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <div className="space-y-4">
                  {myBookings
                    .filter(b => b.status === 'completed')
                    .map(booking => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking}
                        onReview={(tourName, bookingId) => setReviewModal({ isOpen: true, tourName, bookingId })}
                        onReport={(tourName, bookingId) => setReportModal({ isOpen: true, tourName, bookingId })}
                        onCancel={() => handleCancelBooking(booking)}
                        onViewDetails={handleViewDetails}
                        onContinuePayment={handleContinuePayment}
                        hasReviewed={Boolean(booking.hasReviewed || reviewedBookingIds.has(booking.id))}
                        hasReported={Boolean(booking.hasReported || reportedBookingIds.has(booking.id))}
                      />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, tourName: '', bookingId: '' })}
        onSubmit={handleReviewSubmit}
        tourName={reviewModal.tourName}
        bookingId={reviewModal.bookingId}
      />
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, tourName: '', bookingId: '' })}
        onSubmit={handleReportSubmit}
        tourName={reportModal.tourName}
        bookingId={reportModal.bookingId}
      />
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'warning' })}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        variant={confirmModal.variant}
      />
      <CancelBookingModal
        isOpen={cancelModal.isOpen}
        booking={cancelModal.booking}
        form={cancelForm}
        submitting={cancelModal.submitting}
        refundAmount={cancelModal.booking?.status === 'cancelled' && cancelModal.booking?.refundStatus === 'refund_pending'
          ? Number(cancelModal.booking.refundAmount || cancelModal.booking.depositAmount || cancelModal.booking.totalAmount || 0)
          : cancelModal.booking && isFreeCancelWindow(cancelModal.booking) ? getPaidOnlineAmount(cancelModal.booking) : 0}
        onChange={setCancelForm}
        onClose={() => setCancelModal({ isOpen: false, booking: null, submitting: false })}
        onSubmit={submitCancelBooking}
        formatPrice={formatPrice}
      />
      <BookingDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, booking: null })}
        booking={detailModal.booking}
      />
      <ResumePaymentModal
        isOpen={paymentModal.isOpen}
        booking={paymentModal.booking}
        payment={paymentModal.payment}
        loading={paymentModal.loading}
        onClose={() => setPaymentModal({ isOpen: false, booking: null, payment: null, loading: false })}
        onPaid={async () => {
          await refreshBookings();
          setPaymentModal({ isOpen: false, booking: null, payment: null, loading: false });
          setSuccessModal({
            isOpen: true,
            title: 'Thanh toán thành công!',
            message: 'Hệ thống đã ghi nhận thanh toán. Booking của bạn đã được cập nhật.',
          });
        }}
      />
    </div>
  );
}

function BookingCard({ booking, onReview, onReport, onCancel, onViewDetails, onContinuePayment, hasReviewed, hasReported }: { booking: any; onReview: (tourName: string, bookingId: string) => void; onReport: (tourName: string, bookingId: string) => void; onCancel: (bookingId: string, tourName: string) => void; onViewDetails: (booking: any) => void; onContinuePayment: (booking: any) => void; hasReviewed?: boolean; hasReported?: boolean }) {
  const { t } = useLanguage();
  const adults = Number(booking.adults || 0);
  const children = Number(booking.children || 0);
  const peopleText = [
    `${adults} ${t('adults').toLowerCase()}`,
    children > 0 ? `${children} ${t('children').toLowerCase()}` : '',
  ].filter(Boolean).join(', ');
  const canCancel = ['pending', 'deposited', 'paid', 'confirmed'].includes(booking.status);
  const needsRefundBankInfo = booking.status === 'cancelled'
    && booking.refundStatus === 'refund_pending'
    && (!booking.refundBankName || !booking.refundAccountNumber || !booking.refundAccountName);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const refundAmount = Number(booking.refundAmount || booking.depositAmount || booking.totalAmount || 0);
  const refundInfo = booking.refundStatus === 'refund_pending'
    ? {
      label: needsRefundBankInfo ? 'Chờ bạn nhập tài khoản hoàn tiền' : 'Đang chờ admin hoàn tiền',
      message: needsRefundBankInfo
        ? 'Nhà cung cấp đã hủy đơn. Vui lòng nhập thông tin ngân hàng để admin hoàn tiền.'
        : `Admin sẽ hoàn ${formatPrice(refundAmount)} theo thông tin ngân hàng bạn đã cung cấp.`,
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    }
    : booking.refundStatus === 'refunded' || booking.status === 'refunded'
      ? {
        label: 'Đã hoàn tiền',
        message: `Admin đã xác nhận hoàn ${formatPrice(refundAmount)} cho đơn này.`,
        className: 'border-purple-200 bg-purple-50 text-purple-800',
      }
      : booking.refundStatus === 'refund_rejected'
        ? {
          label: 'Từ chối hoàn tiền',
          message: booking.refundRejectReason || 'Admin đã từ chối yêu cầu hoàn tiền cho đơn này.',
          className: 'border-red-200 bg-red-50 text-red-800',
        }
        : booking.refundStatus === 'no_refund'
          ? {
            label: 'Hủy không hoàn tiền',
            message: booking.cancelReason || 'Đơn đã hủy nhưng không đủ điều kiện hoàn tiền.',
            className: 'border-gray-200 bg-gray-50 text-gray-700',
          }
          : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'deposited':
        return 'bg-amber-100 text-amber-700';
      case 'paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-w-0 overflow-hidden bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-lg mb-1 break-words">{booking.tourName}</h3>
          <p className="break-all text-sm text-gray-500">ID: {booking.id}</p>
        </div>
        <Badge className={`w-fit shrink-0 ${getStatusColor(booking.status)}`}>
          {getBookingStatusLabel(booking.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{t('departureDate')}</p>
            <p className="font-medium">{formatBookingDate(booking.startDate || booking.departureDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <div>
            <p className="text-xs text-gray-500">{t('numberOfPeople')}</p>
            <p className="font-medium">{peopleText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div>
            <p className="text-xs text-gray-500">{t('totalAmount')}</p>
            <p className="font-bold text-blue-600">{formatPrice(booking.totalAmount)}</p>
          </div>
        </div>
      </div>

      {refundInfo && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${refundInfo.className}`}>
          <p className="font-bold">{refundInfo.label}</p>
          <p className="mt-1 text-xs leading-relaxed">{refundInfo.message}</p>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap">
        <Button size="sm" variant="outline" className="w-full sm:w-auto sm:flex-1" onClick={() => onViewDetails(booking)}>
          {t('viewDetails')}
        </Button>
        {booking.status === 'pending' && (
          <Button size="sm" className="w-full sm:w-auto sm:flex-1 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => onContinuePayment(booking)}>
            Thanh toán tiếp
          </Button>
        )}
        {canCancel && (
          <Button size="sm" variant="outline" className="w-full sm:w-auto sm:flex-1 text-red-600 hover:text-red-700" onClick={() => onCancel(booking.id, booking.tourName)}>
            {t('cancel')}
          </Button>
        )}
        {needsRefundBankInfo && (
          <Button size="sm" className="w-full sm:w-auto sm:flex-1 bg-blue-600 text-white hover:bg-blue-700" onClick={() => onCancel(booking.id, booking.tourName)}>
            Nhập tài khoản hoàn tiền
          </Button>
        )}
        {booking.status === 'completed' && (!hasReviewed || !hasReported) && (
          <>
            {!hasReviewed && (
              <Button size="sm" variant="outline" className="flex-1 flex items-center justify-center gap-1.5" onClick={() => onReview(booking.tourName, booking.id)}>
                <Star className="w-3.5 h-3.5" />
                Đánh giá
              </Button>
            )}
            {!hasReported && (
              <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:text-red-700 flex items-center justify-center gap-1.5" onClick={() => onReport(booking.tourName, booking.id)}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Báo cáo
              </Button>
            )}
          </>
        )}
        {booking.status === 'completed' && hasReviewed && hasReported && (
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn tất phản hồi
          </div>
        )}
      </div>
    </div>
  );
}

function CancelBookingModal({
  isOpen,
  booking,
  form,
  submitting,
  refundAmount,
  onChange,
  onClose,
  onSubmit,
  formatPrice,
}: {
  isOpen: boolean;
  booking: any;
  form: typeof emptyCancelForm;
  submitting: boolean;
  refundAmount: number;
  onChange: (form: typeof emptyCancelForm) => void;
  onClose: () => void;
  onSubmit: () => void;
  formatPrice: (price: number) => string;
}) {
  if (!isOpen || !booking) return null;

  const isRefundInfoUpdate = booking.status === 'cancelled' && booking.refundStatus === 'refund_pending';
  const isRefundableCancel = refundAmount > 0;

  const update = (field: keyof typeof emptyCancelForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <h3 className="text-lg font-bold text-gray-900">{isRefundInfoUpdate ? 'Thông tin hoàn tiền' : 'Yêu cầu hủy tour'}</h3>
          <p className="mt-1 text-sm text-gray-500">{booking.tourName}</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className={isRefundableCancel ? 'rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800' : 'rounded-xl border border-red-200 bg-red-50 p-4 text-red-800'}>
            <p className="text-sm font-black">
              {isRefundInfoUpdate
                ? `Đơn đang chờ hoàn ${formatPrice(refundAmount)}`
                : isRefundableCancel
                  ? `Bạn đủ điều kiện hoàn 100%: ${formatPrice(refundAmount)}`
                  : 'Bạn không còn trong thời hạn hủy miễn phí'}
            </p>
            <p className="mt-2 text-xs leading-relaxed">
              {isRefundInfoUpdate
                ? 'Nhà cung cấp đã hủy đơn. Vui lòng nhập thông tin ngân hàng để admin hoàn tiền thủ công cho bạn.'
                : isRefundableCancel
                  ? 'Yêu cầu hủy được gửi trước giờ khởi hành tối thiểu 24 giờ. Sau khi xác nhận, đơn sẽ được hủy và admin sẽ hoàn lại toàn bộ số tiền bạn đã thanh toán/cọc.'
                  : 'Yêu cầu hủy được gửi dưới 24 giờ trước giờ khởi hành. Bạn vẫn có thể hủy tour, nhưng hệ thống sẽ ghi nhận hoàn tiền là 0đ theo chính sách hủy.'}
            </p>
            {!isRefundInfoUpdate && (
              <p className="mt-2 text-xs font-semibold">
                Sau khi xác nhận, thao tác hủy không thể tự khôi phục. Nếu cần đặt lại, bạn phải tạo booking mới.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">{isRefundInfoUpdate ? 'Ghi chú' : 'Lý do hủy'}</label>
            <textarea
              value={form.reason}
              onChange={event => update('reason', event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={isRefundInfoUpdate ? 'Ghi chú cho admin nếu cần...' : 'Ví dụ: thay đổi lịch cá nhân, không thể tham gia tour...'}
            />
          </div>

          {refundAmount > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tên ngân hàng</label>
                <input
                  value={form.refundBankName}
                  onChange={event => update('refundBankName', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="VD: Vietcombank"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Số tài khoản</label>
                <input
                  value={form.refundAccountNumber}
                  onChange={event => update('refundAccountNumber', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Nhập số tài khoản"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tên chủ tài khoản</label>
                <input
                  value={form.refundAccountName}
                  onChange={event => update('refundAccountName', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Nhập đúng tên chủ tài khoản"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Đóng</Button>
          <Button className="bg-red-600 text-white hover:bg-red-700" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Đang gửi...' : isRefundInfoUpdate ? 'Gửi thông tin hoàn tiền' : 'Xác nhận hủy'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResumePaymentModal({
  isOpen,
  booking,
  payment,
  loading,
  onClose,
  onPaid,
}: {
  isOpen: boolean;
  booking: any;
  payment: any;
  loading: boolean;
  onClose: () => void;
  onPaid: () => Promise<void>;
}) {
  const [latestPayment, setLatestPayment] = useState<any>(payment);

  useEffect(() => {
    setLatestPayment(payment);
  }, [payment]);

  useEffect(() => {
    if (!isOpen || !booking?.id || !payment) return;

    const checkPayment = async () => {
      try {
        const latest = await api.getPayment(booking.id);
        setLatestPayment(latest);
        if (['paid', 'success', 'deposited'].includes(String(latest?.status || '').toLowerCase())) {
          await onPaid();
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
      }
    };

    const timer = window.setInterval(checkPayment, 3000);
    return () => window.clearInterval(timer);
  }, [isOpen, booking?.id, payment, onPaid]);

  if (!isOpen) return null;

  const method = booking?.paymentMethod === 'cod' ? 'cod' : 'bank_qr';
  const title = method === 'cod' ? 'Thanh toán cọc COD 30%' : 'Thanh toán QR 100%';
  const description = method === 'cod'
    ? 'Quét mã để hoàn tất tiền cọc. Phần còn lại bạn thanh toán trực tiếp cho nhà cung cấp khi đi tour.'
    : 'Quét mã để thanh toán 100% giá trị booking.';
  const qrPayload = latestPayment?.qrCode || latestPayment?.paymentUrl;
  const qrSrc = qrPayload?.startsWith?.('data:')
    ? qrPayload
    : qrPayload
      ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayload)}`
      : '';
  const amount = Number(latestPayment?.amount || booking?.depositAmount || booking?.totalAmount || 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-emerald-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                <h2 className="text-lg font-bold">{title}</h2>
              </div>
              <p className="mt-1 text-sm text-emerald-50">{description}</p>
            </div>
            <button onClick={onClose} className="rounded-xl px-2 py-1 text-sm font-bold hover:bg-white/10">
              Đóng
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold">Đang tạo lại mã thanh toán...</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col items-center">
                {qrSrc ? (
                  <img src={qrSrc} alt="Mã QR thanh toán" className="h-64 w-64 rounded-xl bg-white object-contain p-3 shadow-sm" />
                ) : (
                  <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-white text-sm text-gray-500">
                    Chưa có mã QR
                  </div>
                )}

                <div className="mt-5 w-full space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-emerald-700">Số tiền cần thanh toán</span>
                    <span className="font-bold text-emerald-950">{new Intl.NumberFormat('vi-VN').format(amount)}đ</span>
                  </div>
                  {latestPayment?.transferContent && (
                    <div className="flex justify-between gap-3">
                      <span className="text-emerald-700">Nội dung</span>
                      <span className="font-mono font-bold text-emerald-950">{latestPayment.transferContent}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <span className="text-emerald-700">Trạng thái</span>
                    <span className="font-semibold text-amber-700">Đang chờ thanh toán</span>
                  </div>
                </div>
              </div>

              {latestPayment?.paymentUrl && (
                <a
                  href={latestPayment.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 block w-full rounded-xl border border-emerald-200 bg-white py-3 text-center text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                >
                  Không quét được? Mở trang thanh toán
                </a>
              )}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-gray-500">
            Sau khi thanh toán xong, hệ thống sẽ tự cập nhật trạng thái booking.
          </p>
        </div>
      </div>
    </div>
  );
}

