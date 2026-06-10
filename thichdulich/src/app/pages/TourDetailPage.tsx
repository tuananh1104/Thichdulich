"use client";

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bus,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Hotel,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Share2,
  Shield,
  Star,
  Ticket,
  Utensils,
  User as UserIcon,
  X,
} from 'lucide-react';
import api from '@/services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import { TourCard } from '../components/TourCard';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoriteContext';
import { suggestedAdvanceBookingDays, toTour, useTourManagement } from '../contexts/TourManagementContext';
import type { Tour } from '../types/domainTypes';
import { AIRecommendationService } from '../services/AIRecommendationService';
import { getDestinationByText } from '../data/destinationCatalog';
import { cleanText } from '../utils/text';
import { getTourFallbackImage, getTourImage, isMismatchedHalongImage } from '../utils/tourImages';
import { getTourTypeLabel as getSharedTourTypeLabel } from '../utils/labels';

interface TourReviewView {
  id: string;
  userName?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt?: string;
  providerResponse?: string;
  responseDate?: string;
}

const INCLUDE_META: Record<string, { icon: any; vi: string; en: string }> = {
  accommodation: { icon: Hotel, vi: 'Lưu trú theo chương trình', en: 'Accommodation as listed' },
  meals: { icon: Utensils, vi: 'Bữa ăn theo chương trình', en: 'Meals as per itinerary' },
  transportation: { icon: Bus, vi: 'Xe đưa đón du lịch', en: 'Tour transportation' },
  tourGuide: { icon: UserIcon, vi: 'Hướng dẫn viên', en: 'Tour guide' },
  entrance: { icon: Ticket, vi: 'Vé tham quan', en: 'Entrance tickets' },
  insurance: { icon: Shield, vi: 'Bảo hiểm du lịch', en: 'Travel insurance' },
};

function getTourTypeLabel(type: Tour['type']) {
  const labels: Record<string, { vi: string; en: string }> = {
    beach: { vi: 'Biển đảo', en: 'Beach escape' },
    mountain: { vi: 'Núi và săn mây', en: 'Mountain escape' },
    cultural: { vi: 'Văn hóa bản địa', en: 'Local culture' },
    food: { vi: 'Ẩm thực đặc sản', en: 'Local food' },
    adventure: { vi: 'Khám phá năng động', en: 'Active adventure' },
    city: { vi: 'Thành phố và check-in', en: 'City highlights' },
    nature: { vi: 'Thiên nhiên thư giãn', en: 'Nature retreat' },
  };
  return labels[type]?.vi || getSharedTourTypeLabel(type);
}

