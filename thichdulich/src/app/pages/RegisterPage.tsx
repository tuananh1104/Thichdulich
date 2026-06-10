"use client";

import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '@/services/api';
import { isStrongPassword, isVietnamesePhone, normalizePhone, PASSWORD_RULE_MESSAGE, PHONE_RULE_MESSAGE } from '../utils/validation';
import { Lock, Mail, User, Phone, Building2, Hash, Eye, EyeOff, CheckCircle2, ArrowRight, Compass, X } from 'lucide-react';

type TabType = 'user' | 'provider';
type LegalModalType = 'terms' | 'privacy' | null;

const USER_BENEFITS = [
  'Đặt tour nhanh chóng, thanh toán an toàn 100%',
  'Nhận ưu đãi & deal hot độc quyền cho thành viên',
  'Theo dõi lịch trình, hỗ trợ 24/7 mọi lúc',
];

const PROVIDER_BENEFITS = [
  'Tiếp cận hàng triệu du khách tiềm năng',
  'Quản lý tour, đơn đặt & doanh thu dễ dàng',
  'Công cụ phân tích & báo cáo chuyên nghiệp',
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const userEmailInputRef = useRef<HTMLInputElement>(null);
  const providerEmailInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showProviderPassword, setShowProviderPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [providerForm, setProviderForm] = useState({ companyName: '', taxCode: '', email: '', phone: '', password: '' });

  const benefits = activeTab === 'user' ? USER_BENEFITS : PROVIDER_BENEFITS;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const normalizeRegisterMessage = (message: string, submittedEmail?: string) => {
    const normalized = message.toLowerCase();
    if (
      normalized.includes('email') &&
      (
        normalized.includes('exist') ||
        normalized.includes('tồn tại') ||
        normalized.includes('ton tai') ||
        normalized.includes('used') ||
        normalized.includes('sử dụng') ||
        normalized.includes('su dung') ||
        normalized.includes('google')
      )
    ) {
      return 'Email này đã được sử dụng.';
    }
    if (
      submittedEmail &&
      (
        normalized.includes('request failed with status code 400') ||
        normalized.includes('bad request')
      )
    ) {
      return 'Email này đã được sử dụng.';
    }
    if (normalized.includes('password') || normalized.includes('mật khẩu')) {
      return PASSWORD_RULE_MESSAGE;
    }
    return message;
  };

  const isEmailRegisterError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('email') ||
      normalized.includes('đã được sử dụng') ||
      normalized.includes('da duoc su dung') ||
      normalized.includes('tồn tại') ||
      normalized.includes('ton tai') ||
      normalized.includes('google') ||
      normalized.includes('used') ||
      normalized.includes('exist')
    );
  };

  const showEmailError = (message: string) => {
    setError(message);
    setFieldErrors(prev => ({ ...prev, email: message }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submittedName = activeTab === 'user' ? userForm.name : providerForm.companyName;
    const submittedEmail = activeTab === 'user' ? userForm.email : providerForm.email;
    const submittedPhone = activeTab === 'user' ? userForm.phone : providerForm.phone;
    const submittedPassword = activeTab === 'user' ? userForm.password : providerForm.password;
    const nextErrors: Record<string, string> = {};

    if (!submittedName.trim()) nextErrors.name = activeTab === 'user' ? 'Vui lòng nhập họ tên' : 'Vui lòng nhập tên công ty';
    if (!submittedEmail.trim()) nextErrors.email = 'Vui lòng nhập email';
    else if (!emailPattern.test(submittedEmail.trim())) nextErrors.email = 'Email không đúng định dạng';
    if (!submittedPhone.trim()) nextErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!isVietnamesePhone(submittedPhone)) nextErrors.phone = PHONE_RULE_MESSAGE;
    if (!submittedPassword) nextErrors.password = 'Vui lòng nhập mật khẩu';
    else if (!isStrongPassword(submittedPassword)) nextErrors.password = PASSWORD_RULE_MESSAGE;
    if (!agreed) nextErrors.agreed = 'Vui lòng đồng ý với điều khoản sử dụng';

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const message = Object.values(nextErrors)[0];
      setError(message);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const name = activeTab === 'user' ? userForm.name : providerForm.companyName;
      const email = activeTab === 'user' ? userForm.email : providerForm.email;
      const phone = normalizePhone(activeTab === 'user' ? userForm.phone : providerForm.phone);
      const password = activeTab === 'user' ? userForm.password : providerForm.password;
      const role = activeTab === 'user' ? 'user' : 'provider';
      const result = await register(name, email, password, phone, role);
      if (result) {
        navigate('/verify-email', { state: { email: result.email || email } });
      } else {
        showEmailError('Email này đã được sử dụng.');
      }
    } catch (error) {
      const message = normalizeRegisterMessage(getApiErrorMessage(error, 'Đăng ký thất bại'), submittedEmail);
      if (isEmailRegisterError(message)) {
        showEmailError(message);
        return;
      }
      setError(message);
      setFieldErrors(prev => ({ ...prev, email: message }));
      if (message.toLowerCase().includes('mật khẩu')) {
        setFieldErrors(prev => ({ ...prev, password: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full py-3.5 text-sm rounded-xl focus:outline-none transition-all";
  const inputStyle = { border: '1.5px solid #E5E7EB', background: '#F9FAFB', fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const getInputStyle = (field: string) => ({
    border: `1.5px solid ${fieldErrors[field] ? '#DC2626' : '#E5E7EB'}`,
    background: fieldErrors[field] ? '#FEF2F2' : '#F9FAFB',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  });
  const clearFieldError = (field: string) => {
    if (error) setError('');
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };
  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors[field]}</p> : null;
  const onFocus = (field: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    const hasError = Boolean(fieldErrors[field]);
    e.currentTarget.style.borderColor = hasError ? '#DC2626' : '#0064D2';
    e.currentTarget.style.background = hasError ? '#FEF2F2' : 'white';
    e.currentTarget.style.boxShadow = hasError
      ? '0 0 0 3px rgba(220,38,38,0.12)'
      : '0 0 0 3px rgba(0,100,210,0.1)';
  };
  const onBlur = (field: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = fieldErrors[field] ? '#DC2626' : '#E5E7EB';
    e.currentTarget.style.background = fieldErrors[field] ? '#FEF2F2' : '#F9FAFB';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #F0F4FF 0%, #EBF3FF 60%, #FFF7F0 100%)' }}
    >
      <div
        className="w-full max-w-4xl rounded-3xl overflow-hidden flex shadow-2xl"
        style={{ minHeight: 600, boxShadow: '0 32px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >

        {/* ── Left panel ── */}
        <div
          className="hidden md:flex md:w-[42%] relative flex-col justify-between p-9 overflow-hidden"
          style={{ background: activeTab === 'user'
            ? 'linear-gradient(155deg, #010B24 0%, #02235A 55%, #0040A0 100%)'
            : 'linear-gradient(155deg, #1A0533 0%, #3B0D73 55%, #6D28D9 100%)'
          }}
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-52 h-52 rounded-full opacity-[0.07]" style={{ background: '#FF6000', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-[0.08]" style={{ background: '#60C8FF', transform: 'translate(-30%, 30%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(1,11,36,0.8) 25%, transparent 70%)' }} />

          {/* Top */}
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)', boxShadow: '0 4px 14px rgba(0,100,210,0.4)' }}
              >
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-black" style={{ fontSize: '1.0625rem' }}>Thích Du Lịch</span>
            </div>

            <div
              className="inline-block mt-4 mb-1 px-3 py-1 rounded-full text-xs font-bold tracking-widest"
              style={{ background: 'rgba(255,200,0,0.12)', border: '1px solid rgba(255,200,0,0.25)', color: '#FDE68A' }}
            >
              CHÀO MỪNG BẠN
            </div>
          </div>

          {/* Bottom */}
          <div className="relative">
            <h2
              className="text-white mb-3"
              style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em' }}
            >
              {activeTab === 'user' ? (
                <>Bắt đầu hành trình<br /><span style={{ color: '#60C8FF' }}>khám phá của bạn.</span></>
              ) : (
                <>Trở thành đối tác<br /><span style={{ color: '#C4B5FD' }}>của Thích Du Lịch.</span></>
              )}
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(180,210,255,0.65)' }}>
              {activeTab === 'user'
                ? 'Khám phá những điểm đến tuyệt vời nhất Việt Nam cùng đội ngũ chuyên gia du lịch hàng đầu.'
                : 'Tiếp cận hàng triệu du khách và tăng trưởng doanh thu với nền tảng số hiện đại.'}
            </p>

            <ul className="space-y-2.5">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(200,220,255,0.8)' }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#34D399' }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right form ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 md:px-10 py-10 overflow-y-auto">

          <div className="mb-6">
            <h1
              className="text-gray-900 mb-1.5"
              style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}
            >
              Tạo tài khoản mới
            </h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Điền thông tin bên dưới để tham gia cộng đồng Thích Du Lịch.
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded-2xl p-1 mb-6"
            style={{ background: '#F3F4F6' }}
          >
            {([
              { key: 'user' as TabType, label: '👤 Khách hàng' },
              { key: 'provider' as TabType, label: '🏢 Nhà cung cấp' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setError('');
                  setFieldErrors({});
                }}
                className="flex-1 py-2.5 text-sm rounded-xl transition-all font-bold"
                style={
                  activeTab === tab.key
                    ? { background: 'white', color: '#0064D2', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                    : { color: '#9CA3AF', background: 'transparent' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {error && (
              <div
                className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
              >
                <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">!</div>
                {error}
              </div>
            )}

            {activeTab === 'user' ? (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                    <input
                      type="text" value={userForm.name}
                      onChange={e => { setUserForm({ ...userForm, name: e.target.value }); clearFieldError('name'); }}
                      placeholder="Nguyễn Văn An" required
                      className={`${inputClass} pl-10 pr-4`} style={getInputStyle('name')}
                      onFocus={onFocus('name')} onBlur={onBlur('name')}
                    />
                  </div>
                  <FieldError field="name" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                    <input
                      ref={userEmailInputRef}
                      type="email" value={userForm.email}
                      onChange={e => { setUserForm({ ...userForm, email: e.target.value }); clearFieldError('email'); }}
                      placeholder="email@example.com" required
                      className={`${inputClass} pl-10 pr-4`} style={getInputStyle('email')}
                      onFocus={onFocus('email')} onBlur={onBlur('email')}
                    />
                  </div>
                  <FieldError field="email" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Số điện thoại</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#CBD5E1' }}>+84</span>
                      <input
                        type="tel" value={userForm.phone}
                      onChange={e => { setUserForm({ ...userForm, phone: e.target.value }); clearFieldError('phone'); }}
                        placeholder="912 345 678"
                        className={`${inputClass} pl-11 pr-3`} style={getInputStyle('phone')}
                        onFocus={onFocus('phone')} onBlur={onBlur('phone')}
                      />
                    </div>
                    <FieldError field="phone" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                      <input
                        type={showPassword ? 'text' : 'password'} value={userForm.password}
                        onChange={e => { setUserForm({ ...userForm, password: e.target.value }); clearFieldError('password'); }}
                        placeholder="Ví dụ: Abc@123" required
                        className={`${inputClass} pl-10 pr-10`} style={getInputStyle('password')}
                        onFocus={onFocus('password')} onBlur={onBlur('password')}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#CBD5E1' }}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FieldError field="password" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên công ty</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                      <input
                        type="text" value={providerForm.companyName}
                        onChange={e => { setProviderForm({ ...providerForm, companyName: e.target.value }); clearFieldError('name'); }}
                        placeholder="Công ty Du lịch..." required
                        className={`${inputClass} pl-10 pr-3`} style={getInputStyle('name')}
                        onFocus={onFocus('name')} onBlur={onBlur('name')}
                      />
                    </div>
                    <FieldError field="name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Mã số thuế</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                      <input
                        type="text" value={providerForm.taxCode}
                        onChange={e => setProviderForm({ ...providerForm, taxCode: e.target.value })}
                        placeholder="0123456789"
                        className={`${inputClass} pl-10 pr-3`} style={inputStyle}
                        onFocus={onFocus('taxCode')} onBlur={onBlur('taxCode')}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email doanh nghiệp</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                    <input
                      ref={providerEmailInputRef}
                      type="email" value={providerForm.email}
                      onChange={e => { setProviderForm({ ...providerForm, email: e.target.value }); clearFieldError('email'); }}
                      placeholder="contact@company.com" required
                      className={`${inputClass} pl-10 pr-4`} style={getInputStyle('email')}
                      onFocus={onFocus('email')} onBlur={onBlur('email')}
                    />
                  </div>
                  <FieldError field="email" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                    <input
                      type="tel" value={providerForm.phone}
                      onChange={e => { setProviderForm({ ...providerForm, phone: e.target.value }); clearFieldError('phone'); }}
                      placeholder="090 123 4567"
                      className={`${inputClass} pl-10 pr-4`} style={getInputStyle('phone')}
                      onFocus={onFocus('phone')} onBlur={onBlur('phone')}
                    />
                  </div>
                  <FieldError field="phone" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBD5E1' }} />
                    <input
                      type={showProviderPassword ? 'text' : 'password'} value={providerForm.password}
                      onChange={e => { setProviderForm({ ...providerForm, password: e.target.value }); clearFieldError('password'); }}
                      placeholder="Ví dụ: Abc@123" required
                      className={`${inputClass} pl-10 pr-10`} style={getInputStyle('password')}
                      onFocus={onFocus('password')} onBlur={onBlur('password')}
                    />
                    <button type="button" onClick={() => setShowProviderPassword(!showProviderPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#CBD5E1' }}>
                      {showProviderPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldError field="password" />
                </div>
              </>
            )}

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox" checked={agreed}
                onChange={e => { setAgreed(e.target.checked); clearFieldError('agreed'); }}
                className="w-4 h-4 mt-0.5 rounded"
                style={{ accentColor: '#0064D2' }}
              />
              <span className="text-sm" style={{ color: '#6B7280', lineHeight: 1.6 }}>
                Tôi đồng ý với{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="font-bold hover:underline"
                  style={{ color: '#0064D2' }}
                >
                  Điều khoản dịch vụ
                </button>
                {' '}và{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="font-bold hover:underline"
                  style={{ color: '#0064D2' }}
                >
                  Chính sách bảo mật
                </button>
                {' '}của Thích Du Lịch.
              </span>
            </label>
            {fieldErrors.agreed && <p className="text-xs font-semibold text-red-600">{fieldErrors.agreed}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white text-sm font-bold rounded-xl transition-all hover:opacity-92 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
              style={{
                background: activeTab === 'user'
                  ? 'linear-gradient(135deg, #0064D2, #0091FF)'
                  : 'linear-gradient(135deg, #7C3AED, #9F67FF)',
                boxShadow: activeTab === 'user'
                  ? '0 4px 18px rgba(0,100,210,0.38)'
                  : '0 4px 18px rgba(124,58,237,0.38)',
                letterSpacing: '-0.01em',
              }}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
              ) : (
                <>Đăng ký ngay <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-sm" style={{ color: '#9CA3AF' }}>
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold hover:opacity-75 transition-opacity" style={{ color: '#0064D2' }}>
                Đăng nhập ngay
              </Link>
            </p>
          </form>
        </div>
      </div>
      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}

function LegalModal({ type, onClose }: { type: LegalModalType; onClose: () => void }) {
  if (!type) return null;

  const isTerms = type === 'terms';
  const title = isTerms ? 'Điều khoản dịch vụ' : 'Chính sách bảo mật';
  const intro = isTerms
    ? 'Các điều khoản này áp dụng khi bạn tạo tài khoản, đặt tour hoặc đăng tour trên nền tảng Thích Du Lịch.'
    : 'Chính sách này giải thích cách Thích Du Lịch thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn.';
  const sections = isTerms
    ? [
      {
        heading: '1. Tài khoản và thông tin đăng ký',
        items: [
          'Bạn cần cung cấp thông tin chính xác khi đăng ký và chịu trách nhiệm bảo mật tài khoản của mình.',
          'Không sử dụng thông tin giả mạo, thông tin của người khác hoặc tài khoản cho mục đích gian lận.',
          'Nhà cung cấp cần cung cấp thông tin doanh nghiệp, giấy phép và dữ liệu tour trung thực.',
        ],
      },
      {
        heading: '2. Đặt tour, thanh toán và xác nhận',
        items: [
          'Thông tin tour, giá, lịch khởi hành và số chỗ được hiển thị theo dữ liệu nhà cung cấp cập nhật trên hệ thống.',
          'Đơn đặt tour chỉ được xem là hợp lệ khi được ghi nhận trên hệ thống và đáp ứng điều kiện thanh toán/xác nhận.',
          'Người dùng cần kiểm tra kỹ ngày đi, số lượng khách, thông tin liên hệ và yêu cầu đặc biệt trước khi đặt.',
        ],
      },
      {
        heading: '3. Hủy tour, hoàn tiền và trách nhiệm',
        items: [
          'Chính sách hủy và hoàn tiền phụ thuộc vào trạng thái đơn, thời điểm hủy và phương thức thanh toán.',
          'Các yêu cầu hoàn tiền cần có thông tin tài khoản nhận tiền chính xác để admin xử lý.',
          'Thích Du Lịch có quyền từ chối hoặc tạm khóa tài khoản nếu phát hiện hành vi lạm dụng, spam hoặc vi phạm.',
        ],
      },
      {
        heading: '4. Nội dung đánh giá và báo cáo',
        items: [
          'Đánh giá, báo cáo và hình ảnh gửi lên cần trung thực, lịch sự và không xâm phạm quyền của bên thứ ba.',
          'Admin có thể ẩn, xử lý hoặc yêu cầu bổ sung thông tin đối với nội dung vi phạm hoặc chưa rõ ràng.',
        ],
      },
    ]
    : [
      {
        heading: '1. Dữ liệu được thu thập',
        items: [
          'Thông tin tài khoản như họ tên, email, số điện thoại, vai trò tài khoản và ảnh đại diện nếu có.',
          'Thông tin đặt tour như tour đã chọn, ngày khởi hành, số lượng khách, liên hệ và yêu cầu đặc biệt.',
          'Dữ liệu tương tác như tìm kiếm, xem tour, lưu yêu thích để cải thiện gợi ý và trải nghiệm người dùng.',
        ],
      },
      {
        heading: '2. Mục đích sử dụng dữ liệu',
        items: [
          'Xác thực tài khoản, gửi OTP, xử lý đăng nhập, đặt tour, thanh toán, hủy/hoàn tiền và hỗ trợ khách hàng.',
          'Quản lý provider, duyệt tour, xử lý báo cáo, phản hồi đánh giá và vận hành hệ thống.',
          'Cải thiện chất lượng dịch vụ, cá nhân hóa đề xuất tour và phát hiện hành vi bất thường.',
        ],
      },
      {
        heading: '3. Bảo vệ và chia sẻ dữ liệu',
        items: [
          'Mật khẩu được lưu dưới dạng mã hóa/hash, không lưu mật khẩu thô.',
          'Thông tin chỉ được chia sẻ trong phạm vi cần thiết để xử lý đặt tour, thanh toán, hỗ trợ hoặc tuân thủ pháp luật.',
          'Bạn nên tự bảo vệ thiết bị, email và không chia sẻ mã OTP hoặc mật khẩu cho người khác.',
        ],
      },
      {
        heading: '4. Quyền của người dùng',
        items: [
          'Bạn có thể cập nhật thông tin hồ sơ trong tài khoản hoặc liên hệ hỗ trợ khi cần chỉnh sửa dữ liệu.',
          'Bạn có thể yêu cầu hỗ trợ về tài khoản, đặt tour, hoàn tiền hoặc dữ liệu cá nhân qua kênh liên hệ của hệ thống.',
        ],
      },
    ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="legal-modal-title" className="text-lg font-black text-gray-900">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">{intro}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="space-y-5">
            {sections.map(section => (
              <section key={section.heading}>
                <h3 className="text-sm font-black text-gray-900">{section.heading}</h3>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-gray-600">
                  {section.items.map(item => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            Tôi đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
