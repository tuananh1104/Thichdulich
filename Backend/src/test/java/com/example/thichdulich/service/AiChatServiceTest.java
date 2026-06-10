package com.example.thichdulich.service;

import com.example.thichdulich.chatbot.ChatIntent;
import com.example.thichdulich.chatbot.ConversationContext;
import com.example.thichdulich.chatbot.IntentDetector;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiChatServiceTest {
    private final IntentDetector intentDetector = new IntentDetector();

    @Test
    void detectsAllPrimaryChatbotIntents() {
        assertThat(intentDetector.detect("Toi muon di Ninh Binh", new ConversationContext())).isEqualTo(ChatIntent.tour_search);
        assertThat(intentDetector.detect("Tour nay danh gia sao?", selectedTourContext())).isEqualTo(ChatIntent.tour_review);
        assertThat(intentDetector.detect("So voi tour Ha Long thi sao?", selectedTourContext())).isEqualTo(ChatIntent.tour_compare);
        assertThat(intentDetector.detect("Con cho ngay mai khong?", selectedTourContext())).isEqualTo(ChatIntent.tour_schedule);
        assertThat(intentDetector.detect("Di 4 nguoi bao nhieu?", selectedTourContext())).isEqualTo(ChatIntent.price_calculation);
        assertThat(intentDetector.detect("COD co can coc khong?", new ConversationContext())).isEqualTo(ChatIntent.payment_policy);
        assertThat(intentDetector.detect("Huy truoc 24h co hoan khong?", new ConversationContext())).isEqualTo(ChatIntent.cancellation_policy);
        assertThat(intentDetector.detect("Don ABC123 cua toi thanh toan chua?", new ConversationContext())).isEqualTo(ChatIntent.booking_status);
        assertThat(intentDetector.detect("Di Sapa thang 10 dep khong?", new ConversationContext())).isEqualTo(ChatIntent.travel_advice);
        assertThat(intentDetector.detect("Website bi loi thanh toan", new ConversationContext())).isEqualTo(ChatIntent.website_help);
        assertThat(intentDetector.detect("Messi la ai?", new ConversationContext())).isEqualTo(ChatIntent.out_of_scope);
    }

    @Test
    void detectsAmbiguousContextReferences() {
        assertThat(intentDetector.isAmbiguousReference("tour nay bao nhieu tien?")).isTrue();
        assertThat(intentDetector.isAmbiguousReference("lich do con cho khong?")).isTrue();
        assertThat(intentDetector.isAmbiguousReference("no co an trua khong?")).isTrue();
    }

    private ConversationContext selectedTourContext() {
        ConversationContext context = new ConversationContext();
        context.setSelectedTourId("tour-1");
        context.setSelectedTourName("Tour Ninh Binh");
        return context;
    }
}
