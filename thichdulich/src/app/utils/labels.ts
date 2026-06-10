type LabelMap = Record<string, string>;

function normalizeKey(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

export function labelFrom(map: LabelMap, value: unknown, fallback = 'Không rõ') {
  const key = normalizeKey(value);
  if (!key) return fallback;
  return map[key] || fallback;
}

export const TOUR_TYPE_LABELS: LabelMap = {
  adventure: 'Mạo hiểm',
  beach: 'Biển đảo',
  cultural: 'Văn hóa',
  culture: 'Văn hóa',
  food: 'Ẩm thực',
  nature: 'Thiên nhiên',
  mountain: 'Núi',
  city: 'Thành phố',
};

export const TOUR_STATUS_LABELS: LabelMap = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
  need_edit: 'Cần chỉnh sửa',
  updated: 'Đã cập nhật',
};

export const BOOKING_STATUS_LABELS: LabelMap = {
  pending: 'Chờ thanh toán',
  deposited: 'Đã cọc',
  paid: 'Đã thanh toán',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

export const PAYMENT_METHOD_LABELS: LabelMap = {
  card: 'Thẻ tín dụng',
  transfer: 'Chuyển khoản',
  bank_qr: 'Chuyển khoản QR',
  cod: 'COD - cọc trước 30%',
  vnpay: 'VNPAY',
};

export const PAYMENT_STATUS_LABELS: LabelMap = {
  pending: 'Chờ thanh toán',
  deposited: 'Đã cọc',
  paid: 'Đã thanh toán',
  success: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  refunded: 'Đã hoàn tiền',
};

export const REFUND_STATUS_LABELS: LabelMap = {
  none: 'Không hoàn tiền',
  refund_pending: 'Chờ hoàn tiền',
  refunded: 'Đã hoàn tiền',
  no_refund: 'Không hoàn tiền',
  refund_rejected: 'Từ chối hoàn tiền',
};

export const PAYOUT_STATUS_LABELS: LabelMap = {
  none: 'Chưa phát sinh',
  payout_pending: 'Chờ chuyển nhà cung cấp',
  paid_out: 'Đã chuyển nhà cung cấp',
};

export const PROVIDER_STATUS_LABELS: LabelMap = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
};

export const CONTACT_STATUS_LABELS: LabelMap = {
  new: 'Mới',
  replied: 'Đã trả lời',
  resolved: 'Đã giải quyết',
};

export const REPORT_STATUS_LABELS: LabelMap = {
  pending: 'Chờ xử lý',
  reviewed: 'Đã xem xét',
  resolved: 'Đã giải quyết',
  dismissed: 'Đã bỏ qua',
};

export const ROLE_LABELS: LabelMap = {
  user: 'Khách hàng',
  provider: 'Nhà cung cấp',
  admin: 'Quản trị',
};

export const PROMOTION_STATUS_LABELS: LabelMap = {
  none: 'Không áp dụng',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export const PROMOTION_SOURCE_LABELS: LabelMap = {
  none: 'Không có',
  admin: 'Admin',
  provider: 'Nhà cung cấp',
};

export const getTourTypeLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(TOUR_TYPE_LABELS, value, fallback);

export const getTourStatusLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(TOUR_STATUS_LABELS, value, fallback);

export const getBookingStatusLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(BOOKING_STATUS_LABELS, value, fallback);

export const getPaymentMethodLabel = (value: unknown, fallback = 'Chưa chọn') =>
  labelFrom(PAYMENT_METHOD_LABELS, value, fallback);

export const getPaymentStatusLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(PAYMENT_STATUS_LABELS, value, fallback);

export const getRefundStatusLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(REFUND_STATUS_LABELS, value, fallback);

export const getPayoutStatusLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(PAYOUT_STATUS_LABELS, value, fallback);

export const getProviderStatusLabel = (value: unknown, fallback = 'Chờ duyệt') =>
  labelFrom(PROVIDER_STATUS_LABELS, value, fallback);

export const getContactStatusLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(CONTACT_STATUS_LABELS, value, fallback);

export const getReportStatusLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(REPORT_STATUS_LABELS, value, fallback);

export const getRoleLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(ROLE_LABELS, value, fallback);

export const getPromotionStatusLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(PROMOTION_STATUS_LABELS, value, fallback);

export const getPromotionSourceLabel = (value: unknown, fallback = 'Không rõ') =>
  labelFrom(PROMOTION_SOURCE_LABELS, value, fallback);
