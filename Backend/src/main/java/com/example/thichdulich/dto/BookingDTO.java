package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDTO {
    private String id;

    @NotBlank(message = "Vui lòng chọn tour")
    private String tourId;

    private String tourName;

    private String userId;

    private String userName;

    private String userEmail;

    private String departureScheduleId;

    private LocalDate startDate;

    private LocalDate endDate;

    @NotNull(message = "Vui lòng nhập số người lớn")
    @Min(value = 1, message = "Phải có ít nhất 1 người lớn")
    private Integer adults;

    @Min(value = 0, message = "Số trẻ em không được âm")
    private Integer children;

    private Double totalAmount;

    private Long depositAmount;

    private Long remainingAmount;

    private Integer commissionRate;

    private Long commissionAmount;

    private Long providerPayoutAmount;

    private String cancelledBy;

    private LocalDateTime cancelledAt;

    private String cancelReason;

    private String refundStatus;

    private Long refundAmount;

    private String refundBankName;

    private String refundAccountNumber;

    private String refundAccountName;

    private LocalDateTime refundRequestedAt;

    private LocalDateTime refundProcessedAt;

    private String refundProcessedBy;

    private String refundRejectReason;

    private String payoutStatus;

    private Long payoutAmount;

    private LocalDateTime payoutProcessedAt;

    private String payoutProcessedBy;

    private String status; // pending, deposited, paid, confirmed, completed, cancelled, refunded

    @NotBlank(message = "Vui lòng nhập họ tên liên hệ")
    private String contactName;

    @Email(message = "Email liên hệ không đúng định dạng")
    private String contactEmail;

    @Pattern(regexp = "^(0[0-9]{9}|\\+84[0-9]{9})$", message = "Số điện thoại liên hệ phải đúng định dạng Việt Nam, ví dụ 0912345678 hoặc +84912345678")
    private String contactPhone;

    private String paymentMethod; // cod, bank_qr, transfer, card, vnpay

    private String paymentStatus;

    private String specialRequests;

    private Boolean hasReviewed;

    private Boolean hasReported;

    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
