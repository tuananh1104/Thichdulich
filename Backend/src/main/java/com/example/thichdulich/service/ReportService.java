package com.example.thichdulich.service;

import com.example.thichdulich.dto.TourReportDTO;
import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.TourMessage;
import com.example.thichdulich.entity.TourReport;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.BookingRepository;
import com.example.thichdulich.repository.ProviderRepository;
import com.example.thichdulich.repository.TourMessageRepository;
import com.example.thichdulich.repository.TourReportRepository;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReportService {
    @Autowired
    private TourReportRepository reportRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ProviderRepository providerRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private TourMessageRepository messageRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public TourReportDTO createReport(String userId, TourReportDTO reportDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Tour tour = tourRepository.findById(reportDTO.getTourId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tour"));

        boolean isAdmin = user.getRole() == User.UserRole.admin;
        Booking booking = null;
        if (!isAdmin) {
            if (reportDTO.getBookingId() == null || reportDTO.getBookingId().isBlank()) {
                throw new RuntimeException("Bạn cần chọn đơn đặt tour liên quan để gửi báo cáo");
            }
            booking = bookingRepository.findById(reportDTO.getBookingId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
            if (booking.getUser() == null || !booking.getUser().getId().equals(userId)) {
                throw new RuntimeException("Bạn chỉ có thể báo cáo từ đơn đặt tour của chính mình");
            }
            if (booking.getTour() == null || !booking.getTour().getId().equals(tour.getId())) {
                throw new RuntimeException("Đơn đặt tour không khớp với tour này");
            }
            if (booking.getStatus() == Booking.BookingStatus.cancelled) {
                throw new RuntimeException("Đơn đã hủy không thể gửi báo cáo");
            }
            if (reportRepository.existsByBookingId(booking.getId())) {
                throw new RuntimeException("Đơn đặt tour này đã được báo cáo");
            }
        }

        TourReport report = new TourReport();
        report.setReportedBy(user);
        report.setTour(tour);
        report.setBooking(booking);
        report.setReason(reportDTO.getReason());
        report.setDescription(reportDTO.getDescription());
        if (reportDTO.getImages() != null) {
            try {
                report.setImages(objectMapper.writeValueAsString(reportDTO.getImages()));
            } catch (Exception e) {
                throw new RuntimeException("Ảnh báo cáo không hợp lệ", e);
            }
        }
        report.setStatus(TourReport.ReportStatus.pending);

        TourReport saved = reportRepository.save(report);
        notificationService.notifyAdmins(
                "admin_new_report",
                "Báo cáo vi phạm mới",
                user.getName() + " vừa báo cáo tour " + tour.getNameVi() + ".",
                "/admin/reports",
                "{\"reportId\":\"" + saved.getId() + "\",\"tourId\":\"" + tour.getId() + "\"}"
        );
        sendReportAlertToProviderChat(saved);
        return DtoMapper.toReportDTO(saved);
    }

    public List<TourReportDTO> getTourReports(String tourId) {
        return reportRepository.findByTourId(tourId)
                .stream()
                .map(DtoMapper::toReportDTO)
                .collect(Collectors.toList());
    }

    public List<TourReportDTO> getTourReports(String tourId, String actorUserId, boolean isAdmin) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tour"));
        assertCanViewTourReports(tour, actorUserId, isAdmin);
        return getTourReports(tourId);
    }

    public List<TourReportDTO> getPendingReports() {
        return reportRepository.findByStatusOrderByCreatedAtDesc(TourReport.ReportStatus.pending)
                .stream()
                .map(DtoMapper::toReportDTO)
                .collect(Collectors.toList());
    }

    private void assertCanViewTourReports(Tour tour, String actorUserId, boolean isAdmin) {
        if (isAdmin) {
            return;
        }
        boolean ownsTour = providerRepository.findByUserId(actorUserId)
                .map(provider -> tour.getProvider() != null && provider.getId().equals(tour.getProvider().getId()))
                .orElse(false);
        if (!ownsTour) {
            throw new RuntimeException("You do not have permission to view reports for this tour");
        }
    }

    private void sendReportAlertToProviderChat(TourReport report) {
        Tour tour = report.getTour();
        if (tour == null || tour.getProvider() == null || tour.getProvider().getUser() == null) {
            return;
        }

        User adminSender = userRepository.findByRole(User.UserRole.admin)
                .stream()
                .findFirst()
                .orElse(null);
        if (adminSender == null) {
            return;
        }

        TourMessage message = new TourMessage();
        message.setTour(tour);
        message.setSender(adminSender);
        message.setSenderRole(TourMessage.SenderRole.admin);
        message.setSenderName("Admin");
        message.setMessage(buildReportChatMessage(report));

        TourMessage savedMessage = messageRepository.save(message);
        notificationService.notifyUser(
                tour.getProvider().getUser(),
                "tour_report_alert",
                "Tour co bao cao moi",
                tour.getNameVi() + ": " + safeText(report.getReason()),
                "/provider/feedback",
                "{\"tourId\":\"" + tour.getId() + "\",\"reportId\":\"" + report.getId() + "\",\"messageId\":\"" + savedMessage.getId() + "\"}"
        );
    }

    private String buildReportChatMessage(TourReport report) {
        StringBuilder message = new StringBuilder();
        message.append("[CANH BAO BAO CAO TOUR]\n");
        message.append("Tour: ").append(safeText(report.getTour() != null ? report.getTour().getNameVi() : null)).append('\n');
        if (report.getBooking() != null) {
            message.append("Ma dat tour: ").append(report.getBooking().getId()).append('\n');
        }
        message.append("Nguoi bao cao: ").append(safeText(report.getReportedBy() != null ? report.getReportedBy().getName() : null)).append('\n');
        message.append("Ly do: ").append(safeText(report.getReason())).append('\n');
        message.append("Mo ta: ").append(safeText(report.getDescription())).append('\n');

        String[] images = readReportImages(report.getImages());
        if (images.length > 0) {
            message.append("Anh dinh kem:\n");
            for (int i = 0; i < images.length; i++) {
                message.append(i + 1).append(". ").append(images[i]).append('\n');
            }
        } else {
            message.append("Anh dinh kem: Khong co\n");
        }
        message.append("Vui long kiem tra va phan hoi trong doan chat nay.");
        return message.toString();
    }

    private String[] readReportImages(String imagesJson) {
        if (imagesJson == null || imagesJson.isBlank()) {
            return new String[0];
        }
        try {
            return objectMapper.readValue(imagesJson, String[].class);
        } catch (Exception ignored) {
            return new String[] { imagesJson };
        }
    }

    private String safeText(String value) {
        return value == null || value.isBlank() ? "Khong co" : value.trim();
    }
}
