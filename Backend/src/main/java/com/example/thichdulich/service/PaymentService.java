package com.example.thichdulich.service;

import com.example.thichdulich.config.PaymentProperties;
import com.example.thichdulich.dto.PaymentDTO;
import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.repository.BookingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.TreeMap;

@Service
@Transactional
public class PaymentService {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final int COMMISSION_RATE_PERCENT = 10;
    private static final int COD_DEPOSIT_RATE_PERCENT = 30;

    private final BookingRepository bookingRepository;
    private final PaymentProperties properties;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public PaymentService(BookingRepository bookingRepository, PaymentProperties properties) {
        this.bookingRepository = bookingRepository;
        this.properties = properties;
    }

    public PaymentDTO createPayment(String bookingId, String methodRaw) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getStatus() == Booking.BookingStatus.cancelled) {
            throw new RuntimeException("Booking payment window expired");
        }

        normalizeBookingAmount(booking);
        Booking.PaymentMethod method = parseMethod(methodRaw);
        normalizeBookingFinancials(booking, method);
        long expectedAmount = paymentAmountFor(booking, method);

        if (isCollectedPayment(booking)) {
            return toDTO(booking);
        }
        if (canReusePendingPayment(booking, method, expectedAmount)) {
            syncBankQrPayment(booking);
            return toDTO(booking);
        }

        booking.setPaymentMethod(method);
        booking.setPaymentAmount(expectedAmount);
        booking.setPaymentStatus(Booking.PaymentStatus.pending);
        booking.setPaymentTransactionCode(null);
        booking.setPaymentUrl(null);
        booking.setPaymentQrCode(null);
        booking.setPaidAt(null);

        switch (method) {
            case cod, bank_qr -> createPayosPayment(booking);
            default -> throw new RuntimeException("Unsupported payment method: " + methodRaw);
        }

        return toDTO(bookingRepository.save(booking));
    }

    public PaymentDTO createPayment(String bookingId, String methodRaw, String actorUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        assertCanAccessPaymentBooking(booking, actorUserId, isAdmin);
        return createPayment(bookingId, methodRaw);
    }

    public PaymentDTO getPaymentByBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getPaymentMethod() == null) {
            throw new RuntimeException("Payment not found");
        }
        syncBankQrPayment(booking);
        return toDTO(booking);
    }

    public PaymentDTO getPaymentByBooking(String bookingId, String actorUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        assertCanAccessPaymentBooking(booking, actorUserId, isAdmin);
        return getPaymentByBooking(bookingId);
    }

    @SuppressWarnings("unchecked")
    public PaymentDTO handleBankWebhook(Map<String, Object> payload) {
        if (!verifyPayosSignature(payload)) {
            throw new RuntimeException("Invalid payOS signature");
        }

        Object dataRaw = payload.get("data");
        if (!(dataRaw instanceof Map<?, ?> data)) {
            throw new RuntimeException("Invalid payOS data");
        }

        String orderCode = stringValue(data.get("orderCode"));
        long amount = longValue(data.get("amount"));
        String description = stringValue(data.get("description"));
        String reference = stringValue(data.get("reference"));
        boolean success = Boolean.TRUE.equals(payload.get("success")) || "00".equals(stringValue(data.get("code")));

        Booking booking = bookingRepository.findByPaymentTransactionCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        validateWebhookPayment(booking, amount);

        String expectedContent = transferContent(booking.getId());
        if (description == null || !description.contains(expectedContent)) {
            throw new RuntimeException("Invalid transfer content");
        }

        if (success) {
            markPaid(booking, reference == null || reference.isBlank() ? orderCode : reference);
        }
        return toDTO(booking);
    }

    private boolean canReusePendingPayment(Booking booking, Booking.PaymentMethod method, long expectedAmount) {
        return booking.getPaymentStatus() == Booking.PaymentStatus.pending
                && booking.getPaymentMethod() == method
                && booking.getPaymentAmount() != null
                && booking.getPaymentAmount().longValue() == expectedAmount
                && booking.getPaymentTransactionCode() != null
                && !booking.getPaymentTransactionCode().isBlank()
                && ((booking.getPaymentUrl() != null && !booking.getPaymentUrl().isBlank())
                || (booking.getPaymentQrCode() != null && !booking.getPaymentQrCode().isBlank()));
    }

    private void createPayosPayment(Booking booking) {
        requireConfigured(properties.getPayosClientId(), "payos.clientId");
        requireConfigured(properties.getPayosApiKey(), "payos.apiKey");
        requireConfigured(properties.getPayosChecksumKey(), "payos.checksumKey");
        requireConfigured(properties.getPayosReturnUrl(), "payos.returnUrl");
        requireConfigured(properties.getPayosCancelUrl(), "payos.cancelUrl");

        long orderCode = positiveOrderCode(booking.getId());
        String description = transferContent(booking.getId());
        String rawSignature = "amount=" + booking.getPaymentAmount()
                + "&cancelUrl=" + properties.getPayosCancelUrl()
                + "&description=" + description
                + "&orderCode=" + orderCode
                + "&returnUrl=" + properties.getPayosReturnUrl();

        try {
            Map<String, Object> request = Map.of(
                    "orderCode", orderCode,
                    "amount", booking.getPaymentAmount(),
                    "description", description,
                    "returnUrl", properties.getPayosReturnUrl(),
                    "cancelUrl", properties.getPayosCancelUrl(),
                    "signature", hmacSha256(rawSignature, properties.getPayosChecksumKey())
            );

            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(properties.getPayosEndpoint()))
                    .header("Content-Type", "application/json")
                    .header("x-client-id", properties.getPayosClientId())
                    .header("x-api-key", properties.getPayosApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(request)))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            JsonNode root = JSON.readTree(response.body());
            if (response.statusCode() >= 400 || !"00".equals(root.path("code").asText())) {
                throw new RuntimeException("Tao thanh toan QR that bai: " + root.path("desc").asText(response.body()));
            }
            JsonNode data = root.path("data");
            booking.setPaymentTransactionCode(String.valueOf(orderCode));
            booking.setPaymentUrl(data.path("checkoutUrl").asText(null));
            booking.setPaymentQrCode(data.path("qrCode").asText(null));
            booking.setStatus(Booking.BookingStatus.pending);
            bookingRepository.save(booking);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    private void syncBankQrPayment(Booking booking) {
        if ((booking.getPaymentMethod() != Booking.PaymentMethod.bank_qr && booking.getPaymentMethod() != Booking.PaymentMethod.cod)
                || isCollectedPayment(booking)
                || booking.getPaymentTransactionCode() == null
                || booking.getPaymentTransactionCode().isBlank()) {
            return;
        }

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(properties.getPayosEndpoint() + "/" + booking.getPaymentTransactionCode()))
                    .header("Content-Type", "application/json")
                    .header("x-client-id", properties.getPayosClientId())
                    .header("x-api-key", properties.getPayosApiKey())
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            JsonNode root = JSON.readTree(response.body());
            if (response.statusCode() >= 400 || !"00".equals(root.path("code").asText())) {
                return;
            }

            JsonNode data = root.path("data");
            String status = data.path("status").asText("");
            long amountPaid = data.path("amountPaid").asLong(0);
            long amount = data.path("amount").asLong(booking.getPaymentAmount());
            if ("PAID".equalsIgnoreCase(status) || amountPaid >= amount) {
                markPaid(booking, booking.getPaymentTransactionCode());
            }
        } catch (Exception ignored) {
        }
    }

    private void validateWebhookPayment(Booking booking, long amount) {
        assertAmountMatches(booking, amount, booking.getPaymentMethod());
        if (isCollectedPayment(booking)) {
            throw new RuntimeException("Payment already paid");
        }
    }

    private void markPaid(Booking booking, String transactionCode) {
        if (booking.getStatus() == Booking.BookingStatus.cancelled) {
            throw new RuntimeException("Booking payment window expired");
        }
        booking.setPaymentStatus(booking.getPaymentMethod() == Booking.PaymentMethod.cod
                ? Booking.PaymentStatus.deposited
                : Booking.PaymentStatus.paid);
        booking.setPaymentTransactionCode(transactionCode);
        booking.setPaidAt(LocalDateTime.now());
        booking.setStatus(booking.getPaymentMethod() == Booking.PaymentMethod.cod
                ? Booking.BookingStatus.deposited
                : Booking.BookingStatus.paid);
        bookingRepository.save(booking);
    }

    private void assertAmountMatches(Booking booking, Long amount, Booking.PaymentMethod method) {
        long expected = paymentAmountFor(booking, method);
        if (amount == null || expected != amount.longValue()) {
            throw new RuntimeException("Invalid payment amount");
        }
    }

    private void normalizeBookingAmount(Booking booking) {
        if (booking.getTour() == null) {
            return;
        }
        long payableAmount = calculatePayableAmount(booking);
        if (booking.getTotalAmount() == null || booking.getTotalAmount().longValue() != payableAmount) {
            booking.setTotalAmount(payableAmount);
        }
        Booking.PaymentMethod method = booking.getPaymentMethod() != null ? booking.getPaymentMethod() : Booking.PaymentMethod.bank_qr;
        normalizeBookingFinancials(booking, method);
        bookingRepository.save(booking);
    }

    private void normalizeBookingFinancials(Booking booking, Booking.PaymentMethod method) {
        if (booking.getTotalAmount() == null) return;
        long total = booking.getTotalAmount();
        long deposit = method == Booking.PaymentMethod.cod
                ? Math.round(total * COD_DEPOSIT_RATE_PERCENT / 100.0)
                : total;
        long commission = Math.round(total * COMMISSION_RATE_PERCENT / 100.0);
        booking.setDepositAmount(deposit);
        booking.setRemainingAmount(Math.max(total - deposit, 0L));
        booking.setCommissionRate(COMMISSION_RATE_PERCENT);
        booking.setCommissionAmount(commission);
        booking.setProviderPayoutAmount(method == Booking.PaymentMethod.cod
                ? Math.max(deposit - commission, 0L)
                : Math.max(total - commission, 0L));
        bookingRepository.save(booking);
    }

    private long paymentAmountFor(Booking booking, Booking.PaymentMethod method) {
        if (booking.getTotalAmount() == null) return 0L;
        if (method == Booking.PaymentMethod.cod) {
            Long deposit = booking.getDepositAmount();
            if (deposit != null && deposit > 0) return deposit;
            return Math.round(booking.getTotalAmount() * COD_DEPOSIT_RATE_PERCENT / 100.0);
        }
        return booking.getTotalAmount();
    }

    private long calculatePayableAmount(Booking booking) {
        long adultPrice = booking.getTour().getPrice() != null ? booking.getTour().getPrice() : 0L;
        long childPrice = booking.getTour().getChildPrice() != null ? booking.getTour().getChildPrice() : Math.round(adultPrice * 0.7);
        int adults = booking.getAdults() != null ? booking.getAdults() : 1;
        int children = booking.getChildren() != null ? booking.getChildren() : 0;
        long subtotal = (adultPrice * adults) + (childPrice * children);
        long serviceFee = Math.round(subtotal * 0.05);
        long tax = Math.round(subtotal * 0.10);
        return subtotal + serviceFee + tax;
    }

    private Booking.PaymentMethod parseMethod(String methodRaw) {
        String normalized = methodRaw == null ? "" : methodRaw.trim().toLowerCase();
        normalized = switch (normalized) {
            case "bank", "qr", "bankqr", "payos", "transfer" -> "bank_qr";
            case "cash" -> "cod";
            default -> normalized;
        };
        if ("momo".equals(normalized)) {
            throw new RuntimeException("Unsupported payment method: " + methodRaw);
        }
        return Booking.PaymentMethod.valueOf(normalized);
    }

    private PaymentDTO toDTO(Booking booking) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(booking.getId());
        dto.setBookingId(booking.getId());
        dto.setMethod(booking.getPaymentMethod() == null ? null : booking.getPaymentMethod().name());
        dto.setAmount(booking.getPaymentAmount());
        dto.setStatus(booking.getPaymentStatus() == null ? null : booking.getPaymentStatus().name());
        dto.setTransactionCode(booking.getPaymentTransactionCode());
        dto.setPaymentUrl(booking.getPaymentUrl());
        dto.setQrCode(booking.getPaymentQrCode());
        dto.setTransferContent(transferContent(booking.getId()));
        dto.setPaidAt(booking.getPaidAt());
        dto.setCreatedAt(booking.getCreatedAt());
        return dto;
    }

    private boolean isCollectedPayment(Booking booking) {
        return booking.getPaymentStatus() == Booking.PaymentStatus.deposited
                || booking.getPaymentStatus() == Booking.PaymentStatus.paid
                || booking.getPaymentStatus() == Booking.PaymentStatus.success;
    }

    private boolean verifyPayosSignature(Map<String, Object> payload) {
        String signature = stringValue(payload.get("signature"));
        Object data = payload.get("data");
        if (signature == null || !(data instanceof Map<?, ?> map)) return false;
        String raw = canonicalPayosData(map);
        return signature.equalsIgnoreCase(hmacSha256(raw, properties.getPayosChecksumKey()));
    }

    private String canonicalPayosData(Map<?, ?> data) {
        TreeMap<String, String> sorted = new TreeMap<>();
        data.forEach((key, value) -> {
            if (key != null && value != null) {
                sorted.put(String.valueOf(key), String.valueOf(value));
            }
        });
        return sorted.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .reduce((a, b) -> a + "&" + b)
                .orElse("");
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Cannot sign payment payload", e);
        }
    }

    private long positiveOrderCode(String bookingId) {
        return Integer.toUnsignedLong(bookingId.hashCode());
    }

    private String transferContent(String bookingId) {
        return "TOUR" + Integer.toUnsignedString(bookingId.hashCode(), 36).toUpperCase();
    }

    private void requireConfigured(String value, String key) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException("Missing payment config: " + key);
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private long longValue(Object value) {
        if (value instanceof Number number) return number.longValue();
        if (value == null || String.valueOf(value).isBlank()) return 0L;
        return Long.parseLong(String.valueOf(value));
    }

    private void assertCanAccessPaymentBooking(Booking booking, String actorUserId, boolean isAdmin) {
        if (isAdmin) {
            return;
        }
        if (booking.getUser() != null && actorUserId.equals(booking.getUser().getId())) {
            return;
        }
        throw new RuntimeException("You do not have permission to access payment for this booking");
    }
}
