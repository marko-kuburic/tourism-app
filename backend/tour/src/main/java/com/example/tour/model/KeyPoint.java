//cat > src/main/java/com/example/tour/model/KeyPoint.java <<'EOF'
package com.example.tour.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "key_points",
       indexes = {
           @Index(name = "idx_key_points_tour", columnList = "tour_id"),
           @Index(name = "idx_key_points_tour_seq", columnList = "tour_id,seq")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KeyPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(name = "tour_id", nullable = false,columnDefinition = "char(36)", length = 36)
    private UUID tourId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 2048)
    private String description;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @Column(name = "image_url")
    private String imageUrl;

    /** 0-based redosled tačke na ruti */
    @Column(nullable = false)
    private int seq;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
//EOF
