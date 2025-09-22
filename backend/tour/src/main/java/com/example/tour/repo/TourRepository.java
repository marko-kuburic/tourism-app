
package com.example.tour.repo;

import com.example.tour.model.Tour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TourRepository extends JpaRepository<Tour, UUID> {
    List<Tour> findByAuthorId(UUID authorId);
}
