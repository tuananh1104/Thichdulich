import axios, { AxiosInstance, AxiosError } from 'axios';

// API Base URL - kết nối tới backend
// Leave empty in production when the backend is served behind the same domain.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  errors?: Record<string, string>;
}

interface AuthResponse {
  token: string;
  type: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'provider';
  avatar?: string;
}

interface RegisterPendingResponse {
  email: string;
  verificationRequired: boolean;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });

    // Thêm token JWT vào header nếu có
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        const headers = config.headers as any;
        if (typeof headers?.delete === 'function') {
          headers.delete('Content-Type');
          headers.delete('content-type');
        } else if (headers) {
          delete headers['Content-Type'];
          delete headers['content-type'];
        }
      }
      return config;
    });

    // Xử lý response errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const url = error.config?.url || '';
        const isAuthRequest = url.includes('/api/auth/login') || url.includes('/api/auth/register');
        if (error.response?.status === 401 && !isAuthRequest) {
          // Token hết hạn, đăng xuất
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ============ AUTH ENDPOINTS ============
  async login(email: string, password: string) {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/api/auth/login', {
      email,
      password,
    });
    if (response.data.data?.token) {
      localStorage.setItem('authToken', response.data.data.token);
    }
    return response.data.data;
  }

  async register(
    name: string,
    email: string,
    password: string,
    phone: string,
    role: 'user' | 'provider' = 'user'
  ) {
    const response = await this.client.post<ApiResponse<RegisterPendingResponse>>('/api/auth/register', {
      name,
      email,
      password,
      phone,
      role,
    });
    return response.data.data;
  }

  async verifyEmail(email: string, code: string) {
    const response = await this.client.post<ApiResponse<void>>('/api/auth/verify-email', { email, code });
    return response.data;
  }

  async resendOtp(email: string) {
    const response = await this.client.post<ApiResponse<RegisterPendingResponse>>('/api/auth/resend-otp', { email });
    return response.data.data;
  }

  async forgotPassword(email: string) {
    const response = await this.client.post<ApiResponse<RegisterPendingResponse>>('/api/auth/forgot-password', { email });
    return response.data.data;
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const response = await this.client.post<ApiResponse<void>>('/api/auth/reset-password', {
      email,
      code,
      newPassword,
    });
    return response.data;
  }

  async logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  // ============ USER ENDPOINTS ============
  async getCurrentUser() {
    const response = await this.client.get('/api/auth/me');
    return response.data.data;
  }

  async updateUser(userData: any) {
    const response = await this.client.put('/api/users/profile', userData);
    return response.data.data;
  }

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await this.client.post('/api/users/change-password', {
      oldPassword,
      currentPassword: oldPassword,
      newPassword,
    });
    return response.data;
  }

  // ============ UPLOAD ENDPOINTS ============
  async uploadImage(file: File, folder = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const response = await this.client.post('/api/uploads/image', formData, {
      timeout: 60000,
    });
    return response.data.data;
  }

  async uploadImages(files: File[], folder = 'general') {
    if (!files.length) return [];
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('folder', folder);
    const response = await this.client.post('/api/uploads/images', formData, {
      timeout: 120000,
    });
    return response.data.data || [];
  }

  // ============ TOUR ENDPOINTS ============
  async getTours(params?: any) {
    const response = await this.client.get('/api/tours', { params });
    return response.data.data;
  }

  async getRecommendations(limit = 6) {
    const response = await this.client.get('/api/tours/recommendations', { params: { limit } });
    return response.data.data;
  }

  async saveInteraction(data: { tourId?: string; action: 'view' | 'search' | 'click' | 'bookmark'; searchQuery?: string }) {
    const response = await this.client.post('/api/users/interactions', data);
    return response.data.data;
  }

  async getFavorites() {
    const response = await this.client.get('/api/users/favorites');
    return response.data.data;
  }

  async isFavorite(tourId: string) {
    const response = await this.client.get(`/api/users/favorites/${tourId}`);
    return Boolean(response.data.data?.favorite);
  }

  async addFavorite(tourId: string) {
    const response = await this.client.post(`/api/users/favorites/${tourId}`);
    return response.data.data;
  }

  async removeFavorite(tourId: string) {
    const response = await this.client.delete(`/api/users/favorites/${tourId}`);
    return response.data;
  }

  async getTourById(id: string) {
    const response = await this.client.get(`/api/tours/${id}`);
    return response.data.data;
  }

  async createTour(tourData: any) {
    const response = await this.client.post('/api/tours', tourData);
    return response.data.data;
  }

  async updateTour(id: string, tourData: any) {
    const response = await this.client.put(`/api/tours/${id}`, tourData);
    return response.data.data;
  }

  async deleteTour(id: string) {
    const response = await this.client.delete(`/api/tours/${id}`);
    return response.data;
  }

  // ============ DESTINATION ENDPOINTS ============
  async getDestinations() {
    const response = await this.client.get('/api/destinations');
    return response.data.data;
  }

  async getDestinationById(id: string) {
    const response = await this.client.get(`/api/destinations/${id}`);
    return response.data.data;
  }

  async getToursByDestination(destinationId: string) {
    const response = await this.client.get(`/api/tours/destination/${destinationId}`);
    return response.data.data;
  }

  async createDestination(destinationData: any) {
    const response = await this.client.post('/api/destinations', destinationData);
    return response.data.data;
  }

  async updateDestination(id: string, destinationData: any) {
    const response = await this.client.put(`/api/destinations/${id}`, destinationData);
    return response.data.data;
  }

  async deleteDestination(id: string) {
    const response = await this.client.delete(`/api/destinations/${id}`);
    return response.data;
  }

  async getTourCategories() {
    const response = await this.client.get('/api/tour-categories');
    return response.data.data;
  }

  async getAdminTourCategories() {
    const response = await this.client.get('/api/tour-categories/admin');
    return response.data.data;
  }

  async createTourCategory(categoryData: any) {
    const response = await this.client.post('/api/tour-categories', categoryData);
    return response.data.data;
  }

  async updateTourCategory(code: string, categoryData: any) {
    const response = await this.client.put(`/api/tour-categories/${code}`, categoryData);
    return response.data.data;
  }

  async deleteTourCategory(code: string) {
    const response = await this.client.delete(`/api/tour-categories/${code}`);
    return response.data;
  }

  // ============ BOOKING ENDPOINTS ============
  async getBookings() {
    const response = await this.client.get('/api/bookings');
    return response.data.data;
  }

  async createBooking(bookingData: any) {
    const response = await this.client.post('/api/bookings', bookingData);
    return response.data.data;
  }

  async getBookingById(id: string) {
    const response = await this.client.get(`/api/bookings/${id}`);
    return response.data;
  }

  async updateBooking(id: string, bookingData: any) {
    const response = await this.client.put(`/api/bookings/${id}`, bookingData);
    return response.data.data;
  }

  async updateBookingStatus(id: string, status: string) {
    const response = await this.client.put(`/api/bookings/${id}/status/${status}`);
    return response.data.data;
  }

  async cancelBooking(id: string, data?: any) {
    const response = await this.client.post(`/api/bookings/${id}/cancel`, data || {});
    return response.data.data || response.data;
  }

  async markBookingRefunded(id: string) {
    const response = await this.client.post(`/api/bookings/${id}/refund/complete`);
    return response.data.data;
  }

  async rejectBookingRefund(id: string, reason = '') {
    const response = await this.client.post(`/api/bookings/${id}/refund/reject`, { refundRejectReason: reason });
    return response.data.data;
  }

  async markBookingPaidOut(id: string) {
    const response = await this.client.post(`/api/bookings/${id}/payout/complete`);
    return response.data.data;
  }

  // ============ PAYMENT ENDPOINTS ============
  async createPayment(paymentData: { bookingId: string; method: 'cod' | 'bank_qr' }) {
    const response = await this.client.post('/api/payments/create', paymentData);
    return response.data.data;
  }

  async getPayment(bookingId: string) {
    const response = await this.client.get(`/api/payments/${bookingId}`);
    return response.data.data;
  }

  // ============ REVIEW ENDPOINTS ============
  async getReviews(tourId: string) {
    const response = await this.client.get(`/api/reviews/tour/${tourId}`);
    return response.data.data;
  }

  async createReview(reviewData: any) {
    const response = await this.client.post('/api/reviews', reviewData);
    return response.data;
  }

  async deleteReview(id: string) {
    const response = await this.client.delete(`/api/reviews/${id}`);
    return response.data;
  }

  async addReviewResponse(id: string, responseMessage: string) {
    const response = await this.client.post(`/api/reviews/${id}/response`, null, { params: { response: responseMessage } });
    return response.data.data;
  }

  async requestReviewResponse(id: string) {
    const response = await this.client.post(`/api/reviews/${id}/request-response`);
    return response.data.data;
  }

  // ============ REPORT ENDPOINTS ============
  async createReport(reportData: any) {
    const response = await this.client.post('/api/reports', reportData);
    return response.data;
  }

  async getTourMessages(tourId: string) {
    const response = await this.client.get(`/api/tours/${tourId}/messages`);
    return response.data.data;
  }

  async sendTourMessage(tourId: string, message: string, senderName: string) {
    const response = await this.client.post(`/api/tours/${tourId}/messages`, {
      message,
      senderName,
    });
    return response.data.data;
  }

  // ============ CONTACT ENDPOINTS ============
  async sendContactMessage(contactData: any) {
    const response = await this.client.post('/api/contact', contactData);
    return response.data;
  }

  async getContactMessages(params?: { page?: number; size?: number; status?: string; search?: string }) {
    const response = await this.client.get('/api/contact/page', { params });
    return response.data.data;
  }

  async replyContactMessage(id: string, reply: string) {
    const response = await this.client.post(`/api/contact/${id}/reply`, null, { params: { reply } });
    return response.data.data;
  }

  async resolveContactMessage(id: string) {
    const response = await this.client.post(`/api/contact/${id}/resolve`);
    return response.data.data;
  }

  // ============ AI CHAT ENDPOINTS ============
  async sendChatMessage(message: string, language: string, context?: string, sessionId?: string) {
    const response = await this.client.post('/api/ai/chat', { message, language, context, sessionId });
    return response.data.data;
  }

  // ============ ADMIN ENDPOINTS ============
  async getAdminStats() {
    const response = await this.client.get('/api/admin/statistics');
    return response.data.data;
  }

  async getAllUsers() {
    const response = await this.client.get('/api/admin/users');
    return response.data.data;
  }

  async getAllProviders() {
    const response = await this.client.get('/api/admin/providers');
    return response.data.data;
  }

  async banUser(id: string) {
    const response = await this.client.post(`/api/admin/users/${id}/ban`);
    return response.data.data;
  }

  async unbanUser(id: string) {
    const response = await this.client.post(`/api/admin/users/${id}/unban`);
    return response.data.data;
  }

  async updateAdminUser(id: string, userData: any) {
    const response = await this.client.put(`/api/admin/users/${id}`, userData);
    return response.data.data;
  }

  async updateProviderStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    const response = await this.client.post(`/api/admin/providers/${id}/status`, null, { params: { status } });
    return response.data.data;
  }

  async getAllReports() {
    const response = await this.client.get('/api/admin/reports');
    return response.data.data;
  }

  async getAdminTours() {
    const response = await this.client.get('/api/admin/tours');
    return response.data.data;
  }

  async approveTour(id: string, notes = '') {
    const response = await this.client.post(`/api/admin/tours/${id}/approve`, null, { params: { notes } });
    return response.data.data;
  }

  async rejectTour(id: string, reason: string, notes = '') {
    const response = await this.client.post(`/api/admin/tours/${id}/reject`, null, { params: { reason, notes } });
    return response.data.data;
  }

  async requestTourEdit(id: string, notes: string) {
    const response = await this.client.post(`/api/admin/tours/${id}/request-edit`, null, { params: { notes } });
    return response.data.data;
  }

  async approveTourPromotion(id: string) {
    const response = await this.client.post(`/api/admin/tours/${id}/promotion/approve`);
    return response.data.data;
  }

  async removePromotions(tourIds: string[]) {
    const response = await this.client.post('/api/admin/promotions/remove', { tourIds });
    return response.data.data;
  }

  async resolveReport(id: string, note = '') {
    const response = await this.client.post(`/api/admin/reports/${id}/resolve`, null, { params: { note } });
    return response.data.data;
  }

  async dismissReport(id: string, reason: string) {
    const response = await this.client.post(`/api/admin/reports/${id}/dismiss`, null, { params: { reason } });
    return response.data.data;
  }

  async markReportReviewed(id: string, note = '') {
    const response = await this.client.post(`/api/admin/reports/${id}/review`, null, { params: { note } });
    return response.data.data;
  }

  async getProviderTours() {
    const response = await this.client.get('/api/provider/tours');
    return response.data.data;
  }

  async getProviderBookings() {
    const response = await this.client.get('/api/provider/bookings');
    return response.data.data;
  }

  async getProviderProfile() {
    const response = await this.client.get('/api/provider/profile');
    return response.data.data;
  }

  async updateProviderProfile(profileData: any) {
    const response = await this.client.put('/api/provider/profile', profileData);
    return response.data.data;
  }

  async getTourSchedules(tourId: string) {
    const response = await this.client.get(`/api/tours/${tourId}/schedules`);
    return response.data.data;
  }

  async createProviderSchedule(tourId: string, scheduleData: any) {
    const response = await this.client.post(`/api/provider/tours/${tourId}/schedules`, scheduleData);
    return response.data.data;
  }

  async updateProviderSchedule(tourId: string, scheduleId: string, scheduleData: any) {
    const response = await this.client.put(`/api/provider/tours/${tourId}/schedules/${scheduleId}`, scheduleData);
    return response.data.data;
  }

  async deleteProviderSchedule(tourId: string, scheduleId: string) {
    const response = await this.client.delete(`/api/provider/tours/${tourId}/schedules/${scheduleId}`);
    return response.data;
  }

}

