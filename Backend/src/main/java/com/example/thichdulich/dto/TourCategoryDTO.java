package com.example.thichdulich.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TourCategoryDTO {
    @NotBlank(message = "Mã loại hình là bắt buộc")
    private String code;

    @NotBlank(message = "Tên loại hình là bắt buộc")
    private String name;

    private String description;
    private Boolean active;
    private Integer sortOrder;
    private Long tourCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
