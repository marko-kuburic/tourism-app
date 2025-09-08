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

    // Registrujemo JwtAuthFilter kao bean da bi Spring mogao da ga injektuje
    @Bean
    public JwtAuthFilter jwtAuthFilter(JwtService jwtService) {
        return new JwtAuthFilter(jwtService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthFilter jwtAuthFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> {
                // 401 za neautentifikovane; 403 za nedozvoljene
                // (može i custom entry point ako želiš JSON poruke)
            })
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/whoami").authenticated()
                .requestMatchers(HttpMethod.GET, "/tours/mine").hasAnyRole("GUIDE","ADMIN")
                .requestMatchers(HttpMethod.POST, "/tours").hasAnyRole("GUIDE","ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
