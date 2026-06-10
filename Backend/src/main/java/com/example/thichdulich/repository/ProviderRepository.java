package com.example.thichdulich.repository;

import com.example.thichdulich.entity.Provider;
import com.example.thichdulich.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProviderRepository extends JpaRepository<Provider, String> {
    Optional<Provider> findByUser(User user);

    Optional<Provider> findByUserId(String userId);
}
