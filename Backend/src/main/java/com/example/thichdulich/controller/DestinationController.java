package com.example.thichdulich.controller;

import com.example.thichdulich.dto.ApiResponse;
import com.example.thichdulich.dto.DestinationDTO;
import com.example.thichdulich.service.DestinationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/destinations")
public class DestinationController {
    @Autowired
    private DestinationService destinationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DestinationDTO>>> getAllDestinations() {
        try {
            List<DestinationDTO> destinations = destinationService.getAllDestinations();
            return ResponseEntity.ok(ApiResponse.success(destinations));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DestinationDTO>> getDestinationById(@PathVariable String id) {
        try {
            DestinationDTO destination = destinationService.getDestinationById(id);
            return ResponseEntity.ok(ApiResponse.success(destination));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<DestinationDTO>>> searchDestinations(@RequestParam String keyword) {
        try {
            List<DestinationDTO> destinations = destinationService.searchDestinations(keyword);
            return ResponseEntity.ok(ApiResponse.success(destinations));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @GetMapping("/region/{region}")
    public ResponseEntity<ApiResponse<List<DestinationDTO>>> getDestinationsByRegion(@PathVariable String region) {
        try {
            List<DestinationDTO> destinations = destinationService.getDestinationsByRegion(region);
            return ResponseEntity.ok(ApiResponse.success(destinations));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DestinationDTO>> createDestination(
            @Valid @RequestBody DestinationDTO destinationDTO) {
        try {
            DestinationDTO created = destinationService.createDestination(destinationDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Destination created successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DestinationDTO>> updateDestination(
            @PathVariable String id,
            @Valid @RequestBody DestinationDTO destinationDTO) {
        try {
            DestinationDTO updated = destinationService.updateDestination(id, destinationDTO);
            return ResponseEntity.ok(ApiResponse.success(updated, "Destination updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDestination(@PathVariable String id) {
        try {
            destinationService.deleteDestination(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Destination deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }
}
