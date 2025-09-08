// src/main/java/com/example/tour/dto/CreateTourRequest.java
package com.example.tour.dto;

import com.example.tour.model.Difficulty;
import lombok.*;

import java.util.Set;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CreateTourRequest {
    private String name;
    private String description;
    private Difficulty difficulty;
    private Long priceCents;
    private Set<String> tags;
}
