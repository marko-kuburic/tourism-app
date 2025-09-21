package com.example.tour.dto;

import lombok.*;
import java.util.UUID;
import jakarta.validation.constraints.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateTourReviewRequest {
    @NotNull private UUID tourId;
    @Min(1) @Max(5) private int rating;
    @Size(max = 2048) private String comment;
}
