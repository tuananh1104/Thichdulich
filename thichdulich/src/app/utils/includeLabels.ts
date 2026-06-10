const INCLUDE_LABELS: Record<string, string> = {
  accommodation: 'Lưu trú theo chương trình',
  hotel: 'Lưu trú theo chương trình',
  khachsan: 'Lưu trú theo chương trình',
  luutru: 'Lưu trú theo chương trình',
  meals: 'Bữa ăn theo chương trình',
  meal: 'Bữa ăn theo chương trình',
  food: 'Bữa ăn theo chương trình',
  anuong: 'Bữa ăn theo chương trình',
  buaan: 'Bữa ăn theo chương trình',
  transportation: 'Xe đưa đón du lịch',
  transport: 'Xe đưa đón du lịch',
  vehicle: 'Xe đưa đón du lịch',
  dichuyen: 'Xe đưa đón du lịch',
  xedua: 'Xe đưa đón du lịch',
  tourguide: 'Hướng dẫn viên',
  guide: 'Hướng dẫn viên',
  huongdanvien: 'Hướng dẫn viên',
  huongdan: 'Hướng dẫn viên',
  entrance: 'Vé tham quan',
  ticket: 'Vé tham quan',
  tickets: 'Vé tham quan',
  vevao: 'Vé tham quan',
};

function normalizeIncludeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[đĐ]/g, 'd')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\-\s]/g, '')
    .toLowerCase();
}

export function getIncludeLabel(value: string) {
  const cleanValue = value.trim();
  if (!cleanValue) return '';

  const key = normalizeIncludeKey(cleanValue);
  return INCLUDE_LABELS[key] || cleanValue;
}

export function getIncludeLabels(values?: string[]) {
  return (values || []).map(getIncludeLabel).filter(Boolean);
}
