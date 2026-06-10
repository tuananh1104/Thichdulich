package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.BookingDTO;
import com.example.thichdulich.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
@RequestMapping("/api/bookings")
public class BookingController {
    @Autowired
    private BookingService bookingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getBookings() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = isAdmin(auth);
        List<BookingDTO> bookings = isAdmin
                ? bookingService.getAllBookings()
                : bookingService.getUserBookings(auth.getPrincipal().toString());
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingDTO>> createBooking(@Valid @RequestBody BookingDTO bookingDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userId = auth.getPrincipal().toString();
            BookingDTO created = bookingService.createBooking(userId, bookingDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Đã tạo yêu cầu thanh toán"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingDTO>> getBookingById(@PathVariable String id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            BookingDTO booking = bookingService.getBookingById(id, auth.getPrincipal().toString(), isAdmin(auth));
            return ResponseEntity.ok(ApiResponse.success(booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getUserBookings() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userId = auth.getPrincipal().toString();
            List<BookingDTO> bookings = bookingService.getUserBookings(userId);
            return ResponseEntity.ok(ApiResponse.success(bookings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getBookingsByTour(@PathVariable String tourId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            List<BookingDTO> bookings = bookingService.getBookingsByTour(
                    tourId,
                    auth.getPrincipal().toString(),
                    isAdmin(auth));
            return ResponseEntity.ok(ApiResponse.success(bookings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }

    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<ApiResponse<BookingDTO>> updateBookingStatus(
            @PathVariable String id,
            @PathVariable String status) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            BookingDTO updated = bookingService.updateBookingStatus(
                    id,
                    status,
                    auth.getPrincipal().toString(),
                    isAdmin(auth));
            return ResponseEntity.ok(ApiResponse.success(updated, "Đã cập nhật trạng thái đơn"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/confirm-payment")
    public ResponseEntity<ApiResponse<BookingDTO>> confirmPayment(
            @PathVariable String id,
            @RequestParam(required = false) String transactionId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            BookingDTO updated = bookingService.confirmPayment(
                    id,
                    transactionId,
                    auth.getPrincipal().toString(),
                    isAdmin(auth));
            return ResponseEntity.ok(ApiResponse.success(updated, "Đã xác nhận thanh toán"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingDTO>> cancelBooking(
            @PathVariable String id,
            @RequestBody(required = false) BookingDTO request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            BookingDTO updated = bookingService.requestCancellation(
                    id,
                    auth.getPrincipal().toString(),
                    isAdmin(auth),
                    request);
            return ResponseEntity.ok(ApiResponse.success(updated, "Đã hủy đơn đặt tour"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/refund/complete")
    public ResponseEntity<ApiResponse<BookingDTO>> markRefunded(@PathVariable String id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            requireAdmin(auth);
            BookingDTO updated = bookingService.markRefunded(id, auth.getPrincipal().toString());
            return ResponseEntity.ok(ApiResponse.success(updated, "Đã xác nhận hoàn tiền"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/refund/reject")
    public ResponseEntity<ApiResponse<BookingDTO>> rejectRefund(
            @PathVariable String id,
            @RequestBody(required = false) BookingDTO request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            requireAdmin(auth);
            String reason = request != null ? request.getRefundRejectReason() : null;
            BookingDTO updated = bookingService.rejectRefund(id, auth.getPrincipal().toString(), reason);
            return ResponseEntity.ok(ApiResponse.success(updated, "Đã từ chối hoàn tiền"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/payout/complete")
    public ResponseEntity<ApiResponse<BookingDTO>> markPaidOut(@PathVariable String id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            requireAdmin(auth);
            BookingDTO updated = bookingService.markPaidOut(id, auth.getPrincipal().toString());
            return ResponseEntity.ok(ApiResponse.success(updated, "Đã xác nhận chuyển tiền cho nhà cung cấp"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    private void requireAdmin(Authentication auth) {
        if (!isAdmin(auth)) {
            throw new RuntimeException("Bạn không có quyền thực hiện thao tác này");
        }
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
