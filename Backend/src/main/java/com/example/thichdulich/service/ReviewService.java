package com.example.thichdulich.service;

import com.example.thichdulich.dto.TourReviewDTO;
import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.TourReview;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.TourReviewRepository;
import com.example.thichdulich.repository.UserRepository;
import com.example.thichdulich.repository.BookingRepository;
import com.example.thichdulich.repository.ProviderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReviewService {
    @Autowired
    private TourReviewRepository reviewRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ProviderRepository providerRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public TourReviewDTO createReview(String userId, TourReviewDTO reviewDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Tour tour = tourRepository.findById(reviewDTO.getTourId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tour"));

        if (reviewDTO.getBookingId() == null || reviewDTO.getBookingId().isBlank()) {
            throw new RuntimeException("Bạn cần có đơn đặt tour hợp lệ trước khi đánh giá");
        }
        Booking booking = bookingRepository.findById(reviewDTO.getBookingId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá đơn đặt tour của chính mình");
        }
        if (!booking.getTour().getId().equals(tour.getId())) {
            throw new RuntimeException("Đơn đặt tour không khớp với tour này");
        }
        if (booking.getStatus() != Booking.BookingStatus.completed) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá sau khi tour đã hoàn thành");
        }
        if (booking.getReviewedAt() != null || reviewRepository.existsByBookingId(booking.getId())) {
            throw new RuntimeException("Đơn đặt tour này đã được đánh giá rồi");
        }

        TourReview review = new TourReview();
        review.setUser(user);
        review.setTour(tour);
        review.setBooking(booking);
        review.setRating(reviewDTO.getRating());
        review.setComment(reviewDTO.getComment());
        if (reviewDTO.getImages() != null) {
            try {
                review.setImages(objectMapper.writeValueAsString(reviewDTO.getImages()));
            } catch (Exception e) {
                throw new RuntimeException("Ảnh đánh giá không hợp lệ", e);
            }
        }

        TourReview saved = reviewRepository.save(review);
        booking.setReviewedAt(LocalDateTime.now());
        bookingRepository.save(booking);
        updateTourRating(tour.getId());
        return DtoMapper.toReviewDTO(saved);
    }

    public List<TourReviewDTO> getTourReviews(String tourId) {
        return reviewRepository.findByTourIdOrderByCreatedAtDesc(tourId)
                .stream()
                .map(DtoMapper::toReviewDTO)
                .collect(Collectors.toList());
    }

    public TourReviewDTO updateReview(String reviewId, TourReviewDTO reviewDTO, String actorUserId, boolean isAdmin) {
        TourReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
        assertCanManageReview(review, actorUserId, isAdmin);
        review.setRating(reviewDTO.getRating());
        review.setComment(reviewDTO.getComment());
        if (reviewDTO.getImages() != null) {
            try {
                review.setImages(objectMapper.writeValueAsString(reviewDTO.getImages()));
            } catch (Exception e) {
                throw new RuntimeException("Ảnh đánh giá không hợp lệ", e);
            }
        }
        TourReview updated = reviewRepository.save(review);
        updateTourRating(review.getTour().getId());
        return DtoMapper.toReviewDTO(updated);
    }

    public void deleteReview(String reviewId, String actorUserId, boolean isAdmin) {
        TourReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
        assertCanManageReview(review, actorUserId, isAdmin);
        String tourId = review.getTour().getId();
        reviewRepository.deleteById(reviewId);
        updateTourRating(tourId);
    }

    public TourReviewDTO addProviderResponse(String reviewId, String response, String actorUserId, boolean isAdmin) {
        TourReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
        if (!isAdmin) {
            boolean ownsTour = providerRepository.findByUserId(actorUserId)
                    .map(provider -> review.getTour() != null
                            && review.getTour().getProvider() != null
                            && provider.getId().equals(review.getTour().getProvider().getId()))
                    .orElse(false);
            if (!ownsTour) {
                throw new RuntimeException("Nhà cung cấp chỉ được phản hồi đánh giá thuộc tour của mình");
            }
        }
        User actor = userRepository.findById(actorUserId).orElse(null);
        review.setResponseFrom(actor != null ? actor.getName() : "Nhà cung cấp");
        review.setResponseMessage(response);
        review.setResponseAt(LocalDateTime.now());
        review.setResponseRequested(false);
        return DtoMapper.toReviewDTO(reviewRepository.save(review));
    }

    public TourReviewDTO requestProviderResponse(String reviewId, String adminUserId) {
        TourReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
        if (review.getResponseMessage() != null && !review.getResponseMessage().isBlank()) {
            throw new RuntimeException("Đánh giá này đã có phản hồi");
        }
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy admin"));
        review.setResponseRequested(true);
        review.setResponseRequestedAt(LocalDateTime.now());
        review.setResponseRequestedBy(admin);
        return DtoMapper.toReviewDTO(reviewRepository.save(review));
    }

    private void assertCanManageReview(TourReview review, String actorUserId, boolean isAdmin) {
        if (isAdmin) {
            return;
        }
        if (review.getUser() != null && actorUserId.equals(review.getUser().getId())) {
            return;
        }
        throw new RuntimeException("Bạn không có quyền thao tác với đánh giá này");
    }

    private void updateTourRating(String tourId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tour"));
        List<TourReview> reviews = reviewRepository.findByTourIdOrderByCreatedAtDesc(tourId);
        if (reviews.isEmpty()) {
            tour.setRating(BigDecimal.ZERO);
            tour.setReviewCount(0);
        } else {
            double avg = reviews.stream().mapToInt(TourReview::getRating).average().orElse(0);
            tour.setRating(BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP));
            tour.setReviewCount(reviews.size());
        }
        tourRepository.save(tour);
    }
}
