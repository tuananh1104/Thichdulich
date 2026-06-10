package com.example.thichdulich.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentDTO {
    private String id;
    private String bookingId;
    private String method;
    private Long amount;
    private String status;
    private String transactionCode;
    private String paymentUrl;
    private String qrCode;
    private String transferContent;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