export default new ApiClient();

const API_MESSAGE_MAP: Record<string, string> = {
  'User not found': 'Không tìm thấy người dùng.',
  'Provider not found': 'Không tìm thấy hồ sơ nhà cung cấp.',
  'Tour not found': 'Không tìm thấy tour.',
  'Booking not found': 'Không tìm thấy đơn đặt tour.',
  'Payment not found': 'Không tìm thấy thông tin thanh toán.',
  'Report not found': 'Không tìm thấy báo cáo.',
  'Review not found': 'Không tìm thấy đánh giá.',
  'Destination not found': 'Không tìm thấy điểm đến.',
  'Message not found': 'Không tìm thấy tin nhắn.',
  'Email already exists': 'Email này đã được sử dụng.',
  'Booking is required to review a tour': 'Bạn cần có đơn đặt tour hợp lệ trước khi đánh giá.',
  'You can only review your own booking': 'Bạn chỉ có thể đánh giá đơn đặt tour của chính mình.',
  'Booking does not belong to this tour': 'Đơn đặt tour không khớp với tour này.',
  'You can only review completed bookings': 'Bạn chỉ có thể đánh giá sau khi tour đã hoàn thành.',
  'This booking has already been reviewed': 'Đơn đặt tour này đã được đánh giá rồi.',
  'Booking is required to report a tour': 'Bạn cần chọn đơn đặt tour liên quan để gửi báo cáo.',
  'You can only report your own booking': 'Bạn chỉ có thể báo cáo từ đơn đặt tour của chính mình.',
  'Cancelled bookings cannot be reported': 'Đơn đã hủy không thể gửi báo cáo.',
  'Đơn đặt tour này đã được báo cáo': 'Bạn đã gửi báo cáo cho đơn đặt tour này.',
  'Not enough slots available': 'Ngày khởi hành này không còn đủ chỗ cho số khách bạn đã chọn. Vui lòng giảm số khách hoặc chọn ngày khởi hành khác.',
  'You do not have permission to manage this booking': 'Bạn không có quyền thao tác với đơn đặt tour này.',
  'You do not have permission to manage this review': 'Bạn không có quyền thao tác với đánh giá này.',
  'You can only respond to reviews for your own tours': 'Nhà cung cấp chỉ được phản hồi đánh giá thuộc tour của mình.',
  'Payment already paid': 'Đơn thanh toán này đã được ghi nhận.',
  'Invalid payment amount': 'Số tiền thanh toán không hợp lệ.',
  'Tour approved successfully': 'Đã duyệt tour.',
  'Tour rejected successfully': 'Đã từ chối tour.',
  'Booking created successfully': 'Đặt tour thành công.',
  'Booking cancelled successfully': 'Đã hủy đơn đặt tour.',
  'Report created successfully': 'Đã gửi báo cáo.',
  'Review created successfully': 'Đã gửi đánh giá.',
  'Review updated successfully': 'Đã cập nhật đánh giá.',
  'Review deleted successfully': 'Đã xóa đánh giá.',
  'Response added successfully': 'Đã gửi phản hồi đánh giá.',
  'Message sent successfully': 'Đã gửi tin nhắn.',
  'Profile updated successfully': 'Đã cập nhật hồ sơ.',
  'Password changed successfully': 'Đã đổi mật khẩu.',
  'Email is required': 'Vui lòng nhập email.',
  'Email is invalid': 'Email không đúng định dạng.',
  'OTP is required': 'Vui lòng nhập mã OTP.',
  'OTP must be 6 digits': 'Mã OTP phải gồm 6 chữ số.',
  'New password is required': 'Vui lòng nhập mật khẩu mới.',
  'Password must be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự, 1 chữ in hoa và 1 ký tự đặc biệt.',
  'Mật khẩu phải có ít nhất 6 ký tự': 'Mật khẩu phải có ít nhất 6 ký tự, 1 chữ in hoa và 1 ký tự đặc biệt.',
  'bookingId is required': 'Thiếu mã đơn đặt tour.',
  'method is required': 'Vui lòng chọn phương thức thanh toán.',
};

