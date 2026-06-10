package com.example.thichdulich.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tour_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourReview {
    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id", nullable = false)
    private Tour tour;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(nullable = false)
    private Integer rating;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String comment;

    @Column(columnDefinition = "LONGTEXT")
    private String images;

    @Column(name = "helpful_count", nullable = false)
    private Integer helpfulCount = 0;

    @Column(name = "response_from", length = 100)
    private String responseFrom;

    @Column(name = "response_message", columnDefinition = "TEXT")
    private String responseMessage;

    @Column(name = "response_at")
    private LocalDateTime responseAt;

    @Column(name = "response_requested", nullable = false)
    private Boolean responseRequested = false;

    @Column(name = "response_requested_at")
    private LocalDateTime responseRequestedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_requested_by")
    private User responseRequestedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (helpfulCount == null) helpfulCount = 0;
        if (responseRequested == null) responseRequested = false;
    }
}
