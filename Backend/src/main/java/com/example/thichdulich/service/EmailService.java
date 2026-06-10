package com.example.thichdulich.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final RestClient restClient;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    public EmailService() {
        this.restClient = RestClient.builder().baseUrl("https://api.resend.com").build();
    }

    public void sendVerificationOtp(String email, String code, String name) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY is not configured. Development OTP for {} is {}", email, code);
            return;
        }

        String displayName = name == null || name.isBlank() ? "ban" : name;
        String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                  <h2>Xac minh email Thich Du Lich</h2>
                  <p>Xin chao %s,</p>
                  <p>Ma OTP cua ban la:</p>
                  <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0">%s</div>
                  <p>Ma nay het han sau 5 phut. Neu ban khong tao tai khoan, vui long bo qua email nay.</p>
                </div>
                """.formatted(displayName, code);

        try {
            restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", fromEmail,
                            "to", List.of(email),
                            "subject", "Ma xac minh email Thich Du Lich",
                            "html", html
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Could not send verification OTP email to {}. Development OTP is {}", email, code, ex);
        }
    }

    public void sendPasswordResetOtp(String email, String code, String name) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY is not configured. Development password reset OTP for {} is {}", email, code);
            return;
        }

        String displayName = name == null || name.isBlank() ? "ban" : name;
        String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                  <h2>Dat lai mat khau Thich Du Lich</h2>
                  <p>Xin chao %s,</p>
                  <p>Ma OTP dat lai mat khau cua ban la:</p>
                  <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0">%s</div>
                  <p>Ma nay het han sau 5 phut. Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.</p>
                </div>
                """.formatted(displayName, code);

        try {
            restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", fromEmail,
                            "to", List.of(email),
                            "subject", "Ma dat lai mat khau Thich Du Lich",
                            "html", html
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Could not send password reset OTP email to {}. Development OTP is {}", email, code, ex);
        }
    }
}
