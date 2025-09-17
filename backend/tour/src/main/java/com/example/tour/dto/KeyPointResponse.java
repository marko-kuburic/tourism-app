//cat > src/main/java/com/example/tour/dto/KeyPointResponse.java <<'EOF'
package com.example.tour.dto;

import java.time.Instant;
import java.util.UUID;

public record KeyPointResponse(
        UUID id,
        UUID tourId,
        String name,
        String description,
        double lat,
        double lng,
        String imageUrl,
        int seq,
        Instant createdAt,
        Instant updatedAt
) {}
//EOF
