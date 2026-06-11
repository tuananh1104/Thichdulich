"use client";

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getPostLoginPathForRole } from '../components/ProtectedRoute';
import { API_BASE_URL, getApiErrorMessage } from '@/services/api';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Compass, MapPin, Star } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { icon: '👤', label: 'Khách hàng', email: 'user@demo.com', pass: 'demo123', color: '#0064D2', bg: '#EFF6FF' },
  { icon: '🏢', label: 'Nhà cung cấp', email: 'provider@demo.com', pass: 'demo123', color: '#7C3AED', bg: '#F5F3FF' },
  { icon: '⚙️', label: 'Quản trị viên', email: 'admin@demo.com', pass: 'admin123', color: '#DC2626', bg: '#FEF2F2' },
];

const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo;
  const emailFromRegister = (location.state as any)?.email;

  const [email, setEmail] = useState(emailFromRegister || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  const normalizeLoginMessage = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('xác minh') || normalized.includes('xac minh') || normalized.includes('verify')) {
      return 'Vui lòng xác minh email trước khi đăng nhập.';
    }
    if (
      normalized.includes('khóa') ||
      normalized.includes('khoa') ||
      normalized.includes('bị khóa') ||
      normalized.includes('disabled') ||
      normalized.includes('chưa hoạt động')
    ) {
      return 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.';
    }
    if (normalized.includes('bad credentials') || normalized.includes('không chính xác')) {
      return 'Email hoặc mật khẩu không chính xác.';
    }
    return message;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  useEffect(() => {
    if (pendingRedirect && user) {
      setPendingRedirect(false);
      navigate(getPostLoginPathForRole(user.role, returnTo), { replace: true });
    }
  }, [pendingRedirect, user, navigate, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    const nextErrors = {
      email: !normalizedEmail
        ? 'Vui lòng nhập email'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
          ? 'Email không đúng định dạng'
          : '',
      password: password ? '' : 'Vui lòng nhập mật khẩu',
    };
    setFieldErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      setError(Object.values(nextErrors).find(Boolean) || 'Vui lòng kiểm tra lại thông tin đăng nhập');
      return;
    }
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const success = await login(normalizedEmail, password);
      if (success) {
        setPendingRedirect(true);
      } else {
        setError('Email hoặc mật khẩu không chính xác.');
        setFieldErrors({ email: ' ', password: ' ' });
      }
    } catch (error) {
      const message = normalizeLoginMessage(getApiErrorMessage(error, 'Đăng nhập thất bại'));
      setError(message);
      if (message.toLowerCase().includes('email') || message.toLowerCase().includes('mật khẩu')) {
        setFieldErrors({ email: ' ', password: ' ' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (hasError: boolean) => ({
    border: `1.5px solid ${hasError ? '#DC2626' : '#E5E7EB'}`,
    background: hasError ? '#FEF2F2' : '#F9FAFB',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  });

  const getFocusShadow = (hasError: boolean) =>
    hasError ? '0 0 0 3px rgba(220,38,38,0.12)' : '0 0 0 3px rgba(0,100,210,0.1)';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #F0F4FF 0%, #EBF3FF 50%, #FFF7F0 100%)' }}
    >
      <div
        className="w-full max-w-4xl rounded-3xl overflow-hidden flex shadow-2xl"
        style={{ minHeight: 580, boxShadow: '0 32px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        {/* ── Left decorative panel ── */}
        <div
          className="hidden md:flex md:w-[44%] relative flex-col justify-between p-9 overflow-hidden"
          style={{ background: 'linear-gradient(155deg, #010B24 0%, #02235A 55%, #0040A0 100%)' }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-[0.07]" style={{ background: '#FF6000', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-[0.08]" style={{ background: '#60C8FF', transform: 'translate(-30%, 30%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(1,11,36,0.85) 20%, transparent 70%)' }} />

          {/* Top: Brand */}
          <div className="relative">
            <Link to="/" className="flex items-center gap-2.5 mb-8 transition-opacity hover:opacity-85" aria-label="Về trang chủ">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)', boxShadow: '0 4px 14px rgba(0,100,210,0.4)' }}
              >
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-black" style={{ fontSize: '1.0625rem', letterSpacing: '-0.4px' }}>Thích Du Lịch</span>
            </Link>

            {/* Highlights */}
            <div className="space-y-3">
              {[
                { icon: MapPin, text: '500+ điểm đến trên toàn quốc', color: '#60A5FA' },
                { icon: Star, text: '10.000+ khách hàng hài lòng', color: '#FBBF24' },
                { icon: Compass, text: 'Tour chất lượng, giá tốt nhất thị trường', color: '#34D399' },
              ].map(({ icon: Icon, text, color }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'rgba(200,220,255,0.85)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: headline + social proof */}
          <div className="relative">
            <h2
              className="text-white mb-3"
              style={{ fontSize: '1.625rem', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em' }}
            >
              Bắt đầu hành trình<br />
              <span style={{ color: '#60C8FF' }}>khám phá của bạn.</span>
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(180,210,255,0.65)' }}>
              Đặt tour, lưu điểm đến yêu thích và theo dõi lịch trình mọi lúc, mọi nơi.
            </p>

            {/* Social proof pill */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex -space-x-2">
                {['#0064D2', '#7C3AED', '#059669', '#FF6000'].map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: color, borderColor: '#020E30' }}
                  >
                    {['N', 'T', 'M', 'H'][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-bold text-xs">10.000+ tin tưởng sử dụng</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-xs">★</span>)}
                  <span className="text-xs ml-1" style={{ color: 'rgba(200,220,255,0.5)' }}>4.9/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 md:px-10 py-10">

          {/* Mobile brand */}
          <Link to="/" className="flex items-center gap-2 mb-8 md:hidden transition-opacity hover:opacity-85" aria-label="Về trang chủ">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}>
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900" style={{ fontSize: '1.0625rem' }}>Thích Du Lịch</span>
          </Link>

          <div className="mb-7">
            <h1
              className="text-gray-900 mb-1.5"
              style={{ fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-0.03em' }}
            >
              Chào mừng trở lại 👋
            </h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Đăng nhập để tiếp tục hành trình khám phá của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
              >
                <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">!</div>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (error) setError('');
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  placeholder="email@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3.5 text-sm rounded-xl focus:outline-none transition-all"
                  style={getInputStyle(!!fieldErrors.email)}
                  onFocus={e => { e.currentTarget.style.borderColor = fieldErrors.email ? '#DC2626' : '#0064D2'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = getFocusShadow(!!fieldErrors.email); }}
                  onBlur={e => {
                    const message = e.currentTarget.value.trim() ? '' : 'Vui lòng nhập email';
                    setFieldErrors(prev => ({ ...prev, email: message }));
                    e.currentTarget.style.borderColor = message ? '#DC2626' : '#E5E7EB';
                    e.currentTarget.style.background = message ? '#FEF2F2' : '#F9FAFB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              {fieldErrors.email?.trim() && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-gray-700">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password', { state: { email: email.trim() } })}
                  className="text-xs font-semibold transition-colors hover:opacity-75"
                  style={{ color: '#0064D2' }}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError('');
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                  }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3.5 text-sm rounded-xl focus:outline-none transition-all"
                  style={getInputStyle(!!fieldErrors.password)}
                  onFocus={e => { e.currentTarget.style.borderColor = fieldErrors.password ? '#DC2626' : '#0064D2'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = getFocusShadow(!!fieldErrors.password); }}
                  onBlur={e => {
                    const message = e.currentTarget.value ? '' : 'Vui lòng nhập mật khẩu';
                    setFieldErrors(prev => ({ ...prev, password: message }));
                    e.currentTarget.style.borderColor = message ? '#DC2626' : '#E5E7EB';
                    e.currentTarget.style.background = message ? '#FEF2F2' : '#F9FAFB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-gray-600"
                  style={{ color: '#CBD5E1' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password?.trim() && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#0064D2' }}
              />
              <span className="text-sm" style={{ color: '#6B7280' }}>Ghi nhớ đăng nhập</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white text-sm font-bold rounded-xl transition-all hover:opacity-92 hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #0064D2, #0091FF)',
                boxShadow: '0 4px 18px rgba(0,100,210,0.38)',
                letterSpacing: '-0.01em',
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400">hoặc</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 text-sm font-bold rounded-xl transition-all hover:bg-gray-50 active:scale-[0.99] flex items-center justify-center gap-3"
              style={{ border: '1.5px solid #E5E7EB', color: '#374151', background: 'white' }}
            >
              <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-black" style={{ color: '#4285F4' }}>G</span>
              Continue with Google
            </button>

            {/* Register link */}
            <p className="text-center text-sm" style={{ color: '#9CA3AF' }}>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold transition-colors hover:opacity-80" style={{ color: '#0064D2' }}>
                Đăng ký miễn phí
              </Link>
            </p>

            {SHOW_DEMO_ACCOUNTS && (
              <div className="rounded-2xl p-4" style={{ background: '#F8FAFF', border: '1.5px solid #DBEAFE' }}>
                <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#1E40AF' }}>
                  🔐 Demo — click để điền tự động:
                </p>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map(acc => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => { setEmail(acc.email); setPassword(acc.pass); setError(''); setFieldErrors({}); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all hover:shadow-sm active:scale-[0.99]"
                      style={{ background: acc.bg, border: `1.5px solid ${acc.color}18` }}
                    >
                      <span className="text-base flex-shrink-0">{acc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block" style={{ color: acc.color }}>{acc.label}</span>
                        <span className="text-xs block truncate" style={{ color: '#9CA3AF' }}>{acc.email}</span>
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: '#CBD5E1' }}>↵ click</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
