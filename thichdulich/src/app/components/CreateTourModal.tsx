"use client";

import { useEffect, useState, useRef } from 'react';
import {
  X, Save, Plus, Trash2, Info, List, Users,
  ChevronRight, ChevronLeft, MapPin, Image as ImageIcon,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import type { Tour } from '../types/domainTypes';
import { getIncludeLabel } from '../utils/includeLabels';
import { suggestedAdvanceBookingDays } from '../contexts/TourManagementContext';
import api from '@/services/api';

interface CreateTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tourData: Omit<Tour, 'id' | 'status' | 'submittedAt'>) => void | Promise<void>;
  editTour?: Tour | null;
  providerId: string;
  providerName: string;
}

type TabKey = 'basic' | 'itinerary' | 'seats';

interface ItineraryDay {
  day: number;
  titleVi: string;
  titleEn: string;
  activitiesVi: string[];
  activitiesEn: string[];
}

type TourCategoryOption = {
  code: Tour['type'];
  name: string;
  active?: boolean;
};

const FALLBACK_TOUR_CATEGORIES: TourCategoryOption[] = [
  { code: 'beach', name: 'Biển đảo' },
  { code: 'nature', name: 'Thiên nhiên' },
  { code: 'mountain', name: 'Núi' },
  { code: 'cultural', name: 'Văn hóa' },
  { code: 'adventure', name: 'Mạo hiểm' },
  { code: 'food', name: 'Ẩm thực' },
  { code: 'city', name: 'Thành phố' },
];

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'basic',     label: 'Thông tin cơ bản',  icon: Info  },
  { key: 'itinerary', label: 'Lịch trình',         icon: List  },
  { key: 'seats',     label: 'Số chỗ & Giá',       icon: Users },
];

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all';

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#DC2626' }}><AlertCircle className="w-3 h-3" />{msg}</p>;
}

