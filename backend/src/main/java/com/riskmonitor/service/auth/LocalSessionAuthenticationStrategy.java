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
// Local profile authentication is request-scoped by design: the user id is read
// from the current HTTP request header and no server-side session state is kept.
public class LocalSessionAuthenticationStrategy
        extends HeaderUserIdAuthenticationStrategy {

    private final AppUserRepository userRepository;

    public LocalSessionAuthenticationStrategy(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public String resolveUserId(HttpServletRequest request) {
        String header = request.getHeader("X-User-Id");
        if (header == null || header.isBlank()) {
            throw new IllegalArgumentException("Missing X-User-Id header");
        }
        UUID userId;
        try {
            userId = UUID.fromString(header.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Malformed X-User-Id header: not a UUID");
        }
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("Unknown local user: " + userId);
        }
        return userId.toString();
    }
}
