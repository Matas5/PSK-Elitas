package com.riskmonitor.service.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class GoogleHeaderAuthenticationStrategy implements AuthenticationStrategy {

    @Override
    public String resolveUserId(HttpServletRequest request) {
        String userId = request.getHeader("X-Google-User-Id");
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("Missing X-Google-User-Id header");
        }
        return userId;
    }
}
