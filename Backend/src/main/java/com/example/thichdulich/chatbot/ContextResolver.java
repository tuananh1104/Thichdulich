package com.example.thichdulich.chatbot;

import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.repository.TourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class ContextResolver {
    private final TourRepository tourRepository;
    private final IntentDetector intentDetector;

    public ResolvedContext resolve(String message, ChatIntent intent, ConversationContext context) {
        String q = IntentDetector.normalize(message);
        ResolvedContext resolved = new ResolvedContext();
        resolved.setAmbiguousReference(intentDetector.isAmbiguousReference(message) || intent == ChatIntent.tour_follow_up);
        resolved.setDate(resolveDate(q, context));
        resolved.setPeopleCount(resolvePeopleCount(q, context));
        resolved.setOrderCode(resolveOrderCode(message));

        List<String> mentionedTourIds = resolveMentionedTours(q);
        if (!mentionedTourIds.isEmpty()) {
            resolved.setTourId(mentionedTourIds.get(0));
            resolved.setCompareTourIds(mentionedTourIds);
            return resolved;
        }

        if (resolved.isAmbiguousReference() || intent != ChatIntent.tour_search) {
            if (context.getSelectedTourId() != null) {
                resolved.setTourId(context.getSelectedTourId());
            } else if (!context.getLastAssistantTourSuggestions().isEmpty()) {
                resolved.setTourId(context.getLastAssistantTourSuggestions().get(0));
            }
        }
        if (intent == ChatIntent.tour_compare && resolved.getCompareTourIds().size() < 2) {
            resolved.setCompareTourIds(new ArrayList<>(context.getLastAssistantTourSuggestions()));
        }
        return resolved;
    }

    private List<String> resolveMentionedTours(String query) {
        return tourRepository.findByStatus(Tour.TourStatus.approved).stream()
                .filter(tour -> query.contains(IntentDetector.normalize(tour.getNameVi()))
                        || query.contains(IntentDetector.normalize(tour.getLocation())))
                .sorted(Comparator.comparingInt((Tour tour) -> IntentDetector.normalize(tour.getNameVi()).length()).reversed())
                .limit(4)
                .map(Tour::getId)
                .toList();
    }

    private LocalDate resolveDate(String query, ConversationContext context) {
        if (query.contains("ngay mai")) return LocalDate.now().plusDays(1);
        if (query.contains("hom nay")) return LocalDate.now();
        if (query.contains("ngay do") || query.contains("lich do")) return context.getSelectedDate();
        Matcher iso = Pattern.compile("(20\\d{2})[-/](\\d{1,2})[-/](\\d{1,2})").matcher(query);
        if (iso.find()) return LocalDate.of(Integer.parseInt(iso.group(1)), Integer.parseInt(iso.group(2)), Integer.parseInt(iso.group(3)));
        Matcher vi = Pattern.compile("(\\d{1,2})[-/](\\d{1,2})(?:[-/](20\\d{2}))?").matcher(query);
        if (vi.find()) {
            int year = vi.group(3) == null ? LocalDate.now().getYear() : Integer.parseInt(vi.group(3));
            return LocalDate.of(year, Integer.parseInt(vi.group(2)), Integer.parseInt(vi.group(1)));
        }
        return context.getSelectedDate();
    }

    private Integer resolvePeopleCount(String query, ConversationContext context) {
        Matcher matcher = Pattern.compile("(\\d{1,2})\\s*(nguoi|khach|người|khách)").matcher(query);
        if (matcher.find()) return Integer.parseInt(matcher.group(1));
        return context.getPeopleCount();
    }

    private String resolveOrderCode(String message) {
        Matcher matcher = Pattern.compile("\\b[A-Z0-9]{5,}\\b").matcher(message.toUpperCase());
        return matcher.find() ? matcher.group() : null;
    }
}
