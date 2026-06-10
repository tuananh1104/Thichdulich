package com.example.thichdulich.service;

import com.example.thichdulich.dto.TourCategoryDTO;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.entity.TourCategory;
import com.example.thichdulich.repository.TourCategoryRepository;
import com.example.thichdulich.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@Transactional
public class TourCategoryService {
    @Autowired
    private TourCategoryRepository categoryRepository;

    @Autowired
    private TourRepository tourRepository;

    public List<TourCategoryDTO> getActiveCategories() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TourCategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TourCategoryDTO createCategory(TourCategoryDTO dto) {
        String code = normalizeCode(dto.getCode());
        if (categoryRepository.existsById(code)) {
            throw new RuntimeException("Loại hình tour đã tồn tại");
        }
        TourCategory category = new TourCategory();
        category.setCode(code);
        apply(dto, category);
        return toDTO(categoryRepository.save(category));
    }

    public TourCategoryDTO updateCategory(String code, TourCategoryDTO dto) {
        TourCategory category = categoryRepository.findById(normalizeCode(code))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại hình tour"));
        apply(dto, category);
        return toDTO(categoryRepository.save(category));
    }

    public void deleteCategory(String code) {
        Tour.TourType type = parseType(code);
        long tourCount = tourRepository.countByType(type);
        if (tourCount > 0) {
            throw new RuntimeException("Loại hình đang có tour sử dụng, chỉ có thể tắt hiển thị");
        }
        categoryRepository.deleteById(normalizeCode(code));
    }

    public void ensureActiveCategory(String code) {
        TourCategory category = categoryRepository.findById(normalizeCode(code))
                .orElseThrow(() -> new RuntimeException("Loại hình tour không hợp lệ"));
        if (!Boolean.TRUE.equals(category.getActive())) {
            throw new RuntimeException("Loại hình tour đang bị tắt");
        }
    }

    private void apply(TourCategoryDTO dto, TourCategory category) {
        if (dto.getName() != null) category.setName(dto.getName().trim());
        if (dto.getDescription() != null) category.setDescription(dto.getDescription().trim());
        if (dto.getActive() != null) category.setActive(dto.getActive());
        if (dto.getSortOrder() != null) category.setSortOrder(dto.getSortOrder());
        parseType(category.getCode());
    }

    private TourCategoryDTO toDTO(TourCategory category) {
        TourCategoryDTO dto = new TourCategoryDTO();
        dto.setCode(category.getCode());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setActive(category.getActive());
        dto.setSortOrder(category.getSortOrder());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        dto.setTourCount(tourRepository.countByType(parseType(category.getCode())));
        return dto;
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new RuntimeException("Mã loại hình là bắt buộc");
        }
        return code.trim().toLowerCase(Locale.ROOT);
    }

    private Tour.TourType parseType(String code) {
        try {
            return Tour.TourType.valueOf(normalizeCode(code));
        } catch (Exception ignored) {
            throw new RuntimeException("Mã loại hình tour không hợp lệ");
        }
    }
}
