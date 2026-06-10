package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourReviewDTO {
    private String id;

    @NotBlank(message = "Vui lòng chọn tour")
    private String tourId;

    private String bookingId;

    private String tourName;

    private String userId;

    private String userName;

    private String userAvatar;

    @NotNull(message = "Vui lòng chọn số sao đánh giá")
    @Min(value = 1, message = "Đánh giá tối thiểu là 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa là 5 sao")
    private Integer rating;

    @NotBlank(message = "Vui lòng nhập nội dung đánh giá")
    @Size(max = 2000, message = "Nội dung đánh giá không được vượt quá 2000 ký tự")
    private String comment;

    private String[] images;

    private Integer helpfulCount;

    private String providerResponse;

    private String responseFrom;

    private LocalDateTime responseDate;

    private Boolean responseRequested;

    private LocalDateTime responseRequestedAt;

    private String responseRequestedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
