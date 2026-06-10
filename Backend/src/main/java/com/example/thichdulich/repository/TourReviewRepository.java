package com.example.thichdulich.repository;

import com.example.thichdulich.entity.TourReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TourReviewRepository extends JpaRepository<TourReview, String> {
    List<TourReview> findByTourIdOrderByCreatedAtDesc(String tourId);

    List<TourReview> findByUserId(String userId);

    Double findAverageRatingByTourId(String tourId);

    boolean existsByBookingId(String bookingId);
}
