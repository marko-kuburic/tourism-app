package com.example.tour.controller;

import com.example.tour.dto.CreateTourReviewRequest;
import com.example.tour.dto.TourReviewResponse;
import com.example.tour.service.TourReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/tours/{tourId}/reviews")
public class TourReviewController {
    private final TourReviewService service;

    @GetMapping
    public ResponseEntity<List<TourReviewResponse>> list(@PathVariable UUID tourId) {
        return ResponseEntity.ok(service.listReviews(tourId));
    }

    @PostMapping
    public ResponseEntity<TourReviewResponse> create(HttpServletRequest req,
                                                     @PathVariable UUID tourId,
                                                     @RequestBody @Valid CreateTourReviewRequest body) {
        Object uidAttr = req.getAttribute("userId");
        UUID userId = (uidAttr instanceof UUID)
            ? (UUID) uidAttr
            : UUID.fromString(String.valueOf(uidAttr));
        String email = String.valueOf(req.getAttribute("email"));
        body.setTourId(tourId);
        TourReviewResponse created = service.createReview(userId, email, body);
        return ResponseEntity.ok(created);
    }
}
