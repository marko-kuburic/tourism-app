// src/main/java/com/example/tour/security/SecurityConfig.java
package com.example.tour.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // NOTE: hasAnyRole("GUIDE","ADMIN") očekuje da authorities izgledaju kao ROLE_GUIDE / ROLE_ADMIN
    // (tj. prefiks "ROLE_"). Ako već šalješ pune authorities bez prefiksa, koristi hasAnyAuthority.

    @Bean
    public JwtAuthFilter jwtAuthFilter(JwtService jwtService) {
        return new JwtAuthFilter(jwtService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthFilter jwtAuthFilter) throws Exception {
        http
            // CORS + stateless API
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Autorizacija ruta
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/actuator/health", "/error").permitAll()
                // public list/get (or switch to authenticated() if you prefer)
                .requestMatchers(HttpMethod.GET, "/tours", "/tours/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/whoami").authenticated()
                .requestMatchers(HttpMethod.GET, "/tours/mine").hasAnyRole("GUIDE","ADMIN")
                .requestMatchers(HttpMethod.POST, "/tours").hasAnyRole("GUIDE","ADMIN")
                .anyRequest().authenticated()
            )


            // JWT filter pre UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
