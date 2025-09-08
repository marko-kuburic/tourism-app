package com.example.tour.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;

    public JwtAuthFilter(JwtService jwt) {
        this.jwt = jwt;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String auth = req.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        String token = auth.substring("Bearer ".length()).trim();

        Claims claims;
        try {
            claims = jwt.parse(token); // <— hvataj isključivo parse greške
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
            res.setCharacterEncoding(StandardCharsets.UTF_8.name());
            res.getWriter().write("{\"error\":\"invalid or expired token\"}");
            return;
        }

        String email    = String.valueOf(claims.get("email"));
        String role     = String.valueOf(claims.get("role"));
        String userIdStr= String.valueOf(claims.get("user_id"));

        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT)));
        var authToken   = new UsernamePasswordAuthenticationToken(email, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authToken);

        if (userIdStr != null && !"null".equals(userIdStr)) {
            try { req.setAttribute("userId", UUID.fromString(userIdStr)); } catch (Exception ignored) {}
        }
        req.setAttribute("email", email);
        req.setAttribute("role", role);

        // VAŽNO: van try-catch bloka
        chain.doFilter(req, res);
    }

}
