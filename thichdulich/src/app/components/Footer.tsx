import { useState } from 'react';
import { Link } from 'react-router';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Twitter, ArrowRight, CheckCircle2 } from 'lucide-react';

const popularDestinations = [
  { label: 'Vịnh Hạ Long', to: '/destinations/ha-long/tours' },
  { label: 'Phố cổ Hội An', to: '/destinations/hoi-an/tours' },
  { label: 'Sapa', to: '/destinations/sapa/tours' },
  { label: 'Phú Quốc', to: '/destinations/phu-quoc/tours' },
  { label: 'Nha Trang', to: '/destinations/nha-trang/tours' },
  { label: 'Đà Lạt', to: '/destinations/dalat/tours' },
];

const quickLinks = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Điểm đến', to: '/destinations' },
  { label: 'Giới thiệu', to: '/about' },
  { label: 'Liên hệ', to: '/contact' },
  { label: 'Điều khoản sử dụng', to: '/' },
  { label: 'Chính sách bảo mật', to: '/' },
];

const socials = [
  { Icon: Facebook, href: '#', label: 'Facebook', color: '#1877F2' },
  { Icon: Instagram, href: '#', label: 'Instagram', color: '#E4405F' },
  { Icon: Youtube, href: '#', label: 'YouTube', color: '#FF0000' },
  { Icon: Twitter, href: '#', label: 'Twitter/X', color: '#1D9BF0' },
];

const badges = [
  { text: 'Bộ VHTTDL cấp phép', sub: 'Kinh doanh lữ hành' },
  { text: 'SSL Secured', sub: 'Thanh toán bảo mật' },
  { text: 'ISO 9001:2015', sub: 'Chất lượng được công nhận' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 4000);
    setEmail('');
  };

  return (
    <footer style={{ background: '#080F1C' }}>

      {/* ── Newsletter banner ── */}
      <div style={{ background: 'linear-gradient(135deg, #0A1E3D 0%, #0D2B5E 50%, #0A1E3D 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(255,96,0,0.15)', border: '1px solid rgba(255,96,0,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-xs font-bold" style={{ color: '#FF8C40' }}>ƯU ĐÃI ĐỘC QUYỀN</span>
              </div>
              <h3 className="text-white mb-1" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Nhận deal hot mỗi tuần
              </h3>
              <p className="text-sm" style={{ color: 'rgba(180,210,255,0.65)' }}>
                Đặt tour giảm đến 30% chỉ dành cho thành viên newsletter
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:min-w-[380px]">
              {subscribed ? (
                <div className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-green-400" style={{ background: 'rgba(34,197,94,0.12)', border: '1.5px solid rgba(34,197,94,0.25)' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  Đăng ký thành công!
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..."
                    className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 text-white placeholder-white/30"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1.5px solid rgba(255,255,255,0.1)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white whitespace-nowrap transition-all hover:shadow-lg hover:-translate-y-px active:translate-y-0"
                    style={{ background: 'linear-gradient(135deg, #FF6000, #FF8C00)', boxShadow: '0 4px 16px rgba(255,96,0,0.35)' }}
                  >
                    Đăng ký
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── Main footer ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)', boxShadow: '0 4px 16px rgba(0,100,210,0.3)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M12 2L9 8H3L8 12.5L6 19L12 15.5L18 19L16 12.5L21 8H15L12 2Z" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5 leading-tight">
                <span className="text-white font-black" style={{ fontSize: '1.0625rem', letterSpacing: '-0.5px' }}>Thích Du Lịch</span>
                <span style={{ fontSize: '0.6rem', lineHeight: 1.25, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Du lịch Việt Nam</span>
              </div>
            </Link>

            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(180,200,255,0.5)', lineHeight: '1.75' }}>
              Nền tảng du lịch số hàng đầu Việt Nam. Khám phá, đặt tour và tận hưởng những hành trình tuyệt vời cùng đội ngũ chuyên gia.
            </p>

            {/* Socials */}
            <div className="flex gap-2.5">
              {socials.map(({ Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = `${color}20`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </a>
              ))}
            </div>
          </div>

          {/* Destinations */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-3.5 w-0.5 rounded-full" style={{ background: '#0064D2' }} />
              <h4 className="text-white font-bold" style={{ fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Điểm đến nổi bật
              </h4>
            </div>
            <ul className="space-y-3">
              {popularDestinations.map((dest) => (
                <li key={dest.label}>
                  <Link
                    to={dest.to}
                    className="text-sm group flex items-center gap-2 transition-all duration-150 w-fit"
                    style={{ color: 'rgba(180,200,255,0.5)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(180,200,255,0.5)'; }}
                  >
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0 transition-all duration-150"
                      style={{ background: 'rgba(0,100,210,0.5)' }}
                    />
                    {dest.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-3.5 w-0.5 rounded-full" style={{ background: '#FF6000' }} />
              <h4 className="text-white font-bold" style={{ fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Liên kết nhanh
              </h4>
            </div>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm transition-all duration-150"
                    style={{ color: 'rgba(180,200,255,0.5)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(180,200,255,0.5)'; }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-3.5 w-0.5 rounded-full" style={{ background: '#059669' }} />
              <h4 className="text-white font-bold" style={{ fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Liên hệ
              </h4>
            </div>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(0,100,210,0.15)' }}>
                  <MapPin className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
                </div>
                <span className="text-sm leading-relaxed" style={{ color: 'rgba(180,200,255,0.5)' }}>
                  123 Nguyễn Huệ, Quận 1,<br />TP. Hồ Chí Minh
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,100,210,0.15)' }}>
                  <Phone className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
                </div>
                <a
                  href="tel:19006789"
                  className="text-sm transition-colors"
                  style={{ color: 'rgba(180,200,255,0.5)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(180,200,255,0.5)'; }}
                >
                  1900 6789
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,100,210,0.15)' }}>
                  <Mail className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
                </div>
                <a
                  href="mailto:hello@thichdulich.vn"
                  className="text-sm transition-colors"
                  style={{ color: 'rgba(180,200,255,0.5)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(180,200,255,0.5)'; }}
                >
                  hello@thichdulich.vn
                </a>
              </li>
            </ul>

            {/* Working hours */}
            <div className="mt-5 px-3.5 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider">Giờ hỗ trợ</p>
              <p className="text-sm font-semibold text-white/75">Thứ 2 – Chủ nhật</p>
              <p className="text-xs" style={{ color: 'rgba(180,200,255,0.45)' }}>7:30 – 22:00 (GMT+7)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust badges ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {badges.map(({ text, sub }) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>{text}</p>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-center sm:text-left" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} Thích Du Lịch. Giấy phép kinh doanh lữ hành số 01-001/LHNĐ-TCDL.
          </p>
          <div className="flex items-center gap-4">
            {['Điều khoản', 'Bảo mật', 'Cookie'].map(item => (
              <a
                key={item}
                href="#"
                className="transition-colors"
                style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
