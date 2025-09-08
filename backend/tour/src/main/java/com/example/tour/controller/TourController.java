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

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TourController {

    private final TourService service;

    @GetMapping("/tours/mine")
    public ResponseEntity<List<TourResponse>> mine(HttpServletRequest req) {
        // Pretpostavka: JwtAuthFilter je već stavio userId u request attribute
        UUID userId = (UUID) req.getAttribute("userId");
        return ResponseEntity.ok(service.listMine(userId));
    }

    @PostMapping("/tours")
    public ResponseEntity<TourResponse> create(HttpServletRequest req,
                                               @RequestBody @Valid CreateTourRequest body) {
        UUID userId = (UUID) req.getAttribute("userId");
        return ResponseEntity.ok(service.create(userId, body));
    }
}
