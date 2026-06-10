package com.example.thichdulich.service;

import com.example.thichdulich.config.PaymentProperties;
import com.example.thichdulich.entity.Booking;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentServiceTest {
    private BookingRepository bookingRepository;
    private PaymentProperties paymentProperties;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        bookingRepository = mock(BookingRepository.class);
        paymentProperties = new PaymentProperties();
        paymentProperties.setPayosEndpoint("https://example.test/payment-requests");
        paymentService = new PaymentService(bookingRepository, paymentProperties);
    }

    @Test
    void rejectsPaymentAccessForAnotherUser() {
        Booking booking = booking("booking-1", "owner-1");
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> paymentService.createPayment("booking-1", "bank_qr", "other-user", false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("permission");
    }

    @Test
    void rejectsPaymentForCancelledBooking() {
        Booking booking = booking("booking-1", "owner-1");
        booking.setStatus(Booking.BookingStatus.cancelled);
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> paymentService.createPayment("booking-1", "bank_qr", "owner-1", false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void requiresPayosCredentialsBeforeCreatingPaymentLink() {
        Booking booking = booking("booking-1", "owner-1");
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThatThrownBy(() -> paymentService.createPayment("booking-1", "bank_qr", "owner-1", false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Missing payment config: payos.clientId");

        assertThat(booking.getPaymentMethod()).isEqualTo(Booking.PaymentMethod.bank_qr);
        assertThat(booking.getPaymentAmount()).isEqualTo(2_875_000L);
    }

    @Test
    void reusesPendingCodDepositPaymentAndCalculatesFinancials() {
        Booking booking = booking("booking-1", "owner-1");
        booking.setPaymentMethod(Booking.PaymentMethod.cod);
        booking.setPaymentStatus(Booking.PaymentStatus.pending);
        booking.setPaymentAmount(862_500L);
        booking.setPaymentTransactionCode("12345");
        booking.setPaymentUrl("https://checkout.example.test/12345");

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var payment = paymentService.createPayment("booking-1", "cash", "owner-1", false);

        assertThat(payment.getMethod()).isEqualTo("cod");
        assertThat(payment.getAmount()).isEqualTo(862_500L);
        assertThat(booking.getTotalAmount()).isEqualTo(2_875_000L);
        assertThat(booking.getDepositAmount()).isEqualTo(862_500L);
        assertThat(booking.getRemainingAmount()).isEqualTo(2_012_500L);
        assertThat(booking.getCommissionAmount()).isEqualTo(287_500L);
        assertThat(booking.getProviderPayoutAmount()).isEqualTo(575_000L);
        verify(bookingRepository, atLeastOnce()).save(booking);
    }

    private Booking booking(String id, String ownerId) {
        Tour tour = new Tour();
        tour.setId("tour-1");
        tour.setPrice(1_000_000L);
        tour.setChildPrice(500_000L);

        User user = new User();
        user.setId(ownerId);

        Booking booking = new Booking();
        booking.setId(id);
        booking.setUser(user);
        booking.setTour(tour);
        booking.setAdults(2);
        booking.setChildren(1);
        booking.setStatus(Booking.BookingStatus.pending);
        booking.setTotalAmount(0L);
        return booking;
    }
}
