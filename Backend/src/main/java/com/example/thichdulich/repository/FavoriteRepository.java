package com.example.thichdulich.repository;

import com.example.thichdulich.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {
    List<Favorite> findByUserId(String userId);

    Optional<Favorite> findByUserIdAndTourId(String userId, String tourId);

    boolean existsByUserIdAndTourId(String userId, String tourId);
}
