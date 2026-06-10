package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterPendingResponse {
    private String email;
    private boolean verificationRequired;
    private long expiresInSeconds;
    private long resendAfterSeconds;
}
