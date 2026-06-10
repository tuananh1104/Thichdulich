package com.example.thichdulich.chatbot;

import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatBookingDataService {
    private final BookingRepository bookingRepository;

    public Optional<Booking> findBooking(String orderCode) {
        if (!StringUtils.hasText(orderCode)) return Optional.empty();
        String code = orderCode.trim();
        return bookingRepository.findById(code)
                .or(() -> bookingRepository.findByPaymentTransactionCode(code));
    }

    public String getBookingStatus(String orderCode) {
        return findBooking(orderCode)
                .map(this::summarizeBooking)
                .orElse("Chưa tìm thấy đơn đặt tour theo mã được cung cấp.");
    }

    public String summarizeBooking(Booking booking) {
        return """
                Mã đơn: %s
                Tour: %s
                Ngày đi: %s
                Số khách: %s người lớn, %s trẻ em
                Trạng thái đơn: %s
                Trạng thái thanh toán: %s
                Phương thức thanh toán: %s
                Tổng tiền: %s VNĐ
                Đã cọc: %s VNĐ
                Còn lại: %s VNĐ
                Trạng thái hoàn tiền: %s
                """.formatted(
                booking.getId(),
                booking.getTour() != null ? booking.getTour().getNameVi() : "chưa có dữ liệu",
                booking.getStartDate() != null ? booking.getStartDate() : "chưa có dữ liệu",
                booking.getAdults(),
                booking.getChildren(),
                booking.getStatus(),
                booking.getPaymentStatus() != null ? booking.getPaymentStatus() : "chưa có dữ liệu",
                booking.getPaymentMethod() != null ? booking.getPaymentMethod() : "chưa có dữ liệu",
                format(booking.getTotalAmount()),
                format(booking.getDepositAmount()),
                format(booking.getRemainingAmount()),
                booking.getRefundStatus());
    }

    private String format(Long value) {
        return value == null ? "chưa có dữ liệu" : String.format("%,d", value);
    }
}
