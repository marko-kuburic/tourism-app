//cat > src/main/java/com/example/tour/model/SimLocation.java <<'EOF'
package com.example.tour.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sim_locations",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_sim_locations_user", columnNames = {"user_id"})
    })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SimLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
//EOF
