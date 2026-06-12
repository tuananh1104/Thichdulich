package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.UploadResponseDTO;
import com.example.thichdulich.service.CloudinaryUploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {
    private final CloudinaryUploadService uploadService;

    public UploadController(CloudinaryUploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/image")
    public ResponseEntity<ApiResponse<UploadResponseDTO>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "general") String folder) {
        UploadResponseDTO uploaded = uploadService.uploadImage(file, folder);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(uploaded, "Image uploaded successfully"));
    }

    @PostMapping("/images")
    public ResponseEntity<ApiResponse<List<UploadResponseDTO>>> uploadImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(defaultValue = "general") String folder) {
        List<UploadResponseDTO> uploaded = uploadService.uploadImages(files, folder);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(uploaded, "Images uploaded successfully"));
    }
}
