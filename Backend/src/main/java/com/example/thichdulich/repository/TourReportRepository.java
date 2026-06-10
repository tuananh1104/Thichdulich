package com.example.thichdulich.repository;

import com.example.thichdulich.entity.TourReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TourReportRepository extends JpaRepository<TourReport, String> {
    List<TourReport> findByStatus(TourReport.ReportStatus status);

    List<TourReport> findByTourId(String tourId);

    List<TourReport> findByStatusOrderByCreatedAtDesc(TourReport.ReportStatus status);

    boolean existsByBookingId(String bookingId);
}
