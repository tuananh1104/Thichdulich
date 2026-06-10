package com.example.thichdulich.repository;

import com.example.thichdulich.entity.DepartureSchedule;
import com.example.thichdulich.entity.Tour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DepartureScheduleRepository extends JpaRepository<DepartureSchedule, String> {
    List<DepartureSchedule> findByTourIdOrderByDepartureDateAsc(String tourId);

    List<DepartureSchedule> findByTour(Tour tour);

    Optional<DepartureSchedule> findByTourIdAndDepartureDate(String tourId, LocalDate departureDate);
}
