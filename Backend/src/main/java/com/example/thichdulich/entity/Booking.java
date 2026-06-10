package com.example.thichdulich.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id", nullable = false)
    private Tour tour;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departure_schedule_id")
    private DepartureSchedule departureSchedule;

    @Column(name = "start_date")
    private java.time.LocalDate startDate;

    @Column(nullable = false)
    private Integer adults = 1;

    @Column(nullable = false)
    private Integer children = 0;

    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('pending','deposited','paid','confirmed','completed','cancelled','refunded')")
    private BookingStatus status = BookingStatus.pending;

    @Column(name = "deposit_amount", nullable = false)
    private Long depositAmount = 0L;

    @Column(name = "remaining_amount", nullable = false)
    private Long remainingAmount = 0L;

    @Column(name = "commission_rate", nullable = false)
    private Integer commissionRate = 10;

    @Column(name = "commission_amount", nullable = false)
    private Long commissionAmount = 0L;

    @Column(name = "provider_payout_amount", nullable = false)
    private Long providerPayoutAmount = 0L;

    @Column(name = "cancelled_by", length = 20)
    private String cancelledBy;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", nullable = false, columnDefinition = "ENUM('none','refund_pending','refunded','no_refund','refund_rejected')")
    private RefundStatus refundStatus = RefundStatus.none;

    @Column(name = "refund_amount", nullable = false)
    private Long refundAmount = 0L;

    @Column(name = "refund_bank_name", length = 100)
    private String refundBankName;

    @Column(name = "refund_account_number", length = 50)
    private String refundAccountNumber;

    @Column(name = "refund_account_name", length = 100)
    private String refundAccountName;

    @Column(name = "refund_requested_at")
    private LocalDateTime refundRequestedAt;

    @Column(name = "refund_processed_at")
    private LocalDateTime refundProcessedAt;

    @Column(name = "refund_processed_by", length = 36)
    private String refundProcessedBy;

    @Column(name = "refund_reject_reason", columnDefinition = "TEXT")
    private String refundRejectReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "payout_status", nullable = false, columnDefinition = "ENUM('none','payout_pending','paid_out')")
    private PayoutStatus payoutStatus = PayoutStatus.none;

    @Column(name = "payout_amount", nullable = false)
    private Long payoutAmount = 0L;

    @Column(name = "payout_processed_at")
    private LocalDateTime payoutProcessedAt;

    @Column(name = "payout_processed_by", length = 36)
    private String payoutProcessedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30)
    private PaymentStatus paymentStatus;

    @Column(name = "payment_amount")
    private Long paymentAmount;

    @Column(name = "payment_transaction_code", length = 200)
    private String paymentTransactionCode;

    @Column(name = "payment_url", length = 1000)
    private String paymentUrl;

    @Column(name = "payment_qr_code", columnDefinition = "TEXT")
    private String paymentQrCode;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "contact_name", nullable = false, length = 100)
    private String contactName;

    @Column(name = "contact_email", nullable = false, length = 150)
    private String contactEmail;

    @Column(name = "contact_phone", nullable = false, length = 15)
    private String contactPhone;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TourReview> reviews;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = BookingStatus.pending;
        if (adults == null) adults = 1;
        if (children == null) children = 0;
        if (depositAmount == null) depositAmount = 0L;
        if (remainingAmount == null) remainingAmount = 0L;
        if (commissionRate == null) commissionRate = 10;
        if (commissionAmount == null) commissionAmount = 0L;
        if (providerPayoutAmount == null) providerPayoutAmount = 0L;
        if (refundStatus == null) refundStatus = RefundStatus.none;
        if (refundAmount == null) refundAmount = 0L;
        if (payoutStatus == null) payoutStatus = PayoutStatus.none;
        if (payoutAmount == null) payoutAmount = 0L;
    }

    public enum BookingStatus {
        pending, deposited, paid, confirmed, completed, cancelled, refunded
    }

    public enum RefundStatus {
        none, refund_pending, refunded, no_refund, refund_rejected
    }

    public enum PayoutStatus {
        none, payout_pending, paid_out
    }

    public enum PaymentMethod {
        cod, bank_qr, vnpay, transfer, card
    }

    public enum PaymentStatus {
        pending, deposited, paid, failed, success, refunded
    }
}
