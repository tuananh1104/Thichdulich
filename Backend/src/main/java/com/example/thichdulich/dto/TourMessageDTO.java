package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourMessageDTO {
    private String id;
    private String tourId;
    private String senderId;
    private String senderRole;
    private String senderName;
    private String message;
    private LocalDateTime sentAt;
}
