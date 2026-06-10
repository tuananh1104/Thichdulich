"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useBookings } from '../contexts/BookingContext';
import { useTourManagement } from '../contexts/TourManagementContext';
import api, { getApiErrorMessage } from '@/services/api';
import {
  User, Mail, Phone, Calendar, Users,
  CheckCircle, MapPin, Clock, CreditCard,
  FileText, ArrowLeft, Shield, ChevronRight,
  Banknote, QrCode, Wallet,
  Star, Check, Lock, PartyPopper, Download,
  AlertCircle, Minus, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { isVietnamesePhone, normalizePhone, PHONE_RULE_MESSAGE } from '../utils/validation';

function formatVND(price: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(price)) + ' ₫';
}

type PaymentMethod = 'vnpay' | 'bank' | 'card' | 'cod';

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  badge?: string;
}[] = [
  { id: 'vnpay', label: 'VNPAY', desc: 'Thanh toán qua ví điện tử VNPAY', icon: Wallet, color: '#0064D2', bg: '#EFF6FF', badge: 'Phổ biến' },
  { id: 'bank', label: 'Chuyển khoản QR', desc: 'Tạo mã QR thanh toán tự động', icon: QrCode, color: '#059669', bg: '#ECFDF5' },
  { id: 'card', label: 'Thẻ tín dụng / Debit', desc: 'Visa, Mastercard, JCB', icon: CreditCard, color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'cod', label: 'Thanh toán sau (COD)', desc: 'Yêu cầu cọc trước 30%, phần còn lại trả khi đi tour', icon: Banknote, color: '#D97706', bg: '#FEF3C7' },
];

const STEPS = ['Thông tin', 'Thanh toán', 'Xác nhận'];

