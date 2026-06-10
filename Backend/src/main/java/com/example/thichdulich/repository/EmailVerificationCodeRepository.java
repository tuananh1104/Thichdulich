package com.example.thichdulich.repository;

import com.example.thichdulich.entity.EmailVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, String> {
    Optional<EmailVerificationCode> findTopByEmailOrderByCreatedAtDesc(String email);

    Optional<EmailVerificationCode> findTopByEmailAndPurposeOrderByCreatedAtDesc(
            String email,
            EmailVerificationCode.Purpose purpose);

    Optional<EmailVerificationCode> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            String email,
            EmailVerificationCode.Purpose purpose);

    List<EmailVerificationCode> findByEmailAndPurposeAndUsedFalse(String email, EmailVerificationCode.Purpose purpose);
}
