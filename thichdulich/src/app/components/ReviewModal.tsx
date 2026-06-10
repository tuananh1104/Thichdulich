"use client";

import { useState } from 'react';
import { X, Star, Upload, Camera, ThumbsUp, AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewData: ReviewData) => void;
  tourName: string;
  bookingId: string;
}

export interface ReviewData {
  rating: number;
  title: string;
  content: string;
  images: File[];
  recommend: boolean;
}

export function ReviewModal({ isOpen, onClose, onSubmit, tourName, bookingId }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recommend, setRecommend] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).slice(0, 5 - images.length);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (rating === 0) {
      setValidationError('Vui lòng chọn số sao để thể hiện trải nghiệm của bạn.');
      return;
    }
    if (!content.trim()) {
      setValidationError('Vui lòng chia sẻ nội dung đánh giá trước khi gửi.');
      return;
    }

    onSubmit({
      rating,
      title: title || getRatingText(rating),
      content,
      images,
      recommend
    });

    // Reset form
    setRating(0);
    setTitle('');
    setContent('');
    setImages([]);
    setRecommend(true);
    setValidationError('');
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return 'Rất tệ';
      case 2: return 'Tệ';
      case 3: return 'Bình thường';
      case 4: return 'Tốt';
      case 5: return 'Tuyệt vời';
      default: return '';
    }
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
        <div className="px-6 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #0A2540, #1E3A5F)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-bold text-white mb-1" style={{ fontSize: '1.25rem' }}>
                ✍️ Đánh giá tour của bạn
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
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Rating */}
            <div className="text-center">
              {validationError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
              <label className="block font-bold text-gray-900 mb-3" style={{ fontSize: '1.125rem' }}>
                Bạn đánh giá tour này như thế nào?
              </label>
              <div className="flex justify-center gap-3 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => { setRating(star); setValidationError(''); }}
                    className="transition-transform hover:scale-125"
                  >
                    <Star
                      className={`w-12 h-12 transition-all ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-lg font-semibold" style={{ color: '#FF6000' }}>
                  {getRatingText(rating)}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tiêu đề đánh giá (tuỳ chọn)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={rating > 0 ? getRatingText(rating) : 'Vd: Tour tuyệt vời, đáng tiền!'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nội dung đánh giá <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => { setContent(e.target.value); setValidationError(''); }}
                placeholder="Chia sẻ trải nghiệm của bạn về tour: điểm đến, hướng dẫn viên, dịch vụ, khách sạn, đồ ăn..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                {content.length}/1000 ký tự
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Thêm hình ảnh (tối đa 5 ảnh)
              </label>
              
              <div className="grid grid-cols-5 gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                    <img 
                      src={URL.createObjectURL(img)} 
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500">
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-medium">Thêm</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Recommend */}
            <div className="p-4 rounded-2xl border-2 border-blue-100" style={{ background: '#EFF6FF' }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#0064D2' }}
                />
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5" style={{ color: '#0064D2' }} />
                  <span className="font-semibold text-gray-900">
                    Tôi giới thiệu tour này cho bạn bè
                  </span>
                </div>
              </label>
            </div>

            {/* Info */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 leading-relaxed">
                💡 <strong>Lưu ý:</strong> Đánh giá của bạn sẽ được công khai và giúp những du khách khác có thêm thông tin hữu ích. Vui lòng đánh giá trung thực và khách quan.
              </p>
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
            className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0064D2, #0091FF)' }}
          >
            Gửi đánh giá
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
