package com.example.thichdulich.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String reply;

    private List<AiChatTourDTO> tours;

    private String sessionId;

    private String intent;

    public AiChatResponse(String reply) {
        this(reply, List.of(), null, null);
    }

    public AiChatResponse(String reply, List<AiChatTourDTO> tours) {
        this(reply, tours, null, null);
    }
}
