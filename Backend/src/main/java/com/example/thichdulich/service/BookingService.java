package com.example.thichdulich.service;

import com.example.thichdulich.dto.BookingDTO;
import com.example.thichdulich.entity.*;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.BookingRepository;
import com.example.thichdulich.repository.DepartureScheduleRepository;
import com.example.thichdulich.repository.ProviderRepository;
import com.example.thichdulich.repository.TourReportRepository;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.TourReviewRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingService {
    private static final int COMMISSION_RATE_PERCENT = 10;
    private static final int COD_DEPOSIT_RATE_PERCENT = 30;
    private static final int PENDING_PAYMENT_TIMEOUT_MINUTES = 20;
    private static final DateTimeFormatter USER_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final List<Booking.BookingStatus> SLOT_HOLDING_STATUSES = List.of(
            Booking.BookingStatus.pending,
            Booking.BookingStatus.deposited,
            Booking.BookingStatus.paid,
            Booking.BookingStatus.confirmed
    );

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartureScheduleRepository scheduleRepository;

    @Autowired
    private ProviderRepository providerRepository;

    @Autowired
    private TourReviewRepository reviewRepository;

    @Autowired
    private TourReportRepository reportRepository;

    @Autowired
    private NotificationService notificationService;

    public BookingDTO createBooking(String userId, BookingDTO bookingDTO) {
        expirePendingPaymentBookings();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Tour tour = tourRepository.findById(bookingDTO.getTourId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tour"));

        LocalDate startDate = bookingDTO.getStartDate();
        if (startDate == null && bookingDTO.getDepartureScheduleId() != null) {
            DepartureSchedule schedule = scheduleRepository.findById(bookingDTO.getDepartureScheduleId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khởi hành"));
            startDate = schedule.getDepartureDate();
        }
        if (startDate == null) {
            throw new RuntimeException("Vui lòng chọn ngày khởi hành");
        }
        ensureMeetsAdvanceBookingDays(tour, startDate);

        int adults = bookingDTO.getAdults() != null ? bookingDTO.getAdults() : 1;
        int children = bookingDTO.getChildren() != null ? bookingDTO.getChildren() : 0;
        ensureSlotAvailable(tour, startDate, adults + children, null);


        long total = calculatePayableAmount(tour, adults, children);
        Booking.PaymentMethod method = Booking.PaymentMethod.cod;
        if (bookingDTO.getPaymentMethod() != null) {
            try {
                method = Booking.PaymentMethod.valueOf(normalizePaymentMethod(bookingDTO.getPaymentMethod()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        long depositAmount = calculateDepositAmount(total, method);
        long commissionAmount = calculateCommissionAmount(total);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTour(tour);
        booking.setDepartureSchedule(null);
        booking.setStartDate(startDate);
        booking.setAdults(adults);
        booking.setChildren(children);
        booking.setTotalAmount(total);
        booking.setDepositAmount(depositAmount);
        booking.setRemainingAmount(Math.max(total - depositAmount, 0L));
        booking.setCommissionRate(COMMISSION_RATE_PERCENT);
        booking.setCommissionAmount(commissionAmount);
        booking.setProviderPayoutAmount(calculateProviderPayoutAmount(total, depositAmount, commissionAmount, method));
        booking.setPaymentAmount(depositAmount);
        booking.setPaymentMethod(method);
        booking.setPaymentStatus(Booking.PaymentStatus.pending);
        booking.setStatus(Booking.BookingStatus.pending);
        booking.setContactName(bookingDTO.getContactName() != null ? bookingDTO.getContactName() : user.getName());
        booking.setContactEmail(bookingDTO.getContactEmail() != null ? bookingDTO.getContactEmail() : user.getEmail());
        booking.setContactPhone(bookingDTO.getContactPhone() != null ? bookingDTO.getContactPhone() : user.getPhone());
        booking.setSpecialRequests(bookingDTO.getSpecialRequests());

        Booking saved = bookingRepository.save(booking);
        notifyProviderNewBooking(saved);


        return toBookingDTO(bookingRepository.findById(saved.getId()).orElseThrow());
    }

    public BookingDTO confirmPayment(String bookingId, String transactionId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        if (booking.getPaymentMethod() == null) {
            throw new RuntimeException("Không tìm thấy thông tin thanh toán");
        }
        booking.setPaymentStatus(booking.getPaymentMethod() == Booking.PaymentMethod.cod
                ? Booking.PaymentStatus.deposited
                : Booking.PaymentStatus.paid);
        booking.setPaymentTransactionCode(transactionId);
        booking.setPaidAt(LocalDateTime.now());

        applyBookingStatus(booking, booking.getPaymentMethod() == Booking.PaymentMethod.cod
                ? Booking.BookingStatus.deposited
                : Booking.BookingStatus.paid);
        bookingRepository.save(booking);
        notifyBookingUser(booking, "booking_payment", "Thanh toán đã được ghi nhận",
                "Thanh toán cho tour " + booking.getTour().getNameVi() + " đã được ghi nhận.", "/bookings");
        return toBookingDTO(booking);
    }

    public BookingDTO confirmPayment(String bookingId, String transactionId, String actorUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        assertCanConfirmPayment(booking, actorUserId, isAdmin);
        return confirmPayment(bookingId, transactionId);
    }

    public BookingDTO getBookingById(String id) {
        expirePendingPaymentBookings();
        completeFinishedConfirmedBookings();
        return toBookingDTO(bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour")));
    }

    public BookingDTO getBookingById(String id, String actorUserId, boolean isAdmin) {
        expirePendingPaymentBookings();
        completeFinishedConfirmedBookings();
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        assertCanManageBooking(booking, actorUserId, isAdmin);
        return toBookingDTO(booking);
    }

    public List<BookingDTO> getUserBookings(String userId) {
        expirePendingPaymentBookings();
        completeFinishedConfirmedBookings();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return bookingRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toBookingDTO)
                .collect(Collectors.toList());
    }

    private String normalizePaymentMethod(String raw) {
        String normalized = raw == null ? "" : raw.trim().toLowerCase();
        return switch (normalized) {
            case "bank", "qr", "bankqr", "bank_qr", "transfer" -> "bank_qr";
            case "cash", "cod" -> "cod";
            case "momo" -> "cod";
            default -> normalized;
        };
    }

    private long calculatePayableAmount(Tour tour, int adults, int children) {
        long adultPrice = tour.getPrice() != null ? tour.getPrice() : 0L;
        long childPrice = tour.getChildPrice() != null ? tour.getChildPrice() : Math.round(adultPrice * 0.7);
        long subtotal = (adultPrice * adults) + (childPrice * children);
        long serviceFee = Math.round(subtotal * 0.05);
        long tax = Math.round(subtotal * 0.10);
        return subtotal + serviceFee + tax;
    }

    private long calculateDepositAmount(long totalAmount, Booking.PaymentMethod method) {
        if (method == Booking.PaymentMethod.cod) {
            return Math.round(totalAmount * COD_DEPOSIT_RATE_PERCENT / 100.0);
        }
        return totalAmount;
    }

    private long calculateCommissionAmount(long totalAmount) {
        return Math.round(totalAmount * COMMISSION_RATE_PERCENT / 100.0);
    }

    private long calculateProviderPayoutAmount(long totalAmount, long depositAmount, long commissionAmount, Booking.PaymentMethod method) {
        if (method == Booking.PaymentMethod.cod) {
            return Math.max(depositAmount - commissionAmount, 0L);
        }
        return Math.max(totalAmount - commissionAmount, 0L);
    }

    private void ensureMeetsAdvanceBookingDays(Tour tour, LocalDate startDate) {
        int advanceDays = tour.getAdvanceBookingDays() != null && tour.getAdvanceBookingDays() > 0
                ? tour.getAdvanceBookingDays()
                : Tour.suggestedAdvanceBookingDays(tour.getDuration());
        LocalDate earliestStartDate = LocalDate.now().plusDays(advanceDays);
        if (startDate.isBefore(earliestStartDate)) {
            throw new RuntimeException("Tour này cần đặt trước tối thiểu " + advanceDays
                    + " ngày. Ngày khởi hành sớm nhất là " + earliestStartDate + ".");
        }
    }


    public List<BookingDTO> getAllBookings() {
        expirePendingPaymentBookings();
        completeFinishedConfirmedBookings();
        return bookingRepository.findAll()
                .stream()
                .map(this::toBookingDTO)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> getProviderBookings(String userId) {
        expirePendingPaymentBookings();
        completeFinishedConfirmedBookings();
        Provider provider = providerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ nhà cung cấp"));
        return bookingRepository.findByTourProviderOrderByCreatedAtDesc(provider)
                .stream()
                .map(this::toBookingDTO)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> getBookingsByTour(String tourId) {
        expirePendingPaymentBookings();
        completeFinishedConfirmedBookings();
        return bookingRepository.findByTourId(tourId)
                .stream()
                .map(this::toBookingDTO)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> getBookingsByTour(String tourId, String actorUserId, boolean isAdmin) {
        expirePendingPaymentBookings();
        completeFinishedConfirmedBookings();
        assertCanViewTourBookings(tourId, actorUserId, isAdmin);
        return bookingRepository.findByTourId(tourId)
                .stream()
                .map(this::toBookingDTO)
                .collect(Collectors.toList());
    }

    public BookingDTO updateBookingStatus(String bookingId, String status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        Booking.BookingStatus nextStatus = Booking.BookingStatus.valueOf(status.toLowerCase());
        applyBookingStatus(booking, nextStatus);
        Booking saved = bookingRepository.save(booking);
        notifyBookingUser(saved, "booking_status", "Trạng thái booking đã cập nhật",
                "Booking tour " + saved.getTour().getNameVi() + " đã chuyển sang trạng thái " + nextStatus.name() + ".", "/bookings");
        return toBookingDTO(saved);
    }

    public BookingDTO updateBookingStatus(String bookingId, String status, String actorUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        assertCanManageBooking(booking, actorUserId, isAdmin);
        Booking.BookingStatus nextStatus = Booking.BookingStatus.valueOf(status.toLowerCase());
        applyBookingStatus(booking, nextStatus);
        Booking saved = bookingRepository.save(booking);
        notifyBookingUser(saved, "booking_status", "Trạng thái booking đã cập nhật",
                "Booking tour " + saved.getTour().getNameVi() + " đã chuyển sang trạng thái " + nextStatus.name() + ".", "/bookings");
        return toBookingDTO(saved);
    }

    public void cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        applyBookingStatus(booking, Booking.BookingStatus.cancelled);
        bookingRepository.save(booking);
    }

    public void cancelBooking(String bookingId, String actorUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        assertCanManageBooking(booking, actorUserId, isAdmin);
        requestCancellation(booking, actorUserId, isAdmin ? "admin" : cancellationActor(booking, actorUserId),
                null, null, null, null, isAdmin);
    }

    public BookingDTO requestCancellation(String bookingId, String actorUserId, boolean isAdmin, BookingDTO request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        assertCanManageBooking(booking, actorUserId, isAdmin);
        String actor = isAdmin ? "admin" : cancellationActor(booking, actorUserId);
        requestCancellation(
                booking,
                actorUserId,
                actor,
                request == null ? null : request.getCancelReason(),
                request == null ? null : request.getRefundBankName(),
                request == null ? null : request.getRefundAccountNumber(),
                request == null ? null : request.getRefundAccountName(),
                isAdmin
        );
        return toBookingDTO(bookingRepository.findById(bookingId).orElseThrow());
    }

    public BookingDTO markRefunded(String bookingId, String adminUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        if (booking.getRefundStatus() != Booking.RefundStatus.refund_pending) {
            throw new RuntimeException("Đơn này không ở trạng thái chờ hoàn tiền");
        }
        booking.setRefundStatus(Booking.RefundStatus.refunded);
        booking.setRefundProcessedAt(LocalDateTime.now());
        booking.setRefundProcessedBy(adminUserId);
        booking.setStatus(Booking.BookingStatus.refunded);
        booking.setPaymentStatus(Booking.PaymentStatus.refunded);
        Booking saved = bookingRepository.save(booking);
        notifyBookingUser(saved, "booking_refunded", "Đã hoàn tiền",
                "Yêu cầu hoàn tiền cho tour " + saved.getTour().getNameVi() + " đã được xử lý.", "/bookings");
        return toBookingDTO(saved);
    }

    public BookingDTO rejectRefund(String bookingId, String adminUserId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        if (booking.getRefundStatus() != Booking.RefundStatus.refund_pending) {
            throw new RuntimeException("Đơn này không ở trạng thái chờ hoàn tiền");
        }
        booking.setRefundStatus(Booking.RefundStatus.refund_rejected);
        booking.setRefundRejectReason(reason);
        booking.setRefundProcessedAt(LocalDateTime.now());
        booking.setRefundProcessedBy(adminUserId);
        Booking saved = bookingRepository.save(booking);
        notifyBookingUser(saved, "booking_refund_rejected", "Yêu cầu hoàn tiền bị từ chối",
                "Yêu cầu hoàn tiền cho tour " + saved.getTour().getNameVi() + " đã bị từ chối.", "/bookings");
        return toBookingDTO(saved);
    }

    public BookingDTO markPaidOut(String bookingId, String adminUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt tour"));
        if (booking.getPayoutStatus() != Booking.PayoutStatus.payout_pending) {
            throw new RuntimeException("Đơn này không ở trạng thái chờ chuyển tiền nhà cung cấp");
        }
        booking.setPayoutStatus(Booking.PayoutStatus.paid_out);
        booking.setPayoutProcessedAt(LocalDateTime.now());
        booking.setPayoutProcessedBy(adminUserId);
        return toBookingDTO(bookingRepository.save(booking));
    }

    public List<BookingDTO> getBookingsByStatus(String status) {
        expirePendingPaymentBookings();
        completeFinishedConfirmedBookings();
        return bookingRepository.findByStatus(Booking.BookingStatus.valueOf(status.toLowerCase()))
                .stream()
                .map(this::toBookingDTO)
                .collect(Collectors.toList());
    }

    @Scheduled(cron = "0 0 * * * *")
    public void completeFinishedConfirmedBookingsOnSchedule() {
        completeFinishedConfirmedBookings();
    }

    @Scheduled(fixedDelay = 60_000)
    public void expirePendingPaymentBookingsOnSchedule() {
        expirePendingPaymentBookings();
    }

    public int expirePendingPaymentBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(PENDING_PAYMENT_TIMEOUT_MINUTES);
        List<Booking> expired = bookingRepository.findByStatusAndCreatedAtBefore(Booking.BookingStatus.pending, cutoff);
        for (Booking booking : expired) {
            booking.setStatus(Booking.BookingStatus.cancelled);
            bookingRepository.save(booking);
        }
        return expired.size();
    }

    public int completeFinishedConfirmedBookings() {
        LocalDate today = LocalDate.now();
        List<Booking> candidates = bookingRepository.findByStatusAndStartDateIsNotNull(Booking.BookingStatus.confirmed);
        int completedCount = 0;

        for (Booking booking : candidates) {
            if (isFinished(booking, today)) {
                booking.setStatus(Booking.BookingStatus.completed);
                booking.setPayoutAmount(booking.getProviderPayoutAmount() != null ? booking.getProviderPayoutAmount() : 0L);
                booking.setPayoutStatus((booking.getPayoutAmount() != null && booking.getPayoutAmount() > 0)
                        ? Booking.PayoutStatus.payout_pending
                        : Booking.PayoutStatus.none);
                bookingRepository.save(booking);
                completedCount++;
            }
        }

        return completedCount;
    }

    private boolean isFinished(Booking booking, LocalDate today) {
        if (booking.getStartDate() == null || booking.getTour() == null) {
            return false;
        }

        int durationDays = booking.getTour().getDuration() != null && booking.getTour().getDuration() > 0
                ? booking.getTour().getDuration()
                : 1;
        LocalDate endDateExclusive = booking.getStartDate().plusDays(durationDays);
        return !today.isBefore(endDateExclusive);
    }

    private void applyBookingStatus(Booking booking, Booking.BookingStatus nextStatus) {
        Booking.BookingStatus currentStatus = booking.getStatus();
        if (currentStatus == nextStatus) {
            return;
        }

        if (currentStatus == Booking.BookingStatus.completed && nextStatus == Booking.BookingStatus.cancelled) {
            throw new RuntimeException("Không thể hủy đơn đã hoàn thành");
        }

        if (nextStatus == Booking.BookingStatus.confirmed) {
            ensureCanConfirmBooking(booking);
        }
        if (nextStatus == Booking.BookingStatus.completed) {
            booking.setPayoutAmount(booking.getProviderPayoutAmount() != null ? booking.getProviderPayoutAmount() : 0L);
            booking.setPayoutStatus((booking.getPayoutAmount() != null && booking.getPayoutAmount() > 0)
                    ? Booking.PayoutStatus.payout_pending
                    : Booking.PayoutStatus.none);
        }

        DepartureSchedule schedule = booking.getDepartureSchedule();
        int seats = (booking.getAdults() != null ? booking.getAdults() : 0)
                + (booking.getChildren() != null ? booking.getChildren() : 0);

        if (schedule != null && seats > 0) {
            if (currentStatus != Booking.BookingStatus.cancelled && nextStatus == Booking.BookingStatus.cancelled) {
                schedule.setBookedSlots(Math.max(0, schedule.getBookedSlots() - seats));
                if (schedule.getStatus() == DepartureSchedule.ScheduleStatus.full
                        && schedule.getBookedSlots() < schedule.getTotalSlots()) {
                    schedule.setStatus(DepartureSchedule.ScheduleStatus.open);
                }
                scheduleRepository.save(schedule);
            } else if (currentStatus == Booking.BookingStatus.cancelled && nextStatus != Booking.BookingStatus.cancelled) {
                if (schedule.getAvailableSlots() < seats) {
                    throw new RuntimeException("Lịch khởi hành không còn đủ chỗ trống");
                }
                schedule.setBookedSlots(schedule.getBookedSlots() + seats);
                if (schedule.getBookedSlots() >= schedule.getTotalSlots()) {
                    schedule.setStatus(DepartureSchedule.ScheduleStatus.full);
                }
                scheduleRepository.save(schedule);
            }
        }

        booking.setStatus(nextStatus);
    }

    private void ensureCanConfirmBooking(Booking booking) {
        if (booking.getStatus() != Booking.BookingStatus.deposited
                && booking.getStatus() != Booking.BookingStatus.paid
                && booking.getStatus() != Booking.BookingStatus.confirmed) {
            throw new RuntimeException("Đơn phải được thanh toán hoặc đặt cọc trước khi nhà cung cấp xác nhận");
        }
        if (booking.getTour() == null || booking.getStartDate() == null) {
            throw new RuntimeException("Thiếu thông tin tour hoặc ngày khởi hành");
        }
        int requestedPeople = (booking.getAdults() != null ? booking.getAdults() : 0)
                + (booking.getChildren() != null ? booking.getChildren() : 0);
        ensureSlotAvailable(booking.getTour(), booking.getStartDate(), requestedPeople, booking.getId());
    }

    private void requestCancellation(
            Booking booking,
            String actorUserId,
            String actor,
            String reason,
            String bankName,
            String accountNumber,
            String accountName,
            boolean isAdmin) {
        if (booking.getStatus() == Booking.BookingStatus.completed) {
            throw new RuntimeException("Không thể hủy đơn đã hoàn thành");
        }
        if (booking.getStatus() == Booking.BookingStatus.cancelled) {
            if ("user".equals(actor) && booking.getRefundStatus() == Booking.RefundStatus.refund_pending) {
                if (isBlank(bankName) || isBlank(accountNumber) || isBlank(accountName)) {
                    throw new RuntimeException("Vui lòng nhập đầy đủ thông tin ngân hàng để hoàn tiền");
                }
                booking.setRefundBankName(bankName);
                booking.setRefundAccountNumber(accountNumber);
                booking.setRefundAccountName(accountName);
                if (!isBlank(reason)) {
                    booking.setCancelReason(reason);
                }
                booking.setRefundRequestedAt(booking.getRefundRequestedAt() != null
                        ? booking.getRefundRequestedAt()
                        : LocalDateTime.now());
                bookingRepository.save(booking);
            }
            return;
        }
        if (booking.getStatus() == Booking.BookingStatus.refunded) {
            return;
        }

        long paidOnlineAmount = paidOnlineAmount(booking);
        boolean eligibleForRefund = isAdmin || "provider".equals(actor) || isFreeCancellationWindow(booking);
        long refundAmount = paidOnlineAmount > 0 && eligibleForRefund ? paidOnlineAmount : 0L;

        if ("user".equals(actor) && refundAmount > 0
                && (isBlank(bankName) || isBlank(accountNumber) || isBlank(accountName))) {
            throw new RuntimeException("Vui lòng nhập đầy đủ thông tin ngân hàng để hoàn tiền");
        }

        booking.setCancelledBy(actor);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancelReason(reason);
        booking.setRefundAmount(refundAmount);
        booking.setRefundBankName(bankName);
        booking.setRefundAccountNumber(accountNumber);
        booking.setRefundAccountName(accountName);
        booking.setRefundRequestedAt(refundAmount > 0 ? LocalDateTime.now() : null);
        booking.setRefundStatus(refundAmount > 0 ? Booking.RefundStatus.refund_pending : Booking.RefundStatus.no_refund);
        if (refundAmount > 0 || paidOnlineAmount <= 0) {
            booking.setPayoutStatus(Booking.PayoutStatus.none);
            booking.setPayoutAmount(0L);
        } else {
            long payoutAmount = booking.getProviderPayoutAmount() != null ? booking.getProviderPayoutAmount() : 0L;
            booking.setPayoutAmount(payoutAmount);
            booking.setPayoutStatus(payoutAmount > 0 ? Booking.PayoutStatus.payout_pending : Booking.PayoutStatus.none);
        }
        applyBookingStatus(booking, Booking.BookingStatus.cancelled);
        bookingRepository.save(booking);
        notifyBookingUser(booking, "booking_cancelled", "Booking đã bị hủy",
                "Booking tour " + booking.getTour().getNameVi() + " đã được ghi nhận hủy.", "/bookings");
    }

    private void notifyProviderNewBooking(Booking booking) {
        User providerUser = booking.getTour() != null
                && booking.getTour().getProvider() != null
                ? booking.getTour().getProvider().getUser()
                : null;
        notificationService.notifyUser(
                providerUser,
                "provider_new_booking",
                "Có booking mới",
                booking.getContactName() + " vừa đặt tour " + booking.getTour().getNameVi() + ".",
                "/provider/bookings",
                "{\"bookingId\":\"" + booking.getId() + "\",\"tourId\":\"" + booking.getTour().getId() + "\"}"
        );
    }

    private void notifyBookingUser(Booking booking, String type, String title, String message, String link) {
        notificationService.notifyUser(
                booking.getUser(),
                type,
                title,
                message,
                link,
                "{\"bookingId\":\"" + booking.getId() + "\",\"tourId\":\"" + booking.getTour().getId() + "\"}"
        );
    }

    private String cancellationActor(Booking booking, String actorUserId) {
        if (booking.getUser() != null && actorUserId.equals(booking.getUser().getId())) {
            return "user";
        }
        return "provider";
    }

    private boolean isFreeCancellationWindow(Booking booking) {
        if (booking.getStartDate() == null) {
            return false;
        }
        return !LocalDateTime.now().isAfter(booking.getStartDate().atStartOfDay().minusHours(24));
    }

    private long paidOnlineAmount(Booking booking) {
        if (booking.getPaymentStatus() == null) {
            return 0L;
        }
        if (booking.getPaymentStatus() == Booking.PaymentStatus.paid
                || booking.getPaymentStatus() == Booking.PaymentStatus.success
                || booking.getPaymentStatus() == Booking.PaymentStatus.deposited) {
            return booking.getPaymentAmount() != null ? booking.getPaymentAmount() : 0L;
        }
        return 0L;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isBlank();
    }

    private void ensureSlotAvailable(Tour tour, LocalDate startDate, int requestedPeople, String excludeBookingId) {
        int maxPeoplePerDay = tour.getMaxPeoplePerDay() != null && tour.getMaxPeoplePerDay() > 0
                ? tour.getMaxPeoplePerDay()
                : 20;
        long heldPeople = bookingRepository.sumPeopleByTourAndStartDateAndStatuses(
                tour.getId(),
                startDate,
                SLOT_HOLDING_STATUSES,
                excludeBookingId);

        int availableSlots = Math.max(0, maxPeoplePerDay - (int) heldPeople);
        if (requestedPeople > availableSlots) {
            throw new RuntimeException("Ngày " + startDate.format(USER_DATE_FORMAT)
                    + " chỉ còn " + availableSlots + " chỗ trống, trong khi bạn đang chọn "
                    + requestedPeople + " khách. Vui lòng giảm số khách hoặc chọn ngày khởi hành khác.");
        }
    }

    private BookingDTO toBookingDTO(Booking booking) {
        ensureBookingFinancialsAreConsistent(booking);
        ensureCompletedBookingHasPayout(booking);
        BookingDTO dto = DtoMapper.toBookingDTO(booking);
        dto.setHasReviewed(booking.getReviewedAt() != null || reviewRepository.existsByBookingId(booking.getId()));
        dto.setHasReported(reportRepository.existsByBookingId(booking.getId()));
        return dto;
    }

    private void ensureBookingFinancialsAreConsistent(Booking booking) {
        if (isVoidedFinancialBooking(booking)) {
            boolean changed = false;
            if (booking.getCommissionAmount() == null || booking.getCommissionAmount() != 0L) {
                booking.setCommissionAmount(0L);
                changed = true;
            }
            if (booking.getProviderPayoutAmount() == null || booking.getProviderPayoutAmount() != 0L) {
                booking.setProviderPayoutAmount(0L);
                changed = true;
            }
            if (booking.getPayoutAmount() == null || booking.getPayoutAmount() != 0L) {
                booking.setPayoutAmount(0L);
                changed = true;
            }
            if (booking.getPayoutStatus() != Booking.PayoutStatus.none) {
                booking.setPayoutStatus(Booking.PayoutStatus.none);
                changed = true;
            }
            if (changed) {
                bookingRepository.save(booking);
            }
            return;
        }
        if (booking.getPaymentMethod() == null || booking.getTotalAmount() == null) {
            return;
        }
        Booking.PaymentMethod method = booking.getPaymentMethod();
        long total = booking.getTotalAmount() != null ? booking.getTotalAmount() : 0L;
        long deposit = booking.getDepositAmount() != null && booking.getDepositAmount() > 0
                ? booking.getDepositAmount()
                : calculateDepositAmount(total, method);
        long commission = booking.getCommissionAmount() != null && booking.getCommissionAmount() > 0
                ? booking.getCommissionAmount()
                : calculateCommissionAmount(total);
        long payout = calculateProviderPayoutAmount(total, deposit, commission, method);

        boolean changed = false;
        if (booking.getDepositAmount() == null || !booking.getDepositAmount().equals(deposit)) {
            booking.setDepositAmount(deposit);
            changed = true;
        }
        long remaining = Math.max(total - deposit, 0L);
        if (booking.getRemainingAmount() == null || !booking.getRemainingAmount().equals(remaining)) {
            booking.setRemainingAmount(remaining);
            changed = true;
        }
        if (booking.getCommissionAmount() == null || !booking.getCommissionAmount().equals(commission)) {
            booking.setCommissionAmount(commission);
            changed = true;
        }
        if (booking.getProviderPayoutAmount() == null || !booking.getProviderPayoutAmount().equals(payout)) {
            booking.setProviderPayoutAmount(payout);
            changed = true;
        }
        if (booking.getPayoutStatus() == Booking.PayoutStatus.payout_pending
                && (booking.getPayoutAmount() == null || !booking.getPayoutAmount().equals(payout))) {
            booking.setPayoutAmount(payout);
            changed = true;
        }
        if (changed) {
            bookingRepository.save(booking);
        }
    }

    private boolean isVoidedFinancialBooking(Booking booking) {
        if (booking.getStatus() == Booking.BookingStatus.refunded) {
            return true;
        }
        if (booking.getStatus() != Booking.BookingStatus.cancelled) {
            return false;
        }
        if (booking.getRefundStatus() == Booking.RefundStatus.no_refund
                || booking.getRefundStatus() == Booking.RefundStatus.refund_rejected) {
            return paidOnlineAmount(booking) <= 0;
        }
        return true;
    }

    private void ensureCompletedBookingHasPayout(Booking booking) {
        boolean shouldHavePayout = booking.getStatus() == Booking.BookingStatus.completed
                || isRetainedCancelledBooking(booking);
        if (!shouldHavePayout) {
            return;
        }
        if (booking.getPayoutStatus() != null && booking.getPayoutStatus() != Booking.PayoutStatus.none) {
            return;
        }
        long payoutAmount = booking.getProviderPayoutAmount() != null ? booking.getProviderPayoutAmount() : 0L;
        if (payoutAmount <= 0) {
            return;
        }
        booking.setPayoutAmount(payoutAmount);
        booking.setPayoutStatus(Booking.PayoutStatus.payout_pending);
        bookingRepository.save(booking);
    }

    private boolean isRetainedCancelledBooking(Booking booking) {
        return booking.getStatus() == Booking.BookingStatus.cancelled
                && (booking.getRefundStatus() == Booking.RefundStatus.no_refund
                || booking.getRefundStatus() == Booking.RefundStatus.refund_rejected)
                && paidOnlineAmount(booking) > 0;
    }

    private void assertCanManageBooking(Booking booking, String actorUserId, boolean isAdmin) {
        if (isAdmin) {
            return;
        }
        if (booking.getUser() != null && actorUserId.equals(booking.getUser().getId())) {
            return;
        }
        if (booking.getTour() != null
                && booking.getTour().getProvider() != null
                && booking.getTour().getProvider().getUser() != null
                && actorUserId.equals(booking.getTour().getProvider().getUser().getId())) {
            return;
        }
        throw new RuntimeException("Bạn không có quyền thao tác với đơn đặt tour này");
    }
    private void assertCanConfirmPayment(Booking booking, String actorUserId, boolean isAdmin) {
        if (isAdmin) {
            return;
        }
        if (booking.getUser() != null && actorUserId.equals(booking.getUser().getId())) {
            return;
        }
        throw new RuntimeException("Bạn không có quyền xác nhận thanh toán cho đơn này");
    }

    private void assertCanViewTourBookings(String tourId, String actorUserId, boolean isAdmin) {
        if (isAdmin) {
            return;
        }
        Provider provider = providerRepository.findByUserId(actorUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ nhà cung cấp"));
        boolean ownsTour = provider.getTours() != null
                && provider.getTours().stream().anyMatch(tour -> tourId.equals(tour.getId()));
        if (!ownsTour) {
            throw new RuntimeException("Bạn không có quyền xem đơn đặt của tour này");
        }
    }
}



