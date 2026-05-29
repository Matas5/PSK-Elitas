package com.riskmonitor.service;

import com.riskmonitor.config.SystemProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserResolver {

    private final SystemProperties systemProperties;

    public String resolve() {
        return systemProperties.user();
    }
}