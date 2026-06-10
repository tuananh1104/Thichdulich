package com.example.thichdulich.mapper;

import com.example.thichdulich.dto.*;
import com.example.thichdulich.entity.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public final class DtoMapper {
    private static final ObjectMapper JSON = new ObjectMapper();

    private DtoMapper() {}

    public static String localizedJson(String vi, String en) {
        ObjectNode node = JSON.createObjectNode();
        String value = vi != null ? vi : "";
        node.put("vi", value);
        node.put("en", value);
        return node.toString();
    }

    public static TourDTO toTourDTO(Tour tour) {
        if (tour == null) return null;
        TourDTO dto = new TourDTO();
        dto.setId(tour.getId());
        dto.setName(localizedJson(tour.getNameVi(), tour.getNameVi()));
        dto.setDescription(localizedJson(tour.getDescriptionVi(), tour.getDescriptionVi()));
        dto.setLocation(tour.getLocation());
        dto.setType(tour.getType() != null ? tour.getType().name() : null);
        dto.setDuration(tour.getDuration());
        dto.setAdvanceBookingDays(tour.getAdvanceBookingDays());
        dto.setMaxSeats(tour.getMaxPeoplePerDay());
        dto.setMaxPeoplePerDay(tour.getMaxPeoplePerDay());
        dto.setPrice(tour.getPrice() != null ? tour.getPrice().doubleValue() : null);
        dto.setChildPrice(tour.getChildPrice() != null ? tour.getChildPrice().doubleValue() : null);
        dto.setOriginalPrice(tour.getOriginalPrice() != null ? tour.getOriginalPrice().doubleValue() : null);
        dto.setPromotionTitle(tour.getPromotionTitle());
        dto.setPromotionBadge(tour.getPromotionBadge());
        dto.setDiscountPercent(tour.getDiscountPercent());
        dto.setPromotionActive(tour.getPromotionActive());
        dto.setPromotionStatus(tour.getPromotionStatus());
        dto.setPromotionSource(tour.getPromotionSource());
        dto.setImage(tour.getImage());
        if (tour.getReviews() != null) {
            int reviewCount = tour.getReviews().size();
            dto.setReviewCount(reviewCount);
            dto.setRating(reviewCount == 0
                    ? 0.0
                    : Math.round(tour.getReviews().stream()
                            .mapToInt(TourReview::getRating)
                            .average()
                            .orElse(0.0) * 10.0) / 10.0);
        } else {
            dto.setRating(tour.getRating() != null ? tour.getRating().doubleValue() : 0.0);
            dto.setReviewCount(tour.getReviewCount());
        }
        dto.setAvailability(tour.getAvailability());
        dto.setStatus(tour.getStatus() != null ? tour.getStatus().name() : null);
        if (tour.getProvider() != null) {
            dto.setProviderId(tour.getProvider().getId());
            dto.setProviderName(tour.getProvider().getCompanyName());
        }
        if (tour.getDestination() != null) {
            dto.setDestinationId(tour.getDestination().getId());
        }
        dto.setRejectionReason(tour.getRejectionReason());
        dto.setAdminNotes(tour.getAdminNotes());
        dto.setSubmittedAt(tour.getSubmittedAt());
        dto.setReviewedAt(tour.getReviewedAt());
        dto.setCreatedAt(tour.getCreatedAt());
        dto.setUpdatedAt(tour.getUpdatedAt());
        dto.setItineraries(readItineraryList(tour));
        dto.setIncluded(readIncludedList(tour));
        dto.setExcluded(readStringList(tour.getExcludedServices()));
        dto.setImages(readImageList(tour));
        return dto;
    }

    public static void applyTourDtoToEntity(Tour tour, TourDTO dto) {
        if (dto.getName() != null) {
            LocalizedText name = readLocalizedText(dto.getName());
            tour.setNameVi(name.vi().isBlank() ? name.en() : name.vi());
        }
        if (dto.getDescription() != null) {
            LocalizedText description = readLocalizedText(dto.getDescription());
            tour.setDescriptionVi(description.vi().isBlank() ? description.en() : description.vi());
        }
        if (dto.getLocation() != null) tour.setLocation(dto.getLocation());
        if (dto.getType() != null) tour.setType(Tour.TourType.valueOf(dto.getType().toLowerCase()));
        if (dto.getDuration() != null) {
            tour.setDuration(dto.getDuration());
            if (dto.getAdvanceBookingDays() == null) {
                tour.setAdvanceBookingDays(Tour.suggestedAdvanceBookingDays(dto.getDuration()));
            }
        }
        if (dto.getAdvanceBookingDays() != null) {
            tour.setAdvanceBookingDays(Math.max(1, dto.getAdvanceBookingDays()));
        }
        Integer maxPeoplePerDay = dto.getMaxPeoplePerDay() != null ? dto.getMaxPeoplePerDay() : dto.getMaxSeats();
        if (maxPeoplePerDay != null) tour.setMaxPeoplePerDay(maxPeoplePerDay);
        if (dto.getPrice() != null) tour.setPrice(dto.getPrice().longValue());
        if (dto.getChildPrice() != null) tour.setChildPrice(dto.getChildPrice().longValue());
        if (dto.getOriginalPrice() != null) tour.setOriginalPrice(dto.getOriginalPrice().longValue());
        if (dto.getPromotionTitle() != null) tour.setPromotionTitle(dto.getPromotionTitle());
        if (dto.getPromotionBadge() != null) tour.setPromotionBadge(dto.getPromotionBadge());
        if (dto.getDiscountPercent() != null) tour.setDiscountPercent(dto.getDiscountPercent());
        if (dto.getPromotionActive() != null) tour.setPromotionActive(dto.getPromotionActive());
        if (dto.getPromotionStatus() != null) tour.setPromotionStatus(dto.getPromotionStatus());
        if (dto.getPromotionSource() != null) tour.setPromotionSource(dto.getPromotionSource());
        if (dto.getImage() != null) tour.setImage(dto.getImage());
        if (dto.getIncluded() != null) {
            List<String> included = cleanStringList(dto.getIncluded());
            tour.setIncludedServices(writeStringList(included));
        }
        if (dto.getExcluded() != null) tour.setExcludedServices(writeStringList(cleanStringList(dto.getExcluded())));
        if (dto.getImages() != null) {
            List<String> images = cleanStringList(dto.getImages());
            tour.setImagesJson(writeStringList(images));
            if ((tour.getImage() == null || tour.getImage().isBlank()) && !images.isEmpty()) {
                tour.setImage(images.get(0));
            }
        }
        if (dto.getItineraries() != null) {
            tour.setItineraryJson(writeItineraryList(dto.getItineraries()));
        }
    }

    public static DestinationDTO toDestinationDTO(Destination d) {
        DestinationDTO dto = new DestinationDTO();
        dto.setId(d.getId());
        dto.setName(d.getNameVi());
        dto.setDescription(d.getDescriptionVi());
        dto.setImage(d.getImage());
        dto.setRegion(d.getRegion());
        dto.setCreatedAt(d.getCreatedAt());
        if (d.getTours() != null) {
            List<TourDTO> approvedTours = d.getTours().stream()
                    .filter(t -> t.getStatus() == Tour.TourStatus.approved)
                    .map(DtoMapper::toTourDTO)
                    .collect(Collectors.toList());
            dto.setTours(approvedTours);
            dto.setTourCount(approvedTours.size());
        }
        return dto;
    }

    public static BookingDTO toBookingDTO(Booking b) {
        BookingDTO dto = new BookingDTO();
        dto.setId(b.getId());
        dto.setTourId(b.getTour().getId());
        dto.setTourName(b.getTour().getNameVi());
        dto.setUserId(b.getUser().getId());
        dto.setUserName(b.getUser().getName());
        dto.setUserEmail(b.getUser().getEmail());
        LocalDate startDate = b.getStartDate();
        if (startDate == null && b.getDepartureSchedule() != null) {
            startDate = b.getDepartureSchedule().getDepartureDate();
        }
        if (startDate != null) {
            dto.setStartDate(startDate);
            if (b.getTour() != null) {
                int durationDays = b.getTour().getDuration() != null && b.getTour().getDuration() > 0
                        ? b.getTour().getDuration()
                        : 1;
                dto.setEndDate(startDate.plusDays(durationDays));
            }
        }
        if (b.getDepartureSchedule() != null) {
            dto.setDepartureScheduleId(b.getDepartureSchedule().getId());
        }
        dto.setAdults(b.getAdults());
        dto.setChildren(b.getChildren());
        dto.setTotalAmount(b.getTotalAmount() != null ? b.getTotalAmount().doubleValue() : null);
        dto.setDepositAmount(b.getDepositAmount());
        dto.setRemainingAmount(b.getRemainingAmount());
        dto.setCommissionRate(b.getCommissionRate());
        dto.setCommissionAmount(b.getCommissionAmount());
        dto.setProviderPayoutAmount(b.getProviderPayoutAmount());
        dto.setCancelledBy(b.getCancelledBy());
        dto.setCancelledAt(b.getCancelledAt());
        dto.setCancelReason(b.getCancelReason());
        dto.setRefundStatus(b.getRefundStatus() != null ? b.getRefundStatus().name() : null);
        dto.setRefundAmount(b.getRefundAmount());
        dto.setRefundBankName(b.getRefundBankName());
        dto.setRefundAccountNumber(b.getRefundAccountNumber());
        dto.setRefundAccountName(b.getRefundAccountName());
        dto.setRefundRequestedAt(b.getRefundRequestedAt());
        dto.setRefundProcessedAt(b.getRefundProcessedAt());
        dto.setRefundProcessedBy(b.getRefundProcessedBy());
        dto.setRefundRejectReason(b.getRefundRejectReason());
        dto.setPayoutStatus(b.getPayoutStatus() != null ? b.getPayoutStatus().name() : null);
        dto.setPayoutAmount(b.getPayoutAmount());
        dto.setPayoutProcessedAt(b.getPayoutProcessedAt());
        dto.setPayoutProcessedBy(b.getPayoutProcessedBy());
        dto.setStatus(b.getStatus() != null ? b.getStatus().name() : null);
        dto.setContactName(b.getContactName());
        dto.setContactEmail(b.getContactEmail());
        dto.setContactPhone(b.getContactPhone());
        dto.setSpecialRequests(b.getSpecialRequests());
        dto.setReviewedAt(b.getReviewedAt());
        dto.setHasReviewed(b.getReviewedAt() != null);
        dto.setCreatedAt(b.getCreatedAt());
        dto.setPaymentMethod(b.getPaymentMethod() != null ? b.getPaymentMethod().name() : null);
        dto.setPaymentStatus(b.getPaymentStatus() != null ? b.getPaymentStatus().name() : null);
        return dto;
    }

    public static UserDTO toUserDTO(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setName(u.getName());
        dto.setEmail(u.getEmail());
        dto.setPhone(u.getPhone());
        dto.setAvatar(u.getAvatar());
        dto.setRole(u.getRole() != null ? u.getRole().name() : null);
        dto.setActive(u.getIsActive());
        dto.setBanned(u.getIsBanned());
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }

    public static TourReviewDTO toReviewDTO(TourReview r) {
        TourReviewDTO dto = new TourReviewDTO();
        dto.setId(r.getId());
        dto.setTourId(r.getTour().getId());
        dto.setTourName(r.getTour().getNameVi());
        if (r.getBooking() != null) {
            dto.setBookingId(r.getBooking().getId());
        }
        dto.setUserId(r.getUser().getId());
        dto.setUserName(r.getUser().getName());
        dto.setRating(r.getRating());
        dto.setComment(r.getComment());
        if (r.getImages() != null && !r.getImages().isBlank()) {
            try {
                dto.setImages(JSON.readValue(r.getImages(), String[].class));
            } catch (Exception ignored) {
                dto.setImages(new String[0]);
            }
        }
        dto.setHelpfulCount(r.getHelpfulCount());
        dto.setCreatedAt(r.getCreatedAt());
        if (r.getResponseMessage() != null) {
            dto.setProviderResponse(r.getResponseMessage());
            dto.setResponseFrom(r.getResponseFrom());
            dto.setResponseDate(r.getResponseAt());
        }
        dto.setResponseRequested(Boolean.TRUE.equals(r.getResponseRequested()));
        dto.setResponseRequestedAt(r.getResponseRequestedAt());
        if (r.getResponseRequestedBy() != null) {
            dto.setResponseRequestedBy(r.getResponseRequestedBy().getName());
        }
        return dto;
    }

    public static TourReportDTO toReportDTO(TourReport r) {
        TourReportDTO dto = new TourReportDTO();
        dto.setId(r.getId());
        dto.setTourId(r.getTour().getId());
        dto.setTourName(r.getTour().getNameVi());
        dto.setReportedByName(r.getReportedBy().getName());
        if (r.getBooking() != null) {
            dto.setBookingId(r.getBooking().getId());
        }
        dto.setReason(r.getReason());
        dto.setDescription(r.getDescription());
        if (r.getImages() != null && !r.getImages().isBlank()) {
            try {
                dto.setImages(JSON.readValue(r.getImages(), String[].class));
            } catch (Exception ignored) {
                dto.setImages(new String[0]);
            }
        }
        dto.setStatus(r.getStatus() != null ? r.getStatus().name() : null);
        dto.setAdminNote(r.getAdminNote());
        if (r.getReviewedBy() != null) {
            dto.setReviewedBy(r.getReviewedBy().getName());
        }
        dto.setReviewedAt(r.getReviewedAt());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }

    public static ContactMessageDTO toContactDTO(ContactMessage c) {
        ContactMessageDTO dto = new ContactMessageDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setEmail(c.getEmail());
        dto.setPhone(c.getPhone());
        dto.setSubject(c.getSubject());
        dto.setMessage(c.getMessage());
        dto.setStatus(c.getStatus());
        dto.setReplyMessage(c.getReplyMessage());
        if (c.getRepliedBy() != null) {
            dto.setRepliedBy(c.getRepliedBy().getName());
        }
        dto.setRepliedAt(c.getRepliedAt());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }

    public static DepartureScheduleDTO toScheduleDTO(DepartureSchedule s) {
        DepartureScheduleDTO dto = new DepartureScheduleDTO();
        dto.setId(s.getId());
        dto.setTourId(s.getTour().getId());
        dto.setDepartureDate(s.getDepartureDate());
        dto.setTotalSlots(s.getTotalSlots());
        dto.setBookedSlots(s.getBookedSlots());
        dto.setAvailableSlots(s.getAvailableSlots());
        dto.setStatus(s.getStatus() != null ? s.getStatus().name() : null);
        return dto;
    }

    private static List<TourItineraryDTO> readItineraryList(Tour tour) {
        if (tour.getItineraryJson() != null && !tour.getItineraryJson().isBlank()) {
            try {
                List<TourItineraryDTO> items = JSON.readValue(
                        tour.getItineraryJson(),
                        JSON.getTypeFactory().constructCollectionType(List.class, TourItineraryDTO.class));
                return items.stream()
                        .filter(item -> item != null && item.getDay() != null)
                        .sorted(java.util.Comparator.comparing(TourItineraryDTO::getDay))
                        .collect(Collectors.toList());
            } catch (Exception ignored) {
            }
        }
        return List.of();
    }

    private static List<String> readIncludedList(Tour tour) {
        return readStringList(tour.getIncludedServices());
    }

    private static List<String> readImageList(Tour tour) {
        return readStringList(tour.getImagesJson());
    }

    private static List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return JSON.readValue(json, JSON.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception ignored) {
            List<String> fallback = new ArrayList<>();
            fallback.add(json);
            return fallback;
        }
    }

    private static String writeStringList(List<String> values) {
        try {
            return JSON.writeValueAsString(values == null ? List.of() : values);
        } catch (Exception ignored) {
            return "[]";
        }
    }

    private static String writeItineraryList(List<TourItineraryDTO> values) {
        try {
            List<TourItineraryDTO> cleaned = values == null ? List.of() : values.stream()
                    .filter(item -> item != null && item.getDay() != null)
                    .collect(Collectors.toList());
            return JSON.writeValueAsString(cleaned);
        } catch (Exception ignored) {
            return "[]";
        }
    }

    private static List<String> cleanStringList(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(value -> value != null && !value.trim().isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());
    }

    private static LocalizedText readLocalizedText(String value) {
        if (value == null) return new LocalizedText("", "");
        try {
            ObjectNode node = (ObjectNode) JSON.readTree(value);
            String vi = node.path("vi").asText("");
            String en = node.path("en").asText("");
            if (en.isBlank()) en = vi;
            return new LocalizedText(vi, en);
        } catch (Exception ignored) {
            return new LocalizedText(value, value);
        }
    }

    private record LocalizedText(String vi, String en) {}
}
