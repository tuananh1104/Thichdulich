package com.example.thichdulich.service;

import com.example.thichdulich.chatbot.*;
import com.example.thichdulich.dto.AiChatResponse;
import com.example.thichdulich.dto.AiChatTourDTO;
import com.example.thichdulich.entity.DepartureSchedule;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.TourReview;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AiChatService {
    private final ContextStore contextStore;
    private final IntentDetector intentDetector;
    private final ContextResolver contextResolver;
    private final ChatTourDataService tourDataService;
    private final ChatPolicyService policyService;
    private final ChatBookingDataService bookingDataService;
    private final ChatPaymentDataService paymentDataService;
    private final WebsiteHelpService websiteHelpService;
    private final PromptBuilder promptBuilder;
    private final ChatAiService aiService;

    public AiChatResponse chat(String message, String language) {
        return chat(message, language, "", null);
    }

    public AiChatResponse chat(String message, String language, String context) {
        return chat(message, language, context, null);
    }

    @Transactional(readOnly = true)
    public AiChatResponse chat(String message, String language, String legacyContext, String rawSessionId) {
        return chat(message, language, legacyContext, rawSessionId, null);
    }

    @Transactional(readOnly = true)
    public AiChatResponse chat(String message, String language, String legacyContext, String rawSessionId, String currentUserId) {
        if (!StringUtils.hasText(message)) {
            throw new IllegalArgumentException("Vui lòng nhập nội dung cần hỗ trợ");
        }

        String sessionId = contextStore.normalizeSessionId(rawSessionId);
        ConversationContext conversationContext = contextStore.loadContext(sessionId);
        List<ChatHistoryMessage> history = new ArrayList<>(contextStore.loadHistory(sessionId));
        if (StringUtils.hasText(legacyContext) && history.isEmpty()) {
            history.add(new ChatHistoryMessage("context", legacyContext, java.time.LocalDateTime.now()));
        }

        ChatIntent intent = intentDetector.detect(message, conversationContext);
        ResolvedContext resolved = contextResolver.resolve(message, intent, conversationContext);
        ChatDataBundle data = collectData(message, intent, resolved, currentUserId);

        String userPrompt = promptBuilder.buildUserPrompt(message, history, conversationContext, intent, resolved, data);
        String reply = aiService.answer(promptBuilder.systemPrompt(), userPrompt, intent, data);

        contextStore.saveMessage(sessionId, "user", message);
        contextStore.saveMessage(sessionId, "assistant", reply);
        updateContext(conversationContext, intent, resolved, data);
        contextStore.saveContext(sessionId, conversationContext);

        return new AiChatResponse(reply, data.getTourCards(), sessionId, intent.name());
    }

    private ChatDataBundle collectData(String message, ChatIntent intent, ResolvedContext resolved, String currentUserId) {
        ChatDataBundle data = new ChatDataBundle();
        switch (intent) {
            case tour_search -> {
                List<Tour> tours = tourDataService.searchTours(message);
                data.setTourData(tourDataService.summarizeTours(tours));
                data.setTourCards(tourDataService.toCards(tours));
            }
            case tour_detail, tour_follow_up -> withTour(resolved, data, tour -> data.setTourData(tourDataService.summarizeTour(tour)));
            case tour_review -> withTour(resolved, data, tour -> {
                data.setTourData(tourDataService.summarizeTour(tour));
                List<TourReview> reviews = tourDataService.getTourReviews(tour.getId());
                data.setReviewData(tourDataService.summarizeReviews(reviews));
                data.setTourCards(List.of(tourDataService.toCard(tour)));
            });
            case tour_compare -> {
                List<Tour> tours = resolved.getCompareTourIds().stream()
                        .distinct()
                        .limit(4)
                        .map(tourDataService::getTourDetail)
                        .flatMap(Optional::stream)
                        .toList();
                data.setTourData(tourDataService.summarizeTours(tours));
                data.setTourCards(tourDataService.toCards(tours));
            }
            case tour_schedule -> withTour(resolved, data, tour -> {
                data.setTourData(tourDataService.summarizeTour(tour));
                List<DepartureSchedule> schedules = tourDataService.getTourSchedule(tour.getId(), resolved.getDate());
                data.setScheduleData(tourDataService.summarizeSchedule(schedules));
                data.setTourCards(List.of(tourDataService.toCard(tour)));
            });
            case price_calculation -> withTour(resolved, data, tour -> {
                data.setTourData(tourDataService.summarizeTour(tour));
                data.setPriceData(tourDataService.calculateTourPrice(tour, resolved.getPeopleCount()));
                data.setTourCards(List.of(tourDataService.toCard(tour)));
            });
            case payment_policy -> data.setPolicyData(policyService.getPolicies());
            case cancellation_policy -> {
                data.setPolicyData(policyService.getPolicies());
                if (StringUtils.hasText(resolved.getOrderCode())) {
                    data.setBookingData(bookingDataService.getBookingStatus(resolved.getOrderCode(), currentUserId));
                }
            }
            case booking_status -> {
                data.setBookingData(StringUtils.hasText(resolved.getOrderCode())
                        ? bookingDataService.getBookingStatus(resolved.getOrderCode(), currentUserId)
                        : "Chưa có mã đơn. Cần người dùng cung cấp mã đơn hoặc đăng nhập vào mục Đặt tour của tôi.");
                if (StringUtils.hasText(resolved.getOrderCode())) {
                    data.setPaymentData(paymentDataService.getPaymentStatus(resolved.getOrderCode(), currentUserId));
                }
            }
            case travel_advice -> data.setTourData("Đây là câu hỏi tư vấn du lịch chung. AI được phép dùng kiến thức du lịch phổ thông, không bịa dữ liệu tour cụ thể.");
            case website_help -> data.setWebsiteHelpData(websiteHelpService.getWebsiteHelp(message));
            case out_of_scope -> data.setWebsiteHelpData("Câu hỏi nằm ngoài phạm vi website đặt tour du lịch.");
        }
        return data;
    }

    private void withTour(ResolvedContext resolved, ChatDataBundle data, java.util.function.Consumer<Tour> handler) {
        if (!StringUtils.hasText(resolved.getTourId())) {
            data.setTourData("Chưa xác định được tour đang được hỏi từ ngữ cảnh.");
            return;
        }
        tourDataService.getTourDetail(resolved.getTourId()).ifPresentOrElse(handler, () -> data.setTourData("Không tìm thấy tour trong hệ thống."));
    }

    private void updateContext(ConversationContext context, ChatIntent intent, ResolvedContext resolved, ChatDataBundle data) {
        context.setLastIntent(intent);
        if (resolved.getTourId() != null) {
            context.setSelectedTourId(resolved.getTourId());
            tourDataService.getTourDetail(resolved.getTourId()).ifPresent(tour -> context.setSelectedTourName(tour.getNameVi()));
        }
        if (resolved.getDate() != null) context.setSelectedDate(resolved.getDate());
        if (resolved.getPeopleCount() != null) context.setPeopleCount(resolved.getPeopleCount());

        List<String> cardIds = data.getTourCards().stream().map(AiChatTourDTO::getId).toList();
        if (!cardIds.isEmpty()) {
            context.setLastAssistantTourSuggestions(cardIds);
            context.setMentionedTourIds(cardIds);
            if (context.getSelectedTourId() == null) {
                context.setSelectedTourId(cardIds.get(0));
                context.setSelectedTourName(data.getTourCards().get(0).getName());
            }
        }
        context.setSummary("Intent gần nhất: " + intent + ". Tour đang chọn: " + context.getSelectedTourName());
    }
}
