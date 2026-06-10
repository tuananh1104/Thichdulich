package com.example.thichdulich.service;

import com.example.thichdulich.dto.TourDTO;
import com.example.thichdulich.entity.Favorite;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.User;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.FavoriteRepository;
import com.example.thichdulich.repository.TourRepository;
import com.example.thichdulich.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FavoriteService {
    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TourRepository tourRepository;

    public List<TourDTO> getUserFavorites(String userId) {
        return favoriteRepository.findByUserId(userId)
                .stream()
                .map(Favorite::getTour)
                .filter(tour -> tour != null && tour.getStatus() == Tour.TourStatus.approved)
                .map(DtoMapper::toTourDTO)
                .collect(Collectors.toList());
    }

    public boolean isFavorite(String userId, String tourId) {
        return favoriteRepository.existsByUserIdAndTourId(userId, tourId);
    }

    public TourDTO addFavorite(String userId, String tourId) {
        return favoriteRepository.findByUserIdAndTourId(userId, tourId)
                .map(favorite -> DtoMapper.toTourDTO(favorite.getTour()))
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    Tour tour = tourRepository.findById(tourId)
                            .orElseThrow(() -> new RuntimeException("Tour not found"));
                    if (tour.getStatus() != Tour.TourStatus.approved || !Boolean.TRUE.equals(tour.getAvailability())) {
                        throw new RuntimeException("Tour is not available for favorite");
                    }

                    Favorite favorite = new Favorite();
                    favorite.setUser(user);
                    favorite.setTour(tour);
                    favoriteRepository.save(favorite);
                    return DtoMapper.toTourDTO(tour);
                });
    }

    public void removeFavorite(String userId, String tourId) {
        favoriteRepository.findByUserIdAndTourId(userId, tourId)
                .ifPresent(favoriteRepository::delete);
    }
}
