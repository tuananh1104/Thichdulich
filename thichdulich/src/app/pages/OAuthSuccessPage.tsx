"use client";

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import api, { getApiErrorMessage } from '@/services/api';
import { getHomePathForRole } from '../components/ProtectedRoute';

export function OAuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const finishLogin = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setError('Không nhận được token đăng nhập từ Google.');
        return;
      }

      localStorage.setItem('authToken', token);
      try {
        const profile = await api.getCurrentUser();
        const user = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
          role: profile.role,
          avatar: profile.avatar,
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.replace(getHomePathForRole(user.role));
      } catch (err) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setError(getApiErrorMessage(err, 'Không thể hoàn tất đăng nhập Google.'));
      }
    };

    finishLogin();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F8FAFC' }}>
      <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm w-full">
        {error ? (
          <>
            <div className="text-red-600 font-bold mb-2">Đăng nhập Google thất bại</div>
            <p className="text-sm text-gray-600">{error}</p>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Đang hoàn tất đăng nhập Google...</p>
          </>
        )}
      </div>
    </div>
  );
}
