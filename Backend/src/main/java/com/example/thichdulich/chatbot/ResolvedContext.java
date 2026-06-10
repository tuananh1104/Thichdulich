package com.example.thichdulich.chatbot;

import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class ResolvedContext {
    private String tourId;
    private List<String> compareTourIds = new ArrayList<>();
    private LocalDate date;
    private Integer peopleCount;
    private String orderCode;
    private boolean ambiguousReference;
}