export function CreateTourModal({
  isOpen, onClose, onSubmit, editTour, providerId, providerName,
}: CreateTourModalProps) {

  // ── Tab ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabKey>('basic');

  // ── Basic info ────────────────────────────────────────────────────────
  const [nameVi,   setNameVi]   = useState(editTour?.name.vi        || '');
  const [nameEn,   setNameEn]   = useState(editTour?.name.en        || '');
  const [descVi,   setDescVi]   = useState(editTour?.description.vi || '');
  const [descEn,   setDescEn]   = useState(editTour?.description.en || '');
  const [location, setLocation] = useState(editTour?.location       || '');
  const [type,     setType]     = useState<Tour['type']>(editTour?.type || 'beach');
  const [image,    setImage]    = useState(editTour?.image           || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(
    Array.from(new Set(((editTour as any)?.images || []).filter(Boolean)))
  );
  const [included, setIncluded] = useState<string[]>(editTour?.included || []);
  const [excluded, setExcluded] = useState<string[]>((editTour as any)?.excluded || []);
  const includedInputRef = useRef<HTMLInputElement>(null);
  const excludedInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // ── Itinerary ─────────────────────────────────────────────────────────
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    editTour?.itinerary
      ? editTour.itinerary.map(d => ({
          day: d.day,
          titleVi: d.title.vi,
          titleEn: d.title.en,
          activitiesVi: [...d.activities.vi],
          activitiesEn: [...d.activities.en],
        }))
      : [{ day: 1, titleVi: 'Ngày 1', titleEn: 'Ngày 1', activitiesVi: [''], activitiesEn: [''] }]
  );

  // ── Seats & Price ─────────────────────────────────────────────────────
  const [duration, setDuration]   = useState(editTour?.duration || 3);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(
    editTour?.advanceBookingDays || suggestedAdvanceBookingDays(editTour?.duration || 3)
  );
  const [price,    setPrice]      = useState(editTour?.price    || 2500000);
  const [maxSeats, setMaxSeats]   = useState(editTour?.maxSeats || 20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tourCategories, setTourCategories] = useState<TourCategoryOption[]>(FALLBACK_TOUR_CATEGORIES);

  // ── Validation errors ────────────────────────────────────────────────
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (!isOpen) return;
    api.getTourCategories()
      .then((items: any[]) => {
        const next = (items || [])
          .map(item => ({ code: String(item.code || '').toLowerCase() as Tour['type'], name: item.name || item.code }))
          .filter(item => item.code && item.name);
        if (next.length) setTourCategories(next);
      })
      .catch(() => setTourCategories(FALLBACK_TOUR_CATEGORIES));
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Helpers ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!nameVi.trim())    e.nameVi   = 'Bắt buộc';
    if (!descVi.trim())    e.descVi   = 'Bắt buộc';
    if (!location.trim())  e.location = 'Bắt buộc';
    if (!image.trim())     e.image    = 'Bắt buộc';
    if (duration < 1)      e.duration = 'Tối thiểu 1 ngày';
    if (advanceBookingDays < 1) e.advanceBookingDays = 'Tối thiểu 1 ngày';
    if (price <= 0)        e.price    = 'Giá tour phải lớn hơn 0.';
    if (maxSeats < 1)      e.maxSeats = 'Tối thiểu 1 chỗ';
    setErrors(e);
    // Jump to first errored tab
    if (e.nameVi || e.descVi || e.location || e.image) {
      setTab('basic'); return false;
    }
    if (e.duration || e.advanceBookingDays || e.price || e.maxSeats) {
      setTab('seats'); return false;
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        images: Array.from(new Set([image, ...galleryImages].map(url => url.trim()).filter(Boolean))),
        name:        { vi: nameVi, en: nameVi },
        description: { vi: descVi, en: descVi },
        location,
        type,
        duration,
        advanceBookingDays,
        price,
        image,
        rating:       4.5,
        reviews:      0,
        maxSeats,
        availability: true,
        providerId,
        providerName,
        itinerary: itinerary.map(d => ({
          day: d.day,
          title:      { vi: d.titleVi, en: d.titleVi },
          activities: { vi: d.activitiesVi.filter(a => a.trim()), en: d.activitiesVi.filter(a => a.trim()) },
        })),
        included,
        excluded,
      } as any);
      onClose();
      setTab('basic');
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const addIncluded = () => {
    const val = includedInputRef.current?.value.trim();
    if (val) { setIncluded(p => [...p, val]); if (includedInputRef.current) includedInputRef.current.value = ''; }
  };

  const addExcluded = () => {
    const val = excludedInputRef.current?.value.trim();
    if (val) {
      setExcluded(prev => Array.from(new Set([...prev, val])));
      if (excludedInputRef.current) excludedInputRef.current.value = '';
    }
  };

  const addGalleryImage = () => {
    const val = galleryInputRef.current?.value.trim();
    if (!val) return;
    setGalleryImages(prev => Array.from(new Set([...prev, val])));
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeGalleryImage = (url: string) => {
    setGalleryImages(prev => prev.filter(item => item !== url));
  };

  const addDay = () =>
    setItinerary(p => [
      ...p,
      { day: p.length + 1, titleVi: `Ngày ${p.length + 1}`, titleEn: `Ngày ${p.length + 1}`, activitiesVi: [''], activitiesEn: [''] },
    ]);

  const removeDay = (idx: number) =>
    setItinerary(p => p.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })));

  const updateDay = (idx: number, field: keyof ItineraryDay, val: any) =>
    setItinerary(p => { const a = [...p]; a[idx] = { ...a[idx], [field]: val }; return a; });

  const addAct = (dayIdx: number, lang: 'vi' | 'en') =>
    setItinerary(p => {
      const a = [...p];
      const f = lang === 'vi' ? 'activitiesVi' : 'activitiesEn';
      a[dayIdx] = { ...a[dayIdx], [f]: [...a[dayIdx][f], ''] };
      return a;
    });

  const updateAct = (dayIdx: number, actIdx: number, lang: 'vi' | 'en', val: string) =>
    setItinerary(p => {
      const a = [...p];
      const f = lang === 'vi' ? 'activitiesVi' : 'activitiesEn';
      const acts = [...a[dayIdx][f]];
      acts[actIdx] = val;
      a[dayIdx] = { ...a[dayIdx], [f]: acts };
      return a;
    });

  const removeAct = (dayIdx: number, actIdx: number, lang: 'vi' | 'en') =>
    setItinerary(p => {
      const a = [...p];
      const f = lang === 'vi' ? 'activitiesVi' : 'activitiesEn';
      a[dayIdx] = { ...a[dayIdx], [f]: a[dayIdx][f].filter((_, i) => i !== actIdx) };
      return a;
    });

  // ── Tab completion indicators ─────────────────────────────────────────
  const basicDone   = !!(nameVi && descVi && location && image);
  const seatsDone   = duration >= 1 && price > 0 && maxSeats >= 1;
  const tabDone: Record<TabKey, boolean> = {
    basic:     basicDone,
    itinerary: itinerary.length > 0 && itinerary.every(d => d.titleVi.trim()),
    seats:     seatsDone,
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full flex flex-col shadow-2xl"
        style={{ maxWidth: 860, maxHeight: '95vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="px-7 py-5 flex items-center justify-between flex-shrink-0 rounded-t-2xl"
          style={{ background: 'linear-gradient(135deg, #0A2540, #1E3A5F)' }}
        >
          <div>
            <h2 className="font-black text-white text-lg">
              {editTour ? '✏️ Chỉnh sửa tour' : '➕ Tạo tour mới'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Điền đầy đủ thông tin — Admin sẽ xét duyệt trước khi tour hiển thị
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 px-7 border-b border-gray-100 flex-shrink-0 bg-white">
          {TABS.map((t, i) => {
            const Icon   = t.icon;
            const active = tab === t.key;
            const done   = tabDone[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 -mb-px transition-all"
                style={{
                  borderBottomColor: active ? '#0064D2' : 'transparent',
                  color: active ? '#0064D2' : '#94A3B8',
                }}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {done && !active && (
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <span className="hidden sm:inline">{t.label}</span>
                <span className="inline sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-7 py-6">

          {/* ── TAB: Thông tin cơ bản ── */}
          {tab === 'basic' && (
            <div className="space-y-5">
              {/* Tên tour */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tên tour (Tiếng Việt) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={nameVi}
                    onChange={e => { setNameVi(e.target.value); setErrors(p => ({ ...p, nameVi: '' })); }}
                    placeholder="VD: Khám phá Vịnh Hạ Long"
                    className={inputCls}
                    style={{ borderColor: errors.nameVi ? '#FCA5A5' : '' }}
                  />
                  <FieldError msg={errors.nameVi} />
                </div>
              </div>

              {/* Địa điểm + Loại */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" style={{ color: '#0064D2' }} />
                    Địa điểm <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => { setLocation(e.target.value); setErrors(p => ({ ...p, location: '' })); }}
                    placeholder="VD: Quảng Ninh, Đà Nẵng..."
                    className={inputCls}
                    style={{ borderColor: errors.location ? '#FCA5A5' : '' }}
                  />
                  <FieldError msg={errors.location} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Loại hình tour</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as Tour['type'])}
                    className={inputCls}
                  >
                    {tourCategories.map(category => (
                      <option key={category.code} value={category.code}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mô tả */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Mô tả tour (Tiếng Việt) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <textarea
                    value={descVi}
                    onChange={e => { setDescVi(e.target.value); setErrors(p => ({ ...p, descVi: '' })); }}
                    placeholder="Mô tả chi tiết về trải nghiệm, điểm tham quan nổi bật..."
                    rows={4}
                    className={`${inputCls} resize-none`}
                    style={{ borderColor: errors.descVi ? '#FCA5A5' : '' }}
                  />
                  <FieldError msg={errors.descVi} />
                </div>
              </div>

              {/* Ảnh */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <ImageIcon className="w-3.5 h-3.5 inline mr-1" style={{ color: '#0064D2' }} />
                  URL ảnh đại diện <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={e => { setImage(e.target.value); setErrors(p => ({ ...p, image: '' })); }}
                  placeholder="https://images.unsplash.com/..."
                  className={inputCls}
                  style={{ borderColor: errors.image ? '#FCA5A5' : '' }}
                />
                <FieldError msg={errors.image} />
                {image && (
                  <div className="mt-2 relative rounded-xl overflow-hidden h-36 bg-gray-100">
                    <img
                      src={image}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Thư viện ảnh tour
                </label>
                <div className="flex gap-2">
                  <input
                    ref={galleryInputRef}
                    type="url"
                    className={inputCls}
                    placeholder="Dán URL ảnh khác của tour..."
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGalleryImage(); } }}
                  />
                  <button
                    type="button"
                    onClick={addGalleryImage}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0"
                    style={{ background: '#0064D2' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Ảnh đại diện sẽ tự được lưu là ảnh đầu tiên. Các ảnh dưới đây hiển thị trong gallery chi tiết tour.</p>
                {galleryImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {galleryImages.map(url => (
                      <div key={url} className="group relative h-28 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                        <img
                          src={url}
                          alt="Ảnh tour"
                          className="h-full w-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(url)}
                          className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Xóa ảnh"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dịch vụ bao gồm */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dịch vụ bao gồm trong tour</label>
                {included.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {included.map((item, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                        style={{ background: '#ECFDF5', color: '#059669' }}
                      >
                        ✓ {getIncludeLabel(item)}
                        <button
                          onClick={() => setIncluded(p => p.filter((_, j) => j !== i))}
                          className="ml-0.5 opacity-60 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={includedInputRef}
                    type="text"
                    className={inputCls}
                    placeholder="VD: Bữa sáng, Xe đưa đón, Hướng dẫn viên, ..."
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIncluded(); } }}
                  />
                  <button
                    type="button"
                    onClick={addIncluded}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0"
                    style={{ background: '#059669' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Nhấn Enter hoặc nút ➕ để thêm từng dịch vụ</p>
                {/* Quick add chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Bữa sáng', 'Bữa trưa', 'Xe đưa đón', 'Hướng dẫn viên', 'Vé tham quan', 'Khách sạn', 'Bảo hiểm du lịch', 'Nước uống'].map(s => (
                    !included.includes(s) && (
                      <button
                        key={s}
                        onClick={() => setIncluded(p => [...p, s])}
                        className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-blue-400 hover:bg-blue-50"
                        style={{ borderColor: '#E2E8F0', color: '#64748B' }}
                      >
                        + {s}
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dịch vụ không bao gồm trong tour</label>
                {excluded.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {excluded.map((item, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                        style={{ background: '#FEF2F2', color: '#DC2626' }}
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setExcluded(p => p.filter((_, j) => j !== i))}
                          className="ml-0.5 opacity-60 hover:opacity-100"
                          aria-label="Xóa dịch vụ không bao gồm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={excludedInputRef}
                    type="text"
                    className={inputCls}
                    placeholder="VD: Vé máy bay, Chi phí cá nhân, Phụ thu phòng đơn..."
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExcluded(); } }}
                  />
                  <button
                    type="button"
                    onClick={addExcluded}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0"
                    style={{ background: '#DC2626' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Vé máy bay', 'Chi phí cá nhân', 'Đồ uống ngoài chương trình', 'Phụ thu phòng đơn', 'VAT', 'Tip hướng dẫn viên'].map(s => (
                    !excluded.includes(s) && (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setExcluded(p => [...p, s])}
                        className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-red-300 hover:bg-red-50"
                        style={{ borderColor: '#E2E8F0', color: '#64748B' }}
                      >
                        + {s}
                      </button>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Lịch trình ── */}
          {tab === 'itinerary' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-700">Lịch trình chi tiết theo ngày</p>
                  <p className="text-xs text-gray-400 mt-0.5">Thêm tiêu đề và các hoạt động cho từng ngày</p>
                </div>
                <button
                  onClick={addDay}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#0064D2' }}
                >
                  <Plus className="w-4 h-4" /> Thêm ngày
                </button>
              </div>

              {itinerary.length === 0 ? (
                <div
                  className="text-center py-14 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: '#CBD5E1', background: '#F8FAFC' }}
                >
                  <List className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400 mb-3">Chưa có lịch trình. Bấm "Thêm ngày" để bắt đầu.</p>
                  <button
                    onClick={addDay}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: '#0064D2' }}
                  >
                    <Plus className="w-4 h-4 inline mr-1.5" />Thêm ngày đầu tiên
                  </button>
                </div>
              ) : itinerary.map((day, dayIdx) => (
                <div key={dayIdx} className="rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Day header */}
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black"
                        style={{ background: '#0064D2' }}
                      >
                        {day.day}
                      </div>
                      <span className="text-sm font-bold text-gray-700">Ngày {day.day}</span>
                    </div>
                    <button
                      onClick={() => removeDay(dayIdx)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Titles */}                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Tiêu đề ngày *</label>
                        <input
                          type="text"
                          value={day.titleVi}
                          onChange={e => updateDay(dayIdx, 'titleVi', e.target.value)}
                          placeholder="VD: Khởi hành - Tham quan Hạ Long"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Activities */}                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Hoạt động</label>
                        <div className="space-y-2">
                          {day.activitiesVi.map((act, actIdx) => (
                            <div key={actIdx} className="flex gap-2">
                              <input
                                type="text"
                                value={act}
                                onChange={e => updateAct(dayIdx, actIdx, 'vi', e.target.value)}
                                placeholder="Hoạt động trong ngày..."
                                className={inputCls}
                              />
                              <button
                                onClick={() => removeAct(dayIdx, actIdx, 'vi')}
                                className="p-2 rounded-xl hover:bg-red-50 flex-shrink-0 transition-colors"
                                style={{ color: '#EF4444', border: '1px solid #FECACA' }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addAct(dayIdx, 'vi')}
                            className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            style={{ border: '1.5px dashed #BFDBFE', color: '#0064D2', background: '#F8FBFF' }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Thêm hoạt động
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: Số chỗ & Giá ── */}
          {tab === 'seats' && (
            <div className="space-y-6">
              {/* Price + Duration row */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Giá tour (₫ / người) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    min={0}
                    step={100000}
                    onChange={e => { setPrice(Number(e.target.value)); setErrors(p => ({ ...p, price: '' })); }}
                    className={inputCls}
                    style={{ borderColor: errors.price ? '#FCA5A5' : '' }}
                  />
                  <FieldError msg={errors.price} />
                  {price > 0 && (
                    <p className="text-xs mt-1 font-semibold" style={{ color: '#0064D2' }}>
                      ≈ {new Intl.NumberFormat('vi-VN').format(price)} ₫
                    </p>
                  )}
                  {/* Price presets */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[1500000, 2500000, 3500000, 5000000, 8000000].map(p => (
                      <button
                        key={p}
                        onClick={() => setPrice(p)}
                        className="text-xs px-3 py-1 rounded-full border transition-all"
                        style={{
                          borderColor: price === p ? '#0064D2' : '#E2E8F0',
                          background:  price === p ? '#EFF6FF' : 'white',
                          color:       price === p ? '#0064D2' : '#64748B',
                          fontWeight:  price === p ? 700 : 500,
                        }}
                      >
                        {new Intl.NumberFormat('vi-VN').format(p)}₫
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Thời lượng (ngày) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={duration}
                    min={1}
                    onChange={e => {
                      const nextDuration = Number(e.target.value);
                      setDuration(nextDuration);
                      setAdvanceBookingDays(suggestedAdvanceBookingDays(nextDuration));
                      setErrors(p => ({ ...p, duration: '', advanceBookingDays: '' }));
                    }}
                    className={inputCls}
                    style={{ borderColor: errors.duration ? '#FCA5A5' : '' }}
                  />
                  <FieldError msg={errors.duration} />
                  {duration >= 1 && (
                    <p className="text-xs mt-1 text-gray-400">{duration} ngày {duration - 1} đêm</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 7, 10, 14].map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDuration(d);
                          setAdvanceBookingDays(suggestedAdvanceBookingDays(d));
                        }}
                        className="text-xs px-3 py-1 rounded-full border transition-all"
                        style={{
                          borderColor: duration === d ? '#0064D2' : '#E2E8F0',
                          background:  duration === d ? '#EFF6FF' : 'white',
                          color:       duration === d ? '#0064D2' : '#64748B',
                          fontWeight:  duration === d ? 700 : 500,
                        }}
                      >
                        {d}N
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px] sm:items-start">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Đặt trước tối thiểu (ngày) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <p className="text-xs leading-relaxed text-gray-500">
                      Hệ thống tự gợi ý theo thời lượng tour, provider có thể chỉnh nếu cần thêm thời gian chuẩn bị.
                    </p>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={advanceBookingDays}
                      min={1}
                      onChange={e => {
                        setAdvanceBookingDays(Number(e.target.value));
                        setErrors(p => ({ ...p, advanceBookingDays: '' }));
                      }}
                      className={inputCls}
                      style={{ borderColor: errors.advanceBookingDays ? '#FCA5A5' : '' }}
                    />
                    <FieldError msg={errors.advanceBookingDays} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 3, 5, 7].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setAdvanceBookingDays(days)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all"
                      style={{
                        borderColor: advanceBookingDays === days ? '#0064D2' : '#BFDBFE',
                        background: advanceBookingDays === days ? '#0064D2' : 'white',
                        color: advanceBookingDays === days ? 'white' : '#0064D2',
                        fontWeight: 700,
                      }}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
              </div>

              {/* Max seats */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Sức chứa tối đa <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={maxSeats}
                    min={1}
                    onChange={e => { setMaxSeats(Number(e.target.value)); setErrors(p => ({ ...p, maxSeats: '' })); }}
                    className={inputCls}
                    style={{ borderColor: errors.maxSeats ? '#FCA5A5' : '' }}
                  />
                  <FieldError msg={errors.maxSeats} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">Chọn nhanh</p>
                  <div className="flex flex-wrap gap-2">
                    {[8, 10, 15, 20, 25, 30, 40, 50].map(n => (
                      <button
                        key={n}
                        onClick={() => setMaxSeats(n)}
                        className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: maxSeats === n ? '#0064D2' : '#F1F5F9',
                          color:      maxSeats === n ? 'white'   : '#64748B',
                        }}
                      >
                        {n} chỗ
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary card */}
              <div
                className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1.5px solid #BFDBFE' }}
              >
                <p className="text-sm font-black text-blue-900 mb-4">📋 Tóm tắt tour</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Tên tour',      value: nameVi    || '(Chưa nhập)' },
                    { label: 'Địa điểm',      value: location  || '(Chưa nhập)' },
                    { label: 'Thời lượng',    value: `${duration} ngày ${duration - 1} đêm` },
                    { label: 'Đặt trước',      value: `${advanceBookingDays} ngày` },
                    { label: 'Loại hình',     value: type },
                    { label: 'Giá',           value: price > 0 ? new Intl.NumberFormat('vi-VN').format(price) + ' ₫' : '(Chưa nhập)' },
                    { label: 'Sức chứa',      value: `${maxSeats} chỗ` },
                    { label: 'Số ngày lịch trình', value: `${itinerary.length} ngày` },
                    { label: 'Dịch vụ bao gồm', value: included.length > 0 ? `${included.length} mục` : '(Chưa thêm)' },
                    { label: 'Không bao gồm', value: excluded.length > 0 ? `${excluded.length} mục` : '(Chưa thêm)' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/70 rounded-xl p-3">
                      <p className="text-xs text-blue-600 mb-0.5">{s.label}</p>
                      <p className="text-sm font-bold text-blue-900 truncate">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-7 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0 bg-white rounded-b-2xl"
        >
          {/* Prev / Next */}
          {tab !== 'basic' && (
            <button
              onClick={() => setTab(tab === 'itinerary' ? 'basic' : 'itinerary')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors"
              style={{ background: '#F1F5F9', color: '#64748B' }}
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
          )}

          {tab !== 'seats' ? (
            <button
              onClick={() => setTab(tab === 'basic' ? 'itinerary' : 'seats')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 ml-auto"
              style={{ background: '#0064D2' }}
            >
              Tiếp theo <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}

          {tab === 'seats' && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 shadow-md ml-auto disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
            >
              <Save className="w-4 h-4" />
              {editTour ? 'Lưu thay đổi' : 'Gửi tour để duyệt'}
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl text-sm font-bold"
            style={{ background: '#F1F5F9', color: '#64748B' }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
