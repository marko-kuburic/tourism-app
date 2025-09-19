//cat > src/main/java/com/example/tour/service/PositionSimulatorService.java <<'EOF'
package com.example.tour.service;

import com.example.tour.dto.LocationResponse;
import com.example.tour.dto.SetLocationRequest;
import com.example.tour.model.SimLocation;
import com.example.tour.repository.SimLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PositionSimulatorService {

    private final SimLocationRepository repo;

    @Transactional
    public LocationResponse upsert(UUID userId, SetLocationRequest req) {
        SimLocation loc = repo.findByUserId(userId)
                .orElseGet(() -> SimLocation.builder().userId(userId).build());
        loc.setLat(req.lat());
        loc.setLng(req.lng());
        SimLocation saved = repo.save(loc);
        return new LocationResponse(saved.getUserId(), saved.getLat(), saved.getLng(), saved.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public LocationResponse get(UUID userId) {
        SimLocation loc = repo.findByUserId(userId).orElseThrow(() -> new IllegalStateException("Location not set"));
        return new LocationResponse(loc.getUserId(), loc.getLat(), loc.getLng(), loc.getUpdatedAt());
    }
}
//EOF
