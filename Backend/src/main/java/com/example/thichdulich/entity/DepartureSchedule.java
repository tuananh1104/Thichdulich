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
@Table(name = "departure_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"tour", "bookings"})
public class DepartureSchedule {
    @Id
    @EqualsAndHashCode.Include
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id", nullable = false)
    private Tour tour;

    @Column(name = "departure_date", nullable = false)
    private LocalDate departureDate;

    @Column(name = "total_slots", nullable = false)
    private Integer totalSlots = 20;

    @Column(name = "booked_slots", nullable = false)
    private Integer bookedSlots = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('open','closed','full')")
    private ScheduleStatus status = ScheduleStatus.open;

    @OneToMany(mappedBy = "departureSchedule")
    private List<Booking> bookings;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
    }

    public int getAvailableSlots() {
        return Math.max(0, totalSlots - bookedSlots);
    }

    public enum ScheduleStatus {
        open, closed, full
    }
}
