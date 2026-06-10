package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatTourDTO {
    private String id;
    private String name;
    private String location;
    private String type;
    private Integer duration;
    private Long price;
    private String image;
    private Double rating;
    private Integer reviewCount;
    private String url;
}
