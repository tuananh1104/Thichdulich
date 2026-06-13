package com.example.thichdulich.repository;

import com.example.thichdulich.entity.ContactMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, String> {
    List<ContactMessage> findAllByOrderByCreatedAtDesc();

    List<ContactMessage> findByStatusOrderByCreatedAtDesc(String status);

    long countByStatus(String status);

    @Query("""
            select c from ContactMessage c
            where (:status is null or c.status = :status)
              and (
                :keyword is null
                or lower(c.name) like lower(concat('%', :keyword, '%'))
                or lower(c.email) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(c.phone, '')) like lower(concat('%', :keyword, '%'))
                or lower(c.subject) like lower(concat('%', :keyword, '%'))
                or lower(c.message) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(c.replyMessage, '')) like lower(concat('%', :keyword, '%'))
              )
            """)
    Page<ContactMessage> searchMessages(
            @Param("status") String status,
            @Param("keyword") String keyword,
            Pageable pageable);
}
