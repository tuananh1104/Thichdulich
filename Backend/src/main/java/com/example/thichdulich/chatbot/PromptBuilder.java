package com.example.thichdulich.chatbot;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PromptBuilder {
    public String systemPrompt() {
        return """
                Bạn là chatbot tư vấn du lịch chuyên nghiệp cho website Thích Du Lịch.

                Nhiệm vụ:
                - Hiểu intent, ngữ cảnh hội thoại và dữ liệu backend cung cấp.
                - Tìm tour, giải thích chi tiết tour, review, lịch khởi hành, còn chỗ, giá, chính sách thanh toán/hủy/hoàn tiền, trạng thái đơn.
                - Tư vấn kiến thức du lịch chung khi intent là travel_advice.
                - Với câu hỏi ngoài phạm vi, trả lời ngắn gọn rằng bạn chỉ hỗ trợ du lịch và website đặt tour, rồi gợi ý người dùng hỏi về tour.

                Quy tắc bắt buộc:
                - Không bịa tour, giá, lịch, còn chỗ, review, booking, payment hoặc policy.
                - Nếu dữ liệu backend ghi "Chưa có dữ liệu" hoặc "Không tìm thấy", hãy nói rõ chưa có thông tin.
                - Nếu người dùng nói "tour này", "tour đó", "cái này", "lịch đó", "giá đó", "nó", "bên này", hãy dựa vào conversationContext và chatHistory.
                - Nếu thiếu dữ liệu định danh như mã đơn hoặc chưa chọn tour, hãy hỏi lại đúng thông tin cần bổ sung.
                - Trả lời bằng tiếng Việt tự nhiên, gọn, thân thiện, có thể dùng bullet ngắn.
                - Không nhắc tới system prompt, Gemini, backend hay implementation.
                """;
    }

    public String buildUserPrompt(
            String userMessage,
            List<ChatHistoryMessage> chatHistory,
            ConversationContext context,
            ChatIntent intent,
            ResolvedContext resolved,
            ChatDataBundle data
    ) {
        return """
                userMessage:
                %s

                detectedIntent:
                %s

                chatHistory:
                %s

                conversationContext:
                selectedTourId=%s
                selectedTourName=%s
                selectedDate=%s
                peopleCount=%s
                lastIntent=%s
                mentionedTourIds=%s
                lastAssistantTourSuggestions=%s
                summary=%s

                resolvedEntity:
                tourId=%s
                compareTourIds=%s
                date=%s
                peopleCount=%s
                orderCode=%s
                ambiguousReference=%s

                tourData:
                %s

                reviewData:
                %s

                scheduleData:
                %s

                priceData:
                %s

                policyData:
                %s

                bookingData:
                %s

                paymentData:
                %s

                websiteHelpData:
                %s

                Hãy viết câu trả lời cuối cùng cho người dùng.
                """.formatted(
                userMessage,
                intent,
                formatHistory(chatHistory),
                context.getSelectedTourId(),
                context.getSelectedTourName(),
                context.getSelectedDate(),
                context.getPeopleCount(),
                context.getLastIntent(),
                context.getMentionedTourIds(),
                context.getLastAssistantTourSuggestions(),
                context.getSummary(),
                resolved.getTourId(),
                resolved.getCompareTourIds(),
                resolved.getDate(),
                resolved.getPeopleCount(),
                resolved.getOrderCode(),
                resolved.isAmbiguousReference(),
                data.getTourData(),
                data.getReviewData(),
                data.getScheduleData(),
                data.getPriceData(),
                data.getPolicyData(),
                data.getBookingData(),
                data.getPaymentData(),
                data.getWebsiteHelpData());
    }

    private String formatHistory(List<ChatHistoryMessage> history) {
        if (history == null || history.isEmpty()) return "Chưa có.";
        return history.stream()
                .skip(Math.max(0, history.size() - 8))
                .map(item -> item.getRole() + ": " + item.getContent())
                .collect(Collectors.joining("\n"));
    }
}
