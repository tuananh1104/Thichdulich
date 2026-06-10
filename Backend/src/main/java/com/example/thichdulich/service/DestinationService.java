package com.example.thichdulich.service;

import com.example.thichdulich.dto.DestinationDTO;
import com.example.thichdulich.entity.Destination;
import com.example.thichdulich.entity.Tour;
import com.example.thichdulich.mapper.DtoMapper;
import com.example.thichdulich.repository.DestinationRepository;
import com.example.thichdulich.repository.TourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DestinationService {
    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private TourRepository tourRepository;

    public List<DestinationDTO> getAllDestinations() {
        List<Destination> destinations = destinationRepository.findAll();
        destinations.forEach(this::attachApprovedToursByDestinationName);
        return destinations.stream()
                .map(this::toDestinationDTO)
                .collect(Collectors.toList());
    }

    public DestinationDTO getDestinationById(String id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Destination not found"));
        attachApprovedToursByDestinationName(destination);
        return toDestinationDTO(destination);
    }

    public List<DestinationDTO> searchDestinations(String keyword) {
        return destinationRepository.findByNameViContainingIgnoreCase(keyword)
                .stream()
                .map(this::toDestinationDTO)
                .collect(Collectors.toList());
    }

    public List<DestinationDTO> getDestinationsByRegion(String region) {
        return destinationRepository.findByRegion(region)
                .stream()
                .map(this::toDestinationDTO)
                .collect(Collectors.toList());
    }

    public DestinationDTO createDestination(DestinationDTO dto) {
        Destination d = new Destination();
        if (dto.getName() != null) {
            d.setNameVi(dto.getName());
        }
        if (dto.getDescription() != null) {
            d.setDescriptionVi(dto.getDescription());
        }
        d.setImage(dto.getImage());
        d.setRegion(dto.getRegion());
        Destination saved = destinationRepository.save(d);
        attachApprovedToursByDestinationName(saved);
        return toDestinationDTO(saved);
    }

    public DestinationDTO updateDestination(String id, DestinationDTO dto) {
        Destination d = destinationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Destination not found"));
        if (dto.getName() != null) {
            d.setNameVi(dto.getName());
        }
        if (dto.getDescription() != null) {
            d.setDescriptionVi(dto.getDescription());
        }
        if (dto.getImage() != null) d.setImage(dto.getImage());
        if (dto.getRegion() != null) d.setRegion(dto.getRegion());
        Destination saved = destinationRepository.save(d);
        attachApprovedToursByDestinationName(saved);
        return toDestinationDTO(saved);
    }

    public void deleteDestination(String id) {
        if (!destinationRepository.existsById(id)) {
            throw new RuntimeException("Destination not found");
        }
        destinationRepository.deleteById(id);
    }

    private void attachApprovedToursByDestinationName(Destination destination) {
        String name = destination.getNameVi();
        if (name == null || name.isBlank()) {
            return;
        }
        List<Tour> matchingTours = tourRepository.findApprovedUnassignedToursMatchingDestination(name.trim());
        for (Tour tour : matchingTours) {
            tour.setDestination(destination);
        }
        if (!matchingTours.isEmpty()) {
            tourRepository.saveAll(matchingTours);
        }
    }

    private DestinationDTO toDestinationDTO(Destination destination) {
        DestinationDTO dto = DtoMapper.toDestinationDTO(destination);
        dto.setTourCount((int) tourRepository.countByDestinationIdAndStatus(
                destination.getId(),
                Tour.TourStatus.approved));
        return dto;
    }
}
