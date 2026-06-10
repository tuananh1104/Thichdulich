package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.TourDTO;
import com.example.thichdulich.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/favorites")
public class FavoriteController {
    @Autowired
    private FavoriteService favoriteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TourDTO>>> getFavorites() {
        return ResponseEntity.ok(ApiResponse.success(
                favoriteService.getUserFavorites(currentUserId()),
                "Favorites retrieved"));
    }

    @GetMapping("/{tourId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> isFavorite(@PathVariable String tourId) {
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("favorite", favoriteService.isFavorite(currentUserId(), tourId))));
    }

    @PostMapping("/{tourId}")
    public ResponseEntity<ApiResponse<TourDTO>> addFavorite(@PathVariable String tourId) {
        return ResponseEntity.ok(ApiResponse.success(
                favoriteService.addFavorite(currentUserId(), tourId),
                "Favorite added"));
    }

    @DeleteMapping("/{tourId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(@PathVariable String tourId) {
        favoriteService.removeFavorite(currentUserId(), tourId);
        return ResponseEntity.ok(ApiResponse.success(null, "Favorite removed"));
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
    }
}
