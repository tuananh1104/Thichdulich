package com.example.thichdulich.controller;

import com.example.thichdulich.dto.AiChatRequest;
import com.example.thichdulich.dto.AiChatResponse;
import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.service.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {
    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@RequestBody AiChatRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                aiChatService.chat(request.getMessage(), request.getLanguage(), request.getContext(), request.getSessionId()),
                "AI response generated"
        ));
    }
}
