package com.example.thichdulich.chatbot;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

@Component
public class IntentDetector {
    private static final Set<String> FOLLOW_UP_TERMS = Set.of("tour nay", "tour do", "cai nay", "cai do", "lich do", "gia do", "no", "ben nay");

    public ChatIntent detect(String message, ConversationContext context) {
        String q = normalize(message);
        if (q.isBlank()) return ChatIntent.out_of_scope;
        if (containsAny(q, "messi", "bong da", "lap trinh", "code", "chung khoan", "crypto", "bitcoin")) return ChatIntent.out_of_scope;
        if (containsAny(q, "trang thai don", "don ", "ma don", "abc", "thanh toan chua", "payment status")) return ChatIntent.booking_status;
        if (containsAny(q, "website bi loi", "loi website", "loi thanh toan", "quen ma don")) return ChatIntent.website_help;
        if (containsAny(q, "huy", "hoan tien", "hoan khong", "refund", "cancel")) return ChatIntent.cancellation_policy;
        if (containsAny(q, "qr", "cod", "coc", "chuyen khoan", "thanh toan", "payment")) return ChatIntent.payment_policy;
        if (containsAny(q, "danh gia", "review", "co dang di", "dang di khong")) return ChatIntent.tour_review;
        if (containsAny(q, "bao nhieu tien", "bao nhieu", "di 2 nguoi", "di 3 nguoi", "di 4 nguoi", "tong tien", "gia")) {
            return context.getSelectedTourId() != null || containsAny(q, "nguoi", "tong") ? ChatIntent.price_calculation : ChatIntent.tour_search;
        }
        if (containsAny(q, "lich", "khoi hanh", "con cho", "ngay mai", "ngay do", "schedule")) return ChatIntent.tour_schedule;
        if (containsAny(q, "so sanh", "khac gi", "hon tour", "voi tour")) return ChatIntent.tour_compare;
        if (containsAny(q, "sao")) return ChatIntent.tour_review;
        if (containsAny(q, "chi tiet", "co an", "bao gom", "lich trinh", "khach san", "tour nay co gi")) return ChatIntent.tour_detail;
        if (FOLLOW_UP_TERMS.stream().anyMatch(q::contains)) return ChatIntent.tour_follow_up;
        if (containsAny(q, "loi", "website", "quen ma don", "dang nhap", "dang ky", "otp", "mat khau", "ho tro")) return ChatIntent.website_help;
        if (containsAny(q, "nen mang gi", "thang may", "mua nao", "kinh nghiem", "thoi tiet", "nhiet do", "mac gi", "mac do gi", "chuan bi gi", "di bien")) return ChatIntent.travel_advice;
        if (containsAny(q, "tour", "chuyen di", "ve du lich", "kham pha", "nghi duong", "toi muon di", "re nhat", "gia dinh", "tim", "goi y", "ninh binh", "ha long", "sapa", "hue", "da nang", "nha trang", "phu quoc", "da lat")) return ChatIntent.tour_search;
        return ChatIntent.travel_advice;
    }

    public boolean isGreetingOrChitchat(String message) {
        String q = normalize(message);
        return containsAny(q, "xin chao", "chao ban", "hello", "hi", "chao bot", "tam biet", "cam on", "thank", "ban la ai", "ai day", "ten la gi", "what is your name", "who are you");
    }

    public boolean isAmbiguousReference(String message) {
        String q = normalize(message);
        return FOLLOW_UP_TERMS.stream().anyMatch(q::contains);
    }

    static String normalize(String value) {
        if (value == null) return "";
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        return normalized.replace('đ', 'd').replaceAll("[^a-z0-9\\s+]", " ").replaceAll("\\s+", " ").trim();
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) return true;
        }
        return false;
    }
}
