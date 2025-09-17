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
    @Column(length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private UUID id;   // ⬅ UUID in Java, CHAR(36) in DB

    @Column(name = "author_id", length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private UUID authorId;   // ⬅ UUID in Java, CHAR(36) in DB

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Status status;

    @Column(name = "price_cents", nullable = false)
    private Long priceCents;

    @ElementCollection
    @CollectionTable(name = "tour_tags", joinColumns = @JoinColumn(name = "tour_id"))
    @Column(name = "tag", length = 64, nullable = false)
    @Builder.Default
    private Set<String> tags = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
