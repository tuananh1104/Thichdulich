package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.NotificationDTO;
import com.example.thichdulich.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDTO>>> getNotifications(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getNotifications(currentUserId(), limit)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(currentUserId())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDTO>> markRead(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markRead(currentUserId(), id)));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        notificationService.markAllRead(currentUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Notifications marked as read"));
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
    }
}
