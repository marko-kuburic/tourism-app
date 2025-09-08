// src/main/java/com/example/tour/dto/TourResponse.java
package com.example.tour.dto;

import com.example.tour.model.Difficulty;
import com.example.tour.model.Status;
import lombok.*;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class TourResponse {
    private UUID id;
    private UUID authorId;
    private String name;
    private String description;
    private Difficulty difficulty;
    private Status status;
    private Long priceCents;
    private Set<String> tags;
    private Instant createdAt;
    private Instant updatedAt;
}
