package com.example.thichdulich.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePaymentRequest {
    @NotBlank(message = "Thiếu mã đơn đặt tour")
    private String bookingId;

    @NotBlank(message = "Vui lòng chọn phương thức thanh toán")
    private String method; // cod, bank_qr
}
