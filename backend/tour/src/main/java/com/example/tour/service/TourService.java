// src/main/java/com/example/tour/service/TourService.java
package com.example.tour.service;

import com.example.tour.dto.CreateTourRequest;
import com.example.tour.dto.TourResponse;
import com.example.tour.model.Status;
import com.example.tour.model.Tour;
import com.example.tour.repository.TourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TourService {

    private final TourRepository repo;

    @Transactional
    public TourResponse create(UUID authorId, CreateTourRequest req) {
        var tour = Tour.builder()
                .id(UUID.randomUUID())
                .authorId(authorId)
                .name(req.getName())
                .description(req.getDescription())
                .difficulty(req.getDifficulty())
                .status(Status.DRAFT)                // <<< top-level Status
                .priceCents(req.getPriceCents())
                .tags(req.getTags() == null ? new HashSet<>() : new HashSet<>(req.getTags()))
                .build();

        var saved = repo.save(tour);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TourResponse> listMine(UUID authorId) {
        return repo.findAllByAuthorId(authorId).stream()
                .map(this::toDto)
                .toList();
    }

    private TourResponse toDto(Tour t) {
        return TourResponse.builder()
                .id(t.getId())
                .authorId(t.getAuthorId())
                .name(t.getName())
                .description(t.getDescription())
                .difficulty(t.getDifficulty())
                .status(t.getStatus())
                .priceCents(t.getPriceCents())
                .tags(t.getTags())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
