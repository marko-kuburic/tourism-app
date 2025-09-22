package com.example.tour.dto;

import com.example.tour.model.Difficulty;
import com.example.tour.model.TransportType;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Minimalni prikaz za turiste (objavljene ture + prva ključna tačka) */
public record TourPublicResponse(
    UUID id,
    UUID authorId,
    String name,
    String description,
    Difficulty difficulty,
    Long priceCents,
    Set<String> tags,
    Double lengthKm,
    Map<TransportType, Integer> durations,
    // Prva ključna tačka:
    UUID firstKeyPointId,
    String firstKeyPointName,
    String firstKeyPointDescription,
    Double firstKeyPointLat,
    Double firstKeyPointLng,
    String firstKeyPointImageUrl,
    Instant publishedAt
) {}
