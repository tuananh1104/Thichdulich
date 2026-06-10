"use client";

import { Link } from 'react-router';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '../components/ui/button';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">{t('pageNotFound')}</h2>
        <p className="text-gray-600 mb-8">
          {t('heroSubtitle')}
        </p>
        <Link to="/">
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Home className="w-4 h-4" />
            {t('home')}
          </Button>
        </Link>
      </div>
    </div>
  );
}