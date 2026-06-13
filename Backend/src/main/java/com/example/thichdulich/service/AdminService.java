package com.example.thichdulich.service;

import com.example.thichdulich.dto.TourDTO;
import com.example.thichdulich.dto.TourReportDTO;
import com.example.thichdulich.dto.UserDTO;
import com.example.thichdulich.dto.ProviderProfileDTO;
import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.entity.Provider;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.TourReport;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.entity.UserInteraction;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.BookingRepository;
import com.example.thichdulich.repository.ProviderRepository;
import com.example.thichdulich.repository.TourReviewRepository;
import com.example.thichdulich.repository.TourReportRepository;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.UserInteractionRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminService {
    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private TourReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderRepository providerRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TourReviewRepository reviewRepository;

    @Autowired
    private UserInteractionRepository userInteractionRepository;

    @Autowired
    private NotificationService notificationService;

    public List<TourDTO> getAllTours() {
        return tourRepository.findAll()
                .stream()
                .filter(tour -> Boolean.TRUE.equals(tour.getAvailability()))
                .map(DtoMapper::toTourDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(DtoMapper::toUserDTO)
                .collect(Collectors.toList());
    }

    public List<ProviderProfileDTO> getAllProviders() {
        return providerRepository.findAll()
                .stream()
                .map(this::toProviderProfileDTO)
                .collect(Collectors.toList());
    }

    public UserDTO setUserBanStatus(String userId, boolean banned) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (target.getRole() == User.UserRole.admin) {
            throw new IllegalArgumentException("Cannot change admin account status");
        }
        target.setIsBanned(banned);
        target.setIsActive(!banned);
        return DtoMapper.toUserDTO(userRepository.save(target));
    }

    public UserDTO updateUser(String userId, UserDTO request) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getName() != null && !request.getName().isBlank()) {
            target.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            target.setPhone(request.getPhone().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && !request.getEmail().equalsIgnoreCase(target.getEmail())) {
            userRepository.findByEmail(request.getEmail())
                    .filter(existing -> !existing.getId().equals(target.getId()))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Email already exists");
                    });
            target.setEmail(request.getEmail().trim());
        }
        return DtoMapper.toUserDTO(userRepository.save(target));
    }

    public ProviderProfileDTO updateProviderStatus(String providerId, String status) {
        Provider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        Provider.ProviderStatus nextStatus = Provider.ProviderStatus.valueOf(status.toLowerCase());
        provider.setStatus(nextStatus);
        provider.setIsVerified(nextStatus == Provider.ProviderStatus.approved);
        if (provider.getUser() != null) {
            boolean enabled = nextStatus != Provider.ProviderStatus.rejected;
            provider.getUser().setIsActive(enabled);
            provider.getUser().setIsBanned(!enabled);
        }
        Provider saved = providerRepository.save(provider);
        if (saved.getUser() != null) {
            notificationService.notifyUser(
                    saved.getUser(),
                    "provider_status",
                    "Trạng thái nhà cung cấp đã cập nhật",
                    "Hồ sơ " + saved.getCompanyName() + " đã chuyển sang trạng thái " + nextStatus.name() + ".",
                    "/provider/overview",
                    "{\"providerId\":\"" + saved.getId() + "\"}"
            );
        }
        return toProviderProfileDTO(saved);
    }

    public List<TourReportDTO> getAllReports() {
        return reportRepository.findAll()
                .stream()
                .map(DtoMapper::toReportDTO)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStatistics() {
        List<User> users = userRepository.findAll();
        List<Provider> providers = providerRepository.findAll();
        List<Tour> tours = tourRepository.findAll();
        List<Booking> bookings = bookingRepository.findAll();
        List<TourReport> reports = reportRepository.findAll();

        long totalRevenue = bookings.stream()
                .filter(this::isCollectedPayment)
                .mapToLong(this::netPaymentAmount)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", users.size());
        stats.put("totalProviders", providers.size());
        stats.put("totalTours", tours.size());
        stats.put("pendingTours", tours.stream().filter(tour -> tour.getStatus() == Tour.TourStatus.pending).count());
        stats.put("approvedTours", tours.stream().filter(tour -> tour.getStatus() == Tour.TourStatus.approved).count());
        stats.put("totalBookings", bookings.size());
        stats.put("revenue", totalRevenue);
        stats.put("totalRevenue", totalRevenue);
        stats.put("pendingReports", reports.stream().filter(report -> report.getStatus() == TourReport.ReportStatus.pending).count());
        stats.put("monthlyRevenue", buildMonthlyRevenue(users, tours, bookings));
        stats.put("topDestinations", buildTopDestinations(tours, bookings));
        stats.put("conversionRate", calculateConversionRate(bookings));
        stats.put("averageRating", calculateAverageRating());
        return stats;
    }

    private List<Map<String, Object>> buildMonthlyRevenue(
            List<User> users,
            List<Tour> tours,
            List<Booking> bookings) {
        YearMonth currentMonth = YearMonth.now();
        DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("'T'M/yy");
        Map<YearMonth, Map<String, Object>> byMonth = new LinkedHashMap<>();

        for (int i = 5; i >= 0; i--) {
            YearMonth month = currentMonth.minusMonths(i);
            Map<String, Object> item = new HashMap<>();
            item.put("month", month.format(labelFormatter));
            item.put("revenue", 0L);
            item.put("bookings", 0L);
            item.put("users", 0L);
            item.put("tours", 0L);
            byMonth.put(month, item);
        }

        bookings.stream()
                .filter(this::isCollectedPayment)
                .forEach(booking -> addToMonth(byMonth, paymentDate(booking), "revenue", netPaymentAmount(booking)));

        bookings.forEach(booking -> addToMonth(byMonth, booking.getCreatedAt(), "bookings", 1L));
        users.forEach(user -> addToMonth(byMonth, user.getCreatedAt(), "users", 1L));
        tours.forEach(tour -> addToMonth(byMonth, tour.getCreatedAt(), "tours", 1L));

        return new ArrayList<>(byMonth.values());
    }

    private List<Map<String, Object>> buildTopDestinations(
            List<Tour> tours,
            List<Booking> bookings) {
        Map<String, Map<String, Object>> byDestination = new HashMap<>();
        Map<String, Long> revenueByBookingId = bookings.stream()
                .filter(this::isCollectedPayment)
                .collect(Collectors.toMap(
                        Booking::getId,
                        this::netPaymentAmount,
                        Long::sum
                ));

        tours.forEach(tour -> {
            String name = destinationName(tour);
            Map<String, Object> item = byDestination.computeIfAbsent(name, key -> {
                Map<String, Object> created = new HashMap<>();
                created.put("name", key);
                created.put("tours", 0L);
                created.put("bookings", 0L);
                created.put("revenue", 0L);
                return created;
            });
            increment(item, "tours", 1L);
        });

        bookings.forEach(booking -> {
            if (booking.getTour() == null) return;
            String name = destinationName(booking.getTour());
            Map<String, Object> item = byDestination.computeIfAbsent(name, key -> {
                Map<String, Object> created = new HashMap<>();
                created.put("name", key);
                created.put("tours", 0L);
                created.put("bookings", 0L);
                created.put("revenue", 0L);
                return created;
            });
            increment(item, "bookings", 1L);
            increment(item, "revenue", revenueByBookingId.getOrDefault(booking.getId(), 0L));
        });

        return byDestination.values()
                .stream()
                .sorted(Comparator
                        .comparingLong((Map<String, Object> item) -> ((Number) item.get("bookings")).longValue())
                        .thenComparingLong(item -> ((Number) item.get("revenue")).longValue())
                        .reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    private Integer calculateConversionRate(List<Booking> bookings) {
        long tourViews = userInteractionRepository.findAll()
                .stream()
                .filter(interaction -> interaction.getAction() == UserInteraction.InteractionAction.view)
                .filter(interaction -> interaction.getTour() != null)
                .count();

        if (tourViews > 0) {
            return (int) Math.round((bookings.size() * 100.0) / tourViews);
        }

        long activeTours = tourRepository.findAll()
                .stream()
                .filter(tour -> Boolean.TRUE.equals(tour.getAvailability()))
                .count();
        return activeTours > 0 ? (int) Math.round((bookings.size() * 100.0) / activeTours) : 0;
    }

    private Double calculateAverageRating() {
        List<Integer> ratings = reviewRepository.findAll()
                .stream()
                .map(review -> review.getRating() == null ? 0 : review.getRating())
                .filter(rating -> rating > 0)
                .collect(Collectors.toList());
        if (ratings.isEmpty()) return 0.0;
        double average = ratings.stream().mapToInt(Integer::intValue).average().orElse(0.0);
        return Math.round(average * 10.0) / 10.0;
    }

    private void addToMonth(Map<YearMonth, Map<String, Object>> byMonth, LocalDateTime date, String key, Long amount) {
        if (date == null) return;
        Map<String, Object> item = byMonth.get(YearMonth.from(date));
        if (item != null) {
            increment(item, key, amount);
        }
    }

    private void increment(Map<String, Object> item, String key, Long amount) {
        long current = ((Number) item.getOrDefault(key, 0L)).longValue();
        item.put(key, current + amount);
    }

    private boolean isCollectedPayment(Booking booking) {
        if (booking == null || booking.getPaymentStatus() == null) return false;
        return booking.getPaymentStatus() == Booking.PaymentStatus.deposited
                || booking.getPaymentStatus() == Booking.PaymentStatus.paid
                || booking.getPaymentStatus() == Booking.PaymentStatus.success;
    }

    private long netPaymentAmount(Booking booking) {
        long amount = booking.getPaymentAmount() == null ? 0L : booking.getPaymentAmount();
        long refunded = booking.getRefundAmount() == null ? 0L : booking.getRefundAmount();
        return Math.max(amount - refunded, 0L);
    }

    private LocalDateTime paymentDate(Booking booking) {
        return booking.getPaidAt() != null ? booking.getPaidAt() : booking.getCreatedAt();
    }

    private String destinationName(Tour tour) {
        if (tour.getDestination() != null && tour.getDestination().getNameVi() != null && !tour.getDestination().getNameVi().isBlank()) {
            return tour.getDestination().getNameVi();
        }
        if (tour.getLocation() != null && !tour.getLocation().isBlank()) {
            return tour.getLocation();
        }
        return "Chưa phân loại";
    }

    public List<TourDTO> getPendingTours() {
        return tourRepository.findByStatus(Tour.TourStatus.pending)
                .stream()
                .map(DtoMapper::toTourDTO)
                .collect(Collectors.toList());
    }

    public TourDTO approveTour(String tourId, String adminId, String adminNotes) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        User admin = userRepository.findById(adminId).orElse(null);
        tour.setStatus(Tour.TourStatus.approved);
        tour.setRejectionReason(null);
        tour.setReviewedAt(LocalDateTime.now());
        tour.setReviewedBy(admin);
        tour.setAdminNotes(adminNotes);
        Tour saved = tourRepository.save(tour);
        notifyTourProvider(saved, "tour_approved", "Tour đã được duyệt",
                "Tour " + saved.getNameVi() + " đã được duyệt và có thể hiển thị công khai.");
        return DtoMapper.toTourDTO(saved);
    }

    public TourDTO rejectTour(String tourId, String adminId, String reason, String adminNotes) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        User admin = userRepository.findById(adminId).orElse(null);
        tour.setStatus(Tour.TourStatus.rejected);
        tour.setRejectionReason(reason);
        tour.setAdminNotes(adminNotes);
        tour.setReviewedAt(LocalDateTime.now());
        tour.setReviewedBy(admin);
        Tour saved = tourRepository.save(tour);
        notifyTourProvider(saved, "tour_rejected", "Tour bị từ chối",
                "Tour " + saved.getNameVi() + " đã bị từ chối. Lý do: " + reason);
        return DtoMapper.toTourDTO(saved);
    }

    public TourDTO requestTourEdit(String tourId, String adminId, String notes) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        User admin = userRepository.findById(adminId).orElse(null);
        tour.setStatus(Tour.TourStatus.need_edit);
        tour.setAdminNotes(notes);
        tour.setReviewedAt(LocalDateTime.now());
        tour.setReviewedBy(admin);
        Tour saved = tourRepository.save(tour);
        notifyTourProvider(saved, "tour_need_edit", "Tour cần chỉnh sửa",
                "Admin yêu cầu chỉnh sửa tour " + saved.getNameVi() + ".");
        return DtoMapper.toTourDTO(saved);
    }

    public List<TourDTO> removePromotions(List<String> tourIds) {
        if (tourIds == null || tourIds.isEmpty()) {
            throw new IllegalArgumentException("At least one tour is required");
        }

        return tourRepository.findAllById(tourIds).stream()
                .filter(tour -> Boolean.TRUE.equals(tour.getPromotionActive())
                        || (tour.getPromotionStatus() != null && !"none".equals(tour.getPromotionStatus()))
                        || tour.getDiscountPercent() != null)
                .map(tour -> {
                    if (tour.getOriginalPrice() != null && tour.getOriginalPrice() > 0) {
                        tour.setPrice(tour.getOriginalPrice());
                    }
                    tour.setPromotionTitle(null);
                    tour.setPromotionBadge(null);
                    tour.setDiscountPercent(null);
                    tour.setPromotionActive(false);
                    tour.setPromotionStatus("none");
                    tour.setPromotionSource("none");
                    return DtoMapper.toTourDTO(tourRepository.save(tour));
                })
                .collect(Collectors.toList());
    }

    public TourDTO approveTourPromotion(String tourId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        if (tour.getDiscountPercent() == null || tour.getDiscountPercent() <= 0) {
            throw new IllegalArgumentException("Tour does not have a pending promotion");
        }
        if (!"pending".equalsIgnoreCase(tour.getPromotionStatus())) {
            throw new IllegalArgumentException("Tour promotion is not pending approval");
        }
        if ("admin".equalsIgnoreCase(tour.getPromotionSource())) {
            throw new IllegalArgumentException("Admin-created promotions do not require provider promotion approval");
        }
        tour.setPromotionActive(true);
        tour.setPromotionStatus("approved");
        if (tour.getPromotionSource() == null || tour.getPromotionSource().isBlank()) {
            tour.setPromotionSource("provider");
        }
        Tour saved = tourRepository.save(tour);
        notifyTourProvider(saved, "tour_promotion_approved", "Ưu đãi đã được duyệt",
                "Ưu đãi của tour " + saved.getNameVi() + " đã được duyệt.");
        return DtoMapper.toTourDTO(saved);
    }

    public List<TourReportDTO> getPendingReports() {
        return reportRepository.findByStatus(TourReport.ReportStatus.pending)
                .stream()
                .map(DtoMapper::toReportDTO)
                .collect(Collectors.toList());
    }

    public TourReportDTO resolveReport(String reportId, String adminId, String adminNote) {
        TourReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        User admin = userRepository.findById(adminId).orElse(null);
        report.setStatus(TourReport.ReportStatus.resolved);
        report.setAdminNote(adminNote);
        report.setReviewedBy(admin);
        report.setReviewedAt(LocalDateTime.now());
        TourReport saved = reportRepository.save(report);
        notifyReportParticipants(saved, "report_resolved", "Báo cáo đã được xử lý",
                "Báo cáo về tour " + saved.getTour().getNameVi() + " đã được xử lý.");
        return DtoMapper.toReportDTO(saved);
    }

    public TourReportDTO reviewReport(String reportId, String adminId, String adminNote) {
        TourReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        User admin = userRepository.findById(adminId).orElse(null);
        report.setStatus(TourReport.ReportStatus.reviewed);
        report.setAdminNote(adminNote);
        report.setReviewedBy(admin);
        report.setReviewedAt(LocalDateTime.now());
        TourReport saved = reportRepository.save(report);
        notifyReportParticipants(saved, "report_reviewed", "Báo cáo đang được xem xét",
                "Báo cáo về tour " + saved.getTour().getNameVi() + " đã được admin xem xét.");
        return DtoMapper.toReportDTO(saved);
    }

    public TourReportDTO dismissReport(String reportId, String adminId, String adminNote) {
        TourReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        User admin = userRepository.findById(adminId).orElse(null);
        report.setStatus(TourReport.ReportStatus.dismissed);
        report.setAdminNote(adminNote);
        report.setReviewedBy(admin);
        report.setReviewedAt(LocalDateTime.now());
        TourReport saved = reportRepository.save(report);
        notifyReportParticipants(saved, "report_dismissed", "Báo cáo đã được bỏ qua",
                "Báo cáo về tour " + saved.getTour().getNameVi() + " đã được admin bỏ qua.");
        return DtoMapper.toReportDTO(saved);
    }

    private void notifyTourProvider(Tour tour, String type, String title, String message) {
        User providerUser = tour.getProvider() != null ? tour.getProvider().getUser() : null;
        notificationService.notifyUser(
                providerUser,
                type,
                title,
                message,
                "/provider/tours",
                "{\"tourId\":\"" + tour.getId() + "\"}"
        );
    }

    private void notifyReportParticipants(TourReport report, String type, String title, String message) {
        notificationService.notifyUser(
                report.getReportedBy(),
                type,
                title,
                message,
                "/my-bookings",
                "{\"reportId\":\"" + report.getId() + "\",\"tourId\":\"" + report.getTour().getId() + "\"}"
        );
        if (report.getTour() != null && report.getTour().getProvider() != null) {
            notificationService.notifyUser(
                    report.getTour().getProvider().getUser(),
                    type,
                    title,
                    message,
                    "/provider/reports",
                    "{\"reportId\":\"" + report.getId() + "\",\"tourId\":\"" + report.getTour().getId() + "\"}"
            );
        }
    }

    private ProviderProfileDTO toProviderProfileDTO(Provider provider) {
        ProviderProfileDTO dto = new ProviderProfileDTO();
        dto.setId(provider.getId());
        dto.setUserId(provider.getUser() != null ? provider.getUser().getId() : null);
        dto.setCompanyName(provider.getCompanyName());
        if (provider.getUser() != null) {
            dto.setEmail(provider.getUser().getEmail());
            dto.setPhone(provider.getPhone() != null ? provider.getPhone() : provider.getUser().getPhone());
        } else {
            dto.setPhone(provider.getPhone());
        }
        dto.setAddress(provider.getAddress());
        dto.setDescription(provider.getDescription());
        dto.setTaxCode(provider.getTaxCode());
        dto.setLicenseNumber(provider.getLicenseNumber());
        dto.setStatus(provider.getStatus() != null ? provider.getStatus().name() : null);
        dto.setVerified(provider.getIsVerified());
        dto.setJoinedDate(provider.getJoinedDate() != null ? provider.getJoinedDate().toString() : null);
        return dto;
    }
}
