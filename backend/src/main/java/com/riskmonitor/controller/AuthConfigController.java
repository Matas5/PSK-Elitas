package com.riskmonitor.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthConfigController {

    private final Environment environment;

    @GetMapping("/config")
    public Map<String, String> config() {
        boolean localActive = Arrays.asList(environment.getActiveProfiles()).contains("local");
        return Map.of("provider", localActive ? "local" : "google");
    }
}
