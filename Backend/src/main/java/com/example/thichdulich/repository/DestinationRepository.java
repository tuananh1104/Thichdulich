package com.example.thichdulich.repository;

import com.example.thichdulich.entity.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, String> {
    List<Destination> findByNameViContainingIgnoreCase(String vi);

    List<Destination> findByRegion(String region);
}
