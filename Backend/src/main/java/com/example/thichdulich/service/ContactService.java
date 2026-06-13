package com.example.thichdulich.service;

import com.example.thichdulich.dto.ContactMessageDTO;
import com.example.thichdulich.dto.ContactMessagePageDTO;
import com.example.thichdulich.entity.ContactMessage;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.ContactMessageRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ContactService {
    @Autowired
    private ContactMessageRepository contactRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    public ContactMessageDTO sendMessage(ContactMessageDTO messageDTO) {
        return sendMessage(messageDTO, null);
    }

    public ContactMessageDTO sendMessage(ContactMessageDTO messageDTO, String userId) {
        ContactMessage message = new ContactMessage();
        if (userId != null && !userId.isBlank()) {
            userRepository.findById(userId).ifPresent(message::setUser);
        }
        message.setName(messageDTO.getName());
        message.setEmail(messageDTO.getEmail());
        message.setPhone(messageDTO.getPhone());
        message.setSubject(messageDTO.getSubject());
        message.setMessage(messageDTO.getMessage());
        message.setStatus("new");
        return DtoMapper.toContactDTO(contactRepository.save(message));
    }

    public List<ContactMessageDTO> getAllMessages() {
        return contactRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(DtoMapper::toContactDTO)
                .collect(Collectors.toList());
    }

    public ContactMessagePageDTO getMessagesPage(int page, int size, String status, String search) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);
        String normalizedStatus = status == null || status.isBlank() || "all".equalsIgnoreCase(status)
                ? null
                : status.toLowerCase();
        String keyword = search == null || search.isBlank() ? null : search.trim();
        Page<ContactMessage> result = contactRepository.searchMessages(
                normalizedStatus,
                keyword,
                PageRequest.of(safePage, safeSize, Sort.by(
                        Sort.Order.asc("status"),
                        Sort.Order.desc("createdAt")
                )));

        return new ContactMessagePageDTO(
                result.getContent().stream().map(DtoMapper::toContactDTO).collect(Collectors.toList()),
                result.getNumber(),
                result.getSize(),
                result.getTotalPages(),
                result.getTotalElements(),
                contactRepository.count(),
                contactRepository.countByStatus("new"),
                contactRepository.countByStatus("replied"),
                contactRepository.countByStatus("resolved")
        );
    }

    public List<ContactMessageDTO> getNewMessages() {
        return contactRepository.findByStatusOrderByCreatedAtDesc("new")
                .stream()
                .map(DtoMapper::toContactDTO)
                .collect(Collectors.toList());
    }

    public ContactMessageDTO replyToMessage(String messageId, String reply, String repliedById) {
        ContactMessage message = contactRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User repliedBy = userRepository.findById(repliedById).orElse(null);
        message.setReplyMessage(reply);
        message.setRepliedBy(repliedBy);
        message.setRepliedAt(LocalDateTime.now());
        message.setStatus("replied");
        ContactMessage saved = contactRepository.save(message);
        emailService.sendContactReply(
                saved.getEmail(),
                saved.getName(),
                saved.getSubject(),
                saved.getMessage(),
                saved.getReplyMessage()
        );
        return DtoMapper.toContactDTO(saved);
    }

    public ContactMessageDTO markAsResolved(String messageId) {
        ContactMessage message = contactRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setStatus("resolved");
        return DtoMapper.toContactDTO(contactRepository.save(message));
    }
}
