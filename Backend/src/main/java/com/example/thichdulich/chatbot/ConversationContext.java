package com.example.thichdulich.chatbot;

import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class ConversationContext {
    private String selectedTourId;
    private String selectedTourName;
    private LocalDate selectedDate;
    private Integer peopleCount;
    private ChatIntent lastIntent;
    private List<String> mentionedTourIds = new ArrayList<>();
    private List<String> lastAssistantTourSuggestions = new ArrayList<>();
    private String summary = "";
}
