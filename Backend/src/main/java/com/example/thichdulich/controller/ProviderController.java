package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.BookingDTO;
import com.example.thichdulich.dto.DepartureScheduleDTO;
import com.example.thichdulich.dto.ProviderProfileDTO;
import com.example.thichdulich.dto.TourDTO;
import com.example.thichdulich.entity.Provider;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.repository.ProviderRepository;
import com.example.thichdulich.repository.UserRepository;
import com.example.thichdulich.service.BookingService;
import com.example.thichdulich.service.TourService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/provider")
public class ProviderController {
    @Autowired
    private TourService tourService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ProviderRepository providerRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ProviderProfileDTO>> getProfile() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        Provider provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        return ResponseEntity.ok(ApiResponse.success(toProfileDto(provider)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<ProviderProfileDTO>> updateProfile(@Valid @RequestBody ProviderProfileDTO request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        Provider provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String companyName = request.getCompanyName().trim();
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone().trim();

        provider.setCompanyName(companyName);
        user.setName(companyName);

        if (!email.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Email already exists", HttpStatus.BAD_REQUEST.value()));
            }
            user.setEmail(email);
        }
        provider.setPhone(phone);
        user.setPhone(phone);
        provider.setAddress(normalizeOptional(request.getAddress()));
        provider.setDescription(normalizeOptional(request.getDescription()));
        provider.setTaxCode(request.getTaxCode().trim());
        provider.setLicenseNumber(request.getLicenseNumber().trim());

        userRepository.save(user);
        Provider saved = providerRepository.save(provider);
        return ResponseEntity.ok(ApiResponse.success(toProfileDto(saved), "Provider profile updated"));
    }

    @GetMapping("/tours")
    public ResponseEntity<ApiResponse<List<TourDTO>>> getMyTours() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        assertApprovedProvider(userId);
        return ResponseEntity.ok(ApiResponse.success(tourService.getProviderTours(userId)));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getMyBookings() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        assertApprovedProvider(userId);
        return ResponseEntity.ok(ApiResponse.success(bookingService.getProviderBookings(userId)));
    }

    @PostMapping("/tours/{tourId}/schedules")
    public ResponseEntity<ApiResponse<DepartureScheduleDTO>> createSchedule(
            @PathVariable String tourId,
            @RequestBody DepartureScheduleDTO request) {
        try {
            String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            assertApprovedProvider(userId);
            DepartureScheduleDTO created = tourService.createSchedule(userId, tourId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Schedule created"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PutMapping("/tours/{tourId}/schedules/{scheduleId}")
    public ResponseEntity<ApiResponse<DepartureScheduleDTO>> updateSchedule(
            @PathVariable String tourId,
            @PathVariable String scheduleId,
            @RequestBody DepartureScheduleDTO request) {
        try {
            String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            assertApprovedProvider(userId);
            DepartureScheduleDTO updated = tourService.updateSchedule(userId, tourId, scheduleId, request);
            return ResponseEntity.ok(ApiResponse.success(updated, "Schedule updated"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @DeleteMapping("/tours/{tourId}/schedules/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(
            @PathVariable String tourId,
            @PathVariable String scheduleId) {
        try {
            String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            assertApprovedProvider(userId);
            tourService.deleteSchedule(userId, tourId, scheduleId);
            return ResponseEntity.ok(ApiResponse.success(null, "Schedule deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    private ProviderProfileDTO toProfileDto(Provider provider) {
        ProviderProfileDTO dto = new ProviderProfileDTO();
        dto.setId(provider.getId());
        dto.setUserId(provider.getUser().getId());
        dto.setCompanyName(provider.getCompanyName());
        dto.setEmail(provider.getUser().getEmail());
        dto.setPhone(provider.getPhone() != null ? provider.getPhone() : provider.getUser().getPhone());
        dto.setAddress(provider.getAddress());
        dto.setDescription(provider.getDescription());
        dto.setTaxCode(provider.getTaxCode());
        dto.setLicenseNumber(provider.getLicenseNumber());
        dto.setStatus(provider.getStatus() != null ? provider.getStatus().name() : null);
        dto.setVerified(provider.getIsVerified());
        dto.setJoinedDate(provider.getJoinedDate() != null ? provider.getJoinedDate().toString() : null);
        return dto;
    }

    private void assertApprovedProvider(String userId) {
        Provider provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        if (provider.getStatus() != Provider.ProviderStatus.approved) {
            throw new RuntimeException("Provider profile is waiting for admin approval");
        }
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
