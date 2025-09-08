package com.example.tour.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import java.util.UUID;

public class JwtUtil {

    // vraća user_id kao UUID iz HS256 JWT-a
    public static UUID extractUserId(String bearer, String secret) {
        if (bearer == null || !bearer.startsWith("Bearer ")) return null;
        String token = bearer.substring("Bearer ".length()).trim();

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secret.getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody();

        Object val = claims.get("user_id");
        if (val == null) return null;
        return UUID.fromString(val.toString());
    }
}
