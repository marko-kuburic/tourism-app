//cat > src/main/java/com/example/tour/controller/PositionSimulatorController.java <<'EOF'
package com.example.tour.controller;

import com.example.tour.dto.LocationResponse;
import com.example.tour.dto.SetLocationRequest;
import com.example.tour.service.PositionSimulatorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@RestController
@RequestMapping("/api/simulator")
@RequiredArgsConstructor
public class PositionSimulatorController {

    private final PositionSimulatorService service;

    @PutMapping("/position")
    public ResponseEntity<LocationResponse> put(HttpServletRequest req,
                                                @RequestBody @Valid SetLocationRequest body) {
        UUID userId = (UUID) req.getAttribute("userId");
        return ResponseEntity.ok(service.upsert(userId, body));
    }

    @GetMapping("/position")
    public ResponseEntity<LocationResponse> get(HttpServletRequest req) {
        UUID userId = (UUID) req.getAttribute("userId");
        return ResponseEntity.ok(service.get(userId));
    }
}
//EOF
