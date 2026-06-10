package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.CreatePaymentRequest;
import com.example.thichdulich.dto.PaymentDTO;
import com.example.thichdulich.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<PaymentDTO>> createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            PaymentDTO payment = paymentService.createPayment(
                    request.getBookingId(),
                    request.getMethod(),
                    auth.getPrincipal().toString(),
                    isAdmin(auth));
            return ResponseEntity.ok(ApiResponse.success(payment, "Payment created"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/bank/webhook")
    public ResponseEntity<ApiResponse<PaymentDTO>> bankWebhook(@RequestBody Map<String, Object> payload) {
        try {
            PaymentDTO payment = paymentService.handleBankWebhook(payload);
            return ResponseEntity.ok(ApiResponse.success(payment, "Bank webhook processed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentDTO>> getPayment(@PathVariable String bookingId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            PaymentDTO payment = paymentService.getPaymentByBooking(
                    bookingId,
                    auth.getPrincipal().toString(),
                    isAdmin(auth));
            return ResponseEntity.ok(ApiResponse.success(payment));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
