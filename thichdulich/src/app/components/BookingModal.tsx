"use client";

import { useState } from 'react';
import { X, Calendar, Users, User, Baby, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBookings } from '../contexts/BookingContext';
import { useNavigate } from 'react-router';
import { LoginRequiredModal } from './LoginRequiredModal';
import { PaymentModal } from './PaymentModal';
import { isVietnamesePhone, normalizePhone, PHONE_RULE_MESSAGE } from '../utils/validation';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  tourName: string;
  tourPrice: number;
}

export interface BookingData {
  departureDate: string;
  adults: number;
  children: number;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
}

export function BookingModal({ isOpen, onClose, tourId, tourName, tourPrice }: BookingModalProps) {
  const { user } = useAuth();
  const { addBooking } = useBookings();
  const navigate = useNavigate();
  
  const [departureDate, setDepartureDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (!isOpen && !showLoginModal) return null;

  // Only compute these when actually rendering
  const totalPrice = isOpen ? (tourPrice * adults + (tourPrice * 0.7 * children)) : 0;
  const formatVND = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + '₫';
  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const inputErrorClass = 'border-red-500 bg-red-50 focus:ring-red-200';
  const clearFormError = (field: string) => {
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const errors: Record<string, string> = {};
    if (!departureDate) errors.departureDate = 'Vui lòng chọn ngày khởi hành phù hợp với lịch của bạn.';
    if (!fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên người liên hệ.';
    if (!email.trim()) errors.email = 'Vui lòng nhập email để nhận xác nhận đặt tour.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Email chưa đúng định dạng. Ví dụ: ten@email.com.';
    if (!phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại để nhà cung cấp liên hệ khi cần.';
    else if (!isVietnamesePhone(phone)) errors.phone = PHONE_RULE_MESSAGE;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    // Open payment modal instead of alert
    setShowPaymentModal(true);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0A2540, #1E3A5F)' }}>
          <div>
            <h2 className="font-bold text-white mb-1" style={{ fontSize: '1.25rem' }}>
              Đặt tour ngay
            </h2>
            <p className="text-sm text-white/80">{tourName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-5">
            {/* Ngày khởi hành */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" style={{ color: '#0064D2' }} />
                Ngày khởi hành <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => {
                  setDepartureDate(e.target.value);
                  clearFormError('departureDate');
                }}
                min={new Date().toISOString().split('T')[0]}
                className={`${inputClass} ${formErrors.departureDate ? inputErrorClass : ''}`}
              />
              {formErrors.departureDate && <p className="mt-1.5 text-xs font-semibold text-red-600">{formErrors.departureDate}</p>}
            </div>

            {/* Số lượng người */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <User className="w-4 h-4" style={{ color: '#0064D2' }} />
                  Người lớn <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-10 h-10 rounded-xl font-bold text-gray-700 transition-colors hover:bg-gray-100"
                    style={{ background: '#F3F4F6' }}
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{adults}</span>
                  <button
                    onClick={() => setAdults(adults + 1)}
                    className="w-10 h-10 rounded-xl font-bold text-white transition-colors hover:opacity-90"
                    style={{ background: '#0064D2' }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Baby className="w-4 h-4" style={{ color: '#0064D2' }} />
                  Trẻ em
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="w-10 h-10 rounded-xl font-bold text-gray-700 transition-colors hover:bg-gray-100"
                    style={{ background: '#F3F4F6' }}
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{children}</span>
                  <button
                    onClick={() => setChildren(children + 1)}
                    className="w-10 h-10 rounded-xl font-bold text-white transition-colors hover:opacity-90"
                    style={{ background: '#0064D2' }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Thông tin liên hệ */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Users className="w-4 h-4" style={{ color: '#0064D2' }} />
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFormError('fullName');
                }}
                placeholder="Nguyễn Văn A"
                className={`${inputClass} ${formErrors.fullName ? inputErrorClass : ''}`}
              />
              {formErrors.fullName && <p className="mt-1.5 text-xs font-semibold text-red-600">{formErrors.fullName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFormError('email');
                  }}
                  placeholder="example@email.com"
                  className={`${inputClass} ${formErrors.email ? inputErrorClass : ''}`}
                />
                {formErrors.email && <p className="mt-1.5 text-xs font-semibold text-red-600">{formErrors.email}</p>}
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFormError('phone');
                  }}
                  placeholder="0901234567"
                  className={`${inputClass} ${formErrors.phone ? inputErrorClass : ''}`}
                />
                {formErrors.phone && <p className="mt-1.5 text-xs font-semibold text-red-600">{formErrors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Ghi chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Yêu cầu đặc biệt, dị ứng thực phẩm..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Phương thức thanh toán */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Phương thức thanh toán
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-10 h-10 rounded-xl font-bold ${paymentMethod === 'card' ? 'text-white bg-blue-500' : 'text-gray-700 bg-gray-200'} transition-colors hover:opacity-90`}
                >
                  <CreditCard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPaymentMethod('transfer')}
                  className={`w-10 h-10 rounded-xl font-bold ${paymentMethod === 'transfer' ? 'text-white bg-blue-500' : 'text-gray-700 bg-gray-200'} transition-colors hover:opacity-90`}
                >
                  Chuyển khoản
                </button>
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Người lớn ({adults} x {formatVND(tourPrice)})</span>
                <span className="font-semibold text-gray-900">{formatVND(tourPrice * adults)}</span>
              </div>
              {children > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Trẻ em ({children} x {formatVND(tourPrice * 0.7)})</span>
                  <span className="font-semibold text-gray-900">{formatVND(tourPrice * 0.7 * children)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-blue-200 flex items-center justify-between">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <div className="text-right">
                  <p className="font-bold text-2xl" style={{ color: '#0064D2' }}>{formatVND(totalPrice)}</p>
                  <p className="text-xs text-gray-500">Đã bao gồm VAT</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3.5 rounded-xl font-bold text-gray-700 transition-all hover:bg-gray-100"
            style={{ background: '#F3F4F6' }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 shadow-lg flex items-center justify-center gap-2"
            style={{ background: '#FF6000' }}
          >
            <CreditCard className="w-4 h-4" />
            Xác nhận đặt tour
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {showLoginModal && (
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          if (user) {
            addBooking({
              tourId, tourName,
              userId: user.id, userName: user.name, userEmail: user.email,
              startDate: departureDate, adults, children,
              totalAmount: totalPrice,
              contactName: fullName, contactEmail: email, contactPhone: normalizePhone(phone),
              specialRequests: notes, paymentMethod,
            });
          }
          setShowPaymentModal(false);
          onClose();
          navigate('/my-bookings');
        }}
        tourName={tourName}
        totalAmount={totalPrice}
        adults={adults}
        children={children}
        departureDate={departureDate}
      />
    </div>
  );
}
