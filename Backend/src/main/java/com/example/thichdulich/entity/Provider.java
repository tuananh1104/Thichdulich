package com.example.thichdulich.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "providers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"user", "tours"})
public class Provider {
    @Id
    @EqualsAndHashCode.Include
    @Column(length = 36)
    private String id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "tax_code", length = 20)
    private String taxCode;

    @Column(length = 15)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String logo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('pending','approved','rejected')")
    private ProviderStatus status = ProviderStatus.pending;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "joined_date", nullable = false)
    private LocalDate joinedDate;

    @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL)
    private List<Tour> tours;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        if (joinedDate == null) {
            joinedDate = LocalDate.now();
        }
        if (isVerified == null) isVerified = false;
    }

    public enum ProviderStatus {
        pending, approved, rejected
    }
}