function getOverviewHighlights(tour: Tour) {
  const location = cleanText(tour.location);
  return [
    {
      icon: Camera,
      title: 'Điểm đặc sắc',
      text: `Tập trung vào trải nghiệm ${getTourTypeLabel(tour.type).toLowerCase()} tại ${location}, có thời gian chụp ảnh và tự do khám phá.`,
    },
    {
      icon: Check,
      title: 'Lịch trình dễ đi',
      text: `${tour.duration} ngày được chia nhịp rõ ràng giữa di chuyển, tham quan, ăn uống và nghỉ ngơi.`,
    },
    {
      icon: Shield,
      title: 'Dịch vụ trọn gói',
      text: 'Có xe đưa đón, hướng dẫn viên, vé tham quan chính và hỗ trợ trong suốt chuyến đi.',
    },
  ];
}

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function TourDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const { tours: allTours, loading: contextLoading } = useTourManagement();

  const [fetchedTour, setFetchedTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateError, setDateError] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [reviews, setReviews] = useState<TourReviewView[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const contextTour = allTours.find((tour) => tour.id === id && tour.status === 'approved');
  const tour = contextTour || fetchedTour;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getTourById(id)
      .then((data) => setFetchedTour(toTour(data)))
      .catch(() => setFetchedTour(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    AIRecommendationService.saveUserInteraction({
      userId: user.id,
      tourId: id,
      action: 'view',
      timestamp: new Date().toISOString(),
    });
    api.saveInteraction({ tourId: id, action: 'view' }).catch(() => {});
  }, [user?.id, id]);

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    api.getReviews(id)
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        setReviews(items.map((review: any) => ({
          id: review.id,
          userName: cleanText(review.userName || 'Du khách'),
          rating: review.rating || 0,
          comment: cleanText(review.comment || ''),
          images: review.images || [],
          createdAt: review.createdAt,
          providerResponse: cleanText(review.providerResponse || ''),
          responseDate: review.responseDate,
        })));
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const destination = useMemo(() => getDestinationByText(tour?.location, tour?.name.vi, (tour as any)?.destinationId), [tour]);
  const tourName = cleanText(tour?.name.vi || tour?.name.en);
  const tourDescription = cleanText(tour?.description.vi || tour?.description.en);
  const overviewHighlights = useMemo(() => (tour ? getOverviewHighlights(tour) : []), [tour]);

  const tourImages = useMemo(() => {
    const images = [
      getTourImage(tour?.image, tour),
      ...((tour as any)?.images || []),
      ...(destination?.gallery || []),
      getTourFallbackImage(tour),
    ].filter((image) => image && !isMismatchedHalongImage(image, tour)) as string[];
    return Array.from(new Set(images)).slice(0, 5);
  }, [tour, destination]);

  const itinerary = useMemo(() => {
    const items = ((tour as any)?.itinerary || []).filter(Boolean);
    if (items.length) {
      return items.map((item: any) => ({
        day: item.day,
        title: cleanText(typeof item.title === 'object' ? item.title.vi || item.title.en : item.title),
        activities: Array.isArray(item.activities) ? item.activities.map(cleanText) : [],
      }));
    }

    const days = Math.max(1, tour?.duration || 1);
    return Array.from({ length: days }, (_, index) => ({
      day: index + 1,
      title: index === 0
        ? `Khởi hành đến ${cleanText(tour?.location) || 'điểm đến'}`
        : index === days - 1
          ? 'Tự do trải nghiệm và trở về'
          : `Khám phá ${cleanText(tour?.location) || 'địa phương'}`,
      activities: ['Di chuyển theo lịch trình', 'Tham quan điểm nổi bật', 'Ăn uống và nghỉ ngơi theo chương trình'],
    }));
  }, [tour]);

  const included = useMemo(() => {
    const keys = ((tour as any)?.included?.length ? (tour as any).included : ['transportation', 'tourGuide', 'entrance', 'insurance']);
    return keys.map((key: string) => INCLUDE_META[key] || { icon: Check, vi: cleanText(key), en: cleanText(key) });
  }, [tour]);

  const excluded = useMemo(() => {
    const items = ((tour as any)?.excluded?.length
      ? (tour as any).excluded
      : ['V\u00e9 m\u00e1y bay', 'Chi ph\u00ed c\u00e1 nh\u00e2n', '\u0110\u1ed3 u\u1ed1ng ngo\u00e0i ch\u01b0\u01a1ng tr\u00ecnh', 'Ph\u1ee5 thu ph\u00f2ng \u0111\u01a1n']);
    return items.map(cleanText).filter(Boolean);
  }, [tour]);

  const relatedTours = allTours
    .filter((item) => item.id !== id && item.status === 'approved' && (!tour || item.location === tour.location || item.type === tour.type))
    .slice(0, 3);

  if ((loading || contextLoading) && !tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Đang tải tour...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy tour</h2>
          <Link to="/destinations">
            <Button>Quay lại danh sách tour</Button>
          </Link>
        </div>
      </div>
    );
  }

  const calculateTotal = () => Math.round((adults + children * 0.7) * tour.price);
  const advanceBookingDays = tour.advanceBookingDays || suggestedAdvanceBookingDays(tour.duration);
  const earliestDepartureDate = startOfDay(new Date());
  earliestDepartureDate.setDate(earliestDepartureDate.getDate() + advanceBookingDays);

  const handleBooking = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!selectedDate) {
      setDateError('Vui lòng chọn ngày khởi hành');
      return;
    }
    if (startOfDay(selectedDate).getTime() < earliestDepartureDate.getTime()) {
      setDateError(`Tour này cần đặt trước tối thiểu ${advanceBookingDays} ngày. Ngày sớm nhất là ${earliestDepartureDate.toLocaleDateString('vi-VN')}.`);
      return;
    }
    navigate(`/booking/${id}`, { state: { date: selectedDate, adults, children, total: calculateTotal() } });
  };

  const handleBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1);
      return;
    }

    navigate(destination ? `/destinations/${destination.id}/tours` : '/destinations');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: tourName, text: tourDescription, url: window.location.href });
      return;
    }
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép link');
  };

  const handleFavorite = async () => {
    if (!tour) return;
    await toggleFavorite(tour);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/destinations" className="hover:text-primary transition-colors">Điểm đến</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium truncate">{tourName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2">
            <div className="grid grid-cols-4 gap-3 mb-8">
              <GalleryImage image={tourImages[0]} name={tourName} className="col-span-4 md:col-span-3 md:row-span-2 h-[400px]" onClick={() => { setSelectedImageIndex(0); setShowLightbox(true); }} />
              {tourImages.slice(1, 5).map((image, index) => (
                <GalleryImage key={image} image={image} name={tourName} className="h-[120px] md:h-[193px]" onClick={() => { setSelectedImageIndex(index + 1); setShowLightbox(true); }} overlay={index === 3 ? tourImages.length : undefined} />
              ))}
            </div>

            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{tourName}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{cleanText(tour.location)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{tour.duration} ngày</span>
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{tour.rating} ({tour.reviews} đánh giá)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleFavorite}>
                  <Heart className={`w-4 h-4 ${isFavorite(tour.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-6 overflow-x-auto">
                {[
                  ['overview', 'Tổng quan'],
                  ['itinerary', 'Lịch trình'],
                  ['included', 'Bao gồm'],
                  ['reviews', `Đánh giá (${tour.reviews || reviews.length || 0})`],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`pb-4 text-sm font-semibold border-b-2 whitespace-nowrap ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'overview' && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Thông tin tour</h2>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                    <p className="text-base leading-8 text-gray-700 whitespace-pre-line">{tourDescription || 'Thông tin chi tiết đang được nhà cung cấp cập nhật.'}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {overviewHighlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                          <Icon className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm leading-6 text-gray-600">{item.text}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <InfoCard label="Điểm đến" value={cleanText(tour.location)} />
                  <InfoCard label="Thời lượng" value={`${tour.duration} ngày`} />
                  <InfoCard label="Nhà cung cấp" value={cleanText(tour.providerName)} />
                </div>
              </section>
            )}

            {activeTab === 'itinerary' && (
              <section className="space-y-4">
                {itinerary.map((day: any) => (
                  <Card key={day.day} className="border-2">
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">{day.day}</div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-3">{day.title}</h3>
                          <ul className="space-y-2">
                            {day.activities.map((activity: string, index: number) => (
                              <li key={index} className="flex gap-2 text-gray-600">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {activity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}

            {activeTab === 'included' && (
              <section className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Check className="w-6 h-6 text-green-600" />
                    Dịch vụ bao gồm
                  </h3>
                  <div className="space-y-3">
                    {included.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-gray-700">{item.vi}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <X className="w-6 h-6 text-red-600" />
                    {'Kh\u00f4ng bao g\u1ed3m'}
                  </h3>
                  {excluded.map((item) => (
                    <div key={item} className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <X className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'reviews' && (
              <ReviewsSection
                reviews={reviews}
                loading={reviewsLoading}
                totalCount={tour.reviews || reviews.length || 0}
                rating={tour.rating || 0}
              />
            )}
          </main>

          <aside>
            <BookingCard
              tour={tour}
              selectedDate={selectedDate}
              setSelectedDate={(date: Date | null) => {
                setSelectedDate(date);
                if (dateError) setDateError('');
              }}
              dateError={dateError}
              adults={adults}
              setAdults={setAdults}
              children={children}
              setChildren={setChildren}
              total={calculateTotal()}
              advanceBookingDays={advanceBookingDays}
              earliestDepartureDate={earliestDepartureDate}
              onBook={handleBooking}
            />
          </aside>
        </div>

        {relatedTours.length > 0 && (
          <section className="mt-16 pt-16 border-t-2 border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Tour tương tự</h2>
              <Link to="/destinations"><Button variant="outline">Xem điểm đến</Button></Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedTours.map((relatedTour) => <TourCard key={relatedTour.id} tour={relatedTour} />)}
            </div>
          </section>
        )}
      </div>

      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setShowLightbox(false)}>
          <button onClick={() => setShowLightbox(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"><X className="w-8 h-8" /></button>
          <button onClick={(event) => { event.stopPropagation(); setSelectedImageIndex((prev) => (prev === 0 ? tourImages.length - 1 : prev - 1)); }} className="absolute left-4 text-white hover:text-gray-300 z-10"><ChevronLeft className="w-12 h-12" /></button>
          <img src={tourImages[selectedImageIndex]} alt={tourName} className="max-w-[90%] max-h-[90%] object-contain" onClick={(event) => event.stopPropagation()} />
          <button onClick={(event) => { event.stopPropagation(); setSelectedImageIndex((prev) => (prev === tourImages.length - 1 ? 0 : prev + 1)); }} className="absolute right-4 text-white hover:text-gray-300 z-10"><ChevronRight className="w-12 h-12" /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">{selectedImageIndex + 1} / {tourImages.length}</div>
        </div>
      )}

      {showLoginModal && (
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          returnTo={`/tours/${id}`}
          message="Bạn cần đăng nhập để đặt tour. Chỉ mất vài giây thôi!"
        />
      )}
    </div>
  );
}

function ReviewsSection({
  reviews,
  loading,
  totalCount,
  rating,
}: {
  reviews: TourReviewView[];
  loading: boolean;
  totalCount: number;
  rating: number;
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Đánh giá từ du khách</h2>
            <p className="mt-1 text-sm text-gray-500">
              {`${totalCount} lượt đánh giá đã được ghi nhận`}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-yellow-50 px-4 py-3">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="text-xl font-black text-gray-900">{rating}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
          Đang tải đánh giá...
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="font-bold text-gray-900">Chưa có nội dung đánh giá</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tour này đã có điểm đánh giá tổng hợp, nhưng chưa có nhận xét chi tiết để hiển thị.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900">{review.userName || 'Du khách'}</h3>
                  {review.createdAt && (
                    <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                  )}
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4"
                      fill={star <= review.rating ? '#FBBF24' : '#E5E7EB'}
                      stroke="none"
                    />
                  ))}
                </div>
              </div>
              <p className="leading-relaxed text-gray-600">{review.comment}</p>
              {review.images && review.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Ảnh đánh giá ${index + 1}`}
                      className="aspect-square rounded-xl border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              )}
              {review.providerResponse && (
                <div className="mt-4 rounded-xl bg-blue-50 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                    Phản hồi từ nhà cung cấp
                  </p>
                  <p className="text-sm text-gray-700">{review.providerResponse}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function GalleryImage({ image, name, className, onClick, overlay }: { image: string; name: string; className: string; onClick: () => void; overlay?: number }) {
  return (
    <button className={`relative rounded-2xl overflow-hidden group ${className}`} onClick={onClick}>
      <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      {overlay && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
          <div className="text-center">
            <Camera className="w-6 h-6 mx-auto mb-1" />
            <span className="text-sm font-semibold">{overlay} ảnh</span>
          </div>
        </div>
      )}
    </button>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-gray-900">{value}</p>
    </div>
  );
}

function BookingCard({
  tour,
  selectedDate,
  setSelectedDate,
  dateError,
  adults,
  setAdults,
  children,
  setChildren,
  total,
  advanceBookingDays,
  earliestDepartureDate,
  onBook,
}: any) {
  const formatVND = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';
  const hasPromotion = Boolean(tour.promotionActive && tour.originalPrice && tour.originalPrice > tour.price);
  return (
    <div className="sticky top-24">
      <Card className="border-2 shadow-xl">
        <CardContent className="p-6">
          <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="text-sm font-semibold text-gray-600 mb-1">{hasPromotion ? 'Giá ưu đãi' : 'Giá từ'}</div>
            {hasPromotion && (
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-400 line-through">{formatVND(tour.originalPrice)}</span>
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-black uppercase"
                  style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}
                >
                  {tour.promotionBadge || `SALE ${tour.discountPercent || 0}%`}
                </span>
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black" style={{ color: hasPromotion ? '#E65300' : '#0064D2' }}>{formatVND(tour.price)}</span>
              <span className="text-gray-600">/người</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn ngày khởi hành</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={earliestDepartureDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Chọn ngày"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                dateError
                  ? 'border-red-500 bg-red-50 focus:border-red-500'
                  : 'border-gray-200 focus:border-primary'
              }`}
            />
            <p className="mt-1.5 text-xs font-semibold text-gray-500">
              Tour này cần đặt trước tối thiểu {advanceBookingDays} ngày. Ngày sớm nhất: {earliestDepartureDate.toLocaleDateString('vi-VN')}.
            </p>
            {dateError && <p className="mt-1.5 text-xs font-semibold text-red-600">{dateError}</p>}
          </div>

          <Counter label="Người lớn" sub="Từ 12 tuổi" value={adults} min={1} setValue={setAdults} />
          <Counter label="Trẻ em" sub="2-11 tuổi" value={children} min={0} setValue={setChildren} />

          <div className="border-t-2 border-gray-200 pt-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Tổng cộng</span>
              <span className="text-2xl font-bold text-primary">{formatVND(total)}</span>
            </div>
            <div className="text-xs text-gray-400 text-right mt-1">Chưa bao gồm phí dịch vụ & thuế</div>
          </div>

          <Button className="w-full bg-gradient-to-r from-accent to-orange-500 text-white font-bold py-6 text-lg shadow-lg" onClick={onBook}>
            ĐẶT NGAY
          </Button>

          <div className="mt-4 text-center">
            <Link to="/contact" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              Bạn cần hỗ trợ? Liên hệ với chúng tôi
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            <a href="tel:+84123456789" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary"><Phone className="w-4 h-4" />+84 123 456 789</a>
            <a href="mailto:info@thichdulich.com" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary"><Mail className="w-4 h-4" />info@thichdulich.com</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Counter({ label, sub, value, min, setValue }: { label: string; sub: string; value: number; min: number; setValue: (value: number) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
      <div>
        <div className="font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setValue(Math.max(min, value - 1))} disabled={value <= min}><Minus className="w-4 h-4" /></Button>
        <span className="w-8 text-center font-bold">{value}</span>
        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setValue(Math.min(10, value + 1))}><Plus className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
