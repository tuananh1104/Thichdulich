"use client";

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Compass, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiErrorMessage } from '@/services/api';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '../utils/validation';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromLogin = (location.state as any)?.email || '';
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(emailFromLogin);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    const timer = window.setInterval(() => {
      setCooldown(current => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const requestOtp = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Email không đúng định dạng');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.forgotPassword(normalizedEmail);
      setEmail(response?.email || normalizedEmail);
      setStep('reset');
      startCooldown(response?.resendAfterSeconds || 60);
      toast.success('Đã gửi mã OTP về email');
    } catch (error) {
      setError(getApiErrorMessage(error, 'Không thể gửi mã OTP'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = code.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError('OTP phải gồm 6 số');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError(PASSWORD_RULE_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.resetPassword(email.trim(), normalizedCode, newPassword);
      toast.success('Đổi mật khẩu thành công');
      navigate('/login', { state: { email: email.trim() } });
    } catch (error) {
      setError(getApiErrorMessage(error, 'Không thể đổi mật khẩu'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: `1.5px solid ${error ? '#FCA5A5' : '#E5E7EB'}`,
    background: error ? '#FEF2F2' : '#F9FAFB',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: 'linear-gradient(135deg, #F0F4FF 0%, #EBF3FF 50%, #FFF7F0 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>

        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}>
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Quên mật khẩu</h1>
            <p className="text-sm text-gray-500">Nhận OTP qua email để đặt lại mật khẩu.</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold text-red-700 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={requestOtp} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={event => { setEmail(event.target.value); setError(''); }}
                  className="w-full pl-10 pr-4 py-3.5 text-sm rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
                  style={inputStyle}
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}>
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-5" noValidate>
            <div className="rounded-2xl px-4 py-3 bg-blue-50 border border-blue-100 text-sm text-blue-900">
              Mã OTP đã được gửi đến <span className="font-bold">{email}</span>.
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mã OTP</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={code}
                  onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  className="w-full pl-10 pr-4 py-3.5 text-sm rounded-xl tracking-[0.35em] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  style={inputStyle}
                  placeholder="000000"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={event => { setNewPassword(event.target.value); setError(''); }}
                  className="w-full pl-10 pr-4 py-3.5 text-sm rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={event => { setConfirmPassword(event.target.value); setError(''); }}
                  className="w-full pl-10 pr-4 py-3.5 text-sm rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}>
              {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
            </button>

            <button type="button" disabled={cooldown > 0 || loading} onClick={() => requestOtp()} className="w-full py-3 text-sm font-bold rounded-xl border border-gray-200 text-gray-700 disabled:opacity-50">
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
