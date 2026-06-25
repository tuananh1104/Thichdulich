const tours = [
  { id: 'tour-ninh-binh', name: 'Tour Ninh Bình 2N1Đ', location: 'Ninh Bình', price: 2500000, rating: 4.7, reviewCount: 18, duration: 2, included: ['Ăn trưa', 'Xe đưa đón', 'Vé tham quan'] },
  { id: 'tour-ha-long', name: 'Tour Hạ Long du thuyền', location: 'Hạ Long', price: 3200000, rating: 4.8, reviewCount: 32, duration: 2, included: ['Ăn trưa', 'Du thuyền', 'Vé tham quan'] },
  { id: 'tour-sapa', name: 'Tour Sapa săn mây', location: 'Sapa', price: 3900000, rating: 4.6, reviewCount: 24, duration: 3, included: ['Khách sạn', 'Ăn sáng', 'Hướng dẫn viên'] },
];

export async function searchTours(query, filters = {}) {
  const q = query.toLowerCase();
  return tours.filter(t => !q || q.includes(t.location.toLowerCase()) || q.includes(t.name.toLowerCase()) || q.includes('tour'));
}

export async function getTourDetail(tourId) {
  return tours.find(t => t.id === tourId) || null;
}

export async function getTourReviews(tourId) {
  if (!tourId) return [];
  return [
    { rating: 5, comment: 'Lịch trình hợp lý, hướng dẫn viên nhiệt tình.' },
    { rating: 4, comment: 'Cảnh đẹp, đồ ăn ổn, nên đi gia đình.' },
  ];
}

export async function getTourSchedule(tourId, date) {
  if (!tourId) return [];
  return [{ date: date || '2026-06-20', availableSlots: 12, status: 'open' }];
}

export async function calculateTourPrice(tourId, peopleCount = 1) {
  const tour = await getTourDetail(tourId);
  if (!tour) return null;
  return { unitPrice: tour.price, peopleCount, total: tour.price * peopleCount };
}
