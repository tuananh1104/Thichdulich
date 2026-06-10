package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.TourReviewDTO;
import com.example.thichdulich.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    @Autowired
    private ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<TourReviewDTO>> createReview(@Valid @RequestBody TourReviewDTO reviewDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            TourReviewDTO created = reviewService.createReview(auth.getPrincipal().toString(), reviewDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Đã gửi đánh giá"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<ApiResponse<List<TourReviewDTO>>> getTourReviews(@PathVariable String tourId) {
        try {
            List<TourReviewDTO> reviews = reviewService.getTourReviews(tourId);
            return ResponseEntity.ok(ApiResponse.success(reviews));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TourReviewDTO>> updateReview(
            @PathVariable String id,
            @Valid @RequestBody TourReviewDTO reviewDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = isAdmin(auth);
            TourReviewDTO updated = reviewService.updateReview(id, reviewDTO, auth.getPrincipal().toString(), isAdmin);
            return ResponseEntity.ok(ApiResponse.success(updated, "Đã cập nhật đánh giá"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable String id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = isAdmin(auth);
            reviewService.deleteReview(id, auth.getPrincipal().toString(), isAdmin);
            return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa đánh giá"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }

    @PostMapping("/{id}/response")
    public ResponseEntity<ApiResponse<TourReviewDTO>> addProviderResponse(
            @PathVariable String id,
            @RequestParam String response) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = isAdmin(auth);
            TourReviewDTO updated = reviewService.addProviderResponse(id, response, auth.getPrincipal().toString(), isAdmin);
            return ResponseEntity.ok(ApiResponse.success(updated, "Đã gửi phản hồi đánh giá"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/request-response")
    public ResponseEntity<ApiResponse<TourReviewDTO>> requestProviderResponse(@PathVariable String id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!isAdmin(auth)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Chỉ admin được yêu cầu nhà cung cấp phản hồi", HttpStatus.FORBIDDEN.value()));
            }
            TourReviewDTO updated = reviewService.requestProviderResponse(id, auth.getPrincipal().toString());
            return ResponseEntity.ok(ApiResponse.success(updated, "Đã yêu cầu nhà cung cấp phản hồi"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
