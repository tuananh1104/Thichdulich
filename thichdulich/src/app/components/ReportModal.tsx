"use client";

import { useState } from 'react';
import { X, AlertTriangle, FileText, Upload } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportData: ReportData) => void;
  tourName: string;
  bookingId: string;
}

export interface ReportData {
  category: string;
  subject: string;
  description: string;
  evidence: File[];
}

export function ReportModal({ isOpen, onClose, onSubmit, tourName, bookingId }: ReportModalProps) {
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<File[]>([]);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const categories = [
    { value: 'service', label: '🛎️ Dịch vụ kém chất lượng', desc: 'HDV, khách sạn, nhà hàng không đạt yêu cầu' },
    { value: 'safety', label: '⚠️ Vấn đề an toàn', desc: 'Xe không đảm bảo, hoạt động nguy hiểm' },
    { value: 'schedule', label: '📅 Sai lịch trình', desc: 'Thay đổi lịch trình không thông báo' },
    { value: 'price', label: '💰 Phụ thu không hợp lý', desc: 'Tính phí vượt quá thỏa thuận' },
    { value: 'fraud', label: '🚫 Lừa đảo', desc: 'Thông tin tour không đúng sự thật' },
    { value: 'other', label: '📝 Khác', desc: 'Vấn đề khác' },
  ];

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - evidence.length);
      setEvidence([...evidence, ...newFiles]);
    }
  };

  const removeEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!category) {
      setValidationError('Vui lòng chọn loại vấn đề phù hợp với báo cáo của bạn.');
      return;
    }
    if (!subject.trim()) {
      setValidationError('Vui lòng nhập tiêu đề ngắn gọn cho báo cáo.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Vui lòng mô tả rõ vấn đề để Admin có đủ thông tin xử lý.');
      return;
    }

    onSubmit({
      category,
      subject,
      description,
      evidence
    });

    // Reset form
    setCategory('');
    setSubject('');
    setDescription('');
    setEvidence([]);
    setValidationError('');
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
        <div className="px-6 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-bold text-white mb-1" style={{ fontSize: '1.25rem' }}>
                🚨 Báo cáo vấn đề
              </h2>
              <p className="text-sm text-white/80">{tourName}</p>
              <p className="text-xs text-white/70 mt-1">Mã booking: {bookingId}</p>
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
            {validationError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
            {/* Warning Notice */}
            <div className="p-4 rounded-xl border-2 border-red-100" style={{ background: '#FEF2F2' }}>
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Chúng tôi sẽ xử lý nghiêm túc</p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    Báo cáo của bạn sẽ được Admin và Provider xem xét trong vòng 24-48 giờ. Vui lòng cung cấp thông tin chính xác.
                  </p>
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Loại vấn đề <span className="text-red-500">*</span>
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <label
                    key={cat.value}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      category === cat.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={category === cat.value}
                      onChange={(e) => { setCategory(e.target.value); setValidationError(''); }}
                      className="sr-only"
                    />
                    <div className="font-semibold text-gray-900 mb-1 text-sm">
                      {cat.label}
                    </div>
                    <p className="text-xs text-gray-600">{cat.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setValidationError(''); }}
                placeholder="Vd: Khách sạn không đúng hạng 4 sao như cam kết"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setValidationError(''); }}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải: thời gian, địa điểm, người liên quan, thiệt hại (nếu có)..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                {description.length}/2000 ký tự
              </div>
            </div>

            {/* Evidence */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Bằng chứng hình ảnh (tối đa 5 ảnh)
              </label>
              
              <div className="space-y-3">
                {evidence.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={() => removeEvidence(index)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {evidence.length < 5 && (
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-red-500 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700">Tải lên bằng chứng</p>
                      <p className="text-xs text-gray-500">Hỗ trợ: JPG, PNG, WEBP</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEvidenceUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800 leading-relaxed">
                🔒 <strong>Bảo mật:</strong> Thông tin của bạn được bảo mật tuyệt đối. Chúng tôi chỉ chia sẻ với Provider liên quan để giải quyết vấn đề.
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
            style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)' }}
          >
            Gửi báo cáo
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
