package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactMessagePageDTO {
    private List<ContactMessageDTO> content;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
    private long allCount;
    private long newCount;
    private long repliedCount;
    private long resolvedCount;
}
