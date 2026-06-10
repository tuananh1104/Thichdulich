package com.example.thichdulich.chatbot;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ChatHistoryMessage {
    private String role;
    private String content;
    private LocalDateTime createdAt;
}
