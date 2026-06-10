package com.example.thichdulich.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"providerProfile", "bookings", "reviews", "reports"})
public class User {
    @Id
    @EqualsAndHashCode.Include
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('user','provider','admin')")
    private UserRole role = UserRole.user;

    @Lob
    @Column(name = "avatar_url", columnDefinition = "LONGTEXT")
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('LOCAL','GOOGLE')")
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(nullable = false)
    private Boolean enabled = false;

    @Column(length = 15)
    private String phone;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_banned", nullable = false)
    private Boolean isBanned = false;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Provider providerProfile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Booking> bookings;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<TourReview> reviews;

    @OneToMany(mappedBy = "reportedBy", cascade = CascadeType.ALL)
    private List<TourReport> reports;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (isActive == null) isActive = true;
        if (isBanned == null) isBanned = false;
        if (enabled == null) enabled = false;
        if (provider == null) provider = AuthProvider.LOCAL;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isAccountUsable() {
        return Boolean.TRUE.equals(enabled) && Boolean.TRUE.equals(isActive) && !Boolean.TRUE.equals(isBanned);
    }

    public enum UserRole {
        user, provider, admin
    }

    public enum AuthProvider {
        LOCAL, GOOGLE
    }
}
