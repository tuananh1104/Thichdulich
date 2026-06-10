package com.example.thichdulich.repository;

import com.example.thichdulich.entity.UserInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, String> {
    List<UserInteraction> findByUserIdOrderByCreatedAtDesc(String userId);
}
