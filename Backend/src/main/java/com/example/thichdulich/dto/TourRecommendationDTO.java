package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourRecommendationDTO {
    private TourDTO tour;
    private Double score;
    private List<String> reasons;
}
