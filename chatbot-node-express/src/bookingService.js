export async function getBookingStatus(orderCode, phoneOrEmail) {
  if (!orderCode) return null;
  return { orderCode, status: 'pending', paymentStatus: 'pending', note: 'Dữ liệu mẫu. Khi triển khai hãy truy vấn DB thật.' };
}
