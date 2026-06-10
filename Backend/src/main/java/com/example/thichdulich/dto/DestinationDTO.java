package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DestinationDTO {
    private String id;

    @NotBlank(message = "Vui lòng nhập tên điểm đến")
    @Size(max = 150, message = "Tên điểm đến không được vượt quá 150 ký tự")
    private String name;

    @Size(max = 3000, message = "Mô tả không được vượt quá 3000 ký tự")
    private String description;

    private String image;

    @Size(max = 100, message = "Khu vực không được vượt quá 100 ký tự")
    private String region;

    @Size(max = 100, message = "Quốc gia không được vượt quá 100 ký tự")
    private String country;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Integer tourCount;

    private List<TourDTO> tours;
}
