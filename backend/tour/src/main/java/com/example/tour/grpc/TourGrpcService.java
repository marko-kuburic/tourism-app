// src/main/java/com/example/tour/grpc/TourGrpcService.java
package com.example.tour.grpc;

import com.example.tour.model.Difficulty;
import com.example.tour.model.Status;
import com.example.tour.model.Tour;
import com.example.tour.repo.TourRepository;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@GrpcService
public class TourGrpcService extends TourServiceGrpc.TourServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(TourGrpcService.class);

    private final TourRepository tourRepository;

    public TourGrpcService(TourRepository tourRepository) {
        this.tourRepository = tourRepository;
        log.info("TourGrpcService initialized");
    }

    /* =======================
       Helpers: mapping Entity → gRPC
       ======================= */
    private com.example.tour.grpc.Tour toGrpc(Tour t) {
        com.example.tour.grpc.Tour.Builder b = com.example.tour.grpc.Tour.newBuilder();

        // Expect standard getters on your entity (no Lombok required if you implement them manually)
        if (t.getId() != null)        b.setId(t.getId().toString());
        if (t.getAuthorId() != null)  b.setAuthorId(t.getAuthorId().toString());

        b.setName(t.getName() == null ? "" : t.getName());
        b.setDescription(t.getDescription() == null ? "" : t.getDescription());
        b.setDifficulty(t.getDifficulty() != null ? t.getDifficulty().name() : Difficulty.EASY.name());
        b.setStatus(t.getStatus() != null ? t.getStatus().name() : Status.DRAFT.name());
        b.setPriceCents(t.getPriceCents() == null ? 0L : t.getPriceCents());

        Instant created = t.getCreatedAt();
        if (created != null) b.setCreatedAt(created.toEpochMilli());
        Instant updated = t.getUpdatedAt();
        if (updated != null) b.setUpdatedAt(updated.toEpochMilli());

        return b.build();
    }

    /* =======================
       gRPC methods
       ======================= */

    @Override
    public void listTours(ListToursRequest request, StreamObserver<ListToursResponse> responseObserver) {
        List<Tour> all = tourRepository.findAll();
        List<com.example.tour.grpc.Tour> items = all.stream()
                .map(this::toGrpc)
                .collect(Collectors.toList());

        responseObserver.onNext(ListToursResponse.newBuilder().addAllItems(items).build());
        responseObserver.onCompleted();
    }

    @Override
    public void createTour(CreateTourRequest request, StreamObserver<CreateTourResponse> responseObserver) {
        try {
            UUID authorId = uuidOrError(request.getAuthorId(), "authorId");
            String name = request.getName();
            if (name == null || name.isBlank()) {
                throw invalidArg("name must not be blank");
            }

            Difficulty difficulty = safeDifficulty(request.getDifficulty());
            Status status = Status.DRAFT; // or derive from request if needed

            // ---- No Lombok: use setters or an explicit constructor you define on the entity ----
            Tour entity = new Tour();
            entity.setId(UUID.randomUUID());
            entity.setAuthorId(authorId);
            entity.setName(name.trim());
            entity.setDescription(request.getDescription());
            entity.setDifficulty(difficulty);
            entity.setStatus(status);
            entity.setPriceCents(request.getPriceCents());
            // createdAt/updatedAt: let DB/defaults/listeners handle, or set here if you prefer

            Tour saved = tourRepository.save(entity);

            responseObserver.onNext(CreateTourResponse.newBuilder().setTour(toGrpc(saved)).build());
            responseObserver.onCompleted();
        } catch (StatusRuntimeException sre) {
            log.warn("CreateTour rejected: {}", sre.getStatus().getDescription());
            responseObserver.onError(sre);
        } catch (Exception e) {
            log.error("CreateTour failed", e);
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Failed to create tour")
                    .withCause(e)
                    .asRuntimeException());
        }
    }

    @Override
    public void deleteTour(DeleteTourRequest request, StreamObserver<DeleteTourResponse> responseObserver) {
        try {
            UUID id = uuidOrError(request.getId(), "id");
            if (tourRepository.existsById(id)) {
                tourRepository.deleteById(id);
            }
            responseObserver.onNext(DeleteTourResponse.newBuilder().build());
            responseObserver.onCompleted();
        } catch (StatusRuntimeException sre) {
            responseObserver.onError(sre);
        } catch (Exception e) {
            log.error("DeleteTour failed", e);
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Failed to delete tour")
                    .withCause(e)
                    .asRuntimeException());
        }
    }

    /* =======================
       Small utils (no Lombok)
       ======================= */

    private static UUID uuidOrError(String raw, String fieldName) {
        if (raw == null || raw.isBlank()) {
            throw invalidArg(fieldName + " is required and must be a UUID");
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            throw invalidArg(fieldName + " must be a valid UUID");
        }
    }

    private static StatusRuntimeException invalidArg(String msg) {
        // Fully-qualify gRPC Status to avoid clashing with your model Status enum
        return io.grpc.Status.INVALID_ARGUMENT.withDescription(msg).asRuntimeException();
    }

    private static Difficulty safeDifficulty(String raw) {
        if (raw == null || raw.isBlank()) return Difficulty.EASY;
        try {
            return Difficulty.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return Difficulty.EASY; // fallback
        }
    }
}
