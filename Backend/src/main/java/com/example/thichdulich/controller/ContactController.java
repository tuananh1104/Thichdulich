package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.ContactMessageDTO;
import com.example.thichdulich.dto.ContactMessagePageDTO;
import com.example.thichdulich.service.ContactRateLimitService;
import com.example.thichdulich.service.ContactService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    @Autowired
    private ContactService contactService;

    @Autowired
    private ContactRateLimitService contactRateLimitService;

    @PostMapping
    public ResponseEntity<ApiResponse<ContactMessageDTO>> sendMessage(
            @Valid @RequestBody ContactMessageDTO messageDTO,
            HttpServletRequest request) {
        try {
            if (!contactRateLimitService.allow(clientIp(request))) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(ApiResponse.error("Bạn gửi liên hệ quá nhanh. Vui lòng thử lại sau.", HttpStatus.TOO_MANY_REQUESTS.value()));
            }
            ContactMessageDTO sent = contactService.sendMessage(messageDTO, currentUserIdOrNull());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(sent, "Message sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ContactMessagePageDTO>> getMessagesPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(required = false, defaultValue = "") String search) {
        try {
            ContactMessagePageDTO messages = contactService.getMessagesPage(page, size, status, search);
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ContactMessageDTO>>> getAllMessages() {
        try {
            List<ContactMessageDTO> messages = contactService.getAllMessages();
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @GetMapping("/new")
    public ResponseEntity<ApiResponse<List<ContactMessageDTO>>> getNewMessages() {
        try {
            List<ContactMessageDTO> messages = contactService.getNewMessages();
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<ContactMessageDTO>> replyToMessage(
            @PathVariable String id,
            @RequestParam String reply,
            @RequestParam(required = false, defaultValue = "Admin") String repliedBy) {
        try {
            String repliedById = currentUserIdOrNull();
            if (repliedById == null) {
                repliedById = repliedBy;
            }
            ContactMessageDTO replied = contactService.replyToMessage(id, reply, repliedById);
            return ResponseEntity.ok(ApiResponse.success(replied, "Reply sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<ContactMessageDTO>> markAsResolved(@PathVariable String id) {
        try {
            ContactMessageDTO resolved = contactService.markAsResolved(id);
            return ResponseEntity.ok(ApiResponse.success(resolved, "Message marked as resolved"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    private String currentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getPrincipal().toString();
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
