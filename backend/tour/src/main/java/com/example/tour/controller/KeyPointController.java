//cat > src/main/java/com/example/tour/controller/KeyPointController.java <<'EOF'
package com.example.tour.controller;

import com.example.tour.dto.CreateKeyPointRequest;
import com.example.tour.dto.KeyPointResponse;
import com.example.tour.dto.UpdateKeyPointRequest;
import com.example.tour.service.KeyPointService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class KeyPointController {

    private final KeyPointService service;

    @GetMapping("/tours/{tourId}/keypoints")
    public ResponseEntity<List<KeyPointResponse>> list(@PathVariable UUID tourId) {
        return ResponseEntity.ok(service.list(tourId));
    }

    @PostMapping("/tours/{tourId}/keypoints")
    public ResponseEntity<KeyPointResponse> create(HttpServletRequest req,
                                                   @PathVariable UUID tourId,
                                                   @RequestBody @Valid CreateKeyPointRequest body) {
        UUID userId = (UUID) req.getAttribute("userId");
        return ResponseEntity.ok(service.create(userId, tourId, body));
    }

    @PutMapping("/tours/{tourId}/keypoints/{keyPointId}")
    public ResponseEntity<KeyPointResponse> update(HttpServletRequest req,
                                                   @PathVariable UUID tourId,
                                                   @PathVariable UUID keyPointId,
                                                   @RequestBody @Valid UpdateKeyPointRequest body) {
        UUID userId = (UUID) req.getAttribute("userId");
        return ResponseEntity.ok(service.update(userId, tourId, keyPointId, body));
    }

    @DeleteMapping("/tours/{tourId}/keypoints/{keyPointId}")
    public ResponseEntity<Void> delete(HttpServletRequest req,
                                       @PathVariable UUID tourId,
                                       @PathVariable UUID keyPointId) {
        UUID userId = (UUID) req.getAttribute("userId");
        service.delete(userId, tourId, keyPointId);
        return ResponseEntity.noContent().build();
    }
}
//EOF
