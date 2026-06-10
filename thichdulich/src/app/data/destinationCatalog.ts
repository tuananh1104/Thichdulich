import { cleanText, normalizeText } from '../utils/text';

export type DestinationRegion = 'north' | 'central' | 'south';

export interface DestinationCatalogItem {
  id: string;
  backendId: string;
  name: string;
  location: string;
  region: DestinationRegion;
  categories: string[];
  description: string;
  highlight: string;
  image: string;
  gallery: string[];
  aliases: string[];
  rating: number;
  reviewCount: number;
}

export const DESTINATION_CATALOG: DestinationCatalogItem[] = [
  {
    id: 'ha-long',
    backendId: 'dest-ha-long',
    name: 'Vịnh Hạ Long',
    location: 'Quảng Ninh',
    region: 'north',
    categories: ['nature', 'beach'],
    description: 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi, hang động và du thuyền nghỉ đêm trên vịnh.',
    highlight: 'Di sản UNESCO',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=800&fit=crop',
    ],
    aliases: ['ha long', 'halong', 'quang ninh', 'vịnh hạ long'],
    rating: 4.8,
    reviewCount: 3241,
  },
  {
    id: 'da-nang',
    backendId: 'dest-da-nang',
    name: 'Đà Nẵng',
    location: 'Đà Nẵng',
    region: 'central',
    categories: ['city', 'beach'],
    description: 'Thành phố biển năng động với Bà Nà Hills, Cầu Vàng, biển Mỹ Khê và ẩm thực miền Trung.',
    highlight: 'Cầu Vàng - Bà Nà Hills',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
    ],
    aliases: ['da nang', 'danang', 'đà nẵng'],
    rating: 4.7,
    reviewCount: 2876,
  },
  {
    id: 'hoi-an',
    backendId: 'dest-hoi-an',
    name: 'Phố cổ Hội An',
    location: 'Quảng Nam',
    region: 'central',
    categories: ['culture', 'city'],
    description: 'Phố cổ bên sông Hoài với đèn lồng, nhà cổ, làng nghề và những lớp học nấu ăn địa phương.',
    highlight: 'Phố cổ 400 năm',
    image: 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop',
    ],
    aliases: ['hoi an', 'hội an', 'quang nam', 'quảng nam'],
    rating: 4.9,
    reviewCount: 4102,
  },
  {
    id: 'sapa',
    backendId: 'dest-sapa',
    name: 'Sapa',
    location: 'Lào Cai',
    region: 'north',
    categories: ['mountain', 'nature'],
    description: 'Thị trấn vùng cao với Fansipan, ruộng bậc thang, bản làng dân tộc và không khí se lạnh.',
    highlight: 'Fansipan & ruộng bậc thang',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop',
    ],
    aliases: ['sapa', 'sa pa', 'lao cai', 'lào cai'],
    rating: 4.8,
    reviewCount: 2103,
  },
  {
    id: 'phu-quoc',
    backendId: 'dest-phu-quoc',
    name: 'Phú Quốc',
    location: 'Kiên Giang',
    region: 'south',
    categories: ['beach', 'nature'],
    description: 'Đảo ngọc với bãi biển trong xanh, tour lặn ngắm san hô, cáp treo Hòn Thơm và hải sản tươi.',
    highlight: 'Đảo ngọc Việt Nam',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop',
    ],
    aliases: ['phu quoc', 'phú quốc', 'kien giang', 'kiên giang'],
    rating: 4.7,
    reviewCount: 3567,
  },
  {
    id: 'nha-trang',
    backendId: 'dest-nha-trang',
    name: 'Nha Trang',
    location: 'Khánh Hòa',
    region: 'central',
    categories: ['beach', 'city'],
    description: 'Thành phố biển với vịnh đẹp, đảo Hòn Mun, tắm bùn khoáng, lặn biển và hoạt động thể thao nước.',
    highlight: 'Vịnh biển & đảo',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&h=800&fit=crop',
    ],
    aliases: ['nha trang', 'khanh hoa', 'khánh hòa'],
    rating: 4.6,
    reviewCount: 2891,
  },
  {
    id: 'dalat',
    backendId: 'dest-da-lat',
    name: 'Đà Lạt',
    location: 'Lâm Đồng',
    region: 'central',
    categories: ['mountain', 'nature'],
    description: 'Thành phố ngàn hoa với hồ Tuyền Lâm, thác Datanla, đồi chè, săn mây và các tour phiêu lưu nhẹ.',
    highlight: 'Thành phố ngàn hoa',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop',
    ],
    aliases: ['da lat', 'dalat', 'đà lạt', 'lam dong', 'lâm đồng'],
    rating: 4.8,
    reviewCount: 1987,
  },
  {
    id: 'mekong-delta',
    backendId: 'dest-mekong',
    name: 'Miền Tây sông nước',
    location: 'Cần Thơ',
    region: 'south',
    categories: ['culture', 'nature'],
    description: 'Hành trình chợ nổi, miệt vườn, đờn ca tài tử và nhịp sống sông nước Đồng bằng sông Cửu Long.',
    highlight: 'Chợ nổi & miệt vườn',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop',
    ],
    aliases: ['mekong', 'mien tay', 'miền tây', 'can tho', 'cần thơ', 'tien giang', 'bến tre'],
    rating: 4.6,
    reviewCount: 1203,
  },
  {
    id: 'ha-noi',
    backendId: 'dest-ha-noi',
    name: 'Hà Nội',
    location: 'Hà Nội',
    region: 'north',
    categories: ['city', 'culture', 'food'],
    description: 'Thủ đô nghìn năm văn hiến với phố cổ, hồ Gươm, làng nghề ven đô và ẩm thực đường phố.',
    highlight: 'Phố cổ & ẩm thực',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop',
    ],
    aliases: ['hà nội', 'ha noi', 'hanoi', 'thủ đô', 'thu do', 'hồ gươm', 'ho guom'],
    rating: 4.7,
    reviewCount: 2460,
  },
  {
    id: 'hue',
    backendId: 'dest-hue',
    name: 'Huế',
    location: 'Thừa Thiên Huế',
    region: 'central',
    categories: ['culture', 'food', 'nature'],
    description: 'Cố đô bên sông Hương với Đại Nội, lăng tẩm, nhà vườn và các món ăn cung đình.',
    highlight: 'Cố đô di sản',
    image: 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
    ],
    aliases: ['huế', 'hue', 'thừa thiên huế', 'thua thien hue', 'cố đô', 'co do', 'sông hương', 'song huong'],
    rating: 4.8,
    reviewCount: 2198,
  },
  {
    id: 'quy-nhon',
    backendId: 'dest-quy-nhon',
    name: 'Quy Nhơn',
    location: 'Bình Định',
    region: 'central',
    categories: ['beach', 'nature', 'food'],
    description: 'Thành phố biển yên bình với Kỳ Co, Eo Gió, Cù Lao Xanh và hải sản tươi.',
    highlight: 'Kỳ Co - Eo Gió',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop',
    ],
    aliases: ['quy nhơn', 'quy nhon', 'bình định', 'binh dinh', 'kỳ co', 'ky co', 'eo gió', 'eo gio', 'cù lao xanh', 'cu lao xanh'],
    rating: 4.7,
    reviewCount: 1764,
  },
  {
    id: 'ha-giang',
    backendId: 'dest-ha-giang',
    name: 'Hà Giang',
    location: 'Hà Giang',
    region: 'north',
    categories: ['mountain', 'adventure', 'culture'],
    description: 'Cao nguyên đá Đồng Văn, đèo Mã Pì Lèng, sông Nho Quế và những bản làng vùng cao.',
    highlight: 'Mã Pì Lèng & Nho Quế',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
    ],
    aliases: ['hà giang', 'ha giang', 'đồng văn', 'dong van', 'mã pì lèng', 'ma pi leng', 'nho quế', 'nho que'],
    rating: 4.9,
    reviewCount: 3012,
  },
  {
    id: 'con-dao',
    backendId: 'dest-con-dao',
    name: 'Côn Đảo',
    location: 'Bà Rịa - Vũng Tàu',
    region: 'south',
    categories: ['beach', 'nature', 'culture'],
    description: 'Quần đảo hoang sơ với biển xanh, rừng nguyên sinh, lặn ngắm san hô và không gian nghỉ dưỡng yên tĩnh.',
    highlight: 'Biển hoang sơ',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop',
    ],
    aliases: ['côn đảo', 'con dao', 'bà rịa vũng tàu', 'ba ria vung tau', 'hòn bảy cạnh', 'hon bay canh'],
    rating: 4.8,
    reviewCount: 1450,
  },
];

