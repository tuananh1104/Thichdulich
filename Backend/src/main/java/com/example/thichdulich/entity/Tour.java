package com.example.thichdulich.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "tours")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tour {
    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private Provider provider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id")
    private Destination destination;

    @Column(name = "name_vi", nullable = false, length = 300)
    private String nameVi;

    @Column(name = "description_vi", columnDefinition = "TEXT")
    private String descriptionVi;

    @Column(nullable = false, length = 200)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('adventure','beach','cultural','food','nature','mountain','city')")
    private TourType type;

    @Column(nullable = false)
    private Integer duration;

    @Column(name = "max_people_per_day", nullable = false)
    private Integer maxPeoplePerDay = 20;

    @Column(name = "advance_booking_days", nullable = false)
    private Integer advanceBookingDays = 3;

    @Column(nullable = false)
    private Long price;

    @Column(name = "child_price")
    private Long childPrice;

    @Column(name = "original_price")
    private Long originalPrice;

    @Column(name = "promotion_title", length = 200)
    private String promotionTitle;

    @Column(name = "promotion_badge", length = 80)
    private String promotionBadge;

    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Column(name = "promotion_active", nullable = false)
    private Boolean promotionActive = false;

    @Column(name = "promotion_status", length = 20)
    private String promotionStatus = "none";

    @Column(name = "promotion_source", length = 20)
    private String promotionSource = "none";

    @Column(name = "excluded_services", columnDefinition = "TEXT")
    private String excludedServices;

    @Column(name = "included_services", columnDefinition = "TEXT")
    private String includedServices;

    @Column(name = "itinerary_json", columnDefinition = "LONGTEXT")
    private String itineraryJson;

    @Column(name = "images_json", columnDefinition = "LONGTEXT")
    private String imagesJson;

    @Column(length = 500)
    private String image;

    @Column(nullable = false, precision = 2, scale = 1)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    @Column(nullable = false)
    private Boolean availability = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('pending','approved','rejected','need_edit','updated')")
    private TourStatus status = TourStatus.pending;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DepartureSchedule> departureSchedules;

    @OneToMany(mappedBy = "tour")
    private List<Booking> bookings;

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TourReview> reviews;

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TourReport> reports;

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TourMessage> messages;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = TourStatus.pending;
        if (reviewCount == null) reviewCount = 0;
        if (maxPeoplePerDay == null || maxPeoplePerDay < 1) maxPeoplePerDay = 20;
        if (advanceBookingDays == null || advanceBookingDays < 1) {
            advanceBookingDays = suggestedAdvanceBookingDays(duration);
        }
        if (rating == null) rating = BigDecimal.ZERO;
        if (availability == null) availability = true;
        if (promotionActive == null) promotionActive = false;
        if (promotionStatus == null) promotionStatus = "none";
        if (promotionSource == null) promotionSource = "none";
        if (submittedAt == null) submittedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (advanceBookingDays == null || advanceBookingDays < 1) {
            advanceBookingDays = suggestedAdvanceBookingDays(duration);
        }
    }

    public static int suggestedAdvanceBookingDays(Integer durationDays) {
        int days = durationDays != null && durationDays > 0 ? durationDays : 1;
        if (days == 1) return 1;
        if (days <= 3) return 3;
        if (days <= 5) return 5;
        return 7;
    }

    public enum TourType {
        adventure, beach, cultural, food, nature, mountain, city
    }

    public enum TourStatus {
        pending, approved, rejected, need_edit, updated
    }
}
