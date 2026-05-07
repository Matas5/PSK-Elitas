package com.riskmonitor.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "risk-monitor.system")
public record SystemProperties(String user) {
}