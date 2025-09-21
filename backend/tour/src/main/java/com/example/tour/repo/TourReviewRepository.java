package com.example.tour.repo;

import com.example.tour.model.TourReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TourReviewRepository extends JpaRepository<TourReview, UUID> {
    List<TourReview> findAllByTourId(UUID tourId);
}
