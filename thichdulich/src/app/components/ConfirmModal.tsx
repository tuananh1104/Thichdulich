"use client";

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'warning'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      iconBg: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
      icon: 'linear-gradient(135deg, #EF4444, #DC2626)',
      button: 'linear-gradient(135deg, #EF4444, #DC2626)',
    },
    warning: {
      iconBg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
      icon: 'linear-gradient(135deg, #F59E0B, #D97706)',
      button: 'linear-gradient(135deg, #F59E0B, #D97706)',
    },
    info: {
      iconBg: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
      icon: 'linear-gradient(135deg, #3B82F6, #2563EB)',
      button: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    },
  };

  const color = colors[variant];

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
              style={{ background: color.iconBg }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: color.icon }}
              >
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="font-bold text-gray-900 mb-2" style={{ fontSize: '1.5rem' }}>
              {title}
            </h2>

            {/* Message */}
            <p className="text-gray-600 leading-relaxed max-w-sm">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl font-bold text-gray-700 transition-all hover:bg-gray-100"
              style={{ background: '#F3F4F6' }}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 shadow-lg"
              style={{ background: color.button }}
            >
              {confirmText}
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
