// src/main/java/com/example/tour/grpc/TourGrpcService.java
package com.example.tour.grpc;

import com.example.tour.dto.TourResponse;
import com.example.tour.model.Difficulty;
import com.example.tour.model.Status;
import com.example.tour.service.TourService;
import io.grpc.StatusRuntimeException;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.UUID;

/**
 * gRPC servis prilagođen domen servisu koji radi sa DTO-ovima (TourResponse).
 * Napomena: generisane proto klase su u ovom istom paketu (com.example.tour.grpc)
 * zbog option java_package u .proto fajlu; zato:
 *  - Proto tipovi se koriste po kratkom imenu (CreateTourRequest, ListToursResponse, ...).
 *  - Naš DTO CreateTourRequest koristimo kao potpuno kvalifikovano ime
 *    (com.example.tour.dto.CreateTourRequest) da izbegnemo koliziju.
 */
@GrpcService
@RequiredArgsConstructor
public class TourGrpcService extends TourServiceGrpc.TourServiceImplBase {

    private final TourService domain;

    @Override
    public void listTours(ListToursRequest req, StreamObserver<ListToursResponse> out) {
        try {
            var tours = domain.listAll().stream()
                    .map(this::toGrpc) // TourResponse -> proto Tour
                    .toList();

            var resp = ListToursResponse.newBuilder()
                    .addAllItems(tours) // pretpostavka: repeated Tour items
                    .build();

            out.onNext(resp);
            out.onCompleted();
        } catch (Exception e) {
            out.onError(asInternal("Failed to list tours", e));
        }
    }

    @Override
    public void createTour(CreateTourRequest req, StreamObserver<CreateTourResponse> out) {
        try {
            var authorId = UUID.fromString(req.getAuthorId());

            // Proto šalje difficulty/status kao STRING -> mapiramo na domen enume
            Difficulty diff = Difficulty.valueOf(req.getDifficulty());
            Status status   = Status.valueOf(req.getStatus());

            var dto = com.example.tour.dto.CreateTourRequest.builder()
                    .name(req.getName())
                    .description(req.getDescription())
                    .difficulty(diff)
                    .status(status)
                    .priceCents(req.getPriceCents())
                    .tags(new HashSet<>(req.getTagsList()))
                    .build();

            TourResponse created = domain.create(authorId, dto);

            var resp = CreateTourResponse.newBuilder()
                    .setTour(toGrpc(created))
                    .build();

            out.onNext(resp);
            out.onCompleted();
        } catch (IllegalArgumentException iae) {
            // npr. loš UUID ili nepostojeća enum vrednost
            out.onError(Status.INVALID_ARGUMENT.withDescription(iae.getMessage()).withCause(iae).asRuntimeException());
        } catch (Exception e) {
            out.onError(asInternal("Failed to create tour", e));
        }
    }

    @Override
    public void deleteTour(DeleteTourRequest req, StreamObserver<DeleteTourResponse> out) {
        try {
            var id = UUID.fromString(req.getId());
            // Preporuka: domain.delete(UUID) neka bude idempotentno (bez greške ako ne postoji)
            domain.delete(id);
            out.onNext(DeleteTourResponse.newBuilder().build());
            out.onCompleted();
        } catch (IllegalArgumentException iae) {
            out.onError(Status.INVALID_ARGUMENT.withDescription("Invalid tour id").withCause(iae).asRuntimeException());
        } catch (Exception e) {
            out.onError(asInternal("Failed to delete tour", e));
        }
    }

    // -------------------------------------------------
    // Private helpers
    // -------------------------------------------------

    /** Mapira naš TourResponse DTO → proto Tour (generisano iz .proto). */
    private Tour toGrpc(TourResponse t) {
        var b = Tour.newBuilder()
                .setId(safeUuid(t.getId()))
                .setAuthorId(safeUuid(t.getAuthorId()))
                .setName(nz(t.getName()))
                .setDescription(nz(t.getDescription()))
                .setDifficulty(t.getDifficulty() != null ? t.getDifficulty().name() : "")
                .setPriceCents(t.getPriceCents() != null ? t.getPriceCents() : 0L);

        if (t.getStatus() != null) {
            b.setStatus(t.getStatus().name());
        }
        if (t.getTags() != null && !t.getTags().isEmpty()) {
            b.addAllTags(t.getTags());
        }
        if (t.getCreatedAt() != null) {
            b.setCreatedAt(formatInstant(t.getCreatedAt()));
        }
        if (t.getUpdatedAt() != null) {
            b.setUpdatedAt(formatInstant(t.getUpdatedAt()));
        }
        return b.build();
    }

    private static String formatInstant(Instant i) {
        return DateTimeFormatter.ISO_INSTANT.withZone(ZoneOffset.UTC).format(i);
    }

    private static String nz(String s) { return s == null ? "" : s; }

    private static String safeUuid(UUID u) { return u == null ? "" : u.toString(); }

    private static StatusRuntimeException asInternal(String msg, Throwable t) {
        return Status.INTERNAL.withDescription(msg).withCause(t).asRuntimeException();
    }
}
