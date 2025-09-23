package com.example.tour.service;
import com.example.tour.dto.CreateKeyPointRequest;
import com.example.tour.dto.KeyPointResponse;
import com.example.tour.dto.UpdateKeyPointRequest;
import com.example.tour.model.KeyPoint;
import com.example.tour.repo.KeyPointRepository;
import com.example.tour.repo.TourRepository;
import com.example.tour.model.Tour;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.tour.repo.KeyPointRepository;
import com.example.tour.repo.TourRepository;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KeyPointService {

    private final KeyPointRepository keyRepo;
    private final TourRepository tourRepo;

    @Transactional(readOnly = true)
    public List<KeyPointResponse> list(UUID tourId) {
        return keyRepo.findByTourIdOrderBySeqAsc(tourId).stream().map(this::toDto).toList();
    }

    @Transactional
    public KeyPointResponse create(UUID userId, UUID tourId, CreateKeyPointRequest req) {
        Tour t = tourRepo.findById(tourId).orElseThrow();
        int nextSeq = keyRepo.findTopByTourIdOrderBySeqDesc(tourId).map(k -> k.getSeq() + 1).orElse(0);
        KeyPoint kp = KeyPoint.builder()
                .tourId(tourId)
                .name(req.name())
                .description(req.description())
                .lat(req.lat())
                .lng(req.lng())
                .imageUrl(req.imageUrl())
                .seq(nextSeq)
                .build();
        kp = keyRepo.save(kp);
        recalcLengthKm(t);
        return toDto(kp);
    }

    @Transactional
    public KeyPointResponse update(UUID userId, UUID tourId, UUID keyPointId, UpdateKeyPointRequest req) {
        KeyPoint kp = keyRepo.findById(keyPointId).orElseThrow();
        kp.setName(req.name());
        kp.setDescription(req.description());
        kp.setLat(req.lat());
        kp.setLng(req.lng());
        kp.setImageUrl(req.imageUrl());
        if (req.seq() != null) kp.setSeq(req.seq());
        KeyPoint saved = keyRepo.save(kp);
        Tour t = tourRepo.findById(tourId).orElseThrow();
        recalcLengthKm(t);
        return toDto(saved);
    }

    @Transactional
    public void delete(UUID userId, UUID tourId, UUID keyPointId) {
        keyRepo.deleteById(keyPointId);
        Tour t = tourRepo.findById(tourId).orElseThrow();
        recalcLengthKm(t);
    }

    private void recalcLengthKm(Tour t) {
        var points = keyRepo.findByTourIdOrderBySeqAsc(t.getId());
        double sumKm = 0.0;
        for (int i = 1; i < points.size(); i++) {
            sumKm += haversineKm(points.get(i-1).getLat(), points.get(i-1).getLng(),
                                 points.get(i).getLat(), points.get(i).getLng());
        }
        t.setLengthKm(points.size() >= 2 ? sumKm : null);
        tourRepo.save(t);
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0088; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2)*Math.sin(dLat/2) +
                   Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))*
                   Math.sin(dLon/2)*Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
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
