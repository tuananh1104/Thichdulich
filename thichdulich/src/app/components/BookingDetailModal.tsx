"use client";

import { X, Calendar, Users, MapPin, Phone, Mail, CreditCard, Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { getBookingStatusLabel, getPaymentMethodLabel, getPaymentStatusLabel } from '../utils/labels';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

const formatPrice = (price: number) => `${new Intl.NumberFormat('vi-VN').format(price || 0)}đ`;

const bookingStatuses: Record<string, { icon: any; label: string; color: string; bg: string; desc: string }> = {
  pending: {
    icon: Clock,
    label: 'Chờ thanh toán',
    color: '#F59E0B',
    bg: '#FEF3C7',
    desc: 'Đơn đã được tạo và đang chờ thanh toán. Booking chỉ được xác nhận sau khi hệ thống ghi nhận thanh toán.',
  },
  deposited: {
    icon: CheckCircle,
    label: 'Đã cọc',
    color: '#B45309',
    bg: '#FEF3C7',
    desc: 'Bạn đã thanh toán tiền cọc COD. Nhà cung cấp sẽ xác nhận và chuẩn bị tour.',
  },
  paid: {
    icon: CheckCircle,
    label: 'Đã thanh toán',
    color: '#10B981',
    bg: '#D1FAE5',
    desc: 'Bạn đã thanh toán đầy đủ. Nhà cung cấp sẽ xác nhận tour.',
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Đã xác nhận',
    color: '#10B981',
    bg: '#D1FAE5',
    desc: 'Nhà cung cấp đã xác nhận booking. Vui lòng theo dõi thông tin liên hệ và có mặt đúng giờ.',
  },
  completed: {
    icon: CheckCircle,
    label: 'Hoàn thành',
    color: '#3B82F6',
    bg: '#DBEAFE',
    desc: 'Chuyến đi đã hoàn thành. Bạn có thể đánh giá để chia sẻ trải nghiệm.',
  },
  cancelled: {
    icon: XCircle,
    label: 'Đã hủy',
    color: '#EF4444',
    bg: '#FEE2E2',
    desc: 'Booking đã bị hủy. Vui lòng kiểm tra trạng thái hoàn tiền nếu có.',
  },
  refunded: {
    icon: CheckCircle,
    label: 'Đã hoàn tiền',
    color: '#7C3AED',
    bg: '#F5F3FF',
    desc: 'Booking đã được xử lý hoàn tiền.',
  },
};

export function BookingDetailModal({ isOpen, onClose, booking }: BookingDetailModalProps) {
  if (!isOpen || !booking) return null;

  const statusConfig = bookingStatuses[booking.status] || {
    icon: Info,
    label: getBookingStatusLabel(booking.status),
    color: '#6B7280',
    bg: '#F3F4F6',
    desc: '',
  };
  const StatusIcon = statusConfig.icon;

  const paymentStatus = (booking.paymentStatus || 'pending').toLowerCase();
  const paid = paymentStatus === 'paid' || paymentStatus === 'success' || paymentStatus === 'deposited';
  const paymentStatusConfig = paid
    ? { label: getPaymentStatusLabel(paymentStatus), color: '#10B981', bg: '#D1FAE5', icon: CheckCircle }
    : paymentStatus === 'failed'
      ? { label: getPaymentStatusLabel(paymentStatus), color: '#EF4444', bg: '#FEE2E2', icon: XCircle }
      : { label: getPaymentStatusLabel(paymentStatus), color: '#F59E0B', bg: '#FEF3C7', icon: Clock };
  const PaymentStatusIcon = paymentStatusConfig.icon;

  const adults = Number(booking.adults || 0);
  const children = Number(booking.children || 0);
  const childAmount = children * 500000;
  const adultAmount = Math.max(Number(booking.totalAmount || 0) - childAmount, 0);
  const startDate = booking.startDate || booking.departureDate || booking.createdAt || Date.now();
  const refundAmount = Number(booking.refundAmount || booking.depositAmount || booking.totalAmount || 0);

  const refundInfo = booking.refundStatus === 'refund_pending'
    ? {
      title: 'Đang chờ hoàn tiền',
      message: booking.refundBankName
        ? `Admin sẽ hoàn ${formatPrice(refundAmount)} theo thông tin ngân hàng đã cung cấp.`
        : 'Đơn đang chờ hoàn tiền nhưng chưa có thông tin ngân hàng nhận tiền.',
      bg: '#FFFBEB',
      border: '#FDE68A',
      color: '#B45309',
    }
    : booking.refundStatus === 'refunded' || booking.status === 'refunded'
      ? {
        title: 'Đã hoàn tiền',
        message: `Admin đã xác nhận hoàn ${formatPrice(refundAmount)} cho đơn này.`,
        bg: '#F5F3FF',
        border: '#DDD6FE',
        color: '#7C3AED',
      }
      : booking.refundStatus === 'refund_rejected'
        ? {
          title: 'Từ chối hoàn tiền',
          message: booking.refundRejectReason || 'Admin đã từ chối yêu cầu hoàn tiền cho đơn này.',
          bg: '#FEF2F2',
          border: '#FECACA',
          color: '#DC2626',
        }
        : booking.refundStatus === 'no_refund'
          ? {
            title: 'Hủy không hoàn tiền',
            message: booking.cancelReason || 'Đơn đã hủy nhưng không đủ điều kiện hoàn tiền.',
            bg: '#F9FAFB',
            border: '#E5E7EB',
            color: '#4B5563',
          }
          : null;

  const timelineItems: Array<{ label: string; date: string | number; color: string }> = [
    booking.status === 'pending'
      ? { label: 'Đã tạo yêu cầu thanh toán', date: booking.createdAt || Date.now(), color: '#F59E0B' }
      : { label: 'Đã tạo đơn đặt tour', date: booking.createdAt || Date.now(), color: '#10B981' },
  ];

  if (booking.status === 'deposited') {
    timelineItems.push({ label: 'Đã cọc COD', date: booking.updatedAt || booking.createdAt || Date.now(), color: '#B45309' });
  }
  if (booking.status === 'paid') {
    timelineItems.push({ label: 'Đã thanh toán', date: booking.updatedAt || booking.createdAt || Date.now(), color: '#10B981' });
  }
  if (['confirmed', 'completed'].includes(booking.status)) {
    timelineItems.push({ label: 'Nhà cung cấp đã xác nhận', date: booking.confirmedAt || booking.updatedAt || booking.createdAt || Date.now(), color: '#10B981' });
  }
  if (booking.status === 'completed') {
    timelineItems.push({ label: 'Tour đã hoàn thành', date: booking.completedAt || booking.endDate || Date.now(), color: '#3B82F6' });
  }
  if (booking.status === 'cancelled') {
    timelineItems.push({ label: 'Đơn đã hủy', date: booking.cancelledAt || booking.updatedAt || booking.createdAt || Date.now(), color: '#EF4444' });
  }

  if (booking.status === 'refunded' || booking.refundStatus === 'refunded') {
    timelineItems.push({ label: 'Đã hoàn tiền', date: booking.refundProcessedAt || booking.cancelledAt || booking.updatedAt || Date.now(), color: '#7C3AED' });
  } else if (booking.refundStatus === 'refund_pending') {
    timelineItems.push({ label: 'Đang chờ admin hoàn tiền', date: booking.cancelledAt || booking.updatedAt || Date.now(), color: '#B45309' });
  } else if (booking.refundStatus === 'refund_rejected') {
    timelineItems.push({ label: 'Admin từ chối hoàn tiền', date: booking.refundProcessedAt || booking.updatedAt || Date.now(), color: '#DC2626' });
  } else if (booking.refundStatus === 'no_refund') {
    timelineItems.push({ label: 'Hủy không hoàn tiền', date: booking.cancelledAt || booking.updatedAt || Date.now(), color: '#6B7280' });
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #0A2540, #1E3A5F)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-bold text-white mb-1 text-xl">Chi tiết đặt tour</h2>
              <p className="text-sm text-white/70">
                Mã booking: <span className="font-mono text-white/90">{booking.id}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors" aria-label="Đóng">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border-2" style={{ background: statusConfig.bg, borderColor: `${statusConfig.color}40` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${statusConfig.color}20` }}>
                  <StatusIcon className="w-6 h-6" style={{ color: statusConfig.color }} />
                </div>
                <div>
                  <div className="font-bold mb-1 text-lg" style={{ color: statusConfig.color }}>{statusConfig.label}</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{statusConfig.desc}</p>
                </div>
              </div>
            </div>

            {refundInfo && (
              <section>
                <div className="rounded-2xl border p-5" style={{ background: refundInfo.bg, borderColor: refundInfo.border }}>
                  <h3 className="text-base font-black" style={{ color: refundInfo.color }}>{refundInfo.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">{refundInfo.message}</p>
                  {booking.refundRejectReason && booking.refundStatus === 'refund_rejected' && (
                    <p className="mt-2 text-xs font-semibold text-red-600">Lý do: {booking.refundRejectReason}</p>
                  )}
                  {booking.refundProcessedAt && (
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      Xử lý lúc {new Date(booking.refundProcessedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              </section>
            )}

            <section>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Thông tin tour</h3>
              <div className="p-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
                <div className="text-xl font-bold text-gray-900 mb-2">{booking.tourName}</div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{booking.location || 'Điểm đến đa dạng'}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Thông tin hành trình</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoTile icon={Calendar} label="Ngày khởi hành" value={format(new Date(startDate), 'dd/MM/yyyy')} color="#0064D2" bg="#EFF6FF" />
                <InfoTile icon={Users} label="Số người" value={`${adults} người lớn, ${children} trẻ em`} color="#F59E0B" bg="#FEF3C7" />
              </div>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Thông tin liên hệ</h3>
              <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white" style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}>
                    {booking.contactName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{booking.contactName || 'Người dùng'}</div>
                    <div className="text-xs text-gray-500">Người đại diện</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <ContactLine icon={Mail} value={booking.contactEmail || 'email@example.com'} />
                  <ContactLine icon={Phone} value={booking.contactPhone || '0123456789'} />
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Thông tin thanh toán</h3>
              <div className="p-5 rounded-2xl border-2 border-blue-100" style={{ background: 'linear-gradient(135deg, #EFF6FF, #FFFFFF)' }}>
                <div className="space-y-3">
                  <PriceLine label={`Giá tour (${adults} người lớn)`} value={adultAmount} />
                  {children > 0 && <PriceLine label={`Trẻ em (${children} bé)`} value={childAmount} />}
                  <div className="pt-3 border-t-2 border-dashed border-blue-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" style={{ color: '#0064D2' }} />
                      <span className="font-bold text-gray-900 text-lg">Tổng cộng</span>
                    </div>
                    <span className="font-bold text-2xl" style={{ color: '#0064D2' }}>{formatPrice(booking.totalAmount)}</span>
                  </div>
                  {(booking.depositAmount || booking.remainingAmount || booking.commissionAmount || booking.providerPayoutAmount) && (
                    <div className="pt-3 border-t border-blue-100 space-y-2 text-sm">
                      <PriceLine label="Đã thu online" value={Number(booking.depositAmount || 0)} />
                      <PriceLine label="Khách trả trực tiếp cho nhà cung cấp" value={Number(booking.remainingAmount || 0)} />
                      <PriceLine label={`Hoa hồng admin (${booking.commissionRate || 10}%)`} value={Number(booking.commissionAmount || 0)} />
                      <PriceLine label="Nhà cung cấp nhận sau hoa hồng" value={Number(booking.providerPayoutAmount || 0)} />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-blue-100 space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-600">Phương thức thanh toán</span>
                    <span className="font-semibold text-gray-900">{getPaymentMethodLabel(booking.paymentMethod)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-600">Trạng thái thanh toán</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold" style={{ background: paymentStatusConfig.bg, color: paymentStatusConfig.color }}>
                      <PaymentStatusIcon className="w-3 h-3" />
                      {paymentStatusConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {booking.specialRequests && (
              <section>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Yêu cầu đặc biệt</h3>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-sm text-gray-700 leading-relaxed">{booking.specialRequests}</p>
                </div>
              </section>
            )}

            <section>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Lịch sử xử lý</h3>
              <div className="relative space-y-4 pl-6">
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-200" />
                {timelineItems.map((item, index) => (
                  <TimelineItem key={`${item.label}-${index}`} label={item.label} date={item.date} color={item.color} />
                ))}
              </div>
            </section>

            <div className="p-5 rounded-2xl border border-blue-200" style={{ background: '#EFF6FF' }}>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0064D2' }} />
                <div>
                  <div className="font-bold text-gray-900 mb-1">Cần hỗ trợ?</div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Liên hệ hotline 24/7: <strong className="text-blue-600">1900-xxxx</strong> hoặc email: <strong className="text-blue-600">support@thichdulich.vn</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <div className="text-xs text-gray-500 font-medium">{label}</div>
          <div className="font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ContactLine({ icon: Icon, value }: { icon: any; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

function PriceLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{formatPrice(value)}</span>
    </div>
  );
}

function TimelineItem({ label, date, color }: { label: string; date: string | number; color: string }) {
  return (
    <div className="relative">
      <div className="absolute -left-7 w-4 h-4 rounded-full" style={{ background: color }} />
      <div className="text-sm">
        <div className="font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{format(new Date(date), 'dd/MM/yyyy HH:mm')}</div>
      </div>
    </div>
  );
}
