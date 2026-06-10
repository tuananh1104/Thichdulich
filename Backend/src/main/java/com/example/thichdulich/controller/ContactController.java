package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.ContactMessageDTO;
import com.example.thichdulich.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    @Autowired
    private ContactService contactService;

    @PostMapping
    public ResponseEntity<ApiResponse<ContactMessageDTO>> sendMessage(
            @Valid @RequestBody ContactMessageDTO messageDTO) {
        try {
            ContactMessageDTO sent = contactService.sendMessage(messageDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(sent, "Message sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ContactMessageDTO>>> getAllMessages() {
        try {
            List<ContactMessageDTO> messages = contactService.getAllMessages();
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @GetMapping("/new")
    public ResponseEntity<ApiResponse<List<ContactMessageDTO>>> getNewMessages() {
        try {
            List<ContactMessageDTO> messages = contactService.getNewMessages();
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<ContactMessageDTO>> replyToMessage(
            @PathVariable String id,
            @RequestParam String reply,
            @RequestParam(required = false, defaultValue = "Admin") String repliedBy) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String repliedById = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())
                    ? auth.getPrincipal().toString()
                    : repliedBy;
            ContactMessageDTO replied = contactService.replyToMessage(id, reply, repliedById);
            return ResponseEntity.ok(ApiResponse.success(replied, "Reply sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<ContactMessageDTO>> markAsResolved(@PathVariable String id) {
        try {
            ContactMessageDTO resolved = contactService.markAsResolved(id);
            return ResponseEntity.ok(ApiResponse.success(resolved, "Message marked as resolved"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }
}
