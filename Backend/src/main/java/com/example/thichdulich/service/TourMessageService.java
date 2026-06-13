package com.example.thichdulich.service;

import com.example.thichdulich.dto.TourMessageDTO;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.TourMessage;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.repository.ProviderRepository;
import com.example.thichdulich.repository.TourMessageRepository;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TourMessageService {
    @Autowired
    private TourMessageRepository messageRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderRepository providerRepository;

    @Autowired
    private NotificationService notificationService;

    public List<TourMessageDTO> getMessagesByTour(String tourId) {
        return messageRepository.findByTourIdOrderBySentAtAsc(tourId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<TourMessageDTO> getMessagesByTour(String tourId, String actorUserId, boolean isAdmin) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        assertCanAccessTourMessages(tour, actorUserId, isAdmin);
        return getMessagesByTour(tourId);
    }

    public TourMessageDTO sendMessage(String tourId, String senderId, String message, String senderRole, String senderName) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TourMessage msg = new TourMessage();
        msg.setTour(tour);
        msg.setSender(sender);
        msg.setMessage(message);
        msg.setSenderName(senderName != null ? senderName : sender.getName());
        msg.setSenderRole(TourMessage.SenderRole.valueOf(senderRole.toLowerCase()));

        TourMessage saved = messageRepository.save(msg);
        notifyMessageRecipient(tour, saved);
        return toDto(saved);
    }

    public TourMessageDTO sendMessage(
            String tourId,
            String senderId,
            String message,
            String senderRole,
            String senderName,
            boolean isAdmin) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        assertCanAccessTourMessages(tour, senderId, isAdmin);
        return sendMessage(tourId, senderId, message, senderRole, senderName);
    }

    private TourMessageDTO toDto(TourMessage m) {
        TourMessageDTO dto = new TourMessageDTO();
        dto.setId(m.getId());
        dto.setTourId(m.getTour().getId());
        dto.setSenderId(m.getSender().getId());
        dto.setSenderRole(m.getSenderRole().name());
        dto.setSenderName(m.getSenderName());
        dto.setMessage(m.getMessage());
        dto.setSentAt(m.getSentAt());
        return dto;
    }

    private void assertCanAccessTourMessages(Tour tour, String actorUserId, boolean isAdmin) {
        if (isAdmin) {
            return;
        }
        boolean ownsTour = providerRepository.findByUserId(actorUserId)
                .map(provider -> tour.getProvider() != null && provider.getId().equals(tour.getProvider().getId()))
                .orElse(false);
        if (!ownsTour) {
            throw new RuntimeException("You do not have permission to access messages for this tour");
        }
    }

    private void notifyMessageRecipient(Tour tour, TourMessage message) {
        String tourName = tour.getNameVi() != null ? tour.getNameVi() : "Tour";
        String preview = message.getMessage() == null || message.getMessage().isBlank()
                ? "Bạn có tin nhắn mới"
                : message.getMessage().trim();
        if (preview.length() > 120) {
            preview = preview.substring(0, 120) + "...";
        }

        if (message.getSenderRole() == TourMessage.SenderRole.admin) {
            User providerUser = tour.getProvider() != null ? tour.getProvider().getUser() : null;
            notificationService.notifyUser(
                    providerUser,
                    "tour_message",
                    "Tin nhắn mới từ Admin",
                    tourName + ": " + preview,
                    "/provider/feedback",
                    "{\"tourId\":\"" + tour.getId() + "\",\"messageId\":\"" + message.getId() + "\"}"
            );
        } else {
            notificationService.notifyAdmins(
                    "tour_message",
                    "Tin nhắn mới từ nhà cung cấp",
                    tourName + ": " + preview,
                    "/admin/messages",
                    "{\"tourId\":\"" + tour.getId() + "\",\"messageId\":\"" + message.getId() + "\"}"
            );
        }
    }
}
