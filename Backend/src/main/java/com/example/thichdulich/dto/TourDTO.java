package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourDTO {
    private String id;

    @NotBlank(message = "Vui lòng nhập tên tour")
    @Size(max = 200, message = "Tên tour không được vượt quá 200 ký tự")
    private String name;

    @Size(max = 5000, message = "Mô tả không được vượt quá 5000 ký tự")
    private String description;

    @NotBlank(message = "Vui lòng nhập địa điểm")
    private String location;

    @NotBlank(message = "Vui lòng chọn loại tour")
    private String type; // adventure, beach, cultural, food, nature, mountain, city

    @NotNull(message = "Vui lòng nhập thời lượng tour")
    @Min(value = 1, message = "Thời lượng tour phải lớn hơn 0")
    private Integer duration;

    @Min(value = 1, message = "Số ngày đặt trước tối thiểu là 1")
    private Integer advanceBookingDays;

    @NotNull(message = "Vui lòng nhập giá tour")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá tour phải lớn hơn 0")
    private Double price;

    @DecimalMin(value = "0.0", message = "Giá trẻ em không được âm")
    private Double childPrice;

    @DecimalMin(value = "0.0", message = "Giá gốc không được âm")
    private Double originalPrice;

    private String promotionTitle;

    private String promotionBadge;

    @Min(value = 0, message = "Phần trăm giảm không được âm")
    @Max(value = 95, message = "Phần trăm giảm không được vượt quá 95")
    private Integer discountPercent;

    private Boolean promotionActive;

    private String promotionStatus;

    private String promotionSource;

    private String image;

    private String destinationId;

    private Double rating;

    private Integer reviewCount;

    @Min(value = 1, message = "Số chỗ tối đa phải lớn hơn 0")
    private Integer maxSeats;

    private Integer maxPeoplePerDay;

    private Boolean availability;

    private String status;

    private String providerId;

    private String providerName;

    private String rejectionReason;

    private String adminNotes;

    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<TourItineraryDTO> itineraries;

    private List<String> included;

    private List<String> excluded;

    private List<String> images;
}
