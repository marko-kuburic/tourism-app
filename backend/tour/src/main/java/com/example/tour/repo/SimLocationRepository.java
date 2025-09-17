//cat > src/main/java/com/example/tour/repository/SimLocationRepository.java <<'EOF'
package com.example.tour.repository;

import com.example.tour.model.SimLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SimLocationRepository extends JpaRepository<SimLocation, UUID> {
    Optional<SimLocation> findByUserId(UUID userId);
}
//EOF
