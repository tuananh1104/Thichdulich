"use client";

import { useState, useEffect } from 'react';
import {
  X, CreditCard, Building2, ChevronRight,
  CheckCircle, Copy, Clock, Shield, ArrowLeft, Zap,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tourName: string;
  totalAmount: number;
  adults: number;
  children: number;
  departureDate: string;
}

type PaymentMethod = 'vnpay' | 'transfer' | null;
type Step = 'method' | 'details' | 'processing' | 'success';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';

const METHODS = [
  {
    id: 'vnpay' as const,
    name: 'VNPay QR',
    desc: 'Quét mã QR qua ứng dụng ngân hàng',
    icon: '🏦',
    color: '#005BAA',
    bg: '#E8F0FB',
    badge: 'Phổ biến',
  },
  {
    id: 'transfer' as const,
    name: 'Chuyển khoản ngân hàng',
    desc: 'Chuyển khoản thủ công qua STK',
    icon: '🏧',
    color: '#059669',
    bg: '#ECFDF5',
    badge: null,
  },
];

// Mock QR code using SVG squares pattern
function QRCodeMock({ color }: { color: string }) {
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,1,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,1,0,1,1,1,0,1,0,1,1,0],
    [0,1,0,0,1,1,0,1,0,1,0,0,1,1,0,1,0,0,1],
    [1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,0,1,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,1,0,0],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,0,0,0,1,0,1,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,1,1,1,1,0,0],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,0,0,1,1,0],
    [1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,0,0,1,1],
  ];
  return (
    <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(19, 10px)`, gap: 1.5 }}>
        {pattern.flat().map((cell, i) => (
          <div
            key={i}
            style={{
              width: 10, height: 10,
              background: cell ? color : 'white',
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function PaymentModal({
  isOpen, onClose, onSuccess, tourName, totalAmount, adults, children, departureDate,
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [countdown, setCountdown] = useState(300); // 5 min
  const [copied, setCopied] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedMethod(null);
      setCountdown(300);
    }
  }, [isOpen]);

  // Countdown timer for step 'details'
  useEffect(() => {
    if (step !== 'details') return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  if (!isOpen) return null;

  const method = METHODS.find(m => m.id === selectedMethod);
  const mins = String(Math.floor(countdown / 60)).padStart(2, '0');
  const secs = String(countdown % 60).padStart(2, '0');

  const handleProceed = () => {
    if (!selectedMethod) return;
    setStep('details');
  };

  const handleConfirmPayment = () => {
    setStep('processing');
    setTimeout(() => setStep('success'), 2200);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const transactionId = 'TD' + Date.now().toString().slice(-8);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={step === 'success' ? undefined : onClose}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ─── Header ───────────────────────────────────────── */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0A2540, #1E3A5F)' }}
        >
          <div className="flex items-center gap-3">
            {step === 'details' && (
              <button
                onClick={() => setStep('method')}
                className="p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
            )}
            <div>
              <h2 className="font-bold text-white">Thanh toán</h2>
              <p className="text-xs text-white/60 mt-0.5 max-w-[220px] truncate">{tourName}</p>
            </div>
          </div>
          {step !== 'success' && step !== 'processing' && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* ─── Amount bar ───────────────────────────────────── */}
        {step !== 'success' && (
          <div className="px-6 py-3 flex items-center justify-between" style={{ background: '#F8FAFF', borderBottom: '1px solid #E8F0FF' }}>
            <div className="text-xs text-gray-500">
              {adults} người lớn{children > 0 ? ` · ${children} trẻ em` : ''} · {new Date(departureDate).toLocaleDateString('vi-VN')}
            </div>
            <div className="font-black" style={{ color: '#0064D2', fontSize: '1.1rem' }}>{formatVND(totalAmount)}</div>
          </div>
        )}

        {/* ─── STEP 1: Choose method ────────────────────────── */}
        {step === 'method' && (
          <div className="p-6 space-y-3">
            <p className="text-sm font-bold text-gray-700 mb-4">Chọn phương thức thanh toán</p>
            {METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left"
                style={{
                  borderColor: selectedMethod === m.id ? m.color : '#E5E7EB',
                  background: selectedMethod === m.id ? m.bg : 'white',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: m.bg }}
                >
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{m.name}</span>
                    {m.badge && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ background: m.color }}
                      >
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: selectedMethod === m.id ? m.color : '#D1D5DB',
                    background: selectedMethod === m.id ? m.color : 'white',
                  }}
                >
                  {selectedMethod === m.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}

            {/* Security note */}
            <div className="flex items-center gap-2 p-3 rounded-xl mt-2" style={{ background: '#F0FDF4' }}>
              <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} />
              <p className="text-xs" style={{ color: '#047857' }}>Giao dịch được mã hóa SSL 256-bit, an toàn tuyệt đối.</p>
            </div>

            <button
              onClick={handleProceed}
              disabled={!selectedMethod}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: selectedMethod ? 'linear-gradient(135deg, #0064D2, #0091FF)' : '#E5E7EB',
                color: selectedMethod ? 'white' : '#9CA3AF',
                cursor: selectedMethod ? 'pointer' : 'not-allowed',
              }}
            >
              Tiếp tục thanh toán
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 2: Payment details ──────────────────────── */}
        {step === 'details' && method && (
          <div className="p-6 space-y-5">
            {/* Countdown */}
            {method.id === 'vnpay' && (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{ background: countdown < 60 ? '#FEF2F2' : '#FFF7ED', border: `1px solid ${countdown < 60 ? '#FECACA' : '#FED7AA'}` }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: countdown < 60 ? '#DC2626' : '#D97706' }} />
                  <span className="text-xs font-medium" style={{ color: countdown < 60 ? '#DC2626' : '#D97706' }}>
                    Mã QR hết hạn sau
                  </span>
                </div>
                <span className="font-black text-lg" style={{ color: countdown < 60 ? '#DC2626' : '#D97706' }}>
                  {mins}:{secs}
                </span>
              </div>
            )}

            {/* VNPay QR */}
            {method.id === 'vnpay' && (
              <div className="text-center space-y-4">
                <p className="text-sm font-bold text-gray-700">
                  Quét mã QR bằng ứng dụng ngân hàng
                </p>
                <div className="flex justify-center">
                  <QRCodeMock color={method.color} />
                </div>
                <div className="p-3 rounded-xl" style={{ background: method.bg }}>
                  <p className="text-xs font-medium" style={{ color: method.color }}>
                    🏦 Hỗ trợ tất cả ngân hàng Việt Nam
                  </p>
                </div>
              </div>
            )}

            {/* Bank Transfer */}
            {method.id === 'transfer' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700">Thông tin chuyển khoản</p>
                {[
                  { label: 'Ngân hàng', value: 'Vietcombank (VCB)' },
                  { label: 'Số tài khoản', value: '1234567890', copyable: true },
                  { label: 'Chủ tài khoản', value: 'CTY TNHH THICHDULICH' },
                  { label: 'Số tiền', value: formatVND(totalAmount), highlight: true },
                  { label: 'Nội dung CK', value: `TDTOUR ${transactionId}`, copyable: true },
                ].map(row => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: row.highlight ? '#EFF6FF' : '#F9FAFB' }}
                  >
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-bold"
                        style={{ color: row.highlight ? '#0064D2' : '#111827' }}
                      >
                        {row.value}
                      </span>
                      {row.copyable && (
                        <button
                          onClick={() => handleCopy(row.value)}
                          className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {copied && (
                  <p className="text-xs text-center font-medium" style={{ color: '#059669' }}>
                    ✓ Đã sao chép vào clipboard
                  </p>
                )}
                <div className="p-3 rounded-xl" style={{ background: '#FEF3C7' }}>
                  <p className="text-xs" style={{ color: '#92400E' }}>
                    ⚠️ Vui lòng chuyển đúng số tiền và nội dung để chúng tôi xác nhận nhanh nhất.
                  </p>
                </div>
              </div>
            )}

            {/* Transaction ID */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#F9FAFB' }}>
              <span className="text-xs text-gray-500">Mã giao dịch</span>
              <span className="text-xs font-bold text-gray-700">{transactionId}</span>
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${method.color}, ${method.color}CC)` }}
            >
              <Zap className="w-4 h-4" />
              {method.id === 'transfer' ? 'Tôi đã chuyển khoản' : 'Tôi đã thanh toán xong'}
            </button>
          </div>
        )}

        {/* ─── STEP 3: Processing ───────────────────────────── */}
        {step === 'processing' && (
          <div className="p-10 text-center space-y-5">
            <div className="relative mx-auto w-20 h-20">
              <div
                className="absolute inset-0 rounded-full animate-spin"
                style={{ border: '4px solid #DBEAFE', borderTopColor: '#0064D2' }}
              />
              <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                <CreditCard className="w-7 h-7" style={{ color: '#0064D2' }} />
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">Đang xác nhận thanh toán...</p>
              <p className="text-sm text-gray-500 mt-1">Vui lòng không đóng cửa sổ này</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: '#0064D2', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 4: Success ──────────────────────────────── */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-5">
            <div
              className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #059669, #34D399)' }}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <div>
              <h3 className="font-black text-gray-900 text-xl">Thanh toán thành công!</h3>
              <p className="text-sm text-gray-500 mt-2">Đặt tour của bạn đã được xác nhận</p>
            </div>

            <div className="p-5 rounded-2xl text-left space-y-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tour</span>
                <span className="font-bold text-gray-900 max-w-[180px] text-right">{tourName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ngày đi</span>
                <span className="font-bold text-gray-900">{new Date(departureDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số người</span>
                <span className="font-bold text-gray-900">
                  {adults} người lớn{children > 0 ? `, ${children} trẻ em` : ''}
                </span>
              </div>
              <div className="h-px" style={{ background: '#BBF7D0' }} />
              <div className="flex justify-between">
                <span className="font-bold text-gray-700">Tổng thanh toán</span>
                <span className="font-black text-lg" style={{ color: '#059669' }}>{formatVND(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Mã giao dịch</span>
                <span className="font-bold text-gray-600">{transactionId}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Email xác nhận đã được gửi đến hộp thư của bạn. Chúng tôi sẽ liên hệ trong 24h.
            </p>

            <button
              onClick={onSuccess}
              className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #059669, #34D399)' }}
            >
              Xem lịch sử đặt tour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
