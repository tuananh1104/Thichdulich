package com.example.thichdulich.repository;

import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.entity.Provider;
import com.example.thichdulich.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByUser(User user);

    List<Booking> findByUserOrderByCreatedAtDesc(User user);

    List<Booking> findByStatus(Booking.BookingStatus status);

    List<Booking> findByStatusAndDepartureScheduleIsNotNull(Booking.BookingStatus status);

    List<Booking> findByTourId(String tourId);

    long countByTourId(String tourId);

    List<Booking> findByTourProviderOrderByCreatedAtDesc(Provider provider);

    List<Booking> findByStatusAndStartDateIsNotNull(Booking.BookingStatus status);

    List<Booking> findByStatusAndCreatedAtBefore(Booking.BookingStatus status, LocalDateTime createdAt);

    Optional<Booking> findByPaymentTransactionCode(String paymentTransactionCode);

    @Query("""
            select coalesce(sum(coalesce(b.adults, 0) + coalesce(b.children, 0)), 0)
            from Booking b
            where b.tour.id = :tourId
              and b.startDate = :startDate
              and b.status = :status
              and (:excludeBookingId is null or b.id <> :excludeBookingId)
            """)
    Long sumPeopleByTourAndStartDateAndStatus(
            @Param("tourId") String tourId,
            @Param("startDate") LocalDate startDate,
            @Param("status") Booking.BookingStatus status,
            @Param("excludeBookingId") String excludeBookingId);

    @Query("""
            select coalesce(sum(coalesce(b.adults, 0) + coalesce(b.children, 0)), 0)
            from Booking b
            where b.tour.id = :tourId
              and b.startDate = :startDate
              and b.status in :statuses
              and (:excludeBookingId is null or b.id <> :excludeBookingId)
            """)
    Long sumPeopleByTourAndStartDateAndStatuses(
            @Param("tourId") String tourId,
            @Param("startDate") LocalDate startDate,
            @Param("statuses") Collection<Booking.BookingStatus> statuses,
            @Param("excludeBookingId") String excludeBookingId);

    Long countByUserAndStatusNot(User user, Booking.BookingStatus status);

    @Query("""
            select distinct b.user.id
            from Booking b
            where b.tour.id in (
                select b2.tour.id from Booking b2 where b2.user.id = :userId
            )
            and b.user.id <> :userId
            """)
    List<String> findSimilarUserIdsByBookedTours(@Param("userId") String userId);

    @Query("""
            select distinct b.tour.id
            from Booking b
            where b.user.id in :userIds
              and b.tour.id not in (
                  select b2.tour.id from Booking b2 where b2.user.id = :currentUserId
              )
            """)
    List<String> findRecommendedTourIdsFromSimilarUsers(
            @Param("userIds") List<String> userIds,
            @Param("currentUserId") String currentUserId);
}
