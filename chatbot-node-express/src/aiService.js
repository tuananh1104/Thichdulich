export async function generateAnswer(systemPrompt, aiInput) {
  const { intent, tourData, reviewData, scheduleData, priceData, policyData, bookingData, paymentData, websiteHelpData } = aiInput;
  if (intent === 'out_of_scope') return 'Mình chỉ hỗ trợ nội dung du lịch và website đặt tour. Bạn muốn tìm tour nào không?';
  if (intent === 'travel_advice') return 'Với tư vấn du lịch chung, bạn nên chọn thời điểm phù hợp thời tiết, chuẩn bị giấy tờ, thuốc cá nhân, trang phục theo điểm đến và kiểm tra lịch trình trước khi đi.';
  if (bookingData) return `Thông tin đơn: ${JSON.stringify(bookingData)}`;
  if (paymentData) return `Thông tin thanh toán: ${JSON.stringify(paymentData)}`;
  if (priceData) return `Giá tạm tính: ${JSON.stringify(priceData)}`;
  if (scheduleData?.length) return `Lịch khởi hành/còn chỗ: ${JSON.stringify(scheduleData)}`;
  if (reviewData?.length) return `Đánh giá tour: ${JSON.stringify(reviewData)}`;
  if (policyData) return `Chính sách: ${JSON.stringify(policyData)}`;
  if (websiteHelpData) return websiteHelpData;
  if (tourData?.length) return `Tôi tìm thấy ${tourData.length} tour phù hợp. Bạn có thể xem gợi ý bên dưới.`;
  return 'Hiện tại tôi chưa có đủ dữ liệu để trả lời chính xác. Bạn bổ sung thêm thông tin giúp tôi nhé.';
}
