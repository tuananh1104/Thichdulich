package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponseDTO {
    private String url;
    private String publicId;
    private String format;
    private Integer width;
    private Integer height;
    private Long bytes;
}
