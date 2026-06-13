package com.example.thichdulich.repository;

import com.example.thichdulich.entity.Notification;
import com.example.thichdulich.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    long countByUserAndReadAtIsNull(User user);

    @Modifying
    @Query("update Notification n set n.readAt = :readAt where n.user = :user and n.readAt is null")
    int markAllRead(User user, LocalDateTime readAt);
}
