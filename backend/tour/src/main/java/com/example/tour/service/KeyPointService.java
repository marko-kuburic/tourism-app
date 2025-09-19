//cat > src/main/java/com/example/tour/service/KeyPointService.java <<'EOF'
package com.example.tour.service;

import com.example.tour.dto.CreateKeyPointRequest;
import com.example.tour.dto.KeyPointResponse;
import com.example.tour.dto.UpdateKeyPointRequest;
import com.example.tour.model.Tour;
import com.example.tour.model.KeyPoint;
import com.example.tour.repository.KeyPointRepository;
import com.example.tour.repository.TourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KeyPointService {

    private final KeyPointRepository keyPointRepo;
    private final TourRepository tourRepo;

    private void ensureAuthor(UUID userId, UUID tourId) {
        Tour t = tourRepo.findById(tourId).orElseThrow(() -> new IllegalArgumentException("Tour not found"));
        if (!t.getAuthorId().equals(userId)) {
            throw new SecurityException("Only author can modify key points");
        }
    }

    @Transactional(readOnly = true)
    public List<KeyPointResponse> list(UUID tourId) {
        return keyPointRepo.findByTourIdOrderBySeqAsc(tourId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public KeyPointResponse create(UUID userId, UUID tourId, CreateKeyPointRequest body) {
        ensureAuthor(userId, tourId);
        int nextSeq = keyPointRepo.findTopByTourIdOrderBySeqDesc(tourId)
                .map(kp -> kp.getSeq() + 1).orElse(0);

        KeyPoint kp = KeyPoint.builder()
                .tourId(tourId)
                .name(body.name())
                .description(body.description())
                .lat(body.lat())
                .lng(body.lng())
                .imageUrl(body.imageUrl())
                .seq(nextSeq)
                .build();

        return toDto(keyPointRepo.saveAndFlush(kp));
    }

    @Transactional
    public KeyPointResponse update(UUID userId, UUID tourId, UUID keyPointId, UpdateKeyPointRequest body) {
        ensureAuthor(userId, tourId);
        KeyPoint kp = keyPointRepo.findById(keyPointId)
                .orElseThrow(() -> new IllegalArgumentException("KeyPoint not found"));
        if (!kp.getTourId().equals(tourId)) {
            throw new IllegalArgumentException("KeyPoint does not belong to tour");
        }

        kp.setName(body.name());
        kp.setDescription(body.description());
        kp.setLat(body.lat());
        kp.setLng(body.lng());
        kp.setImageUrl(body.imageUrl());
        if (body.seq() != null) kp.setSeq(body.seq());

        return toDto(keyPointRepo.saveAndFlush(kp));
    }

    @Transactional
    public void delete(UUID userId, UUID tourId, UUID keyPointId) {
        ensureAuthor(userId, tourId);
        KeyPoint kp = keyPointRepo.findById(keyPointId)
                .orElseThrow(() -> new IllegalArgumentException("KeyPoint not found"));
        if (!kp.getTourId().equals(tourId)) {
            throw new IllegalArgumentException("KeyPoint does not belong to tour");
        }
        keyPointRepo.delete(kp);
    }

    private KeyPointResponse toDto(KeyPoint kp) {
        return new KeyPointResponse(
                kp.getId(),
                kp.getTourId(),
                kp.getName(),
                kp.getDescription(),
                kp.getLat(),
                kp.getLng(),
                kp.getImageUrl(),
                kp.getSeq(),
                kp.getCreatedAt(),
                kp.getUpdatedAt()
        );
    }
}
//EOF
