"use client";

import { LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm, userName }: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
              }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
              >
                <LogOut className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="font-bold text-gray-900 mb-2" style={{ fontSize: '1.5rem' }}>
              Xác nhận đăng xuất
            </h2>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed max-w-sm">
              {userName ? (
                <>
                  Bạn có chắc muốn đăng xuất khỏi tài khoản <span className="font-semibold text-gray-900">{userName}</span>?
                </>
              ) : (
                'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?'
              )}
            </p>
          </div>
        </div>

        {/* Body - Info Box */}
        <div className="px-6 pb-6">
          <div 
            className="p-4 rounded-2xl mb-6"
            style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#F59E0B' }}>
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#92400E' }}>
                  Lưu ý
                </p>
                <p className="text-xs mt-1" style={{ color: '#B45309' }}>
                  Sau khi đăng xuất, bạn sẽ cần đăng nhập lại để tiếp tục sử dụng các tính năng.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl font-bold text-gray-700 transition-all hover:bg-gray-100"
              style={{ background: '#F3F4F6' }}
            >
              Hủy bỏ
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 shadow-lg flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
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
