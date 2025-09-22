
package com.example.tour.repo;

import com.example.tour.model.KeyPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KeyPointRepository extends JpaRepository<KeyPoint, UUID> {
    List<KeyPoint> findByTourIdOrderBySeqAsc(UUID tourId);
    Optional<KeyPoint> findTopByTourIdOrderBySeqDesc(UUID tourId);
    long countByTourId(UUID tourId);
}
//EOF
