package com.riskmonitor.service.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class HeaderUserIdAuthenticationStrategy implements AuthenticationStrategy {

    @Override
    public String resolveUserId(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("Missing X-User-Id header");
        }
        return userId;
    }
}