function normalizeApiMessage(message?: string) {
  if (!message) return '';
  const trimmed = message.trim();
  if (API_MESSAGE_MAP[trimmed]) return API_MESSAGE_MAP[trimmed];

  const lower = trimmed.toLowerCase();
  if (lower.includes('cloudinary configuration is missing')) return 'Thieu cau hinh Cloudinary tren server. Kiem tra CLOUDINARY_URL hoac CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.';
  if (lower.includes('cloudinary configuration is invalid')) return 'Cau hinh Cloudinary tren server khong hop le. Kiem tra lai CLOUDINARY_URL.';
  if (lower.includes('cloudinary upload failed')) return trimmed.replace('Cloudinary upload failed:', 'Upload anh len Cloudinary that bai:');
  if (lower.includes('cannot upload image to cloudinary')) return 'Khong the upload anh len Cloudinary. Kiem tra cau hinh Cloudinary va ket noi server.';
  if (lower.includes('network error')) return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  if (lower.includes('timeout')) return 'Kết nối quá lâu không phản hồi. Vui lòng thử lại.';
  if (lower.includes('request failed with status code 401')) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (lower.includes('request failed with status code 403')) return 'Bạn không có quyền thực hiện thao tác này.';
  if (lower.includes('request failed with status code 404')) return 'Không tìm thấy dữ liệu cần xử lý.';
  if (lower.includes('request failed with status code 500')) return 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau.';
  if (/^[\x00-\x7F]+$/.test(trimmed)) return 'Có lỗi xảy ra. Vui lòng kiểm tra thông tin và thử lại.';
  return trimmed;
}

export function getApiErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiResponse<unknown>> | undefined;
    const fieldMessage = data?.errors ? Object.values(data.errors)[0] : undefined;
    return normalizeApiMessage(fieldMessage || data?.message || error.message) || fallback;
  }

  return error instanceof Error ? normalizeApiMessage(error.message) || fallback : fallback;
}
