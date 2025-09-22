// src/main/java/com/example/tour/controller/TourController.java
package com.example.tour.controller;

import com.example.tour.dto.CreateTourRequest;
import com.example.tour.dto.TourResponse;
import com.example.tour.service.TourService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import com.example.tour.dto.PublishTourRequest;
import com.example.tour.dto.TourPublicResponse;


import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/tours")
public class TourController {

    private final TourService service;

    @GetMapping
    public ResponseEntity<List<TourResponse>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TourResponse> getOne(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<TourResponse>> mine(HttpServletRequest req) {
        Object uidAttr = req.getAttribute("userId");
        UUID userId = (uidAttr instanceof UUID)
            ? (UUID) uidAttr
            : UUID.fromString(String.valueOf(uidAttr));

        return ResponseEntity.ok(service.listMine(userId));
    }

    @PostMapping
    public ResponseEntity<TourResponse> create(HttpServletRequest req,
                                               @RequestBody @Valid CreateTourRequest body) {
        Object uidAttr = req.getAttribute("userId");
        UUID userId = (uidAttr instanceof UUID)
                ? (UUID) uidAttr
                : UUID.fromString(String.valueOf(uidAttr));

        TourResponse created = service.create(userId, body);

        // ⬇⬇ ključna ispravka: koristimo getter umesto record accessor-a
        URI location = (created.getId() != null)
                ? URI.create("/tours/" + created.getId())
                : URI.create("/tours");

        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/public")
    public ResponseEntity<List<TourPublicResponse>> listPublic() {
        return ResponseEntity.ok(service.listPublishedForTourists());
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<TourResponse> publish(HttpServletRequest req,
                                                @PathVariable UUID id,
                                                @Valid @RequestBody PublishTourRequest body) {
        UUID userId = extractUserId(req);
        return ResponseEntity.ok(service.publish(id, userId, body));
    }

     @PostMapping("/{id}/archive")
    public ResponseEntity<TourResponse> archive(HttpServletRequest req, @PathVariable UUID id) {
        UUID userId = extractUserId(req);
        return ResponseEntity.ok(service.archive(id, userId));
    }

    @PostMapping("/{id}/unarchive")
    public ResponseEntity<TourResponse> unarchive(HttpServletRequest req, @PathVariable UUID id) {
        UUID userId = extractUserId(req);
        return ResponseEntity.ok(service.unarchive(id, userId));
    }

    private UUID extractUserId(HttpServletRequest req) {
        Object uidAttr = req.getAttribute("userId");
        if (uidAttr instanceof UUID u) return u;
        if (uidAttr != null) return UUID.fromString(String.valueOf(uidAttr));
        throw new IllegalStateException("Missing userId in request (gateway should set it).");
    }
}
