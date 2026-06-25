import { detectIntent } from './src/intentDetector.js';

const cases = [
  'Tôi muốn đi Ninh Bình',
  'Tour đó bao nhiêu tiền?',
  'Tour này đánh giá sao?',
  'Có ăn trưa không?',
  'Còn chỗ ngày mai không?',
  'Đi 4 người bao nhiêu?',
  'Có đáng đi không?',
  'So với tour Hạ Long thì sao?',
  'Thanh toán QR thế nào?',
  'COD có cần cọc không?',
  'Hủy trước 24h có hoàn không?',
  'Đơn ABC123 của tôi thanh toán chưa?',
  'Tôi muốn hủy đơn',
  'Đi Sapa tháng 10 đẹp không?',
  'Nên mang gì khi đi biển?',
  'Website bị lỗi thanh toán',
  'Tôi quên mã đơn',
  'Tour nào phù hợp gia đình?',
  'Tour nào rẻ nhất?',
  'Messi là ai?',
];

for (const text of cases) {
  console.log(`${text} -> ${detectIntent(text, { selectedTourId: 'tour-ninh-binh' })}`);
}
