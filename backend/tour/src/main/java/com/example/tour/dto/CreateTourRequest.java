// src/main/java/com/example/tour/dto/CreateTourRequest.java
package com.example.tour.dto;

import com.example.tour.model.Difficulty;
import lombok.*;

import java.util.Set;

import jakarta.validation.constraints.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CreateTourRequest {
    @NotBlank private String name;
    @NotBlank private String description;
    @NotNull  private Difficulty difficulty;
    @NotNull @Min(1) private Long priceCents;
    private Set<String> tags;
}