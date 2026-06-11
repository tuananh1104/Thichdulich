package com.example.thichdulich.chatbot;

import com.example.thichdulich.entity.Booking;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ChatPaymentDataService {
    private final ChatBookingDataService bookingDataService;

    public String getPaymentStatus(String orderCode) {
        return bookingDataService.findBooking(orderCode)
                .map(this::summarizePayment)
                .orElse("Chưa tìm thấy thông tin thanh toán theo mã được cung cấp.");
    }

    public String getPaymentStatus(String orderCode, String currentUserId) {
        if (!StringUtils.hasText(currentUserId)) {
            return "Vui lòng đăng nhập để kiểm tra thông tin thanh toán của đơn đặt tour.";
        }

        return bookingDataService.findBooking(orderCode)
                .map(booking -> bookingDataService.belongsToUser(booking, currentUserId)
                        ? summarizePayment(booking)
                        : "Bạn chỉ có thể kiểm tra thông tin thanh toán của đơn thuộc tài khoản của mình.")
                .orElse("Chưa tìm thấy thông tin thanh toán theo mã được cung cấp.");
    }

    private String summarizePayment(Booking booking) {
        return """
                Mã đơn: %s
                Phương thức thanh toán: %s
                Trạng thái thanh toán: %s
                Số tiền thanh toán: %s VNĐ
                Mã giao dịch: %s
                Thời điểm thanh toán: %s
                Link thanh toán: %s
                QR thanh toán: %s
                """.formatted(
                booking.getId(),
                booking.getPaymentMethod() != null ? booking.getPaymentMethod() : "chưa có dữ liệu",
                booking.getPaymentStatus() != null ? booking.getPaymentStatus() : "chưa có dữ liệu",
                booking.getPaymentAmount() != null ? String.format("%,d", booking.getPaymentAmount()) : "chưa có dữ liệu",
                booking.getPaymentTransactionCode() != null ? booking.getPaymentTransactionCode() : "chưa có dữ liệu",
                booking.getPaidAt() != null ? booking.getPaidAt() : "chưa có dữ liệu",
                booking.getPaymentUrl() != null ? booking.getPaymentUrl() : "chưa có dữ liệu",
                booking.getPaymentQrCode() != null ? "đã tạo" : "chưa có dữ liệu");
    }
}
