package com.example.thichdulich.chatbot;

import com.example.thichdulich.dto.AiChatTourDTO;
import com.example.thichdulich.entity.DepartureSchedule;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.TourReview;
import com.example.thichdulich.repository.DepartureScheduleRepository;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.TourReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatTourDataService {
    private final TourRepository tourRepository;
    private final TourReviewRepository reviewRepository;
    private final DepartureScheduleRepository scheduleRepository;

    public List<Tour> searchTours(String query) {
        String normalizedQuery = IntentDetector.normalize(query);
        String keyword = cleanupSearchKeyword(query);
        Tour.TourType requestedType = detectTourType(normalizedQuery);
        List<Tour> tours = tourRepository.findByStatus(Tour.TourStatus.approved).stream()
                .filter(tour -> Boolean.TRUE.equals(tour.getAvailability()))
                .toList();

        List<Tour> matchedTours = tours.stream()
                .map(tour -> new ScoredTour(tour, scoreTour(tour, normalizedQuery, keyword, requestedType)))
                .filter(scored -> scored.score() > 0)
                .sorted(Comparator
                        .comparingInt(ScoredTour::score).reversed()
                        .thenComparing(scored -> scored.tour().getRating(), Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(scored -> scored.tour().getReviewCount(), Comparator.nullsLast(Comparator.reverseOrder())))
                .map(ScoredTour::tour)
                .limit(6)
                .toList();

        if (!matchedTours.isEmpty()) {
            return matchedTours;
        }

        return tours.stream()
                .sorted(Comparator
                        .comparing(Tour::getRating, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Tour::getReviewCount, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(6)
                .toList();
    }

    public Optional<Tour> getTourDetail(String tourId) {
        if (!StringUtils.hasText(tourId)) return Optional.empty();
        return tourRepository.findById(tourId);
    }

    public List<TourReview> getTourReviews(String tourId) {
        if (!StringUtils.hasText(tourId)) return List.of();
        return reviewRepository.findByTourIdOrderByCreatedAtDesc(tourId).stream().limit(5).toList();
    }

    public List<DepartureSchedule> getTourSchedule(String tourId, LocalDate date) {
        if (!StringUtils.hasText(tourId)) return List.of();
        if (date != null) {
            return scheduleRepository.findByTourIdAndDepartureDate(tourId, date).stream().toList();
        }
        return scheduleRepository.findByTourIdOrderByDepartureDateAsc(tourId).stream()
                .filter(schedule -> schedule.getDepartureDate() == null || !schedule.getDepartureDate().isBefore(LocalDate.now()))
                .limit(5)
                .toList();
    }

    public String calculateTourPrice(Tour tour, Integer peopleCount) {
        if (tour == null || tour.getPrice() == null) return "Chưa có dữ liệu giá cho tour này.";
        int people = peopleCount == null || peopleCount < 1 ? 1 : peopleCount;
        long total = tour.getPrice() * people;
        return "Giá người lớn: %s VNĐ/người. Số khách: %d. Tổng tạm tính: %s VNĐ."
                .formatted(formatVnd(tour.getPrice()), people, formatVnd(total));
    }

    public String summarizeTours(List<Tour> tours) {
        if (tours == null || tours.isEmpty()) return "Không tìm thấy tour phù hợp trong hệ thống.";
        return tours.stream().map(this::summarizeTour).reduce((a, b) -> a + "\n---\n" + b).orElse("Chưa có dữ liệu.");
    }

    public String summarizeTour(Tour tour) {
        if (tour == null) return "Chưa có dữ liệu tour.";
        return """
                Tour ID: %s
                Tên tour: %s
                Địa điểm: %s
                Loại tour: %s
                Thời lượng: %s ngày
                Giá người lớn: %s VNĐ
                Giá trẻ em: %s
                Đánh giá: %s (%s lượt)
                Dịch vụ bao gồm: %s
                Dịch vụ không bao gồm: %s
                Mô tả: %s
                """.formatted(
                tour.getId(),
                empty(tour.getNameVi()),
                empty(tour.getLocation()),
                tour.getType() != null ? tour.getType().name() : "chưa có dữ liệu",
                tour.getDuration() != null ? tour.getDuration() : "chưa có dữ liệu",
                tour.getPrice() != null ? formatVnd(tour.getPrice()) : "chưa có dữ liệu",
                tour.getChildPrice() != null ? formatVnd(tour.getChildPrice()) + " VNĐ" : "chưa có dữ liệu",
                tour.getRating() != null ? tour.getRating() : "chưa có dữ liệu",
                tour.getReviewCount() != null ? tour.getReviewCount() : 0,
                emptyOrNoData(tour.getIncludedServices()),
                emptyOrNoData(tour.getExcludedServices()),
                shorten(empty(tour.getDescriptionVi()), 600));
    }

    public String summarizeReviews(List<TourReview> reviews) {
        if (reviews == null || reviews.isEmpty()) return "Tour này chưa có review trong hệ thống.";
        return reviews.stream()
                .map(review -> "- %s sao: %s".formatted(review.getRating(), shorten(empty(review.getComment()), 240)))
                .reduce((a, b) -> a + "\n" + b)
                .orElse("Tour này chưa có review trong hệ thống.");
    }

    public String summarizeSchedule(List<DepartureSchedule> schedules) {
        if (schedules == null || schedules.isEmpty()) return "Chưa có lịch khởi hành phù hợp trong hệ thống.";
        return schedules.stream()
                .map(schedule -> "- Ngày %s: còn %s chỗ, trạng thái %s"
                        .formatted(schedule.getDepartureDate(), schedule.getAvailableSlots(), schedule.getStatus()))
                .reduce((a, b) -> a + "\n" + b)
                .orElse("Chưa có lịch khởi hành phù hợp trong hệ thống.");
    }

    public List<AiChatTourDTO> toCards(List<Tour> tours) {
        return tours == null ? List.of() : tours.stream().limit(4).map(this::toCard).toList();
    }

    public AiChatTourDTO toCard(Tour tour) {
        return new AiChatTourDTO(
                tour.getId(),
                tour.getNameVi(),
                tour.getLocation(),
                tour.getType() != null ? tour.getType().name() : null,
                tour.getDuration(),
                tour.getPrice(),
                tour.getImage(),
                tour.getRating() != null ? tour.getRating().doubleValue() : null,
                tour.getReviewCount(),
                "/tours/" + tour.getId()
        );
    }

    private String cleanupSearchKeyword(String query) {
        String normalized = IntentDetector.normalize(query);
        return normalized
                .replace("toi muon di", "")
                .replace("tim tour", "")
                .replace("tim", "")
                .replace("tour nao", "")
                .replace("tour", "")
                .replace("phu hop", "")
                .replace("cho toi", "")
                .replace("goi y", "")
                .trim();
    }

    private int scoreTour(Tour tour, String normalizedQuery, String keyword, Tour.TourType requestedType) {
        String searchable = IntentDetector.normalize(String.join(" ",
                empty(tour.getNameVi()),
                empty(tour.getLocation()),
                empty(tour.getDescriptionVi()),
                empty(tour.getIncludedServices()),
                empty(tour.getExcludedServices()),
                tour.getType() != null ? tour.getType().name() : ""));

        int score = 0;
        if (requestedType != null && requestedType.equals(tour.getType())) score += 120;
        if (StringUtils.hasText(keyword) && searchable.contains(keyword)) score += 80;

        for (String token : keyword.split("\\s+")) {
            if (token.length() < 2 || isWeakSearchToken(token)) continue;
            if (searchable.contains(token)) score += 15;
        }

        if (containsAny(normalizedQuery, "re nhat", "gia re", "tiet kiem") && tour.getPrice() != null) {
            score += Math.max(0, 30 - Math.min(30, (int) (tour.getPrice() / 100_000)));
        }
        if (containsAny(normalizedQuery, "gia dinh", "tre em", "nguoi lon tuoi")
                && containsAny(searchable, "gia dinh", "tre em", "nhe nhang", "nghi duong")) {
            score += 45;
        }

        return score;
    }

    private Tour.TourType detectTourType(String query) {
        if (containsAny(query, "bien", "dao", "vinh", "tam bien", "nghi duong bien")) return Tour.TourType.beach;
        if (containsAny(query, "nui", "sapa", "da lat", "leo nui", "trekking")) return Tour.TourType.mountain;
        if (containsAny(query, "thien nhien", "sinh thai", "rung", "hang dong")) return Tour.TourType.nature;
        if (containsAny(query, "van hoa", "lich su", "di tich", "tam linh")) return Tour.TourType.cultural;
        if (containsAny(query, "am thuc", "mon an", "food", "an uong")) return Tour.TourType.food;
        if (containsAny(query, "mao hiem", "phieu luu", "adventure")) return Tour.TourType.adventure;
        if (containsAny(query, "thanh pho", "city", "do thi")) return Tour.TourType.city;
        return null;
    }

    private boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(needle)) return true;
        }
        return false;
    }

    private boolean isWeakSearchToken(String token) {
        return List.of("toi", "muon", "di", "tim", "tour", "nao", "co", "khong", "cho", "phu", "hop").contains(token);
    }

    private record ScoredTour(Tour tour, int score) {}

    private String formatVnd(Long value) {
        return String.format("%,d", value);
    }

    private String empty(String value) {
        return value == null ? "" : value;
    }

    private String emptyOrNoData(String value) {
        return StringUtils.hasText(value) ? value : "chưa có dữ liệu";
    }

    private String shorten(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max).trim() + "...";
    }
}
