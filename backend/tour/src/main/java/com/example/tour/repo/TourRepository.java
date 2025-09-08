// src/main/java/com/example/tour/repository/TourRepository.java
package com.example.tour.repository;

import com.example.tour.model.Tour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TourRepository extends JpaRepository<Tour, UUID> {
    List<Tour> findAllByAuthorId(UUID authorId);
}
