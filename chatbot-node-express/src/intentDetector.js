import { INTENTS } from './intents.js';

export function normalize(text = '') {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/đ/g, 'd');
}

export function detectIntent(message, context = {}) {
  const q = normalize(message);
  if (/(messi|bong da|code|lap trinh|crypto|chung khoan)/.test(q)) return INTENTS.OUT_OF_SCOPE;
  if (/(ma don|don .*toi|trang thai don|thanh toan chua|abc\d*)/.test(q)) return INTENTS.BOOKING_STATUS;
  if (/(website bi loi|loi website|loi thanh toan|quen ma don)/.test(q)) return INTENTS.WEBSITE_HELP;
  if (/(huy|hoan tien|refund|cancel)/.test(q)) return INTENTS.CANCELLATION_POLICY;
  if (/(qr|cod|coc|chuyen khoan|thanh toan)/.test(q)) return INTENTS.PAYMENT_POLICY;
  if (/(so sanh|voi tour|khac gi)/.test(q)) return INTENTS.TOUR_COMPARE;
  if (/(lich|khoi hanh|con cho|ngay mai|ngay do)/.test(q)) return INTENTS.TOUR_SCHEDULE;
  if (/(danh gia|review|co dang di|dang di khong)/.test(q)) return INTENTS.TOUR_REVIEW;
  if (/(bao nhieu|tong tien|di \d+ nguoi|gia do)/.test(q)) return context.selectedTourId ? INTENTS.PRICE_CALCULATION : INTENTS.TOUR_SEARCH;
  if (/(tour nay|tour do|cai nay|cai do|no|ben nay)/.test(q)) return INTENTS.TOUR_FOLLOW_UP;
  if (/(chi tiet|co an|bao gom|lich trinh|khach san)/.test(q)) return INTENTS.TOUR_DETAIL;
  if (/(website|loi|quen ma don|dang nhap|otp|mat khau|ho tro)/.test(q)) return INTENTS.WEBSITE_HELP;
  if (/(nen mang gi|thang \d+|mua nao|kinh nghiem|di bien|sapa)/.test(q)) return INTENTS.TRAVEL_ADVICE;
  if (/(tour|toi muon di|ninh binh|ha long|gia dinh|re nhat|tim)/.test(q)) return INTENTS.TOUR_SEARCH;
  return INTENTS.TRAVEL_ADVICE;
}
