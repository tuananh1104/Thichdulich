package com.example.thichdulich.chatbot;

import com.example.thichdulich.dto.AiChatTourDTO;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ChatDataBundle {
    private List<AiChatTourDTO> tourCards = new ArrayList<>();
    private String tourData = "Chưa có dữ liệu.";
    private String reviewData = "Chưa có dữ liệu.";
    private String scheduleData = "Chưa có dữ liệu.";
    private String priceData = "Chưa có dữ liệu.";
    private String policyData = "Chưa có dữ liệu.";
    private String bookingData = "Chưa có dữ liệu.";
    private String paymentData = "Chưa có dữ liệu.";
    private String websiteHelpData = "Chưa có dữ liệu.";
}
