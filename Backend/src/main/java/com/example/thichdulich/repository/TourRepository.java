package com.example.thichdulich.repository;

import com.example.thichdulich.entity.Provider;
import com.example.thichdulich.entity.Tour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TourRepository extends JpaRepository<Tour, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Tour t where t.id = :id")
    java.util.Optional<Tour> findByIdWithLock(@Param("id") String id);

    List<Tour> findByProvider(Provider provider);

    List<Tour> findByProviderId(String providerId);

    List<Tour> findByStatus(Tour.TourStatus status);

    List<Tour> findByType(Tour.TourType type);

    long countByType(Tour.TourType type);

    List<Tour> findByDestinationId(String destinationId);

    long countByDestinationIdAndStatus(String destinationId, Tour.TourStatus status);

    List<Tour> findByStatusOrderByRatingDesc(Tour.TourStatus status);

    List<Tour> findByStatusAndAvailability(Tour.TourStatus status, Boolean availability, org.springframework.data.domain.Pageable pageable);

    @Query("""
            select t from Tour t
            where t.status = com.example.thichdulich.entity.Tour.TourStatus.approved
              and t.destination is null
              and (:keyword is null or :keyword = ''
                or lower(t.location) like lower(concat('%', :keyword, '%'))
                or lower(t.nameVi) like lower(concat('%', :keyword, '%')))
            """)
    List<Tour> findApprovedUnassignedToursMatchingDestination(@Param("keyword") String keyword);

    @Query("""
            select distinct t from Tour t
            where t.status = com.example.thichdulich.entity.Tour.TourStatus.approved
              and t.availability = true
              and (:keyword is null or :keyword = ''
                or lower(t.nameVi) like lower(concat('%', :keyword, '%'))
                or lower(t.location) like lower(concat('%', :keyword, '%'))
                or lower(t.descriptionVi) like lower(concat('%', :keyword, '%')))
              and (:location is null or :location = '' or lower(t.location) like lower(concat('%', :location, '%')))
              and (:type is null or t.type = :type)
              and (:minPrice is null or t.price >= :minPrice)
              and (:maxPrice is null or t.price <= :maxPrice)
              and (:duration is null or t.duration = :duration)
              and (:minDuration is null or t.duration >= :minDuration)
              and (:maxDuration is null or t.duration <= :maxDuration)
              and (:startDate is null or true)
            """)
    List<Tour> searchApprovedTours(
            @Param("keyword") String keyword,
            @Param("location") String location,
            @Param("type") Tour.TourType type,
            @Param("minPrice") Long minPrice,
            @Param("maxPrice") Long maxPrice,
            @Param("duration") Integer duration,
            @Param("minDuration") Integer minDuration,
            @Param("maxDuration") Integer maxDuration,
            @Param("startDate") LocalDate startDate);
}
