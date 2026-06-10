package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartureScheduleDTO {
    private String id;
    private String tourId;
    private LocalDate departureDate;
    private Integer totalSlots;
    private Integer bookedSlots;
    private Integer availableSlots;
    private String status;
}