function toDateInputValue(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, '0');
  const day = String(normalized.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { refreshBookings } = useBookings();
  const { tours: allTours } = useTourManagement();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [bookingCode] = useState('TDL' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Pre-fill from TourDetailPage state if passed
  const locationState = location.state as { date?: Date; adults?: number; children?: number; total?: number } | null;

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    adults: locationState?.adults ?? 2,
    children: locationState?.children ?? 0,
    departureDate: locationState?.date
      ? toDateInputValue(new Date(locationState.date))
      : '',
    specialRequests: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
  });

  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const tour = allTours.find(t => t.id === id);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt tour');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (step !== 3 || !['bank', 'cod'].includes(paymentMethod) || !createdBookingId) return;

    const checkPayment = async () => {
      try {
        const latest = await api.getPayment(createdBookingId);
        setPaymentResult(latest);
        if (['paid', 'success', 'deposited'].includes(String(latest?.status || '').toLowerCase())) {
          await refreshBookings();
          setStep(4);
        }
      } catch (error) {
        console.error('Failed to check QR payment status:', error);
      }
    };

    checkPayment();
    const timer = window.setInterval(checkPayment, 3000);
    return () => window.clearInterval(timer);
  }, [step, paymentMethod, createdBookingId, refreshBookings]);

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy tour</h2>
          <button
            onClick={() => navigate('/destinations')}
            className="px-6 py-3 rounded-xl text-white font-semibold"
            style={{ background: '#0064D2' }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const tourName = language === 'vi' ? tour.name.vi : tour.name.en;
  const adultPrice = tour.price;
  const childPrice = tour.price * 0.7;
  const subtotal = formData.adults * adultPrice + formData.children * childPrice;
  const serviceFee = Math.round(subtotal * 0.05);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee + tax;
  const codDeposit = Math.round(total * 0.3);
  const amountDueNow = paymentMethod === 'cod' ? codDeposit : total;
  const remainingCodAmount = Math.max(total - codDeposit, 0);
  const advanceBookingDays = tour.advanceBookingDays || 1;
  const earliestDeparture = new Date();
  earliestDeparture.setDate(earliestDeparture.getDate() + advanceBookingDays);
  const minDepartureDate = toDateInputValue(earliestDeparture);

  // ── Step 1 validation ──────────────────────
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên người liên hệ.';
    if (!formData.email.trim()) errors.email = 'Vui lòng nhập email để nhận xác nhận đặt tour.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = 'Email chưa đúng định dạng. Ví dụ: ten@email.com.';
    if (!formData.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại để nhà cung cấp liên hệ khi cần.';
    else if (!isVietnamesePhone(formData.phone)) errors.phone = PHONE_RULE_MESSAGE;
    if (!formData.departureDate) errors.departureDate = 'Vui lòng chọn ngày khởi hành phù hợp với lịch của bạn.';
    if (formData.departureDate && formData.departureDate < minDepartureDate) {
      errors.departureDate = `Tour này cần đặt trước tối thiểu ${advanceBookingDays} ngày. Ngày sớm nhất là ${new Date(minDepartureDate + 'T00:00:00').toLocaleDateString('vi-VN')}.`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Step 2 validation ──────────────────────
  const validateStep2 = () => {
    if (paymentMethod === 'card') {
      const errs: Record<string, string> = {};
      if (!formData.cardNumber.replace(/\s/g, '') || formData.cardNumber.replace(/\s/g, '').length < 16)
        errs.cardNumber = 'Vui lòng kiểm tra lại số thẻ thanh toán.';
      if (!formData.cardName.trim()) errs.cardName = 'Vui lòng nhập tên chủ thẻ như in trên thẻ.';
      if (!formData.cardExpiry || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) errs.cardExpiry = 'Vui lòng nhập hạn thẻ theo định dạng MM/YY.';
      if (!formData.cardCvv || formData.cardCvv.length < 3) errs.cardCvv = 'Mã bảo mật CVV chưa hợp lệ.';
      setCardErrors(errs);
      if (Object.keys(errs).length > 0) return false;
    }
    if (!agreedToTerms) { toast.error('Vui lòng xác nhận điều khoản đặt tour trước khi thanh toán.'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) handleSubmit();
  };

  const handleSubmit = async () => {
    if (!tour || !user) return;
    setLoading(true);

    // Calculate end date based on tour duration
    const startDateObj = new Date(formData.departureDate + 'T00:00:00');
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + (tour.duration - 1));
    const endDate = toDateInputValue(endDateObj);
    const apiPaymentMethod: 'cod' | 'bank_qr' = paymentMethod === 'bank' ? 'bank_qr' : 'cod';

    try {
      const created = await api.createBooking({
        tourId: tour.id,
        tourName: tour.name.vi,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      startDate: formData.departureDate,
      endDate,
      adults: formData.adults,
      children: formData.children,
      totalAmount: total,
      status: 'pending',
      contactName: formData.fullName,
      contactEmail: formData.email,
      contactPhone: normalizePhone(formData.phone),
      paymentMethod: apiPaymentMethod,
      specialRequests: formData.specialRequests || undefined,
      });
      const payment = await api.createPayment({
        bookingId: created.id,
        method: apiPaymentMethod,
      });
      setCreatedBookingId(created.id);
      setPaymentResult(payment);
      setLoading(false);
      setStep(['bank', 'cod'].includes(paymentMethod) ? 3 : 4);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể tạo đơn đặt tour. Vui lòng kiểm tra thông tin và thử lại.');
      if (message.toLowerCase().includes('chỗ')) {
        toast.error('Ngày khởi hành không còn đủ chỗ', {
          description: message,
        });
      } else {
        toast.error(message);
      }
      setLoading(false);
    }
  };

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all';
  const inputErrorCls = 'border-red-500 bg-red-50 focus:ring-red-200';
  const inputStyle = { '--tw-ring-color': '#0064D2' } as React.CSSProperties;
  const clearFormError = (field: string) => {
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };
  const qrImageSrc = (qrPayload?: string) => {
    if (!qrPayload) return '';
    if (qrPayload.startsWith('data:')) return qrPayload;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayload)}`;
  };

  // ── STEP INDICATOR ────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: done ? '#059669' : active ? '#0064D2' : '#E5E7EB',
                  color: done || active ? 'white' : '#9CA3AF',
                }}
              >
                {done ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className="text-xs mt-1 font-medium" style={{ color: active ? '#0064D2' : done ? '#059669' : '#9CA3AF' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-20 h-0.5 mx-1 mb-5 transition-all" style={{ background: step > num ? '#059669' : '#E5E7EB' }} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── PRICE SUMMARY SIDEBAR ─────────────────────────────────────────
  const PriceSidebar = () => (
    <div className="space-y-4">
      {/* Tour card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <img src={tour.image} alt={tourName} className="w-full h-36 object-cover" />
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug">{tourName}</h3>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0064D2' }} />
              <span className="truncate">{tour.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0064D2' }} />
              <span>{tour.duration} ngày</span>
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
              <span>{tour.rating}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0064D2' }} />
              <span>{formData.adults} NL{formData.children > 0 ? ` + ${formData.children} TE` : ''}</span>
            </div>
            {formData.departureDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0064D2' }} />
                <span>{new Date(formData.departureDate + 'T00:00:00').toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">Chi tiết giá</h4>
        <div className="space-y-3">
          {/* Adults */}
          <div className="flex justify-between items-end gap-2">
            <div>
              <p className="text-xs text-gray-600">{formData.adults} người lớn</p>
              <p className="text-xs text-gray-400">× {formatVND(adultPrice)}/người</p>
            </div>
            <span className="text-xs font-semibold text-gray-800 flex-shrink-0">{formatVND(formData.adults * adultPrice)}</span>
          </div>
          {/* Children */}
          {formData.children > 0 && (
            <div className="flex justify-between items-end gap-2">
              <div>
                <p className="text-xs text-gray-600">{formData.children} trẻ em</p>
                <p className="text-xs text-gray-400">× {formatVND(childPrice)}/trẻ</p>
              </div>
              <span className="text-xs font-semibold text-gray-800 flex-shrink-0">{formatVND(formData.children * childPrice)}</span>
            </div>
          )}
          {/* Fees */}
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Phí dịch vụ (5%)</span>
              <span className="text-xs text-gray-600">{formatVND(serviceFee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Thuế VAT (10%)</span>
              <span className="text-xs text-gray-600">{formatVND(tax)}</span>
            </div>
          </div>
          {/* Total */}
          <div className="pt-2 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-900">Tổng cộng</span>
            <span className="font-bold text-base flex-shrink-0" style={{ color: '#0064D2' }}>{formatVND(total)}</span>
          </div>
          {paymentMethod === 'cod' && (
            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Cọc trước COD (30%)</span>
                <span className="text-xs font-bold text-amber-700">{formatVND(codDeposit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Thanh toán trực tiếp cho nhà cung cấp</span>
                <span className="text-xs text-gray-600">{formatVND(remainingCodAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
        <Lock className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} />
        <div>
          <p className="text-xs font-bold" style={{ color: '#065F46' }}>Thanh toán bảo mật SSL</p>
          <p className="text-xs" style={{ color: '#059669' }}>Mã hóa 256-bit</p>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#F0F4FA' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0064D2' }}>
              <span className="text-white font-black text-xs">T</span>
            </div>
            <span className="font-bold text-gray-900">Thích Du Lịch</span>
          </div>
          <span className="text-gray-300 mx-1">·</span>
          <span className="text-sm text-gray-500">Đặt tour</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── STEP 3: SUCCESS ─────────────────────────────── */}
        {step === 3 && ['bank', 'cod'].includes(paymentMethod) && paymentResult && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="py-8 px-8 text-center" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-white font-bold mb-1" style={{ fontSize: '1.5rem' }}>
                  {paymentMethod === 'cod' ? 'Cọc COD trước 30%' : 'Thanh toán QR 100%'}
                </h2>
                <p className="text-emerald-100 text-sm">
                  {paymentMethod === 'cod'
                    ? 'Quét mã để cọc 30%, phần còn lại thanh toán khi đi tour'
                    : 'Quét mã để thanh toán 100%, hệ thống sẽ tự kiểm tra trạng thái'}
                </p>
              </div>

              <div className="p-8">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex flex-col items-center">
                    {paymentResult.qrCode || paymentResult.paymentUrl ? (
                      <img
                        src={qrImageSrc(paymentResult.qrCode || paymentResult.paymentUrl)}
                        alt="QR thanh toán"
                        className="h-64 w-64 rounded-xl bg-white object-contain p-3 shadow-sm"
                      />
                    ) : (
                      <div className="h-64 w-64 rounded-xl bg-white flex items-center justify-center text-sm text-gray-500">
                        Đang tạo QR...
                      </div>
                    )}
                    <div className="mt-5 w-full space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-emerald-700">Số tiền</span>
                        <span className="font-bold text-emerald-950">{formatVND(paymentResult.amount || amountDueNow)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-emerald-700">Nội dung</span>
                        <span className="font-mono font-bold text-emerald-950">{paymentResult.transferContent}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-emerald-700">Trạng thái</span>
                        <span className="font-semibold text-amber-700">Đang chờ thanh toán</span>
                      </div>
                    </div>
                  </div>
                  {paymentResult.paymentUrl && (
                    <a href={paymentResult.paymentUrl} target="_blank" rel="noreferrer" className="mt-5 block w-full rounded-xl border border-emerald-200 bg-white py-3 text-center text-sm font-bold text-emerald-700 hover:bg-emerald-50">
                      Không quét được? Mở trang thanh toán
                    </a>
                  )}
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    Sau khi bạn chuyển khoản xong, trang này sẽ tự cập nhật và chuyển sang màn hình đặt tour thành công.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="max-w-xl mx-auto">
            {/* Confetti card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="py-10 px-8 text-center" style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}>
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <PartyPopper className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-white font-bold mb-1" style={{ fontSize: '1.5rem' }}>Đặt tour thành công!</h2>
                <p className="text-blue-100 text-sm">Cảm ơn bạn đã tin tưởng Thích Du Lịch</p>
              </div>

              <div className="p-8">
                {/* Booking code */}
                <div className="text-center mb-6">
                  <p className="text-xs text-gray-500 mb-1">Mã đặt tour của bạn</p>
                  <div className="inline-block px-6 py-3 rounded-2xl" style={{ background: '#EFF6FF', border: '2px dashed #BFDBFE' }}>
                    <span className="font-black tracking-widest" style={{ color: '#0064D2', fontSize: '1.5rem' }}>{createdBookingId || bookingCode}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Lưu mã này để kiểm tra trạng thái đặt tour</p>
                </div>

                {paymentResult && paymentMethod === 'cod' && (
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="font-bold text-amber-900 mb-2">COD đã cọc trước 30%</h3>
                    <p className="text-sm text-amber-800">
                      Bạn đã cọc {formatVND(paymentResult.amount || codDeposit)}. Phần còn lại {formatVND(remainingCodAmount)} thanh toán trực tiếp cho nhà cung cấp khi đi tour.
                    </p>
                  </div>
                )}

                {/* Tour summary */}
                <div className="space-y-3 p-4 rounded-2xl mb-6" style={{ background: '#F9FAFB' }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tour</span>
                    <span className="font-semibold text-gray-800 text-right max-w-[180px]">{tourName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ngày khởi hành</span>
                    <span className="font-semibold text-gray-800">
                      {formData.departureDate ? new Date(formData.departureDate + 'T00:00:00').toLocaleDateString('vi-VN') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Số người</span>
                    <span className="font-semibold text-gray-800">
                      {formData.adults} người lớn{formData.children > 0 ? ` + ${formData.children} trẻ em` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Thanh toán</span>
                    <span className="font-semibold text-gray-800">
                      {paymentMethods.find(p => p.id === paymentMethod)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-900">Tổng tiền</span>
                    <span className="font-bold" style={{ color: '#0064D2' }}>{formatVND(total)}</span>
                  </div>
                </div>

                {/* Info boxes */}
                <div className="space-y-2 mb-6">
                  {[
                    { icon: Mail, text: `Email xác nhận đã gửi về ${formData.email}` },
                    { icon: Phone, text: 'Nhân viên sẽ liên hệ bạn trong 2 giờ làm việc' },
                    { icon: Shield, text: 'Hủy miễn phí trong vòng 24 giờ' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#0064D2' }} />
                        <p className="text-xs text-gray-600">{item.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/my-bookings')}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
                  >
                    Xem đặt tour của tôi
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Trang chủ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1 & 2 ──────────────────────────────────── */}
        {step < 3 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-5">
              <StepIndicator />

              {/* ══ STEP 1: INFO ══ */}
              {step === 1 && (
                <>
                  {/* Contact info */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                        <User className="w-4 h-4" style={{ color: '#0064D2' }} />
                      </div>
                      Thông tin liên hệ
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Họ và tên *</label>
                        <input
                          type="text"
                          className={`${inputCls} ${formErrors.fullName ? inputErrorCls : ''}`}
                          style={inputStyle}
                          value={formData.fullName}
                          onChange={e => {
                            setFormData({ ...formData, fullName: e.target.value });
                            clearFormError('fullName');
                          }}
                          placeholder="Nguyễn Văn A"
                          required
                        />
                        {formErrors.fullName && <p className="mt-1.5 text-xs font-semibold text-red-600">{formErrors.fullName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            className={`${inputCls} pl-10 ${formErrors.email ? inputErrorCls : ''}`}
                            style={inputStyle}
                            value={formData.email}
                            onChange={e => {
                              setFormData({ ...formData, email: e.target.value });
                              clearFormError('email');
                            }}
                            placeholder="email@example.com"
                          />
                        </div>
                        {formErrors.email && <p className="mt-1.5 text-xs font-semibold text-red-600">{formErrors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            className={`${inputCls} pl-10 ${formErrors.phone ? inputErrorCls : ''}`}
                            style={inputStyle}
                            value={formData.phone}
                            onChange={e => {
                              setFormData({ ...formData, phone: e.target.value });
                              clearFormError('phone');
                            }}
                            placeholder="0901 234 567"
                          />
                        </div>
                        {formErrors.phone && <p className="mt-1.5 text-xs font-semibold text-red-600">{formErrors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Tour detail */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                        <Calendar className="w-4 h-4" style={{ color: '#0064D2' }} />
                      </div>
                      Chi tiết chuyến đi
                    </h2>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ngày khởi hành *</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            className={`${inputCls} pl-10 ${formErrors.departureDate ? inputErrorCls : ''}`}
                            style={inputStyle}
                            value={formData.departureDate}
                            onChange={e => {
                              setFormData({ ...formData, departureDate: e.target.value });
                              clearFormError('departureDate');
                            }}
                            min={minDepartureDate}
                          />
                        </div>
                        <p className="mt-1.5 text-xs font-semibold text-gray-500">
                          Tour này cần đặt trước tối thiểu {advanceBookingDays} ngày. Ngày sớm nhất: {new Date(minDepartureDate + 'T00:00:00').toLocaleDateString('vi-VN')}.
                        </p>
                        {formErrors.departureDate && <p className="mt-1.5 text-xs font-semibold text-red-600">{formErrors.departureDate}</p>}
                      </div>

                      {/* Adults */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Người lớn <span className="font-normal text-gray-400">(≥12 tuổi)</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, adults: Math.max(1, formData.adults - 1) })}
                            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <div className="flex-1 text-center">
                            <span className="font-bold text-lg text-gray-900">{formData.adults}</span>
                            <p className="text-xs text-gray-400">{formatVND(adultPrice)}/người</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, adults: Math.min(20, formData.adults + 1) })}
                            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Children */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Trẻ em <span className="font-normal text-gray-400">(2–11 tuổi, 70%)</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, children: Math.max(0, formData.children - 1) })}
                            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <div className="flex-1 text-center">
                            <span className="font-bold text-lg text-gray-900">{formData.children}</span>
                            <p className="text-xs text-gray-400">{formatVND(childPrice)}/trẻ em</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, children: Math.min(10, formData.children + 1) })}
                            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special requests */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                        <FileText className="w-4 h-4" style={{ color: '#0064D2' }} />
                      </div>
                      Yêu cầu đặc biệt
                      <span className="text-xs font-normal text-gray-400 ml-1">(không bắt buộc)</span>
                    </h2>
                    <textarea
                      rows={3}
                      className={inputCls}
                      style={inputStyle}
                      value={formData.specialRequests}
                      onChange={e => setFormData({ ...formData, specialRequests: e.target.value })}
                      placeholder="VD: Phòng tầng cao, ăn chay, phòng cho trẻ em, hỗ trợ xe lăn..."
                    />
                  </div>
                </>
              )}

              {/* ══ STEP 2: PAYMENT ══ */}
              {step === 2 && (
                <>
                  {/* Payment methods */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                        <CreditCard className="w-4 h-4" style={{ color: '#0064D2' }} />
                      </div>
                      Phương thức thanh toán
                    </h2>

                    <div className="space-y-3">
                      {paymentMethods.filter(pm => ['bank', 'cod'].includes(pm.id)).map(pm => {
                        const Icon = pm.icon;
                        const selected = paymentMethod === pm.id;
                        return (
                          <label
                            key={pm.id}
                            className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                            style={{
                              border: selected ? `2px solid ${pm.color}` : '2px solid #E5E7EB',
                              background: selected ? pm.bg : 'white',
                            }}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={selected}
                              onChange={() => setPaymentMethod(pm.id)}
                              className="sr-only"
                            />
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pm.bg }}>
                              <Icon className="w-5 h-5" style={{ color: pm.color }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-900">{pm.label}</span>
                                {pm.badge && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: pm.color }}>
                                    {pm.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{pm.desc}</p>
                            </div>
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                              style={{ borderColor: selected ? pm.color : '#D1D5DB', background: selected ? pm.color : 'white' }}
                            >
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card details (only if card selected) */}
                  {paymentMethod === 'card' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" style={{ color: '#7C3AED' }} />
                        Thông tin thẻ
                      </h3>
                      {/* Mock card visual */}
                      <div className="h-36 rounded-2xl mb-5 p-5 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' }}>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1">
                            <div className="w-7 h-7 rounded-full opacity-70" style={{ background: '#FF6000' }} />
                            <div className="w-7 h-7 rounded-full -ml-3 opacity-70" style={{ background: '#FFD700' }} />
                          </div>
                          <span className="text-white/60 text-xs font-mono">VISA</span>
                        </div>
                        <div>
                          <p className="text-white font-mono tracking-widest text-sm">
                            {formData.cardNumber || '**** **** **** ****'}
                          </p>
                          <div className="flex justify-between mt-2">
                            <div>
                              <p className="text-white/40 text-xs">Chủ thẻ</p>
                              <p className="text-white text-xs font-semibold">{formData.cardName || 'TÊN CHỦ THẺ'}</p>
                            </div>
                            <div>
                              <p className="text-white/40 text-xs">Hết hạn</p>
                              <p className="text-white text-xs font-semibold">{formData.cardExpiry || 'MM/YY'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số thẻ *</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            className={`${inputCls} font-mono`}
                            style={inputStyle}
                            value={formData.cardNumber}
                            onChange={e => setFormData({ ...formData, cardNumber: formatCard(e.target.value) })}
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                          />
                          {cardErrors.cardNumber && <p className="text-xs text-red-500 mt-1">{cardErrors.cardNumber}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên chủ thẻ *</label>
                          <input
                            type="text"
                            className={`${inputCls} uppercase`}
                            style={inputStyle}
                            value={formData.cardName}
                            onChange={e => setFormData({ ...formData, cardName: e.target.value.toUpperCase() })}
                            placeholder="NGUYEN VAN A"
                          />
                          {cardErrors.cardName && <p className="text-xs text-red-500 mt-1">{cardErrors.cardName}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ngày hết hạn *</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              className={`${inputCls} font-mono`}
                              style={inputStyle}
                              value={formData.cardExpiry}
                              onChange={e => setFormData({ ...formData, cardExpiry: formatExpiry(e.target.value) })}
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                            {cardErrors.cardExpiry && <p className="text-xs text-red-500 mt-1">{cardErrors.cardExpiry}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">CVV *</label>
                            <input
                              type="password"
                              inputMode="numeric"
                              className={`${inputCls} font-mono`}
                              style={inputStyle}
                              value={formData.cardCvv}
                              onChange={e => setFormData({ ...formData, cardCvv: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                              placeholder="•••"
                              maxLength={4}
                            />
                            {cardErrors.cardCvv && <p className="text-xs text-red-500 mt-1">{cardErrors.cardCvv}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR transfer details */}
                  {['bank', 'cod'].includes(paymentMethod) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <QrCode className="w-4 h-4" style={{ color: '#059669' }} />
                        {paymentMethod === 'cod' ? 'Cọc COD trước 30%' : 'Chuyển khoản QR'}
                      </h3>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white">
                            <QrCode className="h-5 w-5" style={{ color: '#059669' }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-950">
                              {paymentMethod === 'cod'
                                ? 'COD yêu cầu cọc trước 30% để giữ chỗ'
                                : 'QR sẽ được tạo tự động sau khi xác nhận thanh toán'}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                              {paymentMethod === 'cod'
                                ? `Hệ thống sẽ tạo mã cọc đúng 30% là ${formatVND(codDeposit)}. Phần còn lại ${formatVND(remainingCodAmount)} trả trực tiếp khi đi tour.`
                                : `Hệ thống sẽ tạo mã QR với đúng số tiền ${formatVND(total)}. Bạn có thể quét QR hoặc mở trang thanh toán ở bước xác nhận.`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-start gap-2 p-3 rounded-xl" style={{ background: '#FFF7ED', border: '1px solid #FDE68A' }}>
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D97706' }} />
                        <p className="text-xs" style={{ color: '#92400E' }}>
                          Booking sẽ chỉ được xác nhận sau khi hệ thống ghi nhận thanh toán thành công.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* VNPAY QR */}
                  {paymentMethod === 'vnpay' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h3 className="font-bold text-gray-900 mb-4">
                        Quét mã QR thanh toán VNPAY
                      </h3>
                      <div className="flex flex-col items-center gap-4">
                        {/* Mock QR */}
                        <div className="w-44 h-44 rounded-2xl flex items-center justify-center" style={{ background: '#F9FAFB', border: '2px dashed #E5E7EB' }}>
                          <div className="text-center">
                            <div className="grid grid-cols-5 gap-0.5 mb-2">
                              {Array.from({ length: 25 }).map((_, i) => (
                                <div key={i} className="w-4 h-4 rounded-sm" style={{ background: Math.random() > 0.5 ? '#111' : 'transparent' }} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-400">QR Demo</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-lg" style={{ color: '#0064D2' }}>
                            {formatVND(total)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Mở app VNPAY → Quét mã → Xác nhận</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terms */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all cursor-pointer"
                        style={{ borderColor: agreedToTerms ? '#0064D2' : '#D1D5DB', background: agreedToTerms ? '#0064D2' : 'white' }}
                      >
                        {agreedToTerms && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">
                        Tôi đã đọc và đồng ý với{' '}
                        <a href="#" className="underline font-semibold" style={{ color: '#0064D2' }}>điều khoản dịch vụ</a>
                        {' '}và{' '}
                        <a href="#" className="underline font-semibold" style={{ color: '#0064D2' }}>chính sách hoàn tiền</a>
                        {' '}của Thích Du Lịch.
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* CTA Button */}
              <button
                onClick={handleNext}
                disabled={loading || (step === 2 && !agreedToTerms)}
                className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:shadow-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: loading || (step === 2 && !agreedToTerms)
                    ? '#9CA3AF'
                    : 'linear-gradient(135deg, #0064D2, #0091FF)',
                  boxShadow: loading || (step === 2 && !agreedToTerms)
                    ? 'none'
                    : '0 4px 20px rgba(0,100,210,0.35)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý thanh toán...
                  </>
                ) : step === 1 ? (
                  <>Tiếp tục chọn thanh toán <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Xác nhận & Thanh toán {formatVND(amountDueNow)}
                  </>
                )}
              </button>
            </div>

            {/* RIGHT COLUMN: Price summary */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <PriceSidebar />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
