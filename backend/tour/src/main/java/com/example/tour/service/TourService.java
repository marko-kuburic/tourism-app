// src/main/java/com/example/tour/service/TourService.java
package com.example.tour.service;

import com.example.tour.dto.CreateTourRequest;
import com.example.tour.dto.TourResponse;
import com.example.tour.model.Tour;
import com.example.tour.repo.TourRepository;
import com.example.tour.dto.TourPublicResponse;
import com.example.tour.model.Status;
import com.example.tour.model.Tour;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.tour.repo.KeyPointRepository;
import com.example.tour.repo.TourRepository;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.util.*;
import com.example.tour.dto.PublishTourRequest;
import com.example.tour.model.TransportType;






@Service
@RequiredArgsConstructor
public class TourService {

    private final TourRepository repo;
     private final KeyPointRepository keyRepo;

    @Transactional(readOnly = true)
    public List<TourResponse> listAll() {
        return repo.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TourPublicResponse> listPublishedForTourists() {
        return repo.findAllByStatus(Status.PUBLISHED).stream().map(this::toPublicDto).toList();
    }


    @Transactional(readOnly = true)
    public TourResponse getById(UUID id) {
        Tour entity = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tour not found: " + id));
        return toDto(entity);
    }

    @Transactional
    public TourResponse create(UUID authorId, CreateTourRequest req) {
        Tour tour = Tour.builder()
                .id(UUID.randomUUID())
                .authorId(authorId)
                .name(req.getName())
                .description(req.getDescription())
                .difficulty(req.getDifficulty())
                .status(req.getStatus())
                .priceCents(req.getPriceCents())
                .tags(req.getTags() == null ? new HashSet<>() : new HashSet<>(req.getTags()))
                .build();

        Tour saved = repo.save(tour);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TourResponse> listMine(UUID authorId) {
        return repo.findByAuthorId(authorId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
        }
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
                .lengthKm(t.getLengthKm())
                .durations(t.getDurations())
                .publishedAt(t.getPublishedAt())
                .archivedAt(t.getArchivedAt())
                .build();
    }



      @Transactional
    public TourResponse publish(UUID tourId, UUID authorId, PublishTourRequest body) {
        Tour t = repo.findById(tourId).orElseThrow(EntityNotFoundException::new);
        if (!Objects.equals(t.getAuthorId(), authorId)) {
            throw new IllegalStateException("Only author can publish their tour.");
        }
        // Uslov 1: osnovni podaci
        if (isBlank(t.getName()) || isBlank(t.getDescription()) || t.getDifficulty() == null) {
            throw new IllegalStateException("Tour is missing basic data (name/description/difficulty).");
        }
        // Uslov 2: >= 2 ključne tačke
        if (keyRepo.countByTourId(tourId) < 2) {
            throw new IllegalStateException("Tour must have at least two key points to be published.");
        }
        // Uslov 3: durations — bar jedan pozitivan
        Map<TransportType, Integer> durations = new EnumMap<>(TransportType.class);
        if (body != null && body.durations() != null) {
            for (var e : body.durations().entrySet()) {
                if (e.getValue() != null && e.getValue() > 0) {
                    durations.put(e.getKey(), e.getValue());
                }
            }
        }
        if (durations.isEmpty()) {
            throw new IllegalStateException("At least one transport duration must be provided (> 0 minutes).");
        }
        t.setDurations(durations);
        t.setStatus(Status.PUBLISHED);
        t.setPublishedAt(Instant.now());
        t.setArchivedAt(null);
        t = repo.save(t);
        return toDto(t);
    }

     @Transactional
    public TourResponse archive(UUID tourId, UUID authorId) {
        Tour t = repo.findById(tourId).orElseThrow(EntityNotFoundException::new);
        if (!Objects.equals(t.getAuthorId(), authorId)) {
            throw new IllegalStateException("Only author can archive their tour.");
        }
        t.setStatus(Status.ARCHIVED);
        t.setArchivedAt(Instant.now());
        t = repo.save(t);
        return toDto(t);
    }

     @Transactional
    public TourResponse unarchive(UUID tourId, UUID authorId) {
        Tour t = repo.findById(tourId).orElseThrow(EntityNotFoundException::new);
        if (!Objects.equals(t.getAuthorId(), authorId)) {
            throw new IllegalStateException("Only author can unarchive their tour.");
        }
        t.setStatus(Status.PUBLISHED);
        t.setArchivedAt(null);
        t = repo.save(t);
        return toDto(t);
    }

     private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

     private TourPublicResponse toPublicDto(Tour t) {
        var first = keyRepo.findFirstByTourIdOrderBySeqAsc(t.getId()).orElse(null);
        return new TourPublicResponse(
                t.getId(), t.getAuthorId(), t.getName(), t.getDescription(),
                t.getDifficulty(), t.getPriceCents(), t.getTags(), t.getLengthKm(),
                t.getDurations(),
                first != null ? first.getId() : null,
                first != null ? first.getName() : null,
                first != null ? first.getDescription() : null,
                first != null ? first.getLat() : null,
                first != null ? first.getLng() : null,
                first != null ? first.getImageUrl() : null,
                t.getPublishedAt()
        );
    }

   @Transactional(readOnly = true)
    public TourPublicResponse publicById(UUID id) {
        var t = repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Tour not found"));
        if (t.getStatus() != Status.PUBLISHED) {
            throw new IllegalStateException("Not published");
        }
        return toPublicDto(t); // izdvoj ovu map-funkciju koju već koristiš za listu
    }


}
