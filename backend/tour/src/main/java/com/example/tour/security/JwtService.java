package com.example.tour.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;

@Service
public class JwtService {

    // proba redom: AUTH_JWT_SECRET, onda JWT_SECRET; ako ni to nema, bacaće grešku
    @Value("${AUTH_JWT_SECRET:${JWT_SECRET:}}")
    private String secret;

    // koliko sekundi tolerancije za klok skew (opciono)
    @Value("${JWT_CLOCK_SKEW_SECONDS:60}")
    private long clockSkewSeconds;

    private Key key() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret is not configured (AUTH_JWT_SECRET / JWT_SECRET).");
        }
        // HS256 očekuje 256-bit ključ; praktično dovoljno dugačak string
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .setAllowedClockSkewSeconds(clockSkewSeconds)
                .build()
                .parseClaimsJws(token)   // verifikuje potpis i exp
                .getBody();
    }
}
