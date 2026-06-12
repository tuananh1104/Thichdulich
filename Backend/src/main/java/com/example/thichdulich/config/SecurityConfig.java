package com.example.thichdulich.config;

import com.example.thichdulich.security.JwtAuthenticationFilter;
import com.example.thichdulich.security.OAuth2LoginSuccessHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
            JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(authz -> authz
                        // Public endpoints
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tours/recommendations").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/tours/*/messages").hasAnyRole("PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/tours/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tour-categories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tour-categories/admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/tour-categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tour-categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tour-categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/destinations/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/destinations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/destinations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/destinations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/tours/*/reviews").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/tour/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/contact").permitAll()
                        .requestMatchers("/api/ai/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/bank/webhook").permitAll()

                        // User endpoints
                        .requestMatchers(HttpMethod.GET, "/api/users/profile").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/profile").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/users/change-password").authenticated()
                        .requestMatchers("/api/users/interactions/**").authenticated()
                        .requestMatchers("/api/users/favorites/**").authenticated()
                        .requestMatchers("/api/uploads/**").authenticated()
                        .requestMatchers("/api/bookings/**").authenticated()
                        .requestMatchers("/api/payments/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reports/pending").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reports/tour/**").hasAnyRole("PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/reports").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/tours/*/reviews").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/reviews").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/tours/*/messages").hasAnyRole("PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/tours").hasAnyRole("PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tours/**").hasAnyRole("PROVIDER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tours/**").hasAnyRole("PROVIDER", "ADMIN")

                        // Provider endpoints
                        .requestMatchers("/api/provider/**").hasAnyRole("PROVIDER", "ADMIN")

                        // Admin endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/contact/**").hasRole("ADMIN")

                        // All other requests require authentication
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2.successHandler(oAuth2LoginSuccessHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
