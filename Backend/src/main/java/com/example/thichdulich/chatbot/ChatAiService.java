package com.example.thichdulich.chatbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class ChatAiService {
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String model;
    private final String endpoint;

    public ChatAiService(
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-2.5-flash}") String model,
            @Value("${app.ai.gemini.endpoint:https://generativelanguage.googleapis.com/v1beta/models}") String endpoint
    ) {
        this.apiKey = normalizeApiKey(apiKey);
        this.model = normalizeModel(model);
        this.endpoint = endpoint != null && endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
    }

    public String answer(String systemPrompt, String userPrompt, ChatIntent intent, ChatDataBundle data) {
        if (!StringUtils.hasText(apiKey)) return fallback(intent, data);
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(buildUri())
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(buildRequestBody(systemPrompt, userPrompt), StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) return fallback(intent, data);
            String text = extractReply(response.body());
            return StringUtils.hasText(text) ? text : fallback(intent, data);
        } catch (Exception ignored) {
            return fallback(intent, data);
        }
    }

    private String fallback(ChatIntent intent, ChatDataBundle data) {
        return switch (intent) {
            case tour_search -> "Tôi tìm thấy một số tour phù hợp trong hệ thống. Bạn có thể xem các gợi ý bên dưới và hỏi tiếp như \"tour này bao nhiêu tiền\" hoặc \"tour này còn chỗ ngày mai không\".";
            case tour_detail, tour_follow_up -> data.getTourData().startsWith("Chưa") ? "Tôi chưa xác định được tour bạn đang hỏi. Bạn vui lòng nói rõ tên tour hoặc chọn một tour trong gợi ý trước đó nhé." : data.getTourData();
            case tour_review -> data.getReviewData();
            case tour_compare -> data.getTourData();
            case tour_schedule -> data.getScheduleData();
            case price_calculation -> data.getPriceData();
            case payment_policy, cancellation_policy -> data.getPolicyData();
            case booking_status -> data.getBookingData();
            case website_help -> data.getWebsiteHelpData();
            case travel_advice -> "Mình có thể tư vấn du lịch chung, nhưng để chính xác hơn bạn cho mình biết điểm đến, thời gian đi và số người nhé.";
            case out_of_scope -> "Mình chỉ hỗ trợ các nội dung liên quan đến du lịch và website đặt tour. Bạn muốn mình tìm tour hoặc hỗ trợ đơn đặt tour không?";
        };
    }

    private URI buildUri() {
        return URI.create(endpoint + "/" + URLEncoder.encode(model, StandardCharsets.UTF_8) + ":generateContent");
    }

    private String buildRequestBody(String systemPrompt, String userPrompt) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.putObject("systemInstruction").putArray("parts").addObject().put("text", systemPrompt);
        ArrayNode contents = root.putArray("contents");
        ObjectNode user = contents.addObject();
        user.put("role", "user");
        user.putArray("parts").addObject().put("text", userPrompt);
        root.putObject("generationConfig").put("temperature", 0.2).put("maxOutputTokens", 900);
        return objectMapper.writeValueAsString(root);
    }

    private String extractReply(String body) throws Exception {
        JsonNode parts = objectMapper.readTree(body).path("candidates").path(0).path("content").path("parts");
        return parts.isArray() && !parts.isEmpty() ? parts.path(0).path("text").asText().trim() : "";
    }

    private String normalizeApiKey(String value) {
        if (!StringUtils.hasText(value)) return "";
        String trimmed = value.trim();
        return trimmed.regionMatches(true, 0, "Bearer ", 0, 7) ? trimmed.substring(7).trim() : trimmed;
    }

    private String normalizeModel(String value) {
        String trimmed = StringUtils.hasText(value) ? value.trim() : "gemini-2.5-flash";
        return trimmed.startsWith("models/") ? trimmed.substring("models/".length()) : trimmed;
    }
}
