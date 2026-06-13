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
                  <h2>Xác minh email Thích Du Lịch</h2>
                  <p>Xin chào %s,</p>
                  <p>Mã OTP của bạn là:</p>
                  <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0">%s</div>
                  <p>Mã này hết hạn sau 5 phút. Nếu bạn không tạo tài khoản, vui lòng bỏ qua email này.</p>
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
                            "subject", "Mã xác minh email Thích Du Lịch",
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
                  <h2>Đặt lại mật khẩu Thích Du Lịch</h2>
                  <p>Xin chào %s,</p>
                  <p>Mã OTP đặt lại mật khẩu của bạn là:</p>
                  <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0">%s</div>
                  <p>Mã này hết hạn sau 5 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
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
                            "subject", "Mã đặt lại mật khẩu Thích Du Lịch",
                            "html", html
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Could not send password reset OTP email to {}. Development OTP is {}", email, code, ex);
        }
    }

    public void sendContactReply(String email, String name, String originalSubject, String originalMessage, String replyMessage) {
        requireResendConfigured();

        String safeSubject = sanitizeSubject(originalSubject);
        String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                  <h2>Phản hồi từ Thích Du Lịch</h2>
                  <div style="margin:18px 0;padding:16px;border-left:4px solid #0064D2;background:#F3F8FF;white-space:pre-wrap">%s</div>
                  <p style="margin-top:24px"><strong>Yêu cầu bạn đã gửi:</strong> %s</p>
                  <div style="margin:12px 0;padding:14px;background:#F9FAFB;border:1px solid #E5E7EB;white-space:pre-wrap">%s</div>
                </div>
                """.formatted(
                escapeHtml(replyMessage),
                escapeHtml(safeSubject),
                escapeHtml(originalMessage)
        );

        sendRequiredEmail(
                email,
                "Phản hồi từ Thích Du Lịch: " + safeSubject,
                html,
                "contact reply"
        );
    }

    private void requireResendConfigured() {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            throw new IllegalStateException("RESEND_API_KEY is not configured");
        }
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new IllegalStateException("RESEND_FROM_EMAIL is not configured");
        }
    }

    private void sendRequiredEmail(String email, String subject, String html, String purpose) {
        try {
            restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", fromEmail,
                            "to", List.of(email),
                            "subject", subject,
                            "html", html
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Could not send {} email to {}", purpose, email, ex);
            throw new IllegalStateException("Could not send email to customer");
        }
    }

    private String sanitizeSubject(String subject) {
        if (subject == null || subject.isBlank()) {
            return "Yêu cầu liên hệ";
        }
        String cleaned = subject.replace('\r', ' ').replace('\n', ' ').trim();
        return cleaned.length() > 140 ? cleaned.substring(0, 140) : cleaned;
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
