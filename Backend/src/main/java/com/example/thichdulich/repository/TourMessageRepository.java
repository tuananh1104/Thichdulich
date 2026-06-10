package com.example.thichdulich.repository;

import com.example.thichdulich.entity.TourMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TourMessageRepository extends JpaRepository<TourMessage, String> {
    List<TourMessage> findByTourIdOrderBySentAtAsc(String tourId);
}
