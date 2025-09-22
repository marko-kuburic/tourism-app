package com.example.tour.grpc;

import com.example.tour.dto.CreateTourRequest;
import com.example.tour.dto.TourResponse;
import com.example.tour.model.Difficulty;
import com.example.tour.service.TourService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;
import tour.v1.CreateTourRequest as GrpcCreateTourRequest; // alias nije dozvoljen u Javi – vidi napomenu ispod
import tour.v1.CreateTourResponse;
import tour.v1.DeleteTourRequest;
import tour.v1.DeleteTourResponse;
import tour.v1.ListToursRequest;
import tour.v1.ListToursResponse;
import tour.v1.TourServiceGrpc;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * gRPC servis prilagođen TourService koji radi sa DTO-ovima (TourResponse).
 *
 * NAPOMENA: Java ne dozvoljava alias import-a. Ispod u kodu koristimo potpuna imena
 * za proto poruke kada se sudaraju nazivi sa našim DTO klasama.
 */
@GrpcService
@RequiredArgsConstructor
public class TourGrpcService extends TourServiceGrpc.TourServiceImplBase {

    private final TourService domain;

    @Override
    public void listTours(ListToursRequest req, StreamObserver<ListToursResponse> out) {
        try {
            // Ako želiš filtriranje po authorId (ako proto dodate polje), ovde možeš granati.
            var tours = domain.listAll().stream()
                    .map(this::toGrpc)   // mapiramo iz TourResponse DTO → proto Tour
                    .collect(Collectors.toList());

            var resp = ListToursResponse.newBuilder()
                    .addAllItems(tours)  // pretpostavka: proto ListToursResponse ima "repeated Tour items"
                    .build();

            out.onNext(resp);
            out.onCompleted();
        } catch (Exception e) {
            out.onError(Status.INTERNAL.withDescription("Failed to list tours").withCause(e).asRuntimeException());
        }
    }

    @Override
    public void createTour(tour.v1.CreateTourRequest req, StreamObserver<CreateTourResponse> out) {
        try {
            var authorId = UUID.fromString(req.getAuthorId());

            // Proto šalje difficulty kao string – mapiramo na domen enum
            Difficulty diff = Difficulty.valueOf(req.getDifficulty());

            var dto = CreateTourRequest.builder()
                    .name(req.getName())
                    .description(req.getDescription())
                    .difficulty(diff)
                    .status(Status.valueOf(req.getStatus()))
                    .priceCents(req.getPriceCents())
                    .tags(new HashSet<>(req.getTagsList()))
                    .build();

            TourResponse created = domain.create(authorId, dto);

            var resp = CreateTourResponse.newBuilder()
                    .setTour(toGrpc(created))  // vraćamo ceo tour objekat
                    .build();

            out.onNext(resp);
            out.onCompleted();
        } catch (IllegalArgumentException iae) {
            out.onError(Status.INVALID_ARGUMENT.withDescription(iae.getMessage()).withCause(iae).asRuntimeException());
        } catch (Exception e) {
            out.onError(Status.INTERNAL.withDescription("Failed to create tour").withCause(e).asRuntimeException());
        }
    }

    @Override
    public void deleteTour(DeleteTourRequest req, StreamObserver<DeleteTourResponse> out) {
        try {
            var id = UUID.fromString(req.getId());
            domain.delete(id);  
            out.onNext(DeleteTourResponse.newBuilder().build());
            out.onCompleted();
        } catch (IllegalArgumentException iae) {
            out.onError(Status.INVALID_ARGUMENT.withDescription("Invalid tour id").withCause(iae).asRuntimeException());
        } catch (Exception e) {
            out.onError(Status.INTERNAL.withDescription("Failed to delete tour").withCause(e).asRuntimeException());
        }
    }

    // -------------------------------------------------
    // Private helpers
    // -------------------------------------------------

    private tour.v1.Tour toGrpc(TourResponse t) {
        var b = tour.v1.Tour.newBuilder()
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


}
