package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.AuthRequest;
import com.example.thichdulich.dto.AuthResponse;
import com.example.thichdulich.dto.ForgotPasswordRequest;
import com.example.thichdulich.dto.RegisterPendingResponse;
import com.example.thichdulich.dto.RegisterRequest;
import com.example.thichdulich.dto.ResendOtpRequest;
import com.example.thichdulich.dto.ResetPasswordRequest;
import com.example.thichdulich.dto.UserDTO;
import com.example.thichdulich.dto.VerifyEmailRequest;
import com.example.thichdulich.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterPendingResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterPendingResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "OTP đã được gửi về email"));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Xác minh email thành công"));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<RegisterPendingResponse>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        RegisterPendingResponse response = authService.resendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(response, "OTP mới đã được gửi về email"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<RegisterPendingResponse>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        RegisterPendingResponse response = authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(response, "OTP dat lai mat khau da duoc gui ve email"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Doi mat khau thanh cong"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> me(Authentication authentication) {
        UserDTO response = authService.getMe(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response, "Current user"));
    }
}
