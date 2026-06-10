package com.example.thichdulich.service;

import com.example.thichdulich.dto.DepartureScheduleDTO;
import com.example.thichdulich.dto.TourRecommendationDTO;
import com.example.thichdulich.dto.TourDTO;
import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.entity.DepartureSchedule;
import com.example.thichdulich.entity.Destination;
import com.example.thichdulich.entity.Favorite;
import com.example.thichdulich.entity.Provider;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.UserInteraction;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.BookingRepository;
import com.example.thichdulich.repository.DepartureScheduleRepository;
import com.example.thichdulich.repository.DestinationRepository;
import com.example.thichdulich.repository.FavoriteRepository;
import com.example.thichdulich.repository.ProviderRepository;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.UserInteractionRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class TourService {
    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private ProviderRepository providerRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private DepartureScheduleRepository scheduleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TourCategoryService tourCategoryService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserInteractionRepository interactionRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    public List<TourDTO> getAllApprovedTours() {
        return tourRepository.findByStatus(Tour.TourStatus.approved)
                .stream()
                .map(DtoMapper::toTourDTO)
                .collect(Collectors.toList());
    }

    public List<TourDTO> searchApprovedTours(
            String keyword,
            String location,
            String type,
            Long minPrice,
            Long maxPrice,
            Integer duration,
            Integer minDuration,
            Integer maxDuration,
            LocalDate startDate,
            String sortBy) {
        Tour.TourType tourType = null;
        if (type != null && !type.isBlank()) {
            tourType = Tour.TourType.valueOf(type.toLowerCase());
        }

        List<Tour> tours = tourRepository.searchApprovedTours(
                keyword, location, tourType, minPrice, maxPrice, duration, minDuration, maxDuration, startDate);

        Comparator<Tour> comparator = switch (sortBy != null ? sortBy : "popular") {
            case "priceAsc" -> Comparator.comparing(Tour::getPrice);
            case "priceDesc" -> Comparator.comparing(Tour::getPrice).reversed();
            case "rating" -> Comparator.comparing(Tour::getRating).reversed();
            default -> Comparator.comparing(Tour::getReviewCount, Comparator.nullsFirst(Integer::compareTo)).reversed();
        };

        return tours.stream()
                .sorted(comparator)
                .map(DtoMapper::toTourDTO)
                .collect(Collectors.toList());
    }

    public List<TourDTO> getToursByType(String type) {
        Tour.TourType tourType = Tour.TourType.valueOf(type.toLowerCase());
        return tourRepository.findByType(tourType)
                .stream()
                .map(DtoMapper::toTourDTO)
                .collect(Collectors.toList());
    }

    public List<TourDTO> getToursByDestination(String destinationId) {
        return tourRepository.findByDestinationId(destinationId)
                .stream()
                .map(DtoMapper::toTourDTO)
                .collect(Collectors.toList());
    }

    public TourDTO getTourById(String id) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        return DtoMapper.toTourDTO(tour);
    }

    public List<DepartureScheduleDTO> getTourSchedules(String tourId) {
        return scheduleRepository.findByTourIdOrderByDepartureDateAsc(tourId)
                .stream()
                .map(DtoMapper::toScheduleDTO)
                .collect(Collectors.toList());
    }

    public DepartureScheduleDTO createSchedule(String userId, String tourId, DepartureScheduleDTO dto) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        assertCanManageTour(userId, false, tour);

        DepartureSchedule schedule = new DepartureSchedule();
        schedule.setTour(tour);
        schedule.setDepartureDate(dto.getDepartureDate());
        schedule.setTotalSlots(dto.getTotalSlots() != null ? dto.getTotalSlots() : 20);
        schedule.setBookedSlots(0);
        if (dto.getStatus() != null) {
            schedule.setStatus(DepartureSchedule.ScheduleStatus.valueOf(dto.getStatus().toLowerCase()));
        }
        return DtoMapper.toScheduleDTO(scheduleRepository.save(schedule));
    }

    public DepartureScheduleDTO updateSchedule(String userId, String tourId, String scheduleId, DepartureScheduleDTO dto) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        assertCanManageTour(userId, false, tour);

        DepartureSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Departure schedule not found"));
        if (schedule.getTour() == null || !tourId.equals(schedule.getTour().getId())) {
            throw new RuntimeException("Departure schedule does not belong to this tour");
        }

        if (dto.getDepartureDate() != null) schedule.setDepartureDate(dto.getDepartureDate());
        if (dto.getTotalSlots() != null) {
            if (dto.getTotalSlots() < schedule.getBookedSlots()) {
                throw new RuntimeException("Total slots cannot be less than booked slots");
            }
            schedule.setTotalSlots(dto.getTotalSlots());
        }
        if (dto.getStatus() != null) {
            schedule.setStatus(DepartureSchedule.ScheduleStatus.valueOf(dto.getStatus().toLowerCase()));
        }
        return DtoMapper.toScheduleDTO(scheduleRepository.save(schedule));
    }

    public void deleteSchedule(String userId, String tourId, String scheduleId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        assertCanManageTour(userId, false, tour);

        DepartureSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Departure schedule not found"));
        if (schedule.getTour() == null || !tourId.equals(schedule.getTour().getId())) {
            throw new RuntimeException("Departure schedule does not belong to this tour");
        }
        if (schedule.getBookedSlots() != null && schedule.getBookedSlots() > 0) {
            throw new RuntimeException("Cannot delete a schedule with bookings");
        }
        scheduleRepository.delete(schedule);
    }

    public TourDTO createTour(String userId, TourDTO tourDTO) {
        Provider provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Provider profile not found"));
        assertProviderApproved(provider);

        Tour tour = new Tour();
        tour.setProvider(provider);
        tour.setStatus(Tour.TourStatus.pending);
        validateActiveTourCategory(tourDTO);
        DtoMapper.applyTourDtoToEntity(tour, tourDTO);
        if (tour.getLocation() == null) tour.setLocation("Việt Nam");
        if (tourDTO.getDestinationId() != null) {
            Destination dest = destinationRepository.findById(tourDTO.getDestinationId())
                    .orElse(null);
            tour.setDestination(dest);
        }

        return DtoMapper.toTourDTO(tourRepository.save(tour));
    }

    public TourDTO updateTour(String tourId, TourDTO tourDTO) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        validateActiveTourCategory(tourDTO);
        DtoMapper.applyTourDtoToEntity(tour, tourDTO);
        if (tourDTO.getDestinationId() != null) {
            destinationRepository.findById(tourDTO.getDestinationId()).ifPresent(tour::setDestination);
        }
        return DtoMapper.toTourDTO(tourRepository.save(tour));
    }

    public TourDTO updateTour(String userId, boolean isAdmin, String tourId, TourDTO tourDTO) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        assertCanManageTour(userId, isAdmin, tour);
        Tour.TourStatus previousStatus = tour.getStatus();
        boolean providerChangedPromotion = !isAdmin && hasPromotionChange(tourDTO);
        boolean providerChangedContent = !isAdmin && hasTourContentChange(tour, tourDTO);
        Tour.TourStatus requestedStatus = parseTourStatus(tourDTO.getStatus());
        if (!isAdmin) {
            validateActiveTourCategory(tourDTO);
        }
        DtoMapper.applyTourDtoToEntity(tour, tourDTO);
        if (!isAdmin) {
            if ((requestedStatus == Tour.TourStatus.updated || providerChangedContent)
                    && (previousStatus == Tour.TourStatus.approved || previousStatus == Tour.TourStatus.need_edit)) {
                tour.setStatus(Tour.TourStatus.updated);
            } else if ((requestedStatus == Tour.TourStatus.pending || providerChangedContent)
                    && previousStatus == Tour.TourStatus.rejected) {
                tour.setStatus(Tour.TourStatus.pending);
            }
        }
        if (providerChangedPromotion) {
            tour.setPromotionSource("provider");
            tour.setPromotionStatus("pending");
            tour.setPromotionActive(false);
        } else if (isAdmin && hasPromotionChange(tourDTO)) {
            tour.setPromotionSource("admin");
            tour.setPromotionStatus(Boolean.FALSE.equals(tour.getPromotionActive()) ? "none" : "approved");
        }
        if (tourDTO.getDestinationId() != null) {
            destinationRepository.findById(tourDTO.getDestinationId()).ifPresent(tour::setDestination);
        }
        return DtoMapper.toTourDTO(tourRepository.save(tour));
    }

    public void deleteTour(String id) {
        if (!tourRepository.existsById(id)) {
            throw new RuntimeException("Tour not found");
        }
        tourRepository.deleteById(id);
    }

    private void validateActiveTourCategory(TourDTO tourDTO) {
        if (tourDTO.getType() != null) {
            tourCategoryService.ensureActiveCategory(tourDTO.getType());
        }
    }

    public void deleteTour(String userId, boolean isAdmin, String id) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        assertCanManageTour(userId, isAdmin, tour);
        if (bookingRepository.countByTourId(id) > 0) {
            tour.setAvailability(false);
            tour.setStatus(Tour.TourStatus.rejected);
            tour.setAdminNotes("Tour has been deleted by provider but is kept for booking history.");
            tourRepository.save(tour);
            return;
        }
        tourRepository.delete(tour);
    }

    public List<TourDTO> getProviderTours(String userId) {
        Provider provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        return tourRepository.findByProvider(provider)
                .stream()
                .filter(tour -> Boolean.TRUE.equals(tour.getAvailability()))
                .map(DtoMapper::toTourDTO)
                .collect(Collectors.toList());
    }

    public List<TourDTO> getTrendingTours() {
        return tourRepository.findByStatusOrderByRatingDesc(Tour.TourStatus.approved)
                .stream()
                .limit(10)
                .map(DtoMapper::toTourDTO)
                .collect(Collectors.toList());
    }

    public List<TourRecommendationDTO> getRecommendations(String userId, int limit) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Booking> bookings = bookingRepository.findByUserOrderByCreatedAtDesc(user);
        List<UserInteraction> interactions = interactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Favorite> favorites = favoriteRepository.findByUserId(userId);
        List<Tour> approvedTours = tourRepository.findByStatus(Tour.TourStatus.approved)
                .stream()
                .filter(t -> Boolean.TRUE.equals(t.getAvailability()))
                .collect(Collectors.toList());

        Map<Tour.TourType, Integer> typeWeights = new HashMap<>();
        Map<String, Integer> locationWeights = new HashMap<>();
        List<Long> prices = new ArrayList<>();
        List<Integer> durations = new ArrayList<>();
        Set<String> searchTokens = new LinkedHashSet<>();
        Set<String> favoriteTourIds = new LinkedHashSet<>();

        for (Booking booking : bookings) {
            Tour tour = booking.getTour();
            if (tour == null) continue;
            typeWeights.merge(tour.getType(), 5, Integer::sum);
            locationWeights.merge(normalize(tour.getLocation()), 4, Integer::sum);
            if (tour.getPrice() != null) prices.add(tour.getPrice());
            if (tour.getDuration() != null) durations.add(tour.getDuration());
        }

        for (Favorite favorite : favorites) {
            Tour tour = favorite.getTour();
            if (tour == null) continue;
            favoriteTourIds.add(tour.getId());
            typeWeights.merge(tour.getType(), 7, Integer::sum);
            locationWeights.merge(normalize(tour.getLocation()), 6, Integer::sum);
            if (tour.getPrice() != null) prices.add(tour.getPrice());
            if (tour.getDuration() != null) durations.add(tour.getDuration());
        }

        for (UserInteraction interaction : interactions) {
            if (interaction.getTour() != null) {
                Tour tour = interaction.getTour();
                int weight = switch (interaction.getAction()) {
                    case bookmark -> 5;
                    case click -> 3;
                    case view -> 2;
                    case search -> 1;
                };
                typeWeights.merge(tour.getType(), weight, Integer::sum);
                locationWeights.merge(normalize(tour.getLocation()), weight, Integer::sum);
                if (tour.getPrice() != null) prices.add(tour.getPrice());
                if (tour.getDuration() != null) durations.add(tour.getDuration());
            }
            if (interaction.getSearchQuery() != null && !interaction.getSearchQuery().isBlank()) {
                searchTokens.addAll(tokenize(interaction.getSearchQuery()));
            }
        }

        Long avgPrice = prices.isEmpty()
                ? null
                : Math.round(prices.stream().mapToLong(Long::longValue).average().orElse(0));
        Double avgDuration = durations.isEmpty()
                ? null
                : durations.stream().mapToInt(Integer::intValue).average().orElse(0);
        boolean hasPersonalSignals = !typeWeights.isEmpty() || !locationWeights.isEmpty() || !searchTokens.isEmpty() || !favoriteTourIds.isEmpty();

        return approvedTours.stream()
                .filter(tour -> bookings.stream().noneMatch(b -> b.getTour() != null && b.getTour().getId().equals(tour.getId())))
                .map(tour -> scoreTour(
                        tour,
                        typeWeights,
                        locationWeights,
                        avgPrice,
                        durations,
                        avgDuration,
                        searchTokens,
                        favoriteTourIds.contains(tour.getId()),
                        hasPersonalSignals))
                .filter(rec -> rec.getScore() > 0)
                .sorted(Comparator.comparing(TourRecommendationDTO::getScore).reversed())
                .limit(Math.max(1, Math.min(limit, 12)))
                .collect(Collectors.toList());
    }

    private TourRecommendationDTO scoreTour(
            Tour tour,
            Map<Tour.TourType, Integer> typeWeights,
            Map<String, Integer> locationWeights,
            Long avgPrice,
            List<Integer> durations,
            Double avgDuration,
            Set<String> searchTokens,
            boolean isFavorite,
            boolean hasPersonalSignals) {
        double score = 0;
        List<String> reasons = new ArrayList<>();

        if (isFavorite) {
            score += 80;
            addReason(reasons, "Tour bạn đã lưu yêu thích");
        }

        int typeWeight = typeWeights.getOrDefault(tour.getType(), 0);
        if (typeWeight > 0) {
            score += typeWeight * 8;
            addReason(reasons, "Phù hợp với loại tour bạn hay quan tâm");
        }

        int locationWeight = locationWeights.getOrDefault(normalize(tour.getLocation()), 0);
        if (locationWeight > 0) {
            score += locationWeight * 6;
            addReason(reasons, "Liên quan đến địa điểm bạn đã xem hoặc tìm kiếm");
        }

        if (avgPrice != null && tour.getPrice() != null
                && Math.abs(tour.getPrice() - avgPrice) <= Math.max(1000000, avgPrice * 0.4)) {
            score += 22;
            addReason(reasons, "Phù hợp với ngân sách bạn thường chọn");
        }

        if (durations.contains(tour.getDuration())) {
            score += 16;
            addReason(reasons, "Thời lượng tour giống lịch sử quan tâm của bạn");
        } else if (avgDuration != null && tour.getDuration() != null && Math.abs(tour.getDuration() - avgDuration) <= 1.5) {
            score += 10;
            addReason(reasons, "Thời lượng gần với các tour bạn đã xem");
        }

        String searchable = normalize(String.join(" ",
                nullToEmpty(tour.getNameVi()),
                nullToEmpty(tour.getDescriptionVi()),
                nullToEmpty(tour.getLocation()),
                tour.getType() != null ? tour.getType().name() : ""));
        long matchedTokens = searchTokens.stream()
                .filter(token -> token.length() >= 2 && searchable.contains(token))
                .count();
        if (matchedTokens > 0) {
            score += Math.min(30, matchedTokens * 10);
            addReason(reasons, "Khớp với lịch sử tìm kiếm của bạn");
        }

        if (tour.getRating() != null) {
            score += tour.getRating().doubleValue() * 4;
        }
        if (tour.getReviewCount() != null) {
            score += Math.min(tour.getReviewCount() / 10.0, 15);
        }
        if (Boolean.TRUE.equals(tour.getPromotionActive()) && tour.getOriginalPrice() != null
                && tour.getPrice() != null && tour.getOriginalPrice() > tour.getPrice()) {
            score += 8;
            addReason(reasons, "Đang có ưu đãi tốt");
        }

        if (reasons.isEmpty() || !hasPersonalSignals) {
            addReason(reasons, hasPersonalSignals
                    ? "Tour nổi bật được nhiều khách quan tâm"
                    : "Gợi ý khởi đầu dựa trên đánh giá và độ phổ biến");
        }

        return new TourRecommendationDTO(DtoMapper.toTourDTO(tour), score, reasons);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private List<String> tokenize(String value) {
        return List.of(normalize(value).split("\\s+")).stream()
                .map(token -> token.replaceAll("[^\\p{L}\\p{N}]", ""))
                .filter(token -> token.length() >= 2)
                .collect(Collectors.toList());
    }

    private void addReason(List<String> reasons, String reason) {
        if (reasons.size() < 3 && !reasons.contains(reason)) {
            reasons.add(reason);
        }
    }

    private void assertCanManageTour(String userId, boolean isAdmin, Tour tour) {
        if (isAdmin) {
            return;
        }

        Provider provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Provider profile not found"));
        assertProviderApproved(provider);
        if (tour.getProvider() == null || !provider.getId().equals(tour.getProvider().getId())) {
            throw new RuntimeException("You do not have permission to manage this tour");
        }
    }

    private void assertProviderApproved(Provider provider) {
        if (provider.getStatus() != Provider.ProviderStatus.approved) {
            throw new RuntimeException("Provider profile is waiting for admin approval");
        }
    }

    private boolean hasPromotionChange(TourDTO dto) {
        return dto.getOriginalPrice() != null
                || hasText(dto.getPromotionTitle())
                || hasText(dto.getPromotionBadge())
                || (dto.getDiscountPercent() != null && dto.getDiscountPercent() > 0)
                || Boolean.TRUE.equals(dto.getPromotionActive())
                || hasText(dto.getPromotionStatus())
                || hasText(dto.getPromotionSource());
    }

    private boolean hasTourContentChange(Tour tour, TourDTO dto) {
        return changed(dto.getName(), tour.getNameVi())
                || changed(dto.getDescription(), tour.getDescriptionVi())
                || changed(dto.getLocation(), tour.getLocation())
                || (dto.getType() != null && tour.getType() != null
                    && !dto.getType().equalsIgnoreCase(tour.getType().name()))
                || (dto.getDuration() != null && !dto.getDuration().equals(tour.getDuration()))
                || (dto.getPrice() != null && !Long.valueOf(dto.getPrice().longValue()).equals(tour.getPrice()))
                || (dto.getChildPrice() != null && !Long.valueOf(dto.getChildPrice().longValue()).equals(tour.getChildPrice()))
                || changed(dto.getImage(), tour.getImage())
                || ((dto.getMaxPeoplePerDay() != null || dto.getMaxSeats() != null)
                    && !Integer.valueOf(dto.getMaxPeoplePerDay() != null ? dto.getMaxPeoplePerDay() : dto.getMaxSeats())
                        .equals(tour.getMaxPeoplePerDay()))
                || (dto.getDestinationId() != null
                    && (tour.getDestination() == null || !dto.getDestinationId().equals(tour.getDestination().getId())));
    }

    private Tour.TourStatus parseTourStatus(String status) {
        if (!hasText(status)) return null;
        try {
            return Tour.TourStatus.valueOf(status.toLowerCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private boolean changed(String next, String current) {
        if (next == null) return false;
        return !next.trim().equals((current == null ? "" : current).trim());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
