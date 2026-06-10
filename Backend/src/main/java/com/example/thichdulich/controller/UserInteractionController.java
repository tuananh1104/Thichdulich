package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.UserInteractionDTO;
import com.example.thichdulich.service.UserInteractionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/interactions")
public class UserInteractionController {
    @Autowired
    private UserInteractionService interactionService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserInteractionDTO>> saveInteraction(@Valid @RequestBody UserInteractionDTO dto) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(interactionService.saveInteraction(userId, dto), "Interaction saved"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserInteractionDTO>>> getInteractions() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        return ResponseEntity.ok(ApiResponse.success(interactionService.getUserInteractions(userId)));
    }
}
