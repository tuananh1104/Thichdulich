export async function getPolicies() {
  return {
    payment: 'QR thanh toán theo mã/link của đơn. COD cần cọc trước 30%, phần còn lại thanh toán khi đi tour.',
    cancellation: 'Hủy trước giờ khởi hành từ 24h trở lên hoàn 100%. Dưới 24h không hoàn. Provider/Admin hủy hoàn 100%.',
  };
}
