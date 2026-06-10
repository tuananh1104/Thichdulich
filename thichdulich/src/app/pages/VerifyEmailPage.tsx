"use client";

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import api, { getApiErrorMessage } from '@/services/api';
import { ArrowRight, CheckCircle2, Compass, MailCheck, RotateCcw } from 'lucide-react';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as any)?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const normalizedCode = code.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Email không đúng định dạng.');
      return;
    }
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError('Mã OTP gồm đúng 6 chữ số.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.verifyEmail(normalizedEmail, normalizedCode);
      setVerified(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xác minh OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email.trim()) return;
    setResending(true);
    setError('');
    try {
      const result = await api.resendOtp(email.trim());
      setCooldown(result?.resendAfterSeconds || 60);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi lại OTP.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: 'linear-gradient(135deg, #F0F4FF 0%, #EBF3FF 55%, #FFF7F0 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}>
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-gray-900">Thích Du Lịch</span>
        </div>

        {verified ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: '#ECFDF5', color: '#059669' }}>
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-gray-900 mb-2" style={{ fontSize: '1.625rem', fontWeight: 900 }}>Đăng ký thành công</h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#6B7280' }}>
              Tài khoản của bạn đã được xác minh. Bây giờ bạn có thể đăng nhập và sử dụng Thích Du Lịch.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login', { state: { email: email.trim() } })}
              className="w-full py-3.5 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)', boxShadow: '0 4px 18px rgba(0,100,210,0.38)' }}
            >
              Về trang đăng nhập
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#EFF6FF', color: '#0064D2' }}>
            <MailCheck className="w-6 h-6" />
          </div>
          <h1 className="text-gray-900 mb-1.5" style={{ fontSize: '1.625rem', fontWeight: 900 }}>Xác minh email</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            Nhập mã OTP 6 số đã được gửi tới email của bạn. Mã có hiệu lực trong 5 phút.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl mb-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">!</div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={event => { setEmail(event.target.value); setError(''); }}
              className="w-full px-4 py-3.5 text-sm rounded-xl focus:outline-none transition-all"
              style={{ border: `1.5px solid ${error && !email ? '#DC2626' : '#E5E7EB'}`, background: '#F9FAFB' }}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Mã OTP</label>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              className="w-full px-4 py-3.5 text-center text-lg font-black tracking-[0.45em] rounded-xl focus:outline-none transition-all"
              style={{ border: `1.5px solid ${error ? '#DC2626' : '#E5E7EB'}`, background: error ? '#FEF2F2' : '#F9FAFB' }}
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)', boxShadow: '0 4px 18px rgba(0,100,210,0.38)' }}
          >
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xác minh...</> : <>Xác minh <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="w-full mt-3 py-3 text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ color: '#0064D2', background: '#EFF6FF' }}
        >
          <RotateCcw className="w-4 h-4" />
          {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
        </button>

        <p className="text-center text-sm mt-5" style={{ color: '#9CA3AF' }}>
          Đã xác minh? <Link to="/login" className="font-bold" style={{ color: '#0064D2' }}>Đăng nhập</Link>
        </p>
          </>
        )}
      </div>
    </div>
  );
}
