"use client";

import { useNavigate } from 'react-router';
import { Lock, LogIn, X, MapPin, Star, Compass, ArrowRight } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnTo?: string;
  message?: string;
}

const PERKS = [
  { icon: MapPin, text: 'Đặt tour nhanh chóng, dễ dàng', color: '#0064D2' },
  { icon: Star, text: 'Lưu tour yêu thích mọi lúc', color: '#F59E0B' },
  { icon: Compass, text: 'Theo dõi lịch trình trực tuyến', color: '#059669' },
];

export function LoginRequiredModal({ isOpen, onClose, returnTo, message }: LoginRequiredModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate('/login', returnTo ? { state: { returnTo } } : undefined);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,15,40,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-sm overflow-hidden"
        style={{
          borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #0064D2 0%, #0091FF 50%, #FF6000 100%)' }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="px-7 pt-6 pb-7">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                boxShadow: '0 4px 16px rgba(0,100,210,0.12)',
              }}
            >
              <Lock className="w-8 h-8" style={{ color: '#0064D2' }} />
            </div>
          </div>

          {/* Text */}
          <h2
            className="text-center text-gray-900 mb-1.5"
            style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Đăng nhập để tiếp tục
          </h2>
          <p className="text-center text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>
            {message ?? 'Bạn cần đăng nhập để đặt tour. Chỉ mất vài giây thôi!'}
          </p>

          {/* Perks */}
          <div
            className="rounded-2xl p-4 mb-5 space-y-2.5"
            style={{ background: '#F8FAFF', border: '1.5px solid #EFF6FF' }}
          >
            {PERKS.map(({ icon: Icon, text, color }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}12`, border: `1px solid ${color}20` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-sm font-medium text-gray-700">{text}</span>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-92 hover:-translate-y-px active:translate-y-0 mb-2.5"
            style={{
              background: 'linear-gradient(135deg, #0064D2, #0091FF)',
              boxShadow: '0 4px 18px rgba(0,100,210,0.38)',
              letterSpacing: '-0.01em',
            }}
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập ngay
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-gray-50"
            style={{ border: '1.5px solid #E5E7EB', color: '#6B7280' }}
          >
            Để sau
          </button>

          {/* Register hint */}
          <p className="text-center text-xs mt-4" style={{ color: '#CBD5E1' }}>
            Chưa có tài khoản?{' '}
            <button
              onClick={() => { onClose(); navigate('/register'); }}
              className="font-bold transition-colors hover:opacity-75"
              style={{ color: '#0064D2' }}
            >
              Đăng ký miễn phí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
