package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourItineraryDTO {
    private String id;
    private Integer day;
    private String title;
    private List<String> activities;
    private String notes;
}
