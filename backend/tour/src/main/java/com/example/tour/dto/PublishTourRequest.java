package com.example.tour.dto;

import com.example.tour.model.TransportType;
import jakarta.validation.constraints.Min;

import java.util.Map;

/** Body za objavu ture: najmanje jedan tip prevoza mora postojati i biti > 0 */
public record PublishTourRequest(
    Map<TransportType, @Min(1) Integer> durations
) {}
