package com.example.tour.purchase; 

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PurchaseClient {

    @Value("${purchase.base-url:http://purchase:8085}")
    private String base;

    private final RestTemplate restTemplate;

    /**
     * Pozivamo purchase servis i PROSLEĐUJEMO Authorization header korisnika,
     * da bi purchase iz tokena pročitao userId.
     */
    public boolean hasOwnership(UUID tourId, String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        if (authHeader != null && !authHeader.isBlank()) {
            headers.set("Authorization", authHeader);
        }
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> resp = restTemplate.exchange(
                base + "/ownership/tours/" + tourId,
                HttpMethod.GET,
                entity,
                Map.class
        );

        Map body = resp.getBody();
        return body != null && Boolean.TRUE.equals(body.get("owned"));
    }
}
