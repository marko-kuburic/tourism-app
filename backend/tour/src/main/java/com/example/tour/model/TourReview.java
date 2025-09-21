package com.example.tour.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tour_reviews", indexes = {
    @Index(name = "idx_tour_reviews_tour", columnList = "tour_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TourReview {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(name = "tour_id", length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private UUID tourId;

    @Column(name = "user_id", length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private UUID userId;

    @Column(nullable = false)
    private int rating; // 1-5

    @Column(length = 2048)
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
