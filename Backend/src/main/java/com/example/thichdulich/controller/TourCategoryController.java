package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.TourCategoryDTO;
import com.example.thichdulich.service.TourCategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tour-categories")
public class TourCategoryController {
    @Autowired
    private TourCategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TourCategoryDTO>>> getActiveCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getActiveCategories()));
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<List<TourCategoryDTO>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategories()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TourCategoryDTO>> createCategory(@Valid @RequestBody TourCategoryDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(categoryService.createCategory(dto), "Đã tạo loại hình tour"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PutMapping("/{code}")
    public ResponseEntity<ApiResponse<TourCategoryDTO>> updateCategory(
            @PathVariable String code,
            @Valid @RequestBody TourCategoryDTO dto) {
        try {
            return ResponseEntity.ok(ApiResponse.success(categoryService.updateCategory(code, dto), "Đã cập nhật loại hình tour"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable String code) {
        try {
            categoryService.deleteCategory(code);
            return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa loại hình tour"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }
}
