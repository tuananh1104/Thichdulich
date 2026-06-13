package com.example.thichdulich.service;

import com.example.thichdulich.dto.NotificationDTO;
import com.example.thichdulich.entity.Notification;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.repository.NotificationRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public NotificationDTO notifyUser(User user, String type, String title, String message, String link, String metadataJson) {
        if (user == null) {
            return null;
        }
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        notification.setMetadataJson(metadataJson);
        return toDto(notificationRepository.save(notification));
    }

    public void notifyAdmins(String type, String title, String message, String link, String metadataJson) {
        userRepository.findByRole(User.UserRole.admin)
                .forEach(admin -> notifyUser(admin, type, title, message, link, metadataJson));
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotifications(String userId, int limit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        int safeLimit = Math.min(Math.max(1, limit), 50);
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getUnreadCount(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return Map.of("count", notificationRepository.countByUserAndReadAtIsNull(user));
    }

    public NotificationDTO markRead(String userId, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (notification.getUser() == null || !userId.equals(notification.getUser().getId())) {
            throw new RuntimeException("You do not have permission to update this notification");
        }
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
        }
        return toDto(notificationRepository.save(notification));
    }

    public void markAllRead(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        notificationRepository.markAllRead(user, LocalDateTime.now());
    }

    private NotificationDTO toDto(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setLink(notification.getLink());
        dto.setMetadataJson(notification.getMetadataJson());
        dto.setRead(notification.getReadAt() != null);
        dto.setReadAt(notification.getReadAt());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}