export function getDestinationByRouteId(id?: string | null) {
  if (!id) return undefined;
  const normalized = normalizeText(id.replace(/^dest-/, ''));
  return DESTINATION_CATALOG.find((destination) => {
    const keys = [destination.id, destination.backendId, destination.name, destination.location];
    return keys.some((key) => normalizeText(key).replace(/^dest-/, '') === normalized)
      || destination.aliases.some((alias) => normalizeText(alias) === normalized);
  });
}

export function getDestinationByText(...values: Array<string | null | undefined>) {
  const normalizedValues = values.map(normalizeText).filter(Boolean);
  return DESTINATION_CATALOG.find((destination) => {
    const haystack = [
      destination.id,
      destination.backendId,
      destination.name,
      destination.location,
      ...destination.aliases,
    ].map(normalizeText);
    return normalizedValues.some((value) => haystack.some((item) => item.includes(value) || value.includes(item)));
  });
}

export function mergeApiDestination(dto: any): DestinationCatalogItem {
  const name = cleanText(parseLocalized(dto?.name, dto?.name || 'Điểm đến'));
  const description = cleanText(parseLocalized(dto?.description, dto?.description || 'Khám phá các tour du lịch phù hợp tại điểm đến này.'));
  const known = getDestinationByRouteId(dto?.id) || getDestinationByText(name, dto?.region);
  const image = dto?.image || known?.image || DESTINATION_CATALOG[0].image;

  return {
    categories: known?.categories || ['nature'],
    highlight: known?.highlight || name,
    gallery: known?.gallery || [image],
    aliases: known?.aliases || [name],
    rating: known?.rating || 0,
    reviewCount: known?.reviewCount || 0,
    id: known?.id || dto?.id || name.toLowerCase().replace(/\s+/g, '-'),
    backendId: dto?.id || known?.backendId || '',
    name,
    description,
    image,
    location: known?.location || name,
    region: mapRegion(dto?.region) || known?.region || 'north',
  };
}

function parseLocalized(value: any, fallback: string) {
  if (!value) return fallback;
  if (typeof value === 'object') return value.vi || value.en || fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed.vi || parsed.en || fallback;
  } catch {
    return value;
  }
}

function mapRegion(region?: string): DestinationRegion | undefined {
  const normalized = normalizeText(region);
  if (!normalized) return undefined;
  if (normalized.includes('bac') || normalized.includes('north')) return 'north';
  if (normalized.includes('trung') || normalized.includes('central')) return 'central';
  if (normalized.includes('nam') || normalized.includes('south')) return 'south';
  return undefined;
}
