package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.TourDTO;
import com.example.thichdulich.dto.TourReportDTO;
import com.example.thichdulich.dto.UserDTO;
import com.example.thichdulich.dto.ProviderProfileDTO;
import com.example.thichdulich.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private AdminService adminService;

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getStatistics()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<List<ProviderProfileDTO>>> getAllProviders() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllProviders()));
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<ApiResponse<UserDTO>> banUser(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.setUserBanStatus(id, true), "User banned"));
    }

    @PostMapping("/users/{id}/unban")
    public ResponseEntity<ApiResponse<UserDTO>> unbanUser(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.setUserBanStatus(id, false), "User unbanned"));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable String id,
            @RequestBody UserDTO request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateUser(id, request), "User updated"));
    }

    @PostMapping("/providers/{id}/status")
    public ResponseEntity<ApiResponse<ProviderProfileDTO>> updateProviderStatus(
            @PathVariable String id,
            @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateProviderStatus(id, status), "Provider status updated"));
    }

    @GetMapping("/tours")
    public ResponseEntity<ApiResponse<List<TourDTO>>> getAllTours() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllTours()));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<TourReportDTO>>> getAllReports() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllReports()));
    }

    // Tour Management
    @GetMapping("/tours/pending")
    public ResponseEntity<ApiResponse<List<TourDTO>>> getPendingTours() {
        try {
            List<TourDTO> tours = adminService.getPendingTours();
            return ResponseEntity.ok(ApiResponse.success(tours));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @PostMapping("/tours/{id}/approve")
    public ResponseEntity<ApiResponse<TourDTO>> approveTour(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "") String notes) {
        try {
            String adminId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            TourDTO approved = adminService.approveTour(id, adminId, notes);
            return ResponseEntity.ok(ApiResponse.success(approved, "Tour approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/tours/{id}/reject")
    public ResponseEntity<ApiResponse<TourDTO>> rejectTour(
            @PathVariable String id,
            @RequestParam String reason,
            @RequestParam(required = false, defaultValue = "") String notes) {
        try {
            String adminId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            TourDTO rejected = adminService.rejectTour(id, adminId, reason, notes);
            return ResponseEntity.ok(ApiResponse.success(rejected, "Tour rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/tours/{id}/request-edit")
    public ResponseEntity<ApiResponse<TourDTO>> requestTourEdit(
            @PathVariable String id,
            @RequestParam String notes) {
        try {
            String adminId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            TourDTO updated = adminService.requestTourEdit(id, adminId, notes);
            return ResponseEntity.ok(ApiResponse.success(updated, "Edit request sent"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/promotions/remove")
    public ResponseEntity<ApiResponse<List<TourDTO>>> removePromotions(
            @RequestBody PromotionRemoveRequest request) {
        try {
            List<TourDTO> updated = adminService.removePromotions(request.tourIds());
            return ResponseEntity.ok(ApiResponse.success(updated, "Promotions removed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/tours/{id}/promotion/approve")
    public ResponseEntity<ApiResponse<TourDTO>> approveTourPromotion(@PathVariable String id) {
        try {
            return ResponseEntity.ok(ApiResponse.success(adminService.approveTourPromotion(id), "Promotion approved"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    public record PromotionRemoveRequest(
            List<String> tourIds
    ) {}

    // Report Management
    @GetMapping("/reports/pending")
    public ResponseEntity<ApiResponse<List<TourReportDTO>>> getPendingReports() {
        try {
            List<TourReportDTO> reports = adminService.getPendingReports();
            return ResponseEntity.ok(ApiResponse.success(reports));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @PostMapping("/reports/{id}/resolve")
    public ResponseEntity<ApiResponse<TourReportDTO>> resolveReport(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "") String note) {
        try {
            String adminId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            TourReportDTO resolved = adminService.resolveReport(id, adminId, note);
            return ResponseEntity.ok(ApiResponse.success(resolved, "Report resolved"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/reports/{id}/review")
    public ResponseEntity<ApiResponse<TourReportDTO>> reviewReport(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "") String note) {
        try {
            String adminId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            TourReportDTO reviewed = adminService.reviewReport(id, adminId, note);
            return ResponseEntity.ok(ApiResponse.success(reviewed, "Report reviewed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/reports/{id}/dismiss")
    public ResponseEntity<ApiResponse<TourReportDTO>> dismissReport(
            @PathVariable String id,
            @RequestParam String reason) {
        try {
            String adminId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            TourReportDTO dismissed = adminService.dismissReport(id, adminId, reason);
            return ResponseEntity.ok(ApiResponse.success(dismissed, "Report dismissed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }
}
