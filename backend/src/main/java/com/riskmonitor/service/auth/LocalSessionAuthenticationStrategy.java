package com.riskmonitor.service.auth;

import com.riskmonitor.repository.AppUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Primary
@Profile("local")
public class LocalSessionAuthenticationStrategy
        extends GoogleHeaderAuthenticationStrategy {

    private final AppUserRepository userRepository;

    public LocalSessionAuthenticationStrategy(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public String resolveUserId(HttpServletRequest request) {
        String header = request.getHeader("X-Local-User-Id");
        if (header == null || header.isBlank()) {
            throw new IllegalArgumentException("Missing X-Local-User-Id header");
        }
        UUID userId;
        try {
            userId = UUID.fromString(header.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Malformed X-Local-User-Id header: not a UUID");
        }
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("Unknown local user: " + userId);
        }
        return userId.toString();
    }
}
