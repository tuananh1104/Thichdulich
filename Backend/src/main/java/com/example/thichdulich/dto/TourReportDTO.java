package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourReportDTO {
    private String id;

    @NotBlank(message = "Vui lòng chọn tour cần báo cáo")
    private String tourId;

    private String bookingId;

    private String tourName;

    private String reportedByName;

    @NotBlank(message = "Vui lòng chọn lý do báo cáo")
    private String reason;

    @Size(max = 2000, message = "Mô tả báo cáo không được vượt quá 2000 ký tự")
    private String description;

    private String[] images;

    private String status; // pending, reviewed, resolved, dismissed

    private String reviewedBy;

    private LocalDateTime reviewedAt;

    private String adminNote;

    private LocalDateTime createdAt;
}
