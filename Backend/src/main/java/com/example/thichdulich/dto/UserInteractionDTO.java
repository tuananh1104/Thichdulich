package com.example.thichdulich.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInteractionDTO {
    private String id;
    private String userId;
    private String tourId;

    @NotBlank(message = "Vui lòng chọn loại tương tác")
    private String action;

    private String searchQuery;
    private LocalDateTime createdAt;
}
