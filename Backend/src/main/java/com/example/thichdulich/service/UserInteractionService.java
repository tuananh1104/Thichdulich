package com.example.thichdulich.service;

import com.example.thichdulich.dto.UserInteractionDTO;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.entity.UserInteraction;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.UserInteractionRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserInteractionService {
    @Autowired
    private UserInteractionRepository interactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TourRepository tourRepository;

    public UserInteractionDTO saveInteraction(String userId, UserInteractionDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserInteraction.InteractionAction action;
        try {
            action = UserInteraction.InteractionAction.valueOf(dto.getAction().toLowerCase());
        } catch (Exception e) {
            throw new RuntimeException("Invalid interaction action");
        }

        Tour tour = null;
        if (dto.getTourId() != null && !dto.getTourId().isBlank()) {
            tour = tourRepository.findById(dto.getTourId())
                    .orElseThrow(() -> new RuntimeException("Tour not found"));
        }
        if (action != UserInteraction.InteractionAction.search && tour == null) {
            throw new RuntimeException("Tour is required for this interaction");
        }

        UserInteraction interaction = new UserInteraction();
        interaction.setUser(user);
        interaction.setTour(tour);
        interaction.setAction(action);
        interaction.setSearchQuery(dto.getSearchQuery() != null ? dto.getSearchQuery().trim() : null);
        return toDto(interactionRepository.save(interaction));
    }

    public List<UserInteractionDTO> getUserInteractions(String userId) {
        return interactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private UserInteractionDTO toDto(UserInteraction interaction) {
        UserInteractionDTO dto = new UserInteractionDTO();
        dto.setId(interaction.getId());
        dto.setUserId(interaction.getUser().getId());
        dto.setTourId(interaction.getTour() != null ? interaction.getTour().getId() : null);
        dto.setAction(interaction.getAction().name());
        dto.setSearchQuery(interaction.getSearchQuery());
        dto.setCreatedAt(interaction.getCreatedAt());
        return dto;
    }
}
