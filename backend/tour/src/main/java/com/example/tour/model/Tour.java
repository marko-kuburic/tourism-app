// src/main/java/com/example/tour/model/Tour.java
package com.example.tour.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "tours")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Tour {

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "author_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID authorId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status; // KORISTI top-level enum Status

    @Column(name = "price_cents", nullable = false)
    private Long priceCents;

    @ElementCollection
    @CollectionTable(name = "tour_tags", joinColumns = @JoinColumn(name = "tour_id"))
    @Column(name = "tag", length = 64, nullable = false)
    @Builder.Default
    private Set<String> tags = new HashSet<>(); // inicijalizovano da ne bude null

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
