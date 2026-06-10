package com.example.thichdulich.repository;

import com.example.thichdulich.entity.TourCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TourCategoryRepository extends JpaRepository<TourCategory, String> {
    List<TourCategory> findByActiveTrueOrderBySortOrderAscNameAsc();
    List<TourCategory> findAllByOrderBySortOrderAscNameAsc();
}
