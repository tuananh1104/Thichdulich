package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.TourRecommendationDTO;
import com.example.thichdulich.dto.TourDTO;
import com.example.thichdulich.service.TourService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tours")
public class TourController {
    @Autowired
    private TourService tourService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TourDTO>>> getAllTours(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(required = false) Integer duration,
            @RequestParam(required = false) Integer minDuration,
            @RequestParam(required = false) Integer maxDuration,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false, defaultValue = "popular") String sortBy) {
        List<TourDTO> tours = tourService.searchApprovedTours(
                search, location, type, minPrice, maxPrice, duration, minDuration, maxDuration, startDate, sortBy);
        return ResponseEntity.ok(ApiResponse.success(tours, "Tours retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TourDTO>> getTourById(@PathVariable String id) {
        try {
            TourDTO tour = tourService.getTourById(id);
            return ResponseEntity.ok(ApiResponse.success(tour));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<TourDTO>>> getToursByType(@PathVariable String type) {
        List<TourDTO> tours = tourService.getToursByType(type);
        return ResponseEntity.ok(ApiResponse.success(tours));
    }

    @GetMapping("/destination/{destinationId}")
    public ResponseEntity<ApiResponse<List<TourDTO>>> getToursByDestination(@PathVariable String destinationId) {
        List<TourDTO> tours = tourService.getToursByDestination(destinationId);
        return ResponseEntity.ok(ApiResponse.success(tours));
    }

    @GetMapping("/{id}/schedules")
    public ResponseEntity<ApiResponse<List<com.example.thichdulich.dto.DepartureScheduleDTO>>> getTourSchedules(
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(tourService.getTourSchedules(id)));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<TourDTO>>> getTrendingTours() {
        List<TourDTO> tours = tourService.getTrendingTours();
        return ResponseEntity.ok(ApiResponse.success(tours, "Trending tours retrieved"));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<TourRecommendationDTO>>> getRecommendations(
            @RequestParam(required = false, defaultValue = "6") int limit) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        return ResponseEntity.ok(ApiResponse.success(tourService.getRecommendations(userId, limit)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TourDTO>> createTour(@Valid @RequestBody TourDTO tourDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String providerId = auth.getPrincipal().toString();
            TourDTO created = tourService.createTour(providerId, tourDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Tour created successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TourDTO>> updateTour(
            @PathVariable String id,
            @Valid @RequestBody TourDTO tourDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
            TourDTO updated = tourService.updateTour(auth.getPrincipal().toString(), isAdmin, id, tourDTO);
            return ResponseEntity.ok(ApiResponse.success(updated, "Tour updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTour(@PathVariable String id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
            tourService.deleteTour(auth.getPrincipal().toString(), isAdmin, id);
            return ResponseEntity.ok(ApiResponse.success(null, "Tour deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }
}
