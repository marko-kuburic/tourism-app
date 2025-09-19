//cat > src/main/java/com/example/tour/dto/CreateKeyPointRequest.java <<'EOF'
package com.example.tour.dto;

import jakarta.validation.constraints.*;

public record CreateKeyPointRequest(
        @NotBlank String name,
        @NotBlank String description,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double lng,
        String imageUrl
) {}
//EOF
