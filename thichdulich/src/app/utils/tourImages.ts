import { normalizeText } from './text';

const FALLBACK_BY_KEYWORD = [
  {
    keys: ['hoi an', 'quang nam'],
    image: 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop',
  },
  {
    keys: ['da nang', 'danang'],
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&h=700&fit=crop',
  },
  {
    keys: ['sapa', 'sa pa', 'lao cai'],
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop',
  },
  {
    keys: ['phu quoc', 'kien giang'],
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop',
  },
  {
    keys: ['nha trang', 'khanh hoa'],
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=700&fit=crop',
  },
  {
    keys: ['da lat', 'dalat', 'lam dong'],
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop',
  },
  {
    keys: ['can tho', 'mekong', 'mien tay', 'tien giang', 'ben tre'],
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=700&fit=crop',
  },
  {
    keys: ['ha long', 'halong', 'quang ninh'],
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop',
  },
];

const FALLBACK_BY_TYPE: Record<string, string> = {
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop',
  nature: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=700&fit=crop',
  mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop',
  cultural: 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop',
  culture: 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop',
  adventure: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop',
  city: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&h=700&fit=crop',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&h=700&fit=crop',
};

export function getTourFallbackImage(tour?: {
  location?: string;
  type?: string;
  name?: { vi?: string; en?: string };
  description?: { vi?: string; en?: string };
}) {
  const text = normalizeText([
    tour?.location,
    tour?.name?.vi,
    tour?.name?.en,
    tour?.description?.vi,
    tour?.description?.en,
  ].filter(Boolean).join(' '));

  const byKeyword = FALLBACK_BY_KEYWORD.find((entry) =>
    entry.keys.some((key) => text.includes(normalizeText(key)))
  );

  return byKeyword?.image
    || FALLBACK_BY_TYPE[tour?.type || '']
    || 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=700&fit=crop';
}

export function isMismatchedHalongImage(image?: string, tour?: {
  location?: string;
  name?: { vi?: string; en?: string };
  description?: { vi?: string; en?: string };
}) {
  if (!image || !image.includes('1528127269322')) return false;

  const text = normalizeText([
    tour?.location,
    tour?.name?.vi,
    tour?.name?.en,
    tour?.description?.vi,
    tour?.description?.en,
  ].filter(Boolean).join(' '));

  return !['ha long', 'halong', 'quang ninh'].some((key) => text.includes(key));
}

export function getTourImage(image: string | undefined, tour?: Parameters<typeof getTourFallbackImage>[0]) {
  if (!image || isMismatchedHalongImage(image, tour)) {
    return getTourFallbackImage(tour);
  }
  return image;
}
