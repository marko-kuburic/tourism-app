package com.example.tour.dto;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TourReviewResponse {
    private UUID id;
    private UUID tourId;
    private UUID userId;
    private String username;
    private int rating;
    private String comment;
    private Instant createdAt;
}
