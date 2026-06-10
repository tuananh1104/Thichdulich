package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.TourReportDTO;
import com.example.thichdulich.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @Autowired
    private ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<TourReportDTO>> createReport(@Valid @RequestBody TourReportDTO reportDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userId = auth.getPrincipal().toString();
            TourReportDTO created = reportService.createReport(userId, reportDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Đã gửi báo cáo"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<ApiResponse<List<TourReportDTO>>> getTourReports(@PathVariable String tourId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            List<TourReportDTO> reports = reportService.getTourReports(
                    tourId,
                    auth.getPrincipal().toString(),
                    isAdmin(auth));
            return ResponseEntity.ok(ApiResponse.success(reports));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<TourReportDTO>>> getPendingReports() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!isAdmin(auth)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Admin permission required", HttpStatus.FORBIDDEN.value()));
            }
            List<TourReportDTO> reports = reportService.getPendingReports();
            return ResponseEntity.ok(ApiResponse.success(reports));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
