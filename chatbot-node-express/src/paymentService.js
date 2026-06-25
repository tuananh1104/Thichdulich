export async function getPaymentStatus(orderCode) {
  if (!orderCode) return null;
  return { orderCode, method: 'bank_qr', status: 'pending', qrCreated: true };
}
