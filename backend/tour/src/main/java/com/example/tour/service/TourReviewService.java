package com.example.tour.service;

// ...existing code...

import com.example.tour.dto.CreateTourReviewRequest;
import com.example.tour.dto.TourReviewResponse;
import com.example.tour.model.TourReview;
import com.example.tour.repo.TourReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TourReviewService {
    private final TourReviewRepository repo;
    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
    private final String userServiceBaseUrl = "http://gateway:8080/stakeholders";

    @Transactional
    public TourReviewResponse createReview(UUID userId, String email, CreateTourReviewRequest req) {
        // Provera da li je korisnik turist
        String role = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
            .map(a -> a.getAuthority())
            .filter(r -> r.equalsIgnoreCase("ROLE_TOURIST"))
            .findFirst()
            .orElse(null);
        if (role == null) {
            throw new org.springframework.security.access.AccessDeniedException("Only tourists can leave reviews.");
        }
        TourReview review = TourReview.builder()
            .tourId(req.getTourId())
            .userId(userId)
            .rating(req.getRating())
            .comment(req.getComment())
            .build();
        TourReview saved = repo.save(review);
        return toDto(saved, email);
    }

    @Transactional(readOnly = true)
    public List<TourReviewResponse> listReviews(UUID tourId) {
        return repo.findAllByTourId(tourId)
            .stream()
            .map(r -> {
                String username = null;
                try {
                    String url = userServiceBaseUrl + "/users/" + r.getUserId();
                    var resp = restTemplate.getForEntity(url, java.util.Map.class);
                    if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                        Object usernameObj = resp.getBody().get("username");
                        if (usernameObj != null) username = usernameObj.toString();
                        System.out.println("[TourReviewService] User response: " + resp.getBody());
                    }
                } catch (Exception ex) {
                    System.out.println("[TourReviewService] Error fetching user via gateway: " + ex);
                }
                return toDto(r, username);
            })
            .toList();
    }

    // DTO za deserializaciju odgovora stakeholders servisa
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    @lombok.Getter @lombok.Setter
    public static class UserResponse {
        private String email;
    }

    private TourReviewResponse toDto(TourReview r, String username) {
        return TourReviewResponse.builder()
            .id(r.getId())
            .tourId(r.getTourId())
            .userId(r.getUserId())
            .username(username)
            .rating(r.getRating())
            .comment(r.getComment())
            .createdAt(r.getCreatedAt())
            .build();
    }
}
