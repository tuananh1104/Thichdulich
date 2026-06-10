package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.TourMessageDTO;
import com.example.thichdulich.service.TourMessageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tours/{tourId}/messages")
public class TourMessageController {
    @Autowired
    private TourMessageService tourMessageService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TourMessageDTO>>> getMessages(@PathVariable String tourId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(ApiResponse.success(tourMessageService.getMessagesByTour(
                tourId,
                auth.getPrincipal().toString(),
                isAdmin(auth))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TourMessageDTO>> sendMessage(
            @PathVariable String tourId,
            @Valid @RequestBody SendTourMessageRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String senderId = auth.getPrincipal().toString();
        boolean isAdmin = isAdmin(auth);
        String senderRole = isAdmin ? "admin" : "provider";

        TourMessageDTO created = tourMessageService.sendMessage(
                tourId,
                senderId,
                request.getMessage(),
                senderRole,
                request.getSenderName(),
                isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Message sent successfully"));
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    @Data
    public static class SendTourMessageRequest {
        @NotBlank(message = "Vui lòng nhập nội dung tin nhắn")
        private String message;

        private String senderName;
    }
}
