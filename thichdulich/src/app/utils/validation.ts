export const PASSWORD_RULE_MESSAGE = 'Mật khẩu phải có ít nhất 6 ký tự, 1 chữ in hoa và 1 ký tự đặc biệt';
export const PHONE_RULE_MESSAGE = 'Số điện thoại phải đúng định dạng Việt Nam, ví dụ 0912345678 hoặc +84912345678';

export const normalizePhone = (phone: string) =>
  phone.trim().replace(/[\s().-]/g, '');

export const isStrongPassword = (password: string) =>
  password.length >= 6 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password);

export const isVietnamesePhone = (phone: string) => {
  const normalizedPhone = normalizePhone(phone);
  return /^(0[0-9]{9}|\+84[0-9]{9})$/.test(normalizedPhone);
};
