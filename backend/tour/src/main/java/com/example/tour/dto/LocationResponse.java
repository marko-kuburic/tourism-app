//cat > src/main/java/com/example/tour/dto/LocationResponse.java <<'EOF'
package com.example.tour.dto;

import java.time.Instant;
import java.util.UUID;

public record LocationResponse(
        UUID userId,
        double lat,
        double lng,
        Instant updatedAt
) {}
//EOF
