package com.example.thichdulich.service;

import com.example.thichdulich.dto.ContactMessageDTO;
import com.example.thichdulich.entity.ContactMessage;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.ContactMessageRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

    public ContactMessageDTO sendMessage(ContactMessageDTO messageDTO) {
        ContactMessage message = new ContactMessage();
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
        return DtoMapper.toContactDTO(contactRepository.save(message));
    }

    public ContactMessageDTO markAsResolved(String messageId) {
        ContactMessage message = contactRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setStatus("resolved");
        return DtoMapper.toContactDTO(contactRepository.save(message));
    }
}
