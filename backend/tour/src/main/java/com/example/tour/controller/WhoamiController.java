package com.example.tour.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
public class WhoamiController {

    @GetMapping("/whoami")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> whoami(HttpServletRequest req) {
        UUID userId = (UUID) req.getAttribute("userId");
        String email = (String) req.getAttribute("email");
        String role  = (String) req.getAttribute("role");

        if (userId == null) {
            // Ako filter nije postavio a endpoint je zaštićen, vrati 401
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(Map.of(
                "userId", userId.toString(),
                "email",  email,
                "role",   role
        ));
    }
}
