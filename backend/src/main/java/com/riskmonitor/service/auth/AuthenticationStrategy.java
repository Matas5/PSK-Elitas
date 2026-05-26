package com.riskmonitor.service.auth;

import jakarta.servlet.http.HttpServletRequest;

public interface AuthenticationStrategy {

    String resolveUserId(HttpServletRequest request);
}
